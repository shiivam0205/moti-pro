from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import sqlite3
import uuid
import os
import requests
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

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

class Login(BaseModel):
    username: str
    password: str

class Chat(BaseModel):
    user_id: str
    message: str

# ================= SEARCH AGENT =================
def web_search(query):

    try:
        url = f"https://api.duckduckgo.com/?q={query}&format=json"
        r = requests.get(url, timeout=5)
        data = r.json()

        return data.get("AbstractText") or "No strong web result found."

    except:
        return "Search unavailable"

# ================= ROOT =================
@app.get("/")
def root():
    return {"status": "MOTI ULTRA AI ACTIVE"}

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

# ================= CHAT =================
@app.post("/chat")
def chat(data: Chat):

    msg = data.message.lower()

    # save user msg
    cur.execute("INSERT INTO chats VALUES (?, ?, ?)",
                (data.user_id, "user", data.message))
    conn.commit()

    # WEB BROWSING MODE
    web_data = ""
    if "search" in msg or "google" in msg or "news" in msg:
        web_data = web_search(data.message)

    cur.execute(
        "SELECT role, message FROM chats WHERE user_id=? ORDER BY rowid DESC LIMIT 20",
        (data.user_id,)
    )

    history = cur.fetchall()[::-1]

    messages = [
        {
            "role": "system",
            "content": """
You are MOTI ULTRA AI.

Rules:
- Always respond in same language
- Be natural human assistant
- Use web data if available
- Never say offline
"""
        }
    ]

    if web_data:
        messages.append({
            "role": "system",
            "content": f"Web Result: {web_data}"
        })

    for r, m in history:
        messages.append({
            "role": "user" if r == "user" else "assistant",
            "content": m
        })

    messages.append({"role": "user", "content": data.message})

    res = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=messages,
        temperature=0.85,
        max_tokens=600
    )

    reply = res.choices[0].message.content

    cur.execute("INSERT INTO chats VALUES (?, ?, ?)",
                (data.user_id, "assistant", reply))

    conn.commit()

    return {"reply": reply}