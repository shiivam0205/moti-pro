from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route("/")
def home():
    return jsonify({"status": "online"})

@app.route("/chat", methods=["POST"])
def chat():
    data = request.get_json()

    return jsonify({
        "reply": f"MOTI: {data.get('message', '')}"
    })