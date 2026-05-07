import requests
import os
from dotenv import load_dotenv

load_dotenv()
KEY = os.getenv("LLM_API_KEY")

def ask_llm(msg):
    r = requests.post(
        "https://api.groq.com/openai/v1/chat/completions",
        headers={"Authorization": f"Bearer {KEY}"},
        json={
            "model": "llama-3.1-8b-instant",
            "messages": [{"role": "user", "content": msg}]
        }
    )
    return r.json()["choices"][0]["message"]["content"]