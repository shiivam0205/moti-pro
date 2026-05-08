from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
import requests
import os

app = Flask(__name__)
CORS(app)

app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///moti.db"
db = SQLAlchemy(app)

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

# ================= DB =================
class Chat(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user = db.Column(db.String(100))
    message = db.Column(db.Text)
    response = db.Column(db.Text)

with app.app_context():
    db.create_all()

# ================= HOME =================
@app.route("/")
def home():
    return {"status": "online"}

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=10000)
# ================= CHAT =================
@app.route("/chat", methods=["POST"])
def chat():

    data = request.json
    user = data.get("user")
    message = data.get("message")

    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json"
    }

    payload = {
        "model": "llama-3.3-70b-versatile",
        "messages": [
            {"role": "system", "content": "You are MOTI AI ChatGPT clone."},
            {"role": "user", "content": message}
        ]
    }

    res = requests.post(
        "https://api.groq.com/openai/v1/chat/completions",
        headers=headers,
        json=payload
    )

    reply = res.json()["choices"][0]["message"]["content"]

    # SAVE CHAT
    chat = Chat(user=user, message=message, response=reply)
    db.session.add(chat)
    db.session.commit()

    return {"reply": reply}

# ================= HISTORY =================
@app.route("/history/<user>")
def history(user):

    chats = Chat.query.filter_by(user=user).all()

    return jsonify([
        {
            "message": c.message,
            "response": c.response
        } for c in chats
    ])

if __name__ == "__main__":
    app.run()