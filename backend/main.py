from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import sqlite3
import uuid
import os
from groq import Groq

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

# ---------------- GROQ ----------------
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

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
            "SELECT role, message FROM chats WHERE user_id=? ORDER BY rowid ASC",
            (user_id,)
        )
        return {"history": cur.fetchall()}
    except:
        return {"history": []}

# ---------------- REAL AI CHAT ----------------
@app.post("/chat")
def chat(data: ChatData):
    try:
        cur.execute(
            "INSERT INTO chats VALUES (?, ?, ?)",
            (data.user_id, "user", data.message)
        )
        conn.commit()

        cur.execute("SELECT username FROM users WHERE user_id=?", (data.user_id,))
        user = cur.fetchone()
        username = user[0] if user else "friend"

        cur.execute(
            "SELECT role, message FROM chats WHERE user_id=? ORDER BY rowid DESC LIMIT 8",
            (data.user_id,)
        )
        history_rows = cur.fetchall()
        history_rows.reverse()

        messages = [
            {
                "role": "system",
                "content": f"""
You are MOTI, a premium ultra smart emotional AI assistant.
Talk naturally like ChatGPT premium.
Be warm, intelligent, expressive, and humanlike.
User name is {username}.
Do not repeat robotic phrases.
Keep replies conversational.
"""
            }
        ]

        for role, msg in history_rows:
            r = "assistant" if role == "assistant" else "user"
            messages.append({"role": r, "content": msg})

        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            temperature=0.9,
            max_tokens=300
        )

        reply = completion.choices[0].message.content

        cur.execute(
            "INSERT INTO chats VALUES (?, ?, ?)",
            (data.user_id, "assistant", reply)
        )
        conn.commit()

        return {"reply": reply}

    except Exception as e:
        return {"reply": "AI server error: " + str(e)}