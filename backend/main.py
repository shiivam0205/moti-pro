from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import sqlite3
import uuid
import os
from groq import Groq

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ================= DB =================
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
    chat_id TEXT,
    user_id TEXT,
    role TEXT,
    message TEXT
)
""")

conn.commit()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

class Login(BaseModel):
    username: str
    password: str

class Chat(BaseModel):
    user_id: str
    chat_id: str
    message: str

# ================= ROOT =================
@app.get("/")
def root():
    return {"status": "MOTI CHATGPT CLONE ACTIVE"}

# ================= LOGIN =================
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

# ================= CHAT HISTORY LIST =================
@app.get("/history/{user_id}")
def history(user_id: str):

    cur.execute(
        "SELECT DISTINCT chat_id FROM chats WHERE user_id=?",
        (user_id,)
    )

    chats = [c[0] for c in cur.fetchall()]

    return {"chats": chats}

# ================= CHAT LOAD =================
@app.get("/load/{user_id}/{chat_id}")
def load(user_id: str, chat_id: str):

    cur.execute(
        "SELECT role, message FROM chats WHERE user_id=? AND chat_id=?",
        (user_id, chat_id)
    )

    return {"messages": cur.fetchall()}

# ================= CHAT =================
@app.post("/chat")
def chat(data: Chat):

    cur.execute(
        "INSERT INTO chats VALUES (?, ?, ?, ?)",
        (data.chat_id, data.user_id, "user", data.message)
    )
    conn.commit()

    cur.execute(
        "SELECT role, message FROM chats WHERE user_id=? AND chat_id=?",
        (data.user_id, data.chat_id)
    )

    history = cur.fetchall()

    messages = [
        {
            "role": "system",
            "content": """
You are MOTI AI ChatGPT clone.
- respond naturally
- multilingual
- human tone
"""
        }
    ]

    for r, m in history:
        messages.append({
            "role": "user" if r == "user" else "assistant",
            "content": m
        })

    messages.append({"role": "user", "content": data.message})

    res = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=messages,
        temperature=0.8,
        max_tokens=600
    )

    reply = res.choices[0].message.content

    cur.execute(
        "INSERT INTO chats VALUES (?, ?, ?, ?)",
        (data.chat_id, data.user_id, "assistant", reply)
    )

    conn.commit()

    return {"reply": reply}