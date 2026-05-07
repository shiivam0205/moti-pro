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

# =========================================
# APP
# =========================================
app = FastAPI()

# =========================================
# CORS
# =========================================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =========================================
# DATABASE
# =========================================
conn = sqlite3.connect(
    "moti.db",
    check_same_thread=False
)

cur = conn.cursor()

# USERS
cur.execute("""
CREATE TABLE IF NOT EXISTS users (
    user_id TEXT,
    username TEXT,
    password TEXT
)
""")

# CHATS
cur.execute("""
CREATE TABLE IF NOT EXISTS chats (
    user_id TEXT,
    role TEXT,
    message TEXT
)
""")

# MEMORY
cur.execute("""
CREATE TABLE IF NOT EXISTS memory (
    user_id TEXT,
    memory_text TEXT
)
""")

conn.commit()

# =========================================
# ENV
# =========================================
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
ELEVEN_API_KEY = os.getenv("ELEVEN_API_KEY")

# =========================================
# GROQ CLIENT
# =========================================
client = Groq(
    api_key=GROQ_API_KEY
)

# =========================================
# MODELS
# =========================================
class LoginData(BaseModel):
    username: str
    password: str


class ChatData(BaseModel):
    user_id: str
    message: str


class VoiceData(BaseModel):
    text: str


# =========================================
# ROOT
# =========================================
@app.get("/")
def root():
    return {
        "status": "MOTI AI RUNNING"
    }


# =========================================
# LOGIN
# =========================================
@app.post("/login")
def login(data: LoginData):

    try:

        # EXISTING USER
        cur.execute(
            """
            SELECT user_id
            FROM users
            WHERE username=?
            AND password=?
            """,
            (
                data.username,
                data.password
            )
        )

        user = cur.fetchone()

        if user:

            return {
                "success": True,
                "user_id": user[0]
            }

        # CREATE USER
        new_user_id = str(uuid.uuid4())

        cur.execute(
            """
            INSERT INTO users
            VALUES (?, ?, ?)
            """,
            (
                new_user_id,
                data.username,
                data.password
            )
        )

        conn.commit()

        return {
            "success": True,
            "user_id": new_user_id
        }

    except Exception as e:

        return {
            "success": False,
            "error": str(e)
        }


# =========================================
# HISTORY
# =========================================
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


# =========================================
# SAVE MEMORY
# =========================================
def save_memory(user_id, text):

    keywords = [
        "remember",
        "my favorite",
        "i like",
        "i love",
        "my goal",
        "my dream",
        "my hobby",
        "my name",
        "i am",
        "i live"
    ]

    lower = text.lower()

    for keyword in keywords:

        if keyword in lower:

            cur.execute(
                """
                INSERT INTO memory
                VALUES (?, ?)
                """,
                (
                    user_id,
                    text
                )
            )

            conn.commit()

            break


# =========================================
# GET MEMORY
# =========================================
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


# =========================================
# INTERNET SEARCH
# =========================================
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


# =========================================
# CHAT
# =========================================
@app.post("/chat")
def chat(data: ChatData):

    try:

        # SAVE USER MESSAGE
        cur.execute(
            """
            INSERT INTO chats
            VALUES (?, ?, ?)
            """,
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

        # CHAT HISTORY
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

        # MEMORY
        memory_context = get_memory(
            data.user_id
        )

        # =========================================
        # INTERNET SEARCH
        # =========================================
        lower = data.message.lower()

        internet_context = ""

        search_keywords = [
            "weather",
            "today",
            "latest",
            "news",
            "bitcoin",
            "price",
            "forecast",
            "temperature",
            "current",
            "live",
            "who is",
            "what is"
        ]

        if any(
            keyword in lower
            for keyword in search_keywords
        ):

            search_query = data.message

            if (
                "weather" in lower
                or "temperature" in lower
            ):

                search_query = (
                    "India weather today "
                    "current forecast"
                )

            if "bitcoin" in lower:

                search_query = (
                    "bitcoin live price today"
                )

            if "news" in lower:

                search_query = (
                    "latest breaking news today"
                )

            internet_context = internet_search(
                search_query
            )

        print("INTERNET DATA:")
        print(internet_context)

        # =========================================
        # BUILD MESSAGES
        # =========================================
        messages = []

        # SYSTEM
        messages.append({
            "role": "system",
            "content": f"""
You are MOTI.

You are a premium AI assistant with realtime internet access.

User:
{username}

Memory:
{memory_context}

RULES:
- Never say you lack realtime access.
- Never say you are offline.
- Use internet results confidently.
- Speak naturally like ChatGPT.
- Be emotional and human.
- Support Hindi and English.
"""
        })

        # HISTORY
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

        # INTERNET RESULT
        if internet_context:

            messages.append({
                "role": "user",
                "content": f"""
Realtime internet result:

{internet_context}

Use this data to answer correctly.
"""
            })

        # FINAL USER MESSAGE
        messages.append({
            "role": "user",
            "content": data.message
        })

        # =========================================
        # AI RESPONSE
        # =========================================
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            temperature=0.8,
            max_tokens=500
        )

        reply = (
            completion
            .choices[0]
            .message
            .content
        )

        # SAVE AI REPLY
        cur.execute(
            """
            INSERT INTO chats
            VALUES (?, ?, ?)
            """,
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


# =========================================
# VOICE
# =========================================
@app.post("/voice")
def voice(data: VoiceData):

    try:

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

        if response.status_code != 200:

            return {
                "error": response.text
            }

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