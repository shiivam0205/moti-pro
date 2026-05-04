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
@app.post("/chat")
def chat(payload: dict):
    message = payload.get("message", "")

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "You are MOTI, a helpful AI assistant."},
            {"role": "user", "content": message}
        ]
    )

    reply = response.choices[0].message.content

    return {"reply": reply}