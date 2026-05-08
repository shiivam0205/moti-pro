from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import os

app = Flask(__name__)
CORS(app)

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

@app.route("/")
def home():
    return jsonify({
        "status": "online"
    })

@app.route("/chat", methods=["POST"])
def chat():

    try:

        data = request.get_json()

        message = data.get("message", "")

        if message == "":
            return jsonify({
                "reply": "Please type something."
            })

        headers = {
            "Authorization": f"Bearer {GROQ_API_KEY}",
            "Content-Type": "application/json"
        }

        payload = {
            "model": "llama3-70b-8192",
            "messages": [
                {
                    "role": "system",
                    "content": "You are MOTI AI. Reply naturally like ChatGPT."
                },
                {
                    "role": "user",
                    "content": message
                }
            ]
        }

        response = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers=headers,
            json=payload
        )

        result = response.json()

        reply = result["choices"][0]["message"]["content"]

        return jsonify({
            "reply": reply
        })

    except Exception as e:

        print(e)

        return jsonify({
            "reply": "AI brain error."
        })

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)