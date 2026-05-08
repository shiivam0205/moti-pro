from flask import Flask, request, jsonify
from flask_cors import CORS
import random

app = Flask(__name__)
CORS(app)

responses = [
    "I understand what you mean.",
    "That sounds interesting.",
    "Tell me more about it.",
    "I am thinking about your message.",
    "That is actually a smart point.",
    "I can help you with that.",
    "Interesting question.",
    "I am MOTI AI and I am online."
]

@app.route("/")
def home():
    return jsonify({
        "status": "online"
    })

@app.route("/chat", methods=["POST"])
def chat():

    data = request.get_json()

    message = data.get("message", "")

    if not message:
        return jsonify({
            "reply": "Please say something."
        })

    # basic smart replies

    lower = message.lower()

    if "hello" in lower or "hi" in lower:
        reply = "Hello! How can I help you today?"

    elif "your name" in lower:
        reply = "My name is MOTI AI."

    elif "how are you" in lower:
        reply = "I am doing great."

    elif "weather" in lower:
        reply = "I can help with weather once APIs are connected."

    else:
        reply = random.choice(responses)

    return jsonify({
        "reply": reply
    })

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)