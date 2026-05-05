from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from groq import Groq
import sqlite3
import os
import uuid

app = FastAPI()

# ---------------- CORS ----------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------- GROQ ----------------
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

# ---------------- DATABASE ----------------
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
        username = data.username.strip()
        password = data.password.strip()

        if not username or not password:
            return {"error": "Username and password required"}

        cursor.execute(
            "SELECT user_id FROM users WHERE username=? AND password=?",
            (username, password)
        )

        user = cursor.fetchone()

        if user:
            return {"user_id": user[0]}

        user_id = str(uuid.uuid4())

        cursor.execute(
            "INSERT INTO users VALUES (?, ?, ?)",
            (user_id, username, password)
        )
        conn.commit()

        return {"user_id": user_id}

    except Exception as e:
        return {"error": str(e)}

# ---------------- SAVE CHAT ----------------
def save_chat(user_id, role, message):
    cursor.execute(
        "INSERT INTO chats (user_id, role, message) VALUES (?, ?, ?)",
        (user_id, role, message)
    )
    conn.commit()

# ---------------- HISTORY ----------------
@app.get("/history/{user_id}")
def history(user_id: str):
    cursor.execute(
        "SELECT role, message FROM chats WHERE user_id=? ORDER BY id",
        (user_id,)
    )

    rows = cursor.fetchall()
    return {"history": rows}

# ---------------- CHAT ----------------
@app.post("/chat")
def chat(payload: ChatRequest):
    try:
        user_id = payload.user_id
        message = payload.message

        if not message:
            return {"reply": "Please type something"}

        save_chat(user_id, "user", message)

        cursor.execute(
            "SELECT role, message FROM chats WHERE user_id=? ORDER BY id DESC LIMIT 12",
            (user_id,)
        )

        rows = cursor.fetchall()[::-1]

        messages = [
            {
                "role": "system",
                "content": "You are MOTI AI assistant. Be helpful and friendly."
            }
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
        return {"reply": f"AI error: {str(e)}"}