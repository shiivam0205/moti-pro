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

  // ================= STREAM EFFECT =================
  const typeEffect = (text, callback) => {

    let i = 0;
    let temp = "";

    const interval = setInterval(() => {

      temp += text[i];
      i++;

      callback(temp);

      if (i >= text.length) clearInterval(interval);

    }, 15);
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

    let streamingMsg = { role: "ai", text: "" };

    setChat([...updated, streamingMsg]);

    typeEffect(data.reply, (val) => {

      setChat(prev => {
        const copy = [...prev];
        copy[copy.length - 1] = { role: "ai", text: val };
        return copy;
      });

    });

    speak(data.reply);
  };

  // ================= LOGIN UI =================
  if (!userId) {
    return (
      <div style={styles.login}>
        <h1>MOTI GOD MODE AI</h1>

        <input style={styles.input} placeholder="username"
          onChange={(e)=>setUsername(e.target.value)}
        />

        <input style={styles.input} type="password" placeholder="password"
          onChange={(e)=>setPassword(e.target.value)}
        />

        <button style={styles.btn} onClick={login}>
          Enter AI
        </button>
      </div>
    );
  }

  // ================= CHAT UI =================
  return (
    <div style={styles.app}>

      <div style={styles.header}>MOTI GOD MODE AI</div>

      <div style={styles.chat}>
        {chat.map((c,i)=>(
          <div key={i}
            style={{
              ...styles.msg,
              alignSelf: c.role==="user"?"flex-end":"flex-start",
              background: c.role==="user"?"#4a90e2":"#222"
            }}
          >
            {c.text}
          </div>
        ))}
      </div>

      <div style={styles.bottom}>
        <input style={styles.input}
          value={input}
          onChange={(e)=>setInput(e.target.value)}
          placeholder="Ask anything in any language..."
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
    background: "#0b0b0b",
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
    color: "white"
  },

  login: {
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    background: "#0b0b0b",
    color: "white"
  }
};