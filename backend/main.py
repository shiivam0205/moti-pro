from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from groq import Groq
import sqlite3
import os
import uuid

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------- GROQ ----------------
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

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

# ---------------- HOME ----------------
@app.get("/")
def home():
    return {"status": "MOTI AI running"}

# ---------------- LOGIN ----------------
@app.post("/login")
def login(data: LoginRequest):
    try:
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

    except Exception as e:
        return {"error": str(e)}

# ---------------- CHAT ----------------
@app.post("/chat")
def chat(payload: ChatRequest):
    try:
        message = payload.message.strip()
        user_id = payload.user_id

        if not message:
            return {"reply": "Please type something"}

        cursor.execute(
            "INSERT INTO chats (user_id, role, message) VALUES (?, ?, ?)",
            (user_id, "user", message)
        )
        conn.commit()

        cursor.execute(
            "SELECT role, message FROM chats WHERE user_id=? ORDER BY id DESC LIMIT 10",
            (user_id,)
        )

        rows = cursor.fetchall()[::-1]

        messages = [
            {
                "role": "system",
                "content": "You are MOTI AI assistant. Be helpful, short and friendly."
            }
        ]

        for r in rows:
            messages.append({"role": r[0], "content": r[1]})

        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=messages
        )

        reply = response.choices[0].message.content

        cursor.execute(
            "INSERT INTO chats (user_id, role, message) VALUES (?, ?, ?)",
            (user_id, "assistant", reply)
        )
        conn.commit()

        return {"reply": reply}

    except Exception as e:
        return {"reply": f"Server error: {str(e)}"}