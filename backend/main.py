from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from groq import Groq
from pydantic import BaseModel
import os
import sqlite3

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

# ---------------- DATABASE ----------------
conn = sqlite3.connect("moti.db", check_same_thread=False)
cursor = conn.cursor()

cursor.execute("""
CREATE TABLE IF NOT EXISTS memory (
    user_id TEXT,
    type TEXT,
    content TEXT
)
""")

conn.commit()

# ---------------- REQUEST ----------------
class ChatRequest(BaseModel):
    message: str
    user_id: str

# ---------------- SAVE MEMORY ----------------
def save_memory(user_id, content):
    cursor.execute(
        "INSERT INTO memory (user_id, type, content) VALUES (?, ?, ?)",
        (user_id, "fact", content)
    )
    conn.commit()

# ---------------- LOAD MEMORY ----------------
def load_memory(user_id):
    cursor.execute(
        "SELECT content FROM memory WHERE user_id = ?",
        (user_id,)
    )
    rows = cursor.fetchall()
    return [r[0] for r in rows]

# ---------------- API ----------------
@app.get("/")
def home():
    return {"status": "MOTI AI running"}

@app.post("/chat")
def chat(payload: ChatRequest):
    try:
        message = payload.message.strip()
        user_id = payload.user_id

        if message == "":
            return {"reply": "Please type something."}

        lower = message.lower()

        # detect personal info
        if any(x in lower for x in ["my name is", "i am", "i like", "i love"]):
            save_memory(user_id, message)

        memory = load_memory(user_id)

        memory_text = ""
        if memory:
            memory_text = "User memory: " + " | ".join(memory)

        messages = [
            {
                "role": "system",
                "content": f"You are MOTI, a friendly AI assistant. Use user memory when needed. {memory_text}"
            },
            {
                "role": "user",
                "content": message
            }
        ]

        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=messages
        )

        reply = response.choices[0].message.content

        return {"reply": reply}

    except Exception as e:
        print("ERROR:", str(e))
        return {"reply": f"AI error: {str(e)}"}