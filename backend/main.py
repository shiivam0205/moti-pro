from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from groq import Groq
from pydantic import BaseModel
import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

user_memories = {}

class ChatRequest(BaseModel):
    message: str
    user_id: str

@app.get("/")
def home():
    return {"status": "MOTI AI running"}

@app.post("/chat")
def chat(payload: ChatRequest):
    try:
        message = payload.message
        user_id = payload.user_id

        if message.strip() == "":
            return {"reply": "Please type something."}

        if user_id not in user_memories:
            user_memories[user_id] = [
                {
                    "role": "system",
                    "content": "You are MOTI, a smart friendly female AI assistant. Remember recent conversation of this user only and reply naturally."
                }
            ]

        history = user_memories[user_id]

        history.append({
            "role": "user",
            "content": message
        })

        if len(history) > 8:
            history[:] = [history[0]] + history[-7:]

        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=history
        )

        reply = response.choices[0].message.content

        history.append({
            "role": "assistant",
            "content": reply
        })

        return {"reply": reply}

    except Exception as e:
        print("AI ERROR:", str(e))
        return {"reply": f"AI error: {str(e)}"}