from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import os
from openai import OpenAI
import base64
import os

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

@app.route("/tts-stream", methods=["POST"])
def tts_stream():

    try:

        data = request.get_json()
        text = data.get("text", "")

        response = client.audio.speech.create(
            model="gpt-4o-mini-tts",
            voice="alloy",
            input=text,
            format="mp3"
        )

        audio_bytes = response.content
        audio_base64 = base64.b64encode(audio_bytes).decode("utf-8")

        return jsonify({
            "audio": audio_base64
        })

    except Exception as e:
        return jsonify({
            "error": str(e)
        })

app = Flask(__name__)
CORS(app)

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

@app.route("/")
def home():
    return jsonify({
        "status": "online",
        "brain": "active"
    })

@app.route("/chat", methods=["POST"])
def chat():

    try:

        data = request.get_json()

        user_message = data.get("message", "")

        if not user_message:
            return jsonify({
                "reply": "Please type something."
            })

        if not GROQ_API_KEY:
            return jsonify({
                "reply": "Missing GROQ API KEY in Render environment."
            })

        headers = {
            "Authorization": f"Bearer {GROQ_API_KEY}",
            "Content-Type": "application/json"
        }

        payload = {
    "model": "llama-3.3-70b-versatile",
    "messages": [
        {
            "role": "system",
            "content": "You are MOTI AI. Detect language automatically and reply in same language as user. Never force English."
        },
        {
            "role": "user",
            "content": user_message
        }
    ],
    "temperature": 0.7,
    "max_tokens": 1024
}
                {
                    "role": "user",
                    "content": user_message
                }
            ],
            "temperature": 0.7,
            "max_tokens": 1024
        }

        response = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers=headers,
            json=payload,
            timeout=60
        )

        print("STATUS:", response.status_code)
        print("TEXT:", response.text)

        if response.status_code != 200:

            return jsonify({
                "reply": f"Groq API Error: {response.text}"
            })

        result = response.json()

        reply = result["choices"][0]["message"]["content"]

        return jsonify({
            "reply": reply
        })

    except Exception as e:

        print("SERVER ERROR:", str(e))

        return jsonify({
            "reply": f"AI brain error: {str(e)}"
        })

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)