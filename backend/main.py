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
    user_id TEXT,
    role TEXT,
    message TEXT
)
""")

conn.commit()

# ================= AI =================
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

# ================= MODELS =================
class LoginData(BaseModel):
    username: str
    password: str

class ChatData(BaseModel):
    user_id: str
    message: str

# ================= ROOT =================
@app.get("/")
def root():
    return {"status": "MOTI AI PRO MAX ONLINE"}

# ================= LOGIN =================
@app.post("/login")
def login(data: LoginData):

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

# ================= CHAT =================
@app.post("/chat")
def chat(data: ChatData):

    cur.execute(
        "INSERT INTO chats VALUES (?, ?, ?)",
        (data.user_id, "user", data.message)
    )
    conn.commit()

    cur.execute(
        "SELECT role, message FROM chats WHERE user_id=?",
        (data.user_id,)
    )

    history = cur.fetchall()

    messages = [
        {
            "role": "system",
            "content": """
You are MOTI AI PRO MAX.

IMPORTANT:
- Detect user language automatically
- Reply in SAME language as user
- Be natural like human conversation
- Support all world languages
- Never say you are offline
"""
        }
    ]

    for r, m in history:
        messages.append({
            "role": "user" if r == "user" else "assistant",
            "content": m
        })

    messages.append({
        "role": "user",
        "content": data.message
    })

    res = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=messages,
        temperature=0.8,
        max_tokens=600
    )

    reply = res.choices[0].message.content

    cur.execute(
        "INSERT INTO chats VALUES (?, ?, ?)",
        (data.user_id, "assistant", reply)
    )

    conn.commit()

    return {"reply": reply}