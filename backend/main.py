from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import sqlite3
import uuid
import os
from groq import Groq

# =========================
# APP SETUP
# =========================
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =========================
# DB
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

conn.commit()

# =========================
# AI
# =========================
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

# =========================
# MODELS
# =========================
class LoginData(BaseModel):
    username: str
    password: str

class ChatData(BaseModel):
    user_id: str
    message: str

# =========================
# ROOT
# =========================
@app.get("/")
def home():
    return {"status": "MOTI AI ONLINE"}

# =========================
# LOGIN
# =========================
@app.post("/login")
def login(data: LoginData):

    cur.execute(
        "SELECT user_id FROM users WHERE username=? AND password=?",
        (data.username, data.password)
    )

    user = cur.fetchone()

    if user:
        return {"user_id": user[0]}

    user_id = str(uuid.uuid4())

    cur.execute(
        "INSERT INTO users VALUES (?, ?, ?)",
        (user_id, data.username, data.password)
    )

    conn.commit()

    return {"user_id": user_id}

# =========================
# CHAT HISTORY
# =========================
@app.get("/history/{user_id}")
def history(user_id: str):

    cur.execute(
        "SELECT role, message FROM chats WHERE user_id=?",
        (user_id,)
    )

    return {"history": cur.fetchall()}

# =========================
# CHAT (CHATGPT STYLE)
# =========================
@app.post("/chat")
def chat(data: ChatData):

    # save user message
    cur.execute(
        "INSERT INTO chats VALUES (?, ?, ?)",
        (data.user_id, "user", data.message)
    )
    conn.commit()

    # get history
    cur.execute(
        "SELECT role, message FROM chats WHERE user_id=?",
        (data.user_id,)
    )

    history = cur.fetchall()

    messages = [
        {
            "role": "system",
            "content": "You are MOTI AI, a helpful ChatGPT-style assistant. Respond naturally, clearly, and smartly."
        }
    ]

    for role, msg in history:
        messages.append({
            "role": "user" if role == "user" else "assistant",
            "content": msg
        })

    # AI RESPONSE
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=messages,
        temperature=0.8,
        max_tokens=500
    )

    reply = response.choices[0].message.content

    # save AI reply
    cur.execute(
        "INSERT INTO chats VALUES (?, ?, ?)",
        (data.user_id, "assistant", reply)
    )
    conn.commit()

    return {"reply": reply}