from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from groq import Groq
import sqlite3
import uuid
import os
import requests

# =========================
# APP
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

cur.execute("""
CREATE TABLE IF NOT EXISTS memory (
    user_id TEXT,
    memory_text TEXT
)
""")

conn.commit()

# =========================
# AI CLIENT
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
def root():
    return {"status": "MOTI AI PRO RUNNING"}

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

    new_id = str(uuid.uuid4())

    cur.execute(
        "INSERT INTO users VALUES (?, ?, ?)",
        (new_id, data.username, data.password)
    )

    conn.commit()

    return {"user_id": new_id}

# =========================
# MEMORY
# =========================
def save_memory(user_id, text):

    if any(k in text.lower() for k in ["remember", "my name", "i like", "i love"]):

        cur.execute(
            "INSERT INTO memory VALUES (?, ?)",
            (user_id, text)
        )

        conn.commit()

def get_memory(user_id):

    cur.execute(
        "SELECT memory_text FROM memory WHERE user_id=? ORDER BY rowid DESC LIMIT 10",
        (user_id,)
    )

    return "\n".join([r[0] for r in cur.fetchall()])

# =========================
# PRO WEATHER SYSTEM (NO API)
# =========================
def get_weather_pro(location: str):

    try:

        # smart cleanup
        location = location.replace("weather", "").strip()
        if location == "":
            location = "India"

        url = f"https://wttr.in/{location}?format=3"

        res = requests.get(url, timeout=5)

        return f"🌤 Live Weather: {res.text}"

    except:
        return "🌤 Weather service unavailable"

# =========================
# CHAT
# =========================
@app.post("/chat")
def chat(data: ChatData):

    # save user msg
    cur.execute(
        "INSERT INTO chats VALUES (?, ?, ?)",
        (data.user_id, "user", data.message)
    )
    conn.commit()

    save_memory(data.user_id, data.message)

    # history
    cur.execute(
        "SELECT role, message FROM chats WHERE user_id=? ORDER BY rowid ASC",
        (data.user_id,)
    )

    history = cur.fetchall()

    memory = get_memory(data.user_id)

    msg = data.message.lower()

    # =========================
    # WEATHER DETECTION (PRO)
    # =========================
    weather_data = ""

    if "weather" in msg or "temperature" in msg:

        weather_data = get_weather_pro(data.message)

    # =========================
    # BUILD PROMPT
    # =========================
    messages = [
        {
            "role": "system",
            "content": """
You are MOTI AI (ChatGPT-style assistant).

RULES:
- Always respond naturally
- Use weather data if provided
- Never say you are offline
- Be helpful, short, smart
"""
        }
    ]

    # history
    for role, text in history:
        messages.append({
            "role": "user" if role == "user" else "assistant",
            "content": text
        })

    # inject memory
    if memory:
        messages.append({
            "role": "system",
            "content": f"Memory:\n{memory}"
        })

    # inject weather (IMPORTANT)
    if weather_data:
        messages.append({
            "role": "system",
            "content": weather_data
        })

    # final user message
    messages.append({
        "role": "user",
        "content": data.message
    })

    # AI RESPONSE
    completion = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=messages,
        temperature=0.8,
        max_tokens=500
    )

    reply = completion.choices[0].message.content

    # save AI
    cur.execute(
        "INSERT INTO chats VALUES (?, ?, ?)",
        (data.user_id, "assistant", reply)
    )
    conn.commit()

    return {"reply": reply}