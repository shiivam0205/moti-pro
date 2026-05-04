from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def home():
    return {"status": "MOTI AI is running"}

@app.get("/health")
def health():
    return {"ok": True}