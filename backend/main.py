from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
import os

# ======================================================
# APP
# ======================================================

app = Flask(__name__)
CORS(app)

# ======================================================
# DATABASE
# ======================================================

DB_PATH = os.path.join(os.path.dirname(__file__), "moti.db")

conn = sqlite3.connect(DB_PATH, check_same_thread=False)
c = conn.cursor()

# USERS TABLE
c.execute("""
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT
)
""")

# CHATS TABLE
c.execute("""
CREATE TABLE IF NOT EXISTS chats (
    id TEXT,
    user_id TEXT,
    role TEXT,
    message TEXT
)
""")

conn.commit()

# ======================================================
# HOME
# ======================================================

@app.route("/")
def home():
    return "MOTI AI Backend Running Successfully 🚀"

# ======================================================
# LOGIN
# ======================================================

@app.route("/login", methods=["POST"])
def login():

    try:

        data = request.json

        username = data.get("username")
        password = data.get("password")

        if not username or not password:
            return jsonify({
                "error": "username and password required"
            }), 400

        # CHECK EXISTING USER
        c.execute(
            "SELECT id, password FROM users WHERE username=?",
            (username,)
        )

        user = c.fetchone()

        # USER EXISTS
        if user:

            db_user_id = str(user[0])
            db_password = user[1]

            # CORRECT PASSWORD
            if db_password == password:
                return jsonify({
                    "user_id": db_user_id
                })

            # WRONG PASSWORD
            return jsonify({
                "error": "wrong password"
            }), 401

        # CREATE NEW USER
        c.execute(
            "INSERT INTO users (username, password) VALUES (?,?)",
            (username, password)
        )

        conn.commit()

        return jsonify({
            "user_id": str(c.lastrowid)
        })

    except Exception as e:
        return jsonify({
            "error": str(e)
        }), 500

# ======================================================
# CHAT
# ======================================================

@app.route("/chat", methods=["POST"])
def chat():

    try:

        data = request.json

        user_id = str(data.get("user_id"))
        chat_id = str(data.get("chat_id"))
        message = data.get("message")

        # SAFETY
        if not user_id or not chat_id or not message:
            return jsonify({
                "error": "missing data"
            }), 400

        # SAVE USER MESSAGE
        c.execute(
            """
            INSERT INTO chats (id, user_id, role, message)
            VALUES (?, ?, ?, ?)
            """,
            (chat_id, user_id, "user", message)
        )

        # ======================================================
        # AI REPLY
        # ======================================================

        lower = message.lower()

        # WEATHER
        if "weather" in lower:
            reply = (
                "Today's weather is warm with clear skies ☀️"
            )

        # HELLO
        elif "hello" in lower or "hi" in lower:
            reply = "Hello 👋 I am MOTI AI."

        # DEFAULT
        else:
            reply = f"MOTI: understood → {message}"

        # SAVE AI MESSAGE
        c.execute(
            """
            INSERT INTO chats (id, user_id, role, message)
            VALUES (?, ?, ?, ?)
            """,
            (chat_id, user_id, "ai", reply)
        )

        conn.commit()

        print("Saved Chat:", chat_id, user_id)

        return jsonify({
            "reply": reply
        })

    except Exception as e:
        return jsonify({
            "error": str(e)
        }), 500

# ======================================================
# HISTORY
# ======================================================

@app.route("/history/<user_id>")
def history(user_id):

    try:

        c.execute(
            """
            SELECT DISTINCT id
            FROM chats
            WHERE user_id=?
            ORDER BY rowid DESC
            """,
            (str(user_id),)
        )

        rows = c.fetchall()

        chats = [row[0] for row in rows]

        return jsonify({
            "chats": chats
        })

    except Exception as e:
        return jsonify({
            "error": str(e)
        }), 500

# ======================================================
# LOAD CHAT
# ======================================================

@app.route("/load/<user_id>/<chat_id>")
def load_chat(user_id, chat_id):

    try:

        c.execute(
            """
            SELECT role, message
            FROM chats
            WHERE user_id=? AND id=?
            ORDER BY rowid ASC
            """,
            (str(user_id), str(chat_id))
        )

        rows = c.fetchall()

        messages = []

        for row in rows:
            messages.append([
                row[0],
                row[1]
            ])

        return jsonify({
            "messages": messages
        })

    except Exception as e:
        return jsonify({
            "error": str(e)
        }), 500

# ======================================================
# DELETE CHAT
# ======================================================

@app.route("/delete/<user_id>/<chat_id>", methods=["DELETE"])
def delete_chat(user_id, chat_id):

    try:

        c.execute(
            """
            DELETE FROM chats
            WHERE user_id=? AND id=?
            """,
            (str(user_id), str(chat_id))
        )

        conn.commit()

        return jsonify({
            "success": True
        })

    except Exception as e:
        return jsonify({
            "error": str(e)
        }), 500

# ======================================================
# RUN
# ======================================================

if __name__ == "__main__":

    print("🚀 MOTI AI BACKEND STARTED")

    app.run(
        host="0.0.0.0",
        port=5000,
        debug=True
    )