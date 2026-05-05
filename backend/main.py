from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from groq import Groq
from pydantic import BaseModel
import os
import sqlite3
import uuid

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

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

class LoginRequest(BaseModel):
    username: str
    password: str

class ChatRequest(BaseModel):
    user_id: str
    message: str

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

def save_chat(user_id, role, message):
    cursor.execute(
        "INSERT INTO chats (user_id, role, message) VALUES (?, ?, ?)",
        (user_id, role, message)
    )
    conn.commit()

@app.get("/")
def home():
    return {"status": "MOTI AI running"}

@app.post("/chat")
def chat(payload: ChatRequest):
    try:
        user_id = payload.user_id
        message = payload.message

        save_chat(user_id, "user", message)

        cursor.execute(
            "SELECT role, message FROM chats WHERE user_id=? ORDER BY id DESC LIMIT 10",
            (user_id,)
        )

        rows = cursor.fetchall()[::-1]

        messages = [
            {"role": "system", "content": "You are MOTI AI assistant."}
        ]

        for r in rows:
            messages.append({"role": r[0], "content": r[1]})

        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=messages
        )

        reply = response.choices[0].message.content

        save_chat(user_id, "assistant", reply)

        return {"reply": reply}

    except Exception as e:
        return {"reply": str(e)}