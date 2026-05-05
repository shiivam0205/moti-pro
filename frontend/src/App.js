import React, { useState, useEffect } from "react";
import axios from "axios";

function App() {
  const API = "https://moti-pro07.onrender.com";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [userId, setUserId] = useState(localStorage.getItem("user_id") || "");
  const [loggedIn, setLoggedIn] = useState(false);

  const [input, setInput] = useState("");
  const [chat, setChat] = useState([]);

  useEffect(() => {
    if (userId) {
      setLoggedIn(true);
      loadHistory(userId);
    }
  }, []);

  const login = async () => {
    try {
      const res = await axios.post(`${API}/login`, {
        username,
        password,
      });

      if (res.data.error) {
        alert(res.data.error);
        return;
      }

      localStorage.setItem("user_id", res.data.user_id);
      setUserId(res.data.user_id);
      setLoggedIn(true);
      loadHistory(res.data.user_id);
    } catch (err) {
      alert(err.response?.data?.error || "Login failed");
    }
  };

  const loadHistory = async (uid) => {
    try {
      const res = await axios.get(`${API}/history/${uid}`);

      const formatted = res.data.history.map((h) => ({
        role: h[0] === "assistant" ? "bot" : "user",
        text: h[1],
      }));

      setChat(formatted);
    } catch (err) {
      console.log(err);
    }
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const text = input;
    setInput("");

    setChat((prev) => [...prev, { role: "user", text }]);
    setChat((prev) => [...prev, { role: "bot", text: "..." }]);

    try {
      const res = await axios.post(`${API}/chat`, {
        user_id: userId,
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

  // ---------------- LOGIN UI ----------------
  if (!loggedIn) {
    return (
      <div style={styles.loginWrap}>
        <div style={styles.loginBox}>
          <h1 style={styles.logo}>MOTI AI</h1>

          <input
            placeholder="Username"
            style={styles.input}
            onChange={(e) => setUsername(e.target.value)}
          />

          <input
            placeholder="Password"
            type="password"
            style={styles.input}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button style={styles.button} onClick={login}>
            Login / Signup
          </button>
        </div>
      </div>
    );
  }

  // ---------------- CHAT UI ----------------
  return (
    <div style={styles.app}>
      <div style={styles.header}>✨ MOTI AI Assistant</div>

      <div style={styles.chatBox}>
        {chat.map((msg, i) => (
          <div
            key={i}
            style={
              msg.role === "user"
                ? styles.userMsg
                : styles.botMsg
            }
          >
            {msg.text}
          </div>
        ))}
      </div>

      <div style={styles.bottom}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          style={styles.chatInput}
          placeholder="Type message..."
        />

        <button style={styles.sendBtn} onClick={sendMessage}>
          Send
        </button>
      </div>
    </div>
  );
}

const styles = {
  app: {
    background: "#0f0f0f",
    height: "100vh",
    color: "white",
    display: "flex",
    flexDirection: "column",
  },

  header: {
    padding: 15,
    fontSize: 20,
    fontWeight: "bold",
    background: "#111",
    textAlign: "center",
  },

  chatBox: {
    flex: 1,
    overflowY: "auto",
    padding: 10,
  },

  userMsg: {
    background: "#2b7cff",
    padding: 10,
    margin: 6,
    borderRadius: 10,
    textAlign: "right",
  },

  botMsg: {
    background: "#222",
    padding: 10,
    margin: 6,
    borderRadius: 10,
  },

  bottom: {
    display: "flex",
    padding: 10,
    background: "#111",
  },

  chatInput: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    border: "none",
  },

  sendBtn: {
    marginLeft: 10,
    padding: "10px 20px",
  },

  loginWrap: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#0f0f0f",
  },

  loginBox: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
    padding: 20,
    background: "#111",
    borderRadius: 10,
  },

  input: {
    padding: 10,
    borderRadius: 6,
    border: "none",
  },

  button: {
    padding: 10,
    background: "#2b7cff",
    color: "white",
    border: "none",
    borderRadius: 6,
  },

  logo: {
    textAlign: "center",
  },
};

export default App;