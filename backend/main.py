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

# ====================================
# APP
# ====================================
app = FastAPI()

# ====================================
# CORS
# ====================================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ====================================
# DATABASE
# ====================================
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

# ====================================
# ENV
# ====================================
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
ELEVEN_API_KEY = os.getenv("ELEVEN_API_KEY")

# ====================================
# AI CLIENT
# ====================================
client = Groq(
    api_key=GROQ_API_KEY
)

# ====================================
# MODELS
# ====================================
class LoginData(BaseModel):
    username: str
    password: str


class ChatData(BaseModel):
    user_id: str
    message: str


class VoiceData(BaseModel):
    text: str


# ====================================
# ROOT
# ====================================
@app.get("/")
def root():
    return {
        "status": "MOTI AI RUNNING"
    }


# ====================================
# LOGIN
# ====================================
@app.post("/login")
def login(data: LoginData):

    try:

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

        # EXISTING USER
        if user:

            return {
                "user_id": user[0]
            }

        # NEW USER
        new_id = str(uuid.uuid4())

        cur.execute(
            """
            INSERT INTO users
            VALUES (?, ?, ?)
            """,
            (
                new_id,
                data.username,
                data.password
            )
        )

        conn.commit()

        return {
            "user_id": new_id
        }

    except Exception as e:

        return {
            "error": str(e)
        }


# ====================================
# HISTORY
# ====================================
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

    except:

        return {
            "history": []
        }


# ====================================
# SAVE MEMORY
# ====================================
def save_memory(user_id, text):

    keywords = [
        "remember",
        "i like",
        "i love",
        "my favorite",
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


# ====================================
# GET MEMORY
# ====================================
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

    return "\n".join(
        [r[0] for r in rows]
    )


# ====================================
# INTERNET SEARCH
# ====================================
def internet_search(query):

    try:

        results = []

        with DDGS() as ddgs:

            search = ddgs.text(
                query,
                max_results=5
            )

            for r in search:

                title = r.get("title", "")
                body = r.get("body", "")

                results.append(
                    f"{title}: {body}"
                )

        return "\n".join(results)

    except Exception as e:

        return f"Search failed: {str(e)}"


# ====================================
# CHAT
# ====================================
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

        # HISTORY
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

        # INTERNET SEARCH
        lower = data.message.lower()

        search_keywords = [
            "weather",
            "today",
            "latest",
            "news",
            "price",
            "bitcoin",
            "temperature",
            "forecast",
            "current",
            "who is",
            "what is",
            "live"
        ]

        internet_context = ""

        if any(
            keyword in lower
            for keyword in search_keywords
        ):

            search_query = data.message

            # STRONGER WEATHER SEARCH
            if (
                "weather" in lower
                or "temperature" in lower
            ):

                search_query = (
                    "India weather today "
                    "temperature forecast"
                )

            # NEWS SEARCH
            if "news" in lower:

                search_query = (
                    "latest breaking news today"
                )

            # BITCOIN
            if "bitcoin" in lower:

                search_query = (
                    "bitcoin live price today"
                )

            internet_context = internet_search(
                search_query
            )

        print("INTERNET DATA:")
        print(internet_context)

        # ====================================
        # AI PROMPT
        # ====================================
        messages = []

        # SYSTEM
        messages.append({
            "role": "system",
            "content": f"""
You are MOTI.

You are an ultra premium AI assistant.

You HAVE realtime internet access.

User:
{username}

Memory:
{memory_context}

VERY IMPORTANT RULES:

1. NEVER say:
- "I don't have realtime access"
- "I cannot access live data"
- "I am offline"

2. If internet data exists,
ALWAYS use it confidently.

3. Speak naturally like ChatGPT.

4. Sound human and emotional.

5. Support Hindi and English.

6. Never sound robotic.

7. Give direct answers.
"""
        })

        # INTERNET DATA
        if internet_context:

            messages.append({
                "role": "system",
                "content": f"""
REALTIME INTERNET DATA:

{internet_context}

Use this realtime data
in your next reply.
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

        # AI RESPONSE
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            temperature=0.9,
            max_tokens=450
        )

        reply = (
            completion
            .choices[0]
            .message
            .content
        )

        # SAVE REPLY
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


# ====================================
# VOICE
# ====================================
@app.post("/voice")
def voice(data: VoiceData):

    try:

        # NO KEY
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

        # RETURN AUDIO
        return FileResponse(
            "voice.mp3",
            media_type="audio/mpeg"
        )

    except Exception as e:

        return {
            "error": str(e)
        }