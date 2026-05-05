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

      localStorage.setItem("user_id", res.data.user_id);
      setUserId(res.data.user_id);
      setLoggedIn(true);

      loadHistory(res.data.user_id);
    } catch (err) {
      alert("Login error");
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

  if (!loggedIn) {
    return (
      <div style={styles.loginPage}>
        <h2>MOTI AI Login</h2>

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
    );
  }

  return (
    <div style={styles.page}>
      <h2 style={styles.title}>MOTI AI</h2>

      <div style={styles.chatBox}>
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

      <div style={styles.inputRow}>
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
  loginPage: {
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },

  page: {
    padding: 20,
    fontFamily: "Arial",
  },

  title: {
    textAlign: "center",
  },

  chatBox: {
    height: "70vh",
    overflowY: "auto",
    border: "1px solid #ccc",
    padding: 10,
    marginBottom: 10,
  },

  userBubble: {
    textAlign: "right",
    background: "#daf1ff",
    padding: 8,
    margin: 5,
    borderRadius: 10,
  },

  botBubble: {
    textAlign: "left",
    background: "#eee",
    padding: 8,
    margin: 5,
    borderRadius: 10,
  },

  inputRow: {
    display: "flex",
    gap: 10,
  },

  chatInput: {
    flex: 1,
    padding: 10,
  },

  sendBtn: {
    padding: "10px 20px",
  },

  input: {
    padding: 10,
    width: 200,
  },

  button: {
    padding: 10,
  },
};

export default App;