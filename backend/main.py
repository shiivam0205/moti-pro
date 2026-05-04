from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from backend import models, database, schemas, auth, agent

app = FastAPI()

models.Base.metadata.create_all(bind=database.engine)

def db():
    d = database.SessionLocal()
    try:
        yield d
    finally:
        d.close()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"]
)

@app.post("/chat")
def chat(req: dict):
    return {"response": "hello"}