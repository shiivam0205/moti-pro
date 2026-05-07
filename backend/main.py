from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import sqlite3
import uuid
import random

app = FastAPI()

# ---------------- CORS ----------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------- DATABASE ----------------
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
class LoginData(BaseModel):
    username: str
    password: str

class ChatData(BaseModel):
    user_id: str
    message: str

# ---------------- ROOT ----------------
@app.get("/")
def root():
    return {"status": "MOTI AI RUNNING"}

# ---------------- LOGIN ----------------
@app.post("/login")
def login(data: LoginData):
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

# ---------------- HISTORY ----------------
@app.get("/history/{user_id}")
def history(user_id: str):
    try:
        cur.execute(
            "SELECT role, message FROM chats WHERE user_id=?",
            (user_id,)
        )
        rows = cur.fetchall()
        return {"history": rows}
    except Exception as e:
        return {"history": []}

# ---------------- AI RESPONSE ENGINE ----------------
def generate_ai_reply(user_id, message):
    text = message.lower()

    cur.execute("SELECT username FROM users WHERE user_id=?", (user_id,))
    user = cur.fetchone()
    username = user[0] if user else "friend"

    cur.execute(
        "SELECT role, message FROM chats WHERE user_id=? ORDER BY rowid DESC LIMIT 6",
        (user_id,)
    )
    memory = cur.fetchall()

    greetings = [
        f"Hello {username}, I'm here with you.",
        f"Hi {username}, tell me what's on your mind.",
        f"Hey {username}, MOTI is listening."
    ]

    smart_random = [
        "Interesting... tell me more.",
        "I understand what you're saying.",
        "That's actually worth discussing deeper.",
        "Hmm, I can help you with that.",
        "Let me think about that with you."
    ]

    if "hello" in text or "hi" in text:
        return random.choice(greetings)

    if "my name" in text:
        return f"Your registered name in my memory is {username}."

    if "who are you" in text:
        return "I am MOTI, your premium intelligent emotional AI assistant."

    if "how are you" in text:
        return random.choice([
            "I'm functioning perfectly and fully focused on you.",
            "Feeling active and ready to help.",
            "All systems stable. I'm doing great."
        ])

    if "love" in text:
        return "Love is a powerful emotion. Are we talking about someone special?"

    if "sad" in text or "depressed" in text:
        return "I can feel some heaviness in your words. Want to talk about what's causing it?"

    if "bye" in text:
        return f"I'll be here whenever you need me, {username}."

    if len(memory) > 4:
        return random.choice(smart_random) + " Also, I'm remembering our recent conversation."

    return random.choice(smart_random)

# ---------------- CHAT ----------------
@app.post("/chat")
def chat(data: ChatData):
    try:
        cur.execute(
            "INSERT INTO chats VALUES (?, ?, ?)",
            (data.user_id, "user", data.message)
        )
        conn.commit()

        reply = generate_ai_reply(data.user_id, data.message)

        cur.execute(
            "INSERT INTO chats VALUES (?, ?, ?)",
            (data.user_id, "assistant", reply)
        )
        conn.commit()

        return {"reply": reply}

    except Exception as e:
        return {"reply": "Server error: " + str(e)}