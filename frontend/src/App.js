import React, { useState, useEffect, useRef } from "react";

const API = process.env.REACT_APP_API;

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

  // ================= LOGIN =================
  useEffect(() => {
    const saved = localStorage.getItem("user");
    if (saved) {
      setUser(saved);
      loadHistory(saved);
    }
  }, []);

  const login = (name) => {
    setUser(name);
    localStorage.setItem("user", name);
    loadHistory(name);
  };

  // ================= LOAD HISTORY =================
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

  // ================= SEND MESSAGE =================
  const send = async (text) => {

    if (!text) return;

    setInput("");

    setMessages(prev => [
      ...prev,
      { role: "user", text }
    ]);

    try {

      const res = await fetch(`${API}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          user,
          message: text
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
      console.log(err);
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
      const text = e.results[0][0].transcript;
      send(text);
    };

    mic.start();
  };

  // ================= LOGIN SCREEN =================
  if (!user) {

    return (
      <div style={styles.login}>
        <h2>MOTI AI</h2>

        <input
          placeholder="Enter username"
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

        <button onClick={newChat}>
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

        <div style={styles.header}>
          MOTI AI
        </div>

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
                    : "#222"
              }}
            >
              {m.text}
            </div>
          ))}

          <div ref={endRef} />

        </div>

        {/* INPUT */}
        <div style={styles.inputBox}>

          <button onClick={startMic}>
            🎤
          </button>

          <input
            value={input}
            onChange={(e) =>
              setInput(e.target.value)
            }
            onKeyDown={(e) =>
              e.key === "Enter" && send(input)
            }
          />

          <button onClick={() => send(input)}>
            ➤
          </button>

        </div>

      </div>
    </div>
  );
}

// ================= STYLES =================
const styles = {

  container: {
    display: "flex",
    height: "100vh",
    background: "#0f0f0f",
    color: "white"
  },

  sidebar: {
    width: 250,
    background: "#111",
    padding: 10,
    overflowY: "auto"
  },

  chatArea: {
    flex: 1,
    display: "flex",
    flexDirection: "column"
  },

  header: {
    padding: 10,
    background: "#111",
    textAlign: "center"
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
    borderRadius: 10,
    maxWidth: "70%"
  },

  inputBox: {
    display: "flex",
    padding: 10,
    background: "#111"
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
  },

  chatItem: {
    padding: 8,
    marginTop: 5,
    background: "#222",
    borderRadius: 5,
    cursor: "pointer"
  }
};