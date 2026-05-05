from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel
import sqlite3
import uuid
import os
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
def home():
    return {"status": "MOTI AI RUNNING"}

# ---------------- LOGIN ----------------
@app.post("/login")
def login(data: Login):
    try:
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

    except Exception as e:
        return {"error": str(e)}

# ---------------- CHAT ----------------
@app.post("/chat")
def chat(data: Chat):
    try:
        cur.execute(
            "INSERT INTO chats VALUES (?, ?, ?)",
            (data.user_id, "user", data.message)
        )
        conn.commit()

        # SIMPLE SAFE RESPONSE (NO API CRASH)
        reply = "I understood: " + data.message

        cur.execute(
            "INSERT INTO chats VALUES (?, ?, ?)",
            (data.user_id, "assistant", reply)
        )
        conn.commit()

        return {"reply": reply}

    except Exception as e:
        return {"reply": "Server error: " + str(e)}

# ---------------- HISTORY ----------------
@app.get("/history/{user_id}")
def history(user_id: str):
    cur.execute(
        "SELECT role, message FROM chats WHERE user_id=?",
        (user_id,)
    )
    return {"history": cur.fetchall()}

# ---------------- VOICE (SAFE FALLBACK ONLY) ----------------
@app.post("/voice")
def voice(data: Voice):
    try:
        # fallback voice (no API dependency = no errors)
        return {"audio": "fallback"}

    except Exception as e:
        return {"error": str(e)}