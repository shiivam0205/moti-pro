import React, { useState } from "react";

export default function App() {

  const [userId, setUserId] = useState(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [msg, setMsg] = useState("");
  const [chat, setChat] = useState([]);

  const API = "https://moti-pro07.onrender.com";

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

  // ================= TEXT TO SPEECH =================
  const speak = (text) => {

    const speech = new SpeechSynthesisUtterance(text);

    speech.lang = "auto"; // browser auto language
    speech.rate = 1;

    window.speechSynthesis.speak(speech);
  };

  // ================= SEND MESSAGE =================
  const send = async () => {

    if (!msg) return;

    const updated = [...chat, { role: "user", text: msg }];
    setChat(updated);

    const text = msg;
    setMsg("");

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

    // voice
    speak(data.reply);
  };

  // ================= LOGIN UI =================
  if (!userId) {
    return (
      <div style={styles.login}>
        <h2>MOTI AI Login</h2>

        <input
          style={styles.input}
          placeholder="username"
          onChange={(e)=>setUsername(e.target.value)}
        />

        <input
          style={styles.input}
          placeholder="password"
          type="password"
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
    <div style={styles.page}>

      <div style={styles.header}>MOTI AI PRO MAX</div>

      <div style={styles.chat}>
        {chat.map((c,i)=>(
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

      <div style={styles.bottom}>
        <input
          style={styles.input}
          value={msg}
          onChange={(e)=>setMsg(e.target.value)}
          placeholder="Ask anything in any language..."
        />

        <button style={styles.btn} onClick={send}>
          Send
        </button>
      </div>

    </div>
  );
}

// ================= STYLES (FIXED UI SIZE) =================
const styles = {

  page: {
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    background: "#0f0f0f",
    color: "white"
  },

  header: {
    padding: 10,
    textAlign: "center",
    background: "#111"
  },

  chat: {
    flex: 1,
    padding: 10,
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: 8
  },

  msg: {
    padding: 10,
    borderRadius: 10,
    maxWidth: "70%"
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
    color: "white"
  },

  login: {
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    background: "#0f0f0f",
    color: "white"
  }
};