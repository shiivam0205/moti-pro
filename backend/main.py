from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
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

# ---------------- AI ----------------
client = Groq(api_key=os.getenv("GROQ_API_KEY"))
ELEVEN_API_KEY = os.getenv("ELEVEN_API_KEY")

# ---------------- DB ----------------
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

# ---------------- ROOT ----------------
@app.get("/")
def root():
    return {"status": "MOTI AI RUNNING"}

# ---------------- LOGIN ----------------
@app.post("/login")
def login(data: Login):
    cur.execute(
        "SELECT user_id FROM users WHERE username=? AND password=?",
        (data.username, data.password)
    )
    user = cur.fetchone()

    if user:
        return {"user_id": user[0]}

    uid = str(uuid.uuid4())

    cur.execute(
        "INSERT INTO users VALUES (?, ?, ?)",
        (uid, data.username, data.password)
    )
    conn.commit()

    return {"user_id": uid}

# ---------------- HISTORY ----------------
@app.get("/history/{user_id}")
def history(user_id: str):
    cur.execute(
        "SELECT role, message FROM chats WHERE user_id=?",
        (user_id,)
    )
    return {"history": cur.fetchall()}

# ---------------- CHAT ----------------
@app.post("/chat")
def chat(data: Chat):
    cur.execute(
        "INSERT INTO chats VALUES (?, ?, ?)",
        (data.user_id, "user", data.message)
    )
    conn.commit()

    res = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[{"role": "user", "content": data.message}]
    )

    reply = res.choices[0].message.content

    cur.execute(
        "INSERT INTO chats VALUES (?, ?, ?)",
        (data.user_id, "assistant", reply)
    )
    conn.commit()

    return {"reply": reply}

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
            "model_id": "eleven_monolingual_v1"
        }

        r = requests.post(url, json=body, headers=headers)

        if r.status_code == 200:
            return Response(content=r.content, media_type="audio/mpeg")

        return {"error": "voice failed"}

    except Exception as e:
        return {"error": str(e)}