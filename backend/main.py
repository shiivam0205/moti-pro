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

cur.execute("""
CREATE TABLE IF NOT EXISTS memory (
    user_id TEXT,
    memory TEXT
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
    return {"status": "MOTI GOD MODE AI ONLINE"}

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

# ================= MEMORY SYSTEM =================
def save_memory(user_id, text):

    if len(text) > 3:
        cur.execute(
            "INSERT INTO memory VALUES (?, ?)",
            (user_id, text)
        )
        conn.commit()

def get_memory(user_id):

    cur.execute(
        "SELECT memory FROM memory WHERE user_id=? ORDER BY rowid DESC LIMIT 10",
        (user_id,)
    )

    return "\n".join([m[0] for m in cur.fetchall()])

# ================= CHAT =================
@app.post("/chat")
def chat(data: ChatData):

    # save user msg
    cur.execute(
        "INSERT INTO chats VALUES (?, ?, ?)",
        (data.user_id, "user", data.message)
    )
    conn.commit()

    save_memory(data.user_id, data.message)

    # history (safe limit)
    cur.execute(
        "SELECT role, message FROM chats WHERE user_id=? ORDER BY rowid DESC LIMIT 20",
        (data.user_id,)
    )

    history = cur.fetchall()[::-1]

    memory = get_memory(data.user_id)

    messages = [
        {
            "role": "system",
            "content": """
You are MOTI GOD MODE AI.

Rules:
- Auto detect language
- Reply in same language
- Be human, emotional, smart
- Use memory when needed
- Never say offline or no access
"""
        }
    ]

    # memory injection
    if memory:
        messages.append({
            "role": "system",
            "content": f"User Memory:\n{memory}"
        })

    # history
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
        temperature=0.85,
        max_tokens=700
    )

    reply = res.choices[0].message.content

    cur.execute(
        "INSERT INTO chats VALUES (?, ?, ?)",
        (data.user_id, "assistant", reply)
    )

    conn.commit()

    return {"reply": reply}