from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from groq import Groq
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
conversation_history = [
    {
        "role": "system",
        "content": "You are MOTI, a smart friendly female AI assistant. Remember previous conversation and reply naturally."
    }
]

@app.get("/")
def home():
    return {"status": "MOTI AI running"}

from pydantic import BaseModel

class ChatRequest(BaseModel):
    message: str

@app.post("/chat")
def chat(payload: ChatRequest):
    try:
        message = payload.message

        if message.strip() == "":
            return {"reply": "Please type something."}

        conversation_history.append({
            "role": "user",
            "content": message
        })

        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=conversation_history
        )

        reply = response.choices[0].message.content

        conversation_history.append({
            "role": "assistant",
            "content": reply
        })

        return {"reply": reply}

    except Exception as e:
        print("AI ERROR:", str(e))
        return {"reply": f"AI error: {str(e)}"}