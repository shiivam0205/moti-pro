import React, { useState } from "react";
import axios from "axios";

function App() {
  const [input, setInput] = useState("");
  const [chat, setChat] = useState([]);

  const API = "https://moti-pro07.onrender.com";

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userText = input;

    setChat((prev) => [
      ...prev,
      { user: userText, bot: "..." }
    ]);

    setInput("");

    try {
      const res = await axios.post(`${API}/chat`, {
        message: userText
      });

      const reply = res.data.reply;

      setChat((prev) => {
        const updated = [...prev];
        updated[updated.length - 1].bot = reply;
        return updated;
      });

    } catch (err) {
      setChat((prev) => {
        const updated = [...prev];
        updated[updated.length - 1].bot = "Server error";
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
      <div style={styles.chatBox}>
        {chat.map((c, i) => (
          <div key={i} style={styles.message}>
            
            <div style={styles.userMsg}>
              👤 You: {c.user}
            </div>

            <div style={styles.botMsg}>
              🤖 MOTI: {c.bot}
            </div>

          </div>
        ))}
      </div>

      {/* INPUT AREA */}
      <div style={styles.inputBox}>
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

const styles = {
  page: {
    fontFamily: "Arial",
    minHeight: "100vh",
    background: "linear-gradient(135deg, #e0f7fa, #e1bee7)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center"
  },

  header: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 10,
    color: "#333"
  },

  chatBox: {
    width: "90%",
    maxWidth: 600,
    height: 400,
    overflowY: "auto",
    background: "white",
    borderRadius: 12,
    padding: 15,
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
  },

  message: {
    marginBottom: 12
  },

  userMsg: {
    textAlign: "right",
    color: "#1a73e8",
    marginBottom: 4
  },

  botMsg: {
    textAlign: "left",
    color: "#2e7d32"
  },

  inputBox: {
    display: "flex",
    marginTop: 15,
    width: "90%",
    maxWidth: 600,
    gap: 10
  },

  input: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    border: "1px solid #ccc",
    outline: "none"
  },

  button: {
    padding: "12px 20px",
    background: "#7b1fa2",
    color: "white",
    border: "none",
    borderRadius: 8,
    cursor: "pointer"
  }
};

export default App;