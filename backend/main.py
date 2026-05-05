from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def home():
    return {"status": "MOTI running"}

@app.post("/chat")
def chat(payload: dict):
    message = payload.get("message", "")

    return {
        "reply": f"MOTI: I heard '{message}'"
    }