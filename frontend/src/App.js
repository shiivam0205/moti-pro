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

  // ================= LOGIN LOAD =================
  useEffect(() => {
    const saved = localStorage.getItem("user");
    if (saved) {
      setUser(saved);
    }
  }, []);

  // ================= LOGIN =================
  const login = (name) => {
    if (!name.trim()) return;
    setUser(name);
    localStorage.setItem("user", name);
  };

  // ================= LOGOUT =================
  const logout = () => {
    setUser("");
    localStorage.removeItem("user");
    setMessages([]);
  };

  // ================= VOICE =================
  const speak = (text) => {

    window.speechSynthesis.cancel();

    const utter = new SpeechSynthesisUtterance(text);

    const voices = speechSynthesis.getVoices();

    utter.voice =
      voices.find(v => v.lang === "en-US") ||
      voices.find(v => v.lang === "hi-IN") ||
      voices[0];

    utter.rate = 1;
    utter.pitch = 1;

    speechSynthesis.speak(utter);
  };

  // ================= SEND (FIXED - NO NEW CHAT ISSUE) =================
  const send = async () => {

    const msg = input;
    if (!msg.trim()) return;

    setInput("");

    // ❌ FIX: ALWAYS APPEND (NOT RESET OR CREATE NEW CHAT)
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

    window.speechSynthesis.cancel();

    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognition) return;

    const mic = new SpeechRecognition();

    mic.lang = "en-IN";

    mic.onresult = (e) => {
      setInput(e.results[0][0].transcript);
    };

    mic.start();
  };

  // ================= LOGIN UI FIXED =================
  if (!user) {

    return (
      <div style={styles.loginBg}>

        <div style={styles.loginBox}>

          <h2 style={{ color: "#4f46e5" }}>MOTI AI</h2>

          <p style={{ color: "#aaa" }}>
            Enter your username to continue
          </p>

          <input
            placeholder="Username"
            style={styles.loginInput}
            onKeyDown={(e) =>
              e.key === "Enter" && login(e.target.value)
            }
          />

          <button
            style={styles.loginBtn}
            onClick={(e) =>
              login(
                document.querySelector("input")?.value
              )
            }
          >
            Login
          </button>

        </div>

      </div>
    );
  }

  // ================= CHAT UI (UNCHANGED STYLE) =================
  return (
    <div style={styles.container}>

      {/* HEADER */}
      <div style={styles.header}>

        MOTI AI

        <button onClick={logout} style={styles.logout}>
          Logout
        </button>

      </div>

      {/* CHAT */}
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
                  : "#1f1f1f"
            }}
          >
            {m.text}
          </div>
        ))}

        <div ref={endRef} />

      </div>

      {/* INPUT */}
      <div style={styles.inputBox}>

        <button onClick={startMic} style={styles.btn}>
          🎤
        </button>

        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask MOTI..."
          style={styles.input}
          onKeyDown={(e) =>
            e.key === "Enter" && send()
          }
        />

        <button onClick={send} style={styles.btn}>
          ➤
        </button>

      </div>

    </div>
  );
}

// ================= STYLES =================
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
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },

  logout: {
    background: "#ef4444",
    color: "white",
    border: "none",
    padding: "5px 10px",
    borderRadius: 5,
    cursor: "pointer"
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
    color: "white",
    cursor: "pointer"
  },

  // LOGIN UI FIX
  loginBg: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "linear-gradient(135deg,#0f0f0f,#1a1a2e)"
  },

  loginBox: {
    padding: 30,
    background: "#111",
    borderRadius: 12,
    textAlign: "center"
  },

  loginInput: {
    padding: 10,
    width: "100%",
    marginTop: 10,
    borderRadius: 8,
    border: "none",
    outline: "none"
  },

  loginBtn: {
    marginTop: 10,
    padding: 10,
    width: "100%",
    background: "#4f46e5",
    border: "none",
    color: "white",
    borderRadius: 8,
    cursor: "pointer"
  }
};