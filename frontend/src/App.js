import React, { useState } from "react";

export default function App() {

  const API = "https://moti-pro07.onrender.com";

  const [userId, setUserId] = useState(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [input, setInput] = useState("");
  const [chat, setChat] = useState([]);

  // ================= LOGIN =================
  const login = async () => {

    const res = await fetch(`${API}/login`, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();

    if (data.user_id) setUserId(data.user_id);
  };

  // ================= VOICE =================
  const speak = (text) => {

    const msg = new SpeechSynthesisUtterance(text);

    msg.rate = 1;
    msg.pitch = 1;
    window.speechSynthesis.speak(msg);
  };

  // ================= SEND =================
  const send = async () => {

    if (!input) return;

    const updated = [...chat, { role: "user", text: input }];
    setChat(updated);

    const text = input;
    setInput("");

    const res = await fetch(`${API}/chat`, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({
        user_id: userId,
        message: text
      })
    });

    const data = await res.json();

    setChat([...updated, { role: "ai", text: data.reply }]);

    speak(data.reply);
  };

  // ================= LOGIN UI =================
  if (!userId) {
    return (
      <div style={styles.login}>
        <h2>MOTI ULTRA AI</h2>

        <input
          style={styles.input}
          placeholder="username"
          onChange={(e)=>setUsername(e.target.value)}
        />

        <input
          style={styles.input}
          type="password"
          placeholder="password"
          onChange={(e)=>setPassword(e.target.value)}
        />

        <button style={styles.btn} onClick={login}>
          Login
        </button>
      </div>
    );
  }

  // ================= CHAT UI =================
  return (
    <div style={styles.app}>

      <div style={styles.header}>MOTI ULTRA CHATGPT</div>

      <div style={styles.chat}>
        {chat.map((c,i)=>(
          <div
            key={i}
            style={{
              ...styles.msg,
              alignSelf: c.role === "user" ? "flex-end" : "flex-start",
              background: c.role === "user" ? "#4a90e2" : "#2a2a2a"
            }}
          >
            {c.text}
          </div>
        ))}
      </div>

      <div style={styles.bottom}>
        <input
          style={styles.input}
          value={input}
          onChange={(e)=>setInput(e.target.value)}
          placeholder="Ask anything..."
        />

        <button style={styles.btn} onClick={send}>
          Send
        </button>
      </div>

    </div>
  );
}

// ================= STYLES =================
const styles = {

  app: {
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    background: "#0d0d0d",
    color: "white"
  },

  header: {
    padding: 10,
    textAlign: "center",
    background: "#111",
    fontWeight: "bold"
  },

  chat: {
    flex: 1,
    overflowY: "auto",
    padding: 10,
    display: "flex",
    flexDirection: "column",
    gap: 8
  },

  msg: {
    padding: 10,
    borderRadius: 10,
    maxWidth: "75%"
  },

  bottom: {
    display: "flex",
    padding: 10,
    background: "#111"
  },

  input: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    border: "none",
    outline: "none"
  },

  btn: {
    marginLeft: 10,
    padding: "10px 15px",
    background: "#4a90e2",
    border: "none",
    borderRadius: 8,
    color: "white",
    cursor: "pointer"
  },

  login: {
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    background: "#0d0d0d",
    color: "white"
  }
};