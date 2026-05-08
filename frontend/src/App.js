import React, { useState, useEffect, useRef } from "react";

const API = process.env.REACT_APP_API || "https://moti-proo.onrender.com";

export default function App() {

  const [user, setUser] = useState("");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);

  const endRef = useRef(null);

  // ================= SCROLL =================
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ================= LOGIN ONLY =================
  const handleLogin = (e) => {
    if (e.key === "Enter" && e.target.value.trim()) {
      setUser(e.target.value.trim());
    }
  };

  // ================= VOICE =================
  const speak = (text) => {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    speechSynthesis.speak(u);
  };

  // ================= SEND MESSAGE (FIXED) =================
  const send = async (text) => {

    const msg = text || input;
    if (!msg.trim()) return;

    setInput("");

    // ❗ IMPORTANT FIX: SAME CHAT, NOT NEW CHAT
    setMessages(prev => [
      ...prev,
      { role: "user", text: msg }
    ]);

    try {

      const res = await fetch(`${API}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          user,
          message: msg
        })
      });

      const data = await res.json();

      setMessages(prev => [
        ...prev,
        { role: "ai", text: data.reply }
      ]);

      speak(data.reply);

    } catch (err) {

      setMessages(prev => [
        ...prev,
        { role: "ai", text: "Backend error" }
      ]);

    }
  };

  // ================= MIC =================
  const startMic = () => {

    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognition) return;

    const mic = new SpeechRecognition();

    mic.lang = "en-IN";

    mic.onresult = (e) => {
      send(e.results[0][0].transcript);
    };

    mic.start();
  };

  // ================= LOGIN SCREEN (FIXED SIMPLE UI) =================
  if (!user) {
    return (
      <div style={styles.login}>
        <h2 style={{ color: "#4f46e5" }}>MOTI AI</h2>

        <input
          placeholder="Enter username"
          style={styles.input}
          onKeyDown={handleLogin}
        />
      </div>
    );
  }

  // ================= CHAT UI =================
  return (
    <div style={styles.container}>

      <div style={styles.header}>
        MOTI AI
      </div>

      <div style={styles.chatBox}>

        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              ...styles.msg,
              alignSelf:
                m.role === "user"
                  ? "flex-end"
                  : "flex-start",
              background:
                m.role === "user"
                  ? "#4f46e5"
                  : "#222"
            }}
          >
            {m.text}
          </div>
        ))}

        <div ref={endRef} />

      </div>

      <div style={styles.inputBox}>

        <button onClick={startMic} style={styles.btn}>
          🎤
        </button>

        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send(input)}
          style={styles.input}
          placeholder="Ask MOTI..."
        />

        <button onClick={() => send(input)} style={styles.btn}>
          ➤
        </button>

      </div>

    </div>
  );
}

// ================= SIMPLE STYLES =================
const styles = {

  container: {
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    background: "#0f0f0f",
    color: "white"
  },

  header: {
    padding: 15,
    background: "#111",
    textAlign: "center",
    fontWeight: "bold"
  },

  chatBox: {
    flex: 1,
    padding: 10,
    display: "flex",
    flexDirection: "column",
    gap: 10,
    overflowY: "auto"
  },

  msg: {
    padding: 10,
    borderRadius: 10,
    maxWidth: "70%"
  },

  inputBox: {
    display: "flex",
    padding: 10,
    background: "#111"
  },

  input: {
    flex: 1,
    padding: 10,
    borderRadius: 10,
    border: "none",
    outline: "none"
  },

  btn: {
    margin: "0 5px",
    padding: 10,
    borderRadius: 10,
    border: "none",
    background: "#4f46e5",
    color: "white"
  },

  login: {
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    background: "#0f0f0f"
  }
};