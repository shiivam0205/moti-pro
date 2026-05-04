from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# CORS FIX
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://moti-pro-p4ls.vercel.app",
        "http://localhost:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# TEST ROUTE
@app.get("/")
def home():
    return {"status": "MOTI AI running"}

# CHAT ROUTE (THIS WAS MISSING)
@app.post("/chat")
def chat(payload: dict):
    message = payload.get("message", "")
    return {"reply": "Hello from MOTI AI"}