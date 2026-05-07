import React, { useState } from "react";

export default function App() {

  const [userId, setUserId] = useState(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);

  const API = "https://moti-pro07.onrender.com";

  // ======================
  // LOGIN
  // ======================
  const handleLogin = async () => {

    try {

      const res = await fetch(`${API}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          password
        })
      });

      const data = await res.json();

      if (data.user_id) {
        setUserId(data.user_id);
      }

    } catch (err) {
      alert("Login error");
    }
  };

  // ======================
  // SEND MESSAGE
  // ======================
  const sendMessage = async () => {

    if (!message) return;

    const newChat = [
      ...chat,
      { role: "user", text: message }
    ];

    setChat(newChat);

    setMessage("");

    try {

      const res = await fetch(`${API}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          message: message
        })
      });

      const data = await res.json();

      setChat([
        ...newChat,
        { role: "ai", text: data.reply }
      ]);

    } catch (err) {

      setChat([
        ...newChat,
        { role: "ai", text: "Server error" }
      ]);

    }
  };

  // ======================
  // LOGIN SCREEN
  // ======================
  if (!userId) {

    return (
      <div style={styles.loginBox}>

        <h1 style={{ color: "white" }}>MOTI AI Login</h1>

        <input
          style={styles.input}
          placeholder="Username"
          onChange={(e) => setUsername(e.target.value)}
        />

        <input
          style={styles.input}
          placeholder="Password"
          type="password"
          onChange={(e) => setPassword(e.target.value)}
        />

        <button style={styles.button} onClick={handleLogin}>
          Login
        </button>

      </div>
    );
  }

  // ======================
  // CHAT UI
  // ======================
  return (
    <div style={styles.container}>

      {/* HEADER */}
      <div style={styles.header}>
        <h2>MOTI AI Chat</h2>
      </div>

      {/* CHAT BOX */}
      <div style={styles.chatBox}>

        {chat.map((c, i) => (
          <div
            key={i}
            style={{
              ...styles.msg,
              alignSelf: c.role === "user" ? "flex-end" : "flex-start",
              backgroundColor: c.role === "user" ? "#4a90e2" : "#333"
            }}
          >
            {c.text}
          </div>
        ))}

      </div>

      {/* INPUT */}
      <div style={styles.inputBox}>

        <input
          style={styles.input}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Ask MOTI..."
        />

        <button style={styles.button} onClick={sendMessage}>
          Send
        </button>

      </div>

    </div>
  );
}

// ======================
// STYLES
// ======================
const styles = {

  container: {
    backgroundColor: "#0f0f0f",
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    color: "white"
  },

  header: {
    padding: 15,
    backgroundColor: "#111",
    textAlign: "center"
  },

  chatBox: {
    flex: 1,
    padding: 10,
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: 10
  },

  msg: {
    padding: 10,
    borderRadius: 10,
    maxWidth: "70%",
    color: "white"
  },

  inputBox: {
    display: "flex",
    padding: 10,
    backgroundColor: "#111"
  },

  input: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    border: "none",
    outline: "none"
  },

  button: {
    marginLeft: 10,
    padding: "10px 15px",
    backgroundColor: "#4a90e2",
    border: "none",
    borderRadius: 8,
    color: "white",
    cursor: "pointer"
  },

  loginBox: {
    height: "100vh",
    backgroundColor: "#0f0f0f",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    gap: 10
  }
};