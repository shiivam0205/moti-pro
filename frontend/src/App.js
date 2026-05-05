import React, { useState } from "react";
import axios from "axios";

function App() {
  const [input, setInput] = useState("");
  const [chat, setChat] = useState([]);

  const API = "https://moti-pro07.onrender.com";

  const sendMessage = async () => {
    if (!input.trim()) return;

    const text = input.trim();
    setInput("");

    // add user message first
    setChat((prev) => [...prev, { role: "user", text }]);

    // placeholder bot message
    setChat((prev) => [...prev, { role: "bot", text: "..." }]);

    try {
      const res = await axios.post(`${API}/chat`, {
        message: text,
      });

      const reply = res.data.reply;

      setChat((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: "bot", text: reply };
        return updated;
      });
    } catch (err) {
      setChat((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "bot",
          text: "⚠️ Server error",
        };
        return updated;
      });
    }
  };

  return (
    <div style={styles.page}>
      {/* HEADER */}
      <div style={styles.header}>
        🤖 MOTI AI Assistant
      </div>

      {/* CHAT BOX */}
      <div style={styles.chatContainer}>
        {chat.map((msg, i) => (
          <div
            key={i}
            style={
              msg.role === "user"
                ? styles.userBubble
                : styles.botBubble
            }
          >
            {msg.text}
          </div>
        ))}
      </div>
<h1 style={{color:"red"}}>UI TEST CHANGE 123</h1>

      {/* INPUT AREA */}
      <div style={styles.inputArea}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          style={styles.input}
        />

        <button onClick={sendMessage} style={styles.button}>
          Send
        </button>
      </div>
    </div>
  );
}

/* ================= PRO UI STYLES ================= */

const styles = {
  page: {
    fontFamily: "Arial",
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    background: "linear-gradient(135deg, #89f7fe, #66a6ff)",
    padding: 15,
  },

  header: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 10,
    textShadow: "0 2px 10px rgba(0,0,0,0.2)",
  },

  chatContainer: {
    flex: 1,
    width: "100%",
    maxWidth: 650,
    overflowY: "auto",
    padding: 15,
    borderRadius: 16,
    background: "rgba(255,255,255,0.25)",
    backdropFilter: "blur(10px)",
    boxShadow: "0 8px 25px rgba(0,0,0,0.1)",
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },

  userBubble: {
    alignSelf: "flex-end",
    background: "#1976d2",
    color: "white",
    padding: "10px 14px",
    borderRadius: "18px 18px 0 18px",
    maxWidth: "75%",
  },

  botBubble: {
    alignSelf: "flex-start",
    background: "white",
    color: "#333",
    padding: "10px 14px",
    borderRadius: "18px 18px 18px 0",
    maxWidth: "75%",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
  },

  inputArea: {
    display: "flex",
    gap: 10,
    width: "100%",
    maxWidth: 650,
    marginTop: 10,
  },

  input: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    border: "none",
    outline: "none",
    fontSize: 14,
  },

  button: {
    padding: "12px 18px",
    borderRadius: 12,
    border: "none",
    background: "#6a1b9a",
    color: "white",
    cursor: "pointer",
    fontWeight: "bold",
  },
};

export default App;