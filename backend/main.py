from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from groq import Groq
import sqlite3
import os
import uuid
import requests

app = FastAPI()

# ---------------- CORS ----------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------- CLIENTS ----------------
groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))
ELEVEN_API_KEY = os.getenv("ELEVEN_API_KEY")

# ---------------- DB ----------------
conn = sqlite3.connect("moti.db", check_same_thread=False)
cursor = conn.cursor()

cursor.execute("""
CREATE TABLE IF NOT EXISTS users (
    user_id TEXT PRIMARY KEY,
    username TEXT,
    password TEXT
)
""")

cursor.execute("""
CREATE TABLE IF NOT EXISTS chats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,
    role TEXT,
    message TEXT
)
""")

conn.commit()

# ---------------- MODELS ----------------
class LoginRequest(BaseModel):
    username: str
    password: str

class ChatRequest(BaseModel):
    user_id: str
    message: str

class VoiceRequest(BaseModel):
    text: str

# ---------------- HOME ----------------
@app.get("/")
def home():
    return {"status": "MOTI AI ULTRA VOICE RUNNING"}

# ---------------- LOGIN ----------------
@app.post("/login")
def login(data: LoginRequest):
    cursor.execute(
        "SELECT user_id FROM users WHERE username=? AND password=?",
        (data.username, data.password)
    )
    user = cursor.fetchone()

    if user:
        return {"user_id": user[0]}

    user_id = str(uuid.uuid4())

    cursor.execute(
        "INSERT INTO users VALUES (?, ?, ?)",
        (user_id, data.username, data.password)
    )
    conn.commit()

    return {"user_id": user_id}

# ---------------- SAVE CHAT ----------------
def save_chat(user_id, role, message):
    cursor.execute(
        "INSERT INTO chats (user_id, role, message) VALUES (?, ?, ?)",
        (user_id, role, message)
    )
    conn.commit()

# ---------------- CHAT ----------------
@app.post("/chat")
def chat(data: ChatRequest):
    try:
        message = data.message.strip()

        save_chat(data.user_id, "user", message)

        cursor.execute(
            "SELECT role, message FROM chats WHERE user_id=? ORDER BY id DESC LIMIT 12",
            (data.user_id,)
        )

        rows = cursor.fetchall()[::-1]

        messages = [
            {
                "role": "system",
                "content": "You are MOTI AI. Be natural, friendly, short."
            }
        ]

        for r in rows:
            messages.append({"role": r[0], "content": r[1]})

        response = groq_client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=messages
        )

        reply = response.choices[0].message.content

        save_chat(data.user_id, "assistant", reply)

        return {"reply": reply}

    except Exception as e:
        return {"reply": f"Server error: {str(e)}"}

# ---------------- ULTRA VOICE (ELEVENLABS) ----------------
@app.post("/voice")
def voice(data: VoiceRequest):
    try:
        url = "https://api.elevenlabs.io/v1/text-to-speech/pNInz6obpgDQGcFmaJgB"

        headers = {
            "xi-api-key": ELEVEN_API_KEY,
            "Content-Type": "application/json"
        }

        payload = {
            "text": data.text,
            "model_id": "eleven_monolingual_v1",
            "voice_settings": {
                "stability": 0.45,
                "similarity_boost": 0.85
            }
        }

        res = requests.post(url, json=payload, headers=headers)

        if res.status_code == 200:
            return res.content

        return {"error": "voice failed"}

    except Exception as e:
        return {"error": str(e)}