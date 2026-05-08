from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route("/")
def home():
    return jsonify({
        "status": "online"
    })

@app.route("/chat", methods=["POST"])
def chat():
    data = request.get_json()
    message = data.get("message", "")

    return jsonify({
        "reply": f"MOTI says: {message}"
    })

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)