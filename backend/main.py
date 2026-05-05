from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from groq import Groq

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

@app.post("/chat")
def chat(payload: dict):
    try:
        message = payload.get("message", "")

        if not message:
            return {"reply": "Please send a message"}

        response = client.chat.completions.create(
            model="llama3-70b-8192",
            messages=[
                {"role": "system", "content": "You are MOTI, a smart AI assistant."},
                {"role": "user", "content": message}
            ]
        )

        reply = response.choices[0].message.content

        return {"reply": reply}

    except Exception as e:
        print("ERROR:", e)
        return {"reply": "AI error - check backend logs"}