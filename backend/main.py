from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import sqlite3
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
        return {"history": [], "error": str(e)}

# ---------------- CHAT ----------------
@app.post("/chat")
def chat(data: ChatData):
    try:
        cur.execute(
            "INSERT INTO chats VALUES (?, ?, ?)",
            (data.user_id, "user", data.message)
        )
        conn.commit()

        text = data.message.lower()

        if "my name" in text:
            reply = "Your account is connected with MOTI memory. I remember you."
        elif "hello" in text:
            reply = "Hello, I am MOTI, your premium AI assistant."
        elif "who are you" in text:
            reply = "I am MOTI, an intelligent emotional voice assistant built for premium conversations."
        else:
            reply = "MOTI understood: " + data.message

        cur.execute(
            "INSERT INTO chats VALUES (?, ?, ?)",
            (data.user_id, "assistant", reply)
        )
        conn.commit()

        return {"reply": reply}

    except Exception as e:
        return {"reply": "Server error: " + str(e)}