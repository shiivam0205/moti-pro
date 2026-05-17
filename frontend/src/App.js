import React, { useState, useEffect, useRef } from "react";

const API =
  process.env.REACT_APP_API ||
  "https://moti-proo.onrender.com";

export default function App() {

  // ================= STATES =================
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [loggedIn, setLoggedIn] = useState(false);

  const [input, setInput] = useState("");

  const [messages, setMessages] = useState([]);

  const [chatHistory, setChatHistory] = useState([]);

  const endRef = useRef(null);

  const isMobile = window.innerWidth <= 768;

  // ================= AUTO SCROLL =================
  useEffect(() => {
    endRef.current?.scrollIntoView({
      behavior: "smooth"
    });
  }, [messages]);

  // ================= LOAD SAVED =================
  useEffect(() => {

    const savedUser =
      localStorage.getItem("moti_user");

    const savedChats =
      localStorage.getItem("moti_chat_history");

    if (savedUser) {
      setUsername(savedUser);
      setLoggedIn(true);
    }

    if (savedChats) {
      setChatHistory(JSON.parse(savedChats));
    }

  }, []);

  // ================= SAVE CHAT HISTORY =================
  useEffect(() => {

    localStorage.setItem(
      "moti_chat_history",
      JSON.stringify(chatHistory)
    );

  }, [chatHistory]);

  // ================= LOGIN =================
  const login = () => {

    if (!username.trim() || !password.trim()) {
      alert("Enter username and password");
      return;
    }

    localStorage.setItem(
      "moti_user",
      username
    );

    setLoggedIn(true);
  };

  // ================= LOGOUT =================
  const logout = () => {

    localStorage.removeItem("moti_user");

    setLoggedIn(false);

    setMessages([]);

    setUsername("");

    setPassword("");
  };

  // ================= NEW CHAT =================
  const newChat = () => {

    if (messages.length > 0) {

      const title =
        messages[0]?.text?.slice(0, 25) ||
        "New Chat";

      const newItem = {
        title,
        messages
      };

      setChatHistory(prev => [
        newItem,
        ...prev
      ]);
    }

    setMessages([]);
  };

  // ================= OPEN OLD CHAT =================
  const openChat = (chat) => {
    setMessages(chat.messages);
  };

  // ================= VOICE =================
  const speak = (text) => {

    window.speechSynthesis.cancel();

    const utter =
      new SpeechSynthesisUtterance(text);

    const voices =
      speechSynthesis.getVoices();

    utter.voice =
      voices.find(v => v.lang === "hi-IN") ||
      voices.find(v => v.lang === "en-US") ||
      voices[0];

    utter.rate = 1;

    speechSynthesis.speak(utter);
  };

  // ================= SEND =================
  const send = async () => {

    if (!input.trim()) return;

    const userMessage = input;

    setInput("");

    setMessages(prev => [
      ...prev,
      {
        role: "user",
        text: userMessage
      }
    ]);

    try {

      const res = await fetch(
        `${API}/chat`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json"
          },
          body: JSON.stringify({
            user: username,
            message: userMessage
          })
        }
      );

      const data = await res.json();

      const reply =
        data.reply || "No response";

      setMessages(prev => [
        ...prev,
        {
          role: "ai",
          text: reply
        }
      ]);

      speak(reply);

    } catch (err) {

      setMessages(prev => [
        ...prev,
        {
          role: "ai",
          text:
            "Backend connection failed"
        }
      ]);

    }
  };

  // ================= MIC =================
  const startMic = () => {

    window.speechSynthesis.cancel();

    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Mic not supported");
      return;
    }

    const recognition =
      new SpeechRecognition();

    recognition.lang = "en-IN";

    recognition.onresult = (e) => {

      const transcript =
        e.results[0][0].transcript;

      setInput(transcript);
    };

    recognition.start();
  };

  // ================= LOGIN PAGE =================
  if (!loggedIn) {

    return (
      <div style={styles.loginPage}>

        <div style={styles.loginCard}>

          <h1 style={styles.logo}>
            MOTI AI
          </h1>

          <p style={styles.subtitle}>
            Smart AI Assistant
          </p>

          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) =>
              setUsername(e.target.value)
            }
            style={styles.loginInput}
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
            style={styles.loginInput}
          />

          <button
            style={styles.loginBtn}
            onClick={login}
          >
            Login
          </button>

        </div>

      </div>
    );
  }

  // ================= MAIN UI =================
  return (
    <div style={styles.container}>

      {/* SIDEBAR */}
      <div style={styles.sidebar}>

        <button
          style={styles.newChatBtn}
          onClick={newChat}
        >
          {isMobile ? "+" : "+ New Chat"}
        </button>

        <div style={styles.history}>

          {chatHistory.map((chat, i) => (

            <div
              key={i}
              style={styles.historyItem}
              onClick={() =>
                openChat(chat)
              }
            >
              {chat.title}
            </div>

          ))}

        </div>

      </div>

      {/* MAIN */}
      <div style={styles.main}>

        {/* HEADER */}
        <div style={styles.header}>

          <h2 style={{ margin: 0 }}>
            MOTI AI
          </h2>

          <button
            style={styles.logoutBtn}
            onClick={logout}
          >
            Logout
          </button>

        </div>

        {/* CHAT */}
        <div style={styles.chatArea}>

          {messages.map((msg, i) => (

            <div
              key={i}
              style={{
                ...styles.message,
                alignSelf:
                  msg.role === "user"
                    ? "flex-end"
                    : "flex-start",
                background:
                  msg.role === "user"
                    ? "#4f46e5"
                    : "#1f2937"
              }}
            >
              {msg.text}
            </div>

          ))}

          <div ref={endRef} />

        </div>

        {/* INPUT */}
        <div style={styles.inputArea}>

          <button
            style={styles.iconBtn}
            onClick={startMic}
          >
            🎤
          </button>

          <input
            value={input}
            onChange={(e) =>
              setInput(e.target.value)
            }
            placeholder="Ask MOTI..."
            style={styles.input}
            onKeyDown={(e) =>
              e.key === "Enter" && send()
            }
          />

          <button
            style={styles.sendBtn}
            onClick={send}
          >
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
    width: "100vw",
    height: "100vh",
    overflow: "hidden",
    background:
      "linear-gradient(135deg,#0f172a,#111827)",
    color: "white"
  },

  sidebar: {
    width:
      window.innerWidth <= 768
        ? 70
        : 260,
    minWidth:
      window.innerWidth <= 768
        ? 70
        : 260,
    background: "#111827",
    padding: 10,
    display: "flex",
    flexDirection: "column"
  },

  newChatBtn: {
    padding: 10,
    border: "none",
    borderRadius: 10,
    background: "#4f46e5",
    color: "white",
    fontWeight: "bold",
    cursor: "pointer",
    marginBottom: 10,
    fontSize:
      window.innerWidth <= 768
        ? 18
        : 15
  },

  history: {
    flex: 1,
    overflowY: "auto"
  },

  historyItem: {
    padding: 8,
    background: "#1f2937",
    borderRadius: 8,
    marginBottom: 8,
    cursor: "pointer",
    fontSize:
      window.innerWidth <= 768
        ? 10
        : 14,
    overflow: "hidden",
    whiteSpace: "nowrap",
    textOverflow: "ellipsis"
  },

  main: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    minWidth: 0
  },

  header: {
    padding: 12,
    background: "#111827",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },

  logoutBtn: {
    padding: "8px 12px",
    border: "none",
    borderRadius: 8,
    background: "#ef4444",
    color: "white",
    cursor: "pointer",
    fontSize: 12
  },

  chatArea: {
    flex: 1,
    padding:
      window.innerWidth <= 768
        ? 10
        : 20,
    display: "flex",
    flexDirection: "column",
    gap: 12,
    overflowY: "auto"
  },

  message: {
    maxWidth:
      window.innerWidth <= 768
        ? "88%"
        : "70%",
    padding: 10,
    borderRadius: 12,
    lineHeight: 1.5,
    fontSize:
      window.innerWidth <= 768
        ? 13
        : 15,
    wordBreak: "break-word"
  },

  inputArea: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: 8,
    background: "#111827"
  },

  input: {
    flex: 1,
    padding: 10,
    borderRadius: 10,
    border: "none",
    outline: "none",
    fontSize: 14,
    minWidth: 0
  },

  iconBtn: {
    padding: 10,
    borderRadius: 10,
    border: "none",
    background: "#374151",
    color: "white",
    cursor: "pointer"
  },

  sendBtn: {
    padding: 10,
    borderRadius: 10,
    border: "none",
    background: "#4f46e5",
    color: "white",
    cursor: "pointer"
  },

  // LOGIN
  loginPage: {
    width: "100vw",
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background:
      "linear-gradient(135deg,#0f172a,#1e293b)",
    padding: 20
  },

  loginCard: {
    width:
      window.innerWidth <= 768
        ? "100%"
        : 340,
    maxWidth: 340,
    background: "#111827",
    padding: 25,
    borderRadius: 16,
    display: "flex",
    flexDirection: "column",
    gap: 15
  },

  logo: {
    textAlign: "center",
    color: "#4f46e5",
    margin: 0
  },

  subtitle: {
    textAlign: "center",
    color: "#9ca3af",
    marginTop: -5
  },

  loginInput: {
    padding: 12,
    borderRadius: 10,
    border: "none",
    outline: "none"
  },

  loginBtn: {
    padding: 12,
    border: "none",
    borderRadius: 10,
    background: "#4f46e5",
    color: "white",
    fontWeight: "bold",
    cursor: "pointer"
  }
};