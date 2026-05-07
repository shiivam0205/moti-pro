from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from groq import Groq
from duckduckgo_search import DDGS

import sqlite3
import uuid
import os
import requests

# =========================
# APP
# =========================
app = FastAPI()

# =========================
# CORS
# =========================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =========================
# DATABASE
# =========================
conn = sqlite3.connect("moti.db", check_same_thread=False)
cur = conn.cursor()

cur.execute("""
CREATE TABLE IF NOT EXISTS users (
    user_id TEXT,
    username TEXT,
    password TEXT
)
""")

cur.execute("""
CREATE TABLE IF NOT EXISTS chats (
    user_id TEXT,
    role TEXT,
    message TEXT
)
""")

cur.execute("""
CREATE TABLE IF NOT EXISTS memory (
    user_id TEXT,
    memory_text TEXT
)
""")

conn.commit()

# =========================
# ENV VARIABLES
# =========================
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
ELEVEN_API_KEY = os.getenv("ELEVEN_API_KEY")

# =========================
# GROQ CLIENT
# =========================
client = Groq(
    api_key=GROQ_API_KEY
)

# =========================
# MODELS
# =========================
class LoginData(BaseModel):
    username: str
    password: str


class ChatData(BaseModel):
    user_id: str
    message: str


class VoiceData(BaseModel):
    text: str


# =========================
# ROOT
# =========================
@app.get("/")
def root():
    return {
        "status": "MOTI AI RUNNING"
    }


# =========================
# LOGIN
# =========================
@app.post("/login")
def login(data: LoginData):
    try:
        cur.execute(
            "SELECT user_id FROM users WHERE username=? AND password=?",
            (data.username, data.password)
        )

        user = cur.fetchone()

        # EXISTING USER
        if user:
            return {
                "user_id": user[0]
            }

        # CREATE NEW USER
        new_user_id = str(uuid.uuid4())

        cur.execute(
            "INSERT INTO users VALUES (?, ?, ?)",
            (
                new_user_id,
                data.username,
                data.password
            )
        )

        conn.commit()

        return {
            "user_id": new_user_id
        }

    except Exception as e:
        return {
            "error": str(e)
        }


# =========================
# CHAT HISTORY
# =========================
@app.get("/history/{user_id}")
def history(user_id: str):
    try:
        cur.execute(
            """
            SELECT role, message
            FROM chats
            WHERE user_id=?
            ORDER BY rowid ASC
            """,
            (user_id,)
        )

        rows = cur.fetchall()

        return {
            "history": rows
        }

    except Exception:
        return {
            "history": []
        }


# =========================
# MEMORY SAVE
# =========================
def save_memory(user_id, text):

    memory_keywords = [
        "remember",
        "my favorite",
        "i like",
        "i love",
        "my dream",
        "my goal",
        "my name",
        "i am",
        "i live",
        "my hobby"
    ]

    lower_text = text.lower()

    for keyword in memory_keywords:

        if keyword in lower_text:

            cur.execute(
                "INSERT INTO memory VALUES (?, ?)",
                (user_id, text)
            )

            conn.commit()

            break


# =========================
# GET MEMORY
# =========================
def get_memory(user_id):

    cur.execute(
        """
        SELECT memory_text
        FROM memory
        WHERE user_id=?
        ORDER BY rowid DESC
        LIMIT 10
        """,
        (user_id,)
    )

    rows = cur.fetchall()

    memories = [r[0] for r in rows]

    return "\n".join(memories)


# =========================
# INTERNET SEARCH
# =========================
def internet_search(query):

    try:
        results = []

        with DDGS() as ddgs:

            search_results = ddgs.text(
                query,
                max_results=5
            )

            for r in search_results:

                title = r.get("title", "")
                body = r.get("body", "")

                results.append(
                    f"{title}: {body}"
                )

        return "\n".join(results)

    except Exception as e:

        return f"Search failed: {str(e)}"


# =========================
# CHAT
# =========================
@app.post("/chat")
def chat(data: ChatData):

    try:

        # SAVE USER MESSAGE
        cur.execute(
            "INSERT INTO chats VALUES (?, ?, ?)",
            (
                data.user_id,
                "user",
                data.message
            )
        )

        conn.commit()

        # SAVE MEMORY
        save_memory(
            data.user_id,
            data.message
        )

        # GET USERNAME
        cur.execute(
            """
            SELECT username
            FROM users
            WHERE user_id=?
            """,
            (data.user_id,)
        )

        user = cur.fetchone()

        username = (
            user[0]
            if user
            else "friend"
        )

        # GET CHAT HISTORY
        cur.execute(
            """
            SELECT role, message
            FROM chats
            WHERE user_id=?
            ORDER BY rowid DESC
            LIMIT 12
            """,
            (data.user_id,)
        )

        rows = cur.fetchall()

        rows.reverse()

        # GET MEMORY
        memory_context = get_memory(
            data.user_id
        )

        # INTERNET SEARCH
        lower = data.message.lower()

        search_keywords = [
            "latest",
            "today",
            "news",
            "weather",
            "price",
            "search",
            "internet",
            "who is",
            "what is",
            "current"
        ]

        internet_context = ""

        if any(
            keyword in lower
            for keyword in search_keywords
        ):

            internet_context = internet_search(
                data.message
            )

        # SYSTEM PROMPT
        messages = [
            {
                "role": "system",
                "content": f"""
You are MOTI.

You are an ultra premium emotional AI assistant.

User name:
{username}

Permanent Memory:
{memory_context}

Internet Search Results:
{internet_context}

Rules:
- Speak naturally like ChatGPT Premium
- Sound human and emotional
- Avoid robotic replies
- Support Hindi and English
- Be intelligent and helpful
- Answer clearly and conversationally
- Use internet data if available
"""
            }
        ]

        # CHAT HISTORY
        for role, msg in rows:

            real_role = (
                "assistant"
                if role == "assistant"
                else "user"
            )

            messages.append({
                "role": real_role,
                "content": msg
            })

        # AI COMPLETION
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            temperature=0.9,
            max_tokens=400
        )

        reply = (
            completion
            .choices[0]
            .message
            .content
        )

        # SAVE AI REPLY
        cur.execute(
            "INSERT INTO chats VALUES (?, ?, ?)",
            (
                data.user_id,
                "assistant",
                reply
            )
        )

        conn.commit()

        return {
            "reply": reply
        }

    except Exception as e:

        return {
            "reply": "AI server error: " + str(e)
        }


# =========================
# ULTRA HUMAN VOICE
# =========================
@app.post("/voice")
def generate_voice(data: VoiceData):

    try:

        # NO ELEVENLABS KEY
        if not ELEVEN_API_KEY:

            return {
                "error": "Missing ELEVEN_API_KEY"
            }

        url = (
            "https://api.elevenlabs.io/v1/"
            "text-to-speech/"
            "EXAVITQu4vr4xnSDxMaL"
        )

        headers = {
            "xi-api-key": ELEVEN_API_KEY,
            "Content-Type": "application/json"
        }

        payload = {
            "text": data.text,
            "model_id": "eleven_multilingual_v2",
            "voice_settings": {
                "stability": 0.4,
                "similarity_boost": 0.9
            }
        }

        response = requests.post(
            url,
            json=payload,
            headers=headers
        )

        # FAILED
        if response.status_code != 200:

            return {
                "error": response.text
            }

        # SAVE AUDIO
        with open("voice.mp3", "wb") as f:

            f.write(response.content)

        return FileResponse(
            "voice.mp3",
            media_type="audio/mpeg"
        )

    except Exception as e:

        return {
            "error": str(e)
        }