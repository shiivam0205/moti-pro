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

# recent chat memory
user_memories = {}

# permanent personal profile memory
user_profiles = {}

class ChatRequest(BaseModel):
    message: str
    user_id: str

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

        # create personal profile if new user
        if user_id not in user_profiles:
            user_profiles[user_id] = []

        # save personal facts when user says remember/my name/my favorite/i am/i like
        lower_msg = message.lower()

        trigger_words = [
            "my name is",
            "i am ",
            "i'm ",
            "my favorite",
            "i like",
            "i love",
            "remember that",
            "remember this",
            "my birthday",
            "i live in"
        ]

        for t in trigger_words:
            if t in lower_msg:
                if message not in user_profiles[user_id]:
                    user_profiles[user_id].append(message)
                break

        personal_memory_text = ""
        if len(user_profiles[user_id]) > 0:
            personal_memory_text = "Here is what you permanently know about this user: " + " | ".join(user_profiles[user_id])

        # create recent conversation if new
        if user_id not in user_memories:
            user_memories[user_id] = [
                {
                    "role": "system",
                    "content": "You are MOTI, a smart friendly female AI assistant. Reply naturally and personally."
                }
            ]

        history = user_memories[user_id]

        # update system prompt with permanent memory
        history[0] = {
            "role": "system",
            "content": f"You are MOTI, a smart friendly female AI assistant. Reply naturally and personally. {personal_memory_text}"
        }

        history.append({
            "role": "user",
            "content": message
        })

        # keep recent short chat memory
        if len(history) > 10:
            history[:] = [history[0]] + history[-9:]

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