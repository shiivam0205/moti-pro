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

# ---------------- AI CLIENT ----------------
groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))
ELEVEN_API_KEY = os.getenv("ELEVEN_API_KEY")

# ---------------- DATABASE ----------------
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
class Login(BaseModel):
    username: str
    password: str

class Chat(BaseModel):
    user_id: str
    message: str

class Voice(BaseModel):
    text: str

# ---------------- HOME ----------------
@app.get("/")
def home():
    return {"status": "MOTI AI ONLINE"}

# ---------------- LOGIN ----------------
@app.post("/login")
def login(data: Login):
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
def save(user_id, role, msg):
    cursor.execute(
        "INSERT INTO chats (user_id, role, message) VALUES (?, ?, ?)",
        (user_id, role, msg)
    )
    conn.commit()

# ---------------- CHAT ----------------
@app.post("/chat")
def chat(data: Chat):
    try:
        save(data.user_id, "user", data.message)

        cursor.execute(
            "SELECT role, message FROM chats WHERE user_id=? ORDER BY id DESC LIMIT 10",
            (data.user_id,)
        )

        history = cursor.fetchall()[::-1]

        messages = [
            {"role": "system", "content": "You are MOTI AI assistant. Be natural and helpful."}
        ]

        for h in history:
            messages.append({"role": h[0], "content": h[1]})

        response = groq_client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=messages
        )

        reply = response.choices[0].message.content

        save(data.user_id, "assistant", reply)

        return {"reply": reply}

    except Exception as e:
        return {"reply": f"Error: {str(e)}"}

# ---------------- VOICE ----------------
@app.post("/voice")
def voice(data: Voice):
    try:
        url = "https://api.elevenlabs.io/v1/text-to-speech/pNInz6obpgDQGcFmaJgB"

        headers = {
            "xi-api-key": ELEVEN_API_KEY,
            "Content-Type": "application/json"
        }

        body = {
            "text": data.text,
            "model_id": "eleven_monolingual_v1",
            "voice_settings": {
                "stability": 0.5,
                "similarity_boost": 0.8
            }
        }

        r = requests.post(url, json=body, headers=headers)

        if r.status_code == 200:
            return r.content

        return {"error": "voice failed"}

    except Exception as e:
        return {"error": str(e)}