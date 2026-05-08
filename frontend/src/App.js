import React, { useState, useEffect, useRef } from "react";

const API = process.env.REACT_APP_API || "https://moti-proo.onrender.com";

export default function App() {

  const [user, setUser] = useState("");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [chats, setChats] = useState([]);

  const endRef = useRef(null);

  // ================= AUTO SCROLL =================
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ================= LOGIN LOAD =================
  useEffect(() => {
    const saved = localStorage.getItem("user");
    if (saved) {
      setUser(saved);
      loadHistory(saved);
    }
  }, []);

  // ================= LOGIN =================
  const login = (name) => {
    setUser(name);
    localStorage.setItem("user", name);
    loadHistory(name);
  };

  // ================= LOGOUT =================
  const logout = () => {
    setUser("");
    localStorage.removeItem("user");
    setMessages([]);
    setChats([]);
  };

  // ================= HISTORY =================
  const loadHistory = async (u) => {
    try {
      const res = await fetch(`${API}/history/${u}`);
      const data = await res.json();
      setChats(data);
    } catch (err) {
      console.log(err);
    }
  };

  // ================= NEW CHAT =================
  const newChat = () => {
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

  // ================= SEND =================
  const send = async (text) => {

    const msg = text || input;
    if (!msg.trim()) return;

    setInput("");

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

      loadHistory(user);

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
      send(e.results[0][0].transcript);
    };

    mic.start();
  };

  // ================= LOGIN SCREEN =================
  if (!user) {

    return (
      <div style={styles.login}>

        <h1 style={{ color: "#4f46e5" }}>MOTI AI</h1>

        <input
          placeholder="Enter username"
          style={styles.loginInput}
          onKeyDown={(e) =>
            e.key === "Enter" && login(e.target.value)
          }
        />

      </div>
    );
  }

  // ================= UI =================
  return (
    <div style={styles.container}>

      {/* SIDEBAR */}
      <div style={styles.sidebar}>

        <button onClick={newChat} style={styles.newChat}>
          + New Chat
        </button>

        {chats.map((c, i) => (
          <div
            key={i}
            style={styles.chatItem}
            onClick={() =>
              setMessages([
                { role: "user", text: c.message },
                { role: "ai", text: c.response }
              ])
            }
          >
            {c.message}
          </div>
        ))}

      </div>

      {/* CHAT AREA */}
      <div style={styles.chatArea}>

        {/* HEADER */}
        <div style={styles.header}>

          MOTI AI

          <button onClick={logout} style={styles.logout}>
            Logout
          </button>

        </div>

        {/* MESSAGES */}
        <div style={styles.messages}>

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
              e.key === "Enter" && send(input)
            }
          />

          <button onClick={() => send(input)} style={styles.btn}>
            ➤
          </button>

        </div>

      </div>
    </div>
  );
}

// ================= STYLES (COLOURFUL UI) =================
const styles = {

  container: {
    display: "flex",
    height: "100vh",
    background: "linear-gradient(135deg,#0f0f0f,#1a1a2e)",
    color: "white"
  },

  sidebar: {
    width: 260,
    background: "#111827",
    padding: 10,
    overflowY: "auto"
  },

  chatArea: {
    flex: 1,
    display: "flex",
    flexDirection: "column"
  },

  header: {
    padding: 15,
    background: "#111",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontWeight: "bold",
    color: "#4f46e5"
  },

  logout: {
    background: "#ef4444",
    color: "white",
    border: "none",
    padding: "5px 10px",
    borderRadius: 5,
    cursor: "pointer"
  },

  messages: {
    flex: 1,
    padding: 10,
    display: "flex",
    flexDirection: "column",
    gap: 10,
    overflowY: "auto"
  },

  msg: {
    padding: 10,
    borderRadius: 12,
    maxWidth: "70%"
  },

  inputBox: {
    display: "flex",
    padding: 10,
    background: "#111827"
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

  newChat: {
    width: "100%",
    padding: 10,
    marginBottom: 10,
    background: "#4f46e5",
    color: "white",
    border: "none",
    borderRadius: 8,
    cursor: "pointer"
  },

  chatItem: {
    padding: 8,
    marginTop: 5,
    background: "#1f2937",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: 13
  },

  login: {
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    background: "#0f0f0f"
  },

  loginInput: {
    padding: 10,
    borderRadius: 10,
    border: "none",
    outline: "none",
    marginTop: 10
  }
};