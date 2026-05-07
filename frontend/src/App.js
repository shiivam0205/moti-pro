import React, { useState, useEffect, useRef } from "react";
import axios from "axios";

export default function App() {
  const API = "https://moti-pro07.onrender.com";

  const [userId, setUserId] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [chat, setChat] = useState([]);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState("Idle");
  const [loading, setLoading] = useState(false);

  const recognitionRef = useRef(null);

  // ---------------- AUTO LOGIN ----------------
  useEffect(() => {
    const savedUser = localStorage.getItem("moti_user");

    if (savedUser) {
      setUserId(savedUser);
      loadHistory(savedUser);
    }

    initVoice();
  }, []);

  // ---------------- LOAD CHAT HISTORY ----------------
  const loadHistory = async (uid) => {
    try {
      const res = await axios.get(`${API}/history/${uid}`);

      const history = res.data.history.map((msg) => ({
        role: msg[0],
        text: msg[1]
      }));

      setChat(history);
    } catch (err) {
      console.log(err);
    }
  };

  // ---------------- LOGIN ----------------
  const login = async () => {
    if (!username || !password) {
      alert("Enter username and password");
      return;
    }

    try {
      const res = await axios.post(`${API}/login`, {
        username,
        password
      });

      localStorage.setItem("moti_user", res.data.user_id);

      setUserId(res.data.user_id);

      loadHistory(res.data.user_id);
    } catch (err) {
      alert("Login failed");
    }
  };

  // ---------------- LOGOUT ----------------
  const logout = () => {
    localStorage.removeItem("moti_user");
    setUserId("");
    setChat([]);
  };

  // ---------------- SPEAK ----------------
  const speak = (text) => {
    window.speechSynthesis.cancel();

    const utter = new SpeechSynthesisUtterance(text);

    utter.lang = "en-US";
    utter.rate = 1;
    utter.pitch = 1;

    utter.onstart = () => setStatus("Speaking");
    utter.onend = () => setStatus("Idle");

    window.speechSynthesis.speak(utter);
  };

  // ---------------- VOICE INPUT ----------------
  const initVoice = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();

    recognition.lang = "en-IN";
    recognition.continuous = false;

    recognition.onstart = () => {
      setStatus("Listening");
      window.speechSynthesis.cancel();
    };

    recognition.onend = () => {
      setStatus("Idle");
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      sendMessage(transcript);
    };

    recognitionRef.current = recognition;
  };

  const startListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.start();
    }
  };

  // ---------------- SEND MESSAGE ----------------
  const sendMessage = async (customMessage = null) => {
  const text = customMessage || input;

  if (!text.trim()) return;

  const userMessage = {
    role: "user",
    text
  };

  setChat((prev) => [...prev, userMessage]);

  setInput("");
  setLoading(true);
  setStatus("Thinking");

  try {
    const res = await axios.post(`${API}/chat`, {
      user_id: userId,
      message: text
    });

    const fullReply = res.data.reply;

    let currentText = "";

    const botIndex = chat.length + 1;

    setChat((prev) => [
      ...prev,
      {
        role: "assistant",
        text: ""
      }
    ]);

    let i = 0;

    const interval = setInterval(() => {
      currentText += fullReply[i];

      setChat((prev) => {
        const updated = [...prev];

        updated[botIndex] = {
          role: "assistant",
          text: currentText
        };

        return updated;
      });

      i++;

      if (i >= fullReply.length) {
        clearInterval(interval);
        speak(fullReply);
      }
    }, 18);

  } catch (err) {
    setChat((prev) => [
      ...prev,
      {
        role: "assistant",
        text: "Server error."
      }
    ]);
  }

  setLoading(false);
  setStatus("Idle");
};

  // ---------------- LOGIN PAGE ----------------
  if (!userId) {
    return (
      <div style={styles.loginPage}>
        <div style={styles.loginCard}>
          <div style={styles.logoGlow}></div>

          <h1 style={styles.title}>MOTI AI</h1>

          <input
            style={styles.input}
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          <input
            style={styles.input}
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button style={styles.loginBtn} onClick={login}>
            Enter Assistant
          </button>
        </div>
      </div>
    );
  }

  // ---------------- MAIN CHAT UI ----------------
  return (
    <div style={styles.container}>
      {/* SIDEBAR */}
      <div style={styles.sidebar}>
        <h2>MOTI</h2>

        <p>Premium AI Assistant</p>

        <p
  style={{
    color:
      status === "Listening"
        ? "#00ffd5"
        : status === "Speaking"
        ? "#ff66ff"
        : "#9aa0ff"
  }}
>
  Status: {status}
</p>

        <button style={styles.logoutBtn} onClick={logout}>
          Logout
        </button>
      </div>

      {/* MAIN */}
      <div style={styles.main}>
        <div
  style={{
    ...styles.aiOrb,
    transform:
      status === "Listening"
        ? "scale(1.15)"
        : status === "Speaking"
        ? "scale(1.08)"
        : "scale(1)"
  }}
></div>

        <div style={styles.chatArea}>
          {chat.map((msg, index) => (
            <div
              key={index}
              style={
                msg.role === "user"
                  ? styles.userBubble
                  : styles.botBubble
              }
            >
              {msg.text}
            </div>
          ))}

          {loading && (
            <div style={styles.botBubble}>
              MOTI is thinking...
            </div>
          )}
        </div>

        <div style={styles.bottomBar}>
          <input
            style={styles.chatInput}
            placeholder="Ask anything..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                sendMessage();
              }
            }}
          />

          <button
            style={styles.sendBtn}
            onClick={() => sendMessage()}
          >
            Send
          </button>

          <button
            style={styles.micBtn}
            onClick={startListening}
          >
            🎤
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------- STYLES ----------------
const styles = {
  loginPage: {
    height: "100vh",
    background: "#05050d",
    display: "flex",
    justifyContent: "center",
    alignItems: "center"
  },

  loginCard: {
    width: "340px",
    background: "rgba(255,255,255,0.05)",
    padding: "30px",
    borderRadius: "20px",
    backdropFilter: "blur(20px)",
    boxShadow: "0 0 40px rgba(108,99,255,0.5)",
    textAlign: "center"
  },

  logoGlow: {
    width: "90px",
    height: "90px",
    borderRadius: "50%",
    margin: "auto",
    marginBottom: "20px",
    background: "#6c63ff",
    boxShadow: "0 0 40px #6c63ff"
  },

  title: {
    color: "white",
    marginBottom: "20px"
  },

  input: {
    width: "100%",
    padding: "14px",
    marginBottom: "15px",
    borderRadius: "12px",
    border: "none",
    outline: "none"
  },

  loginBtn: {
    width: "100%",
    padding: "14px",
    borderRadius: "12px",
    border: "none",
    background: "#6c63ff",
    color: "white",
    fontWeight: "bold",
    cursor: "pointer"
  },

  container: {
    display: "flex",
    height: "100vh",
    background: "#05050d",
    color: "white"
  },

  sidebar: {
    width: "240px",
    background: "rgba(255,255,255,0.04)",
    borderRight: "1px solid rgba(255,255,255,0.08)",
    padding: "20px"
  },

  logoutBtn: {
    marginTop: "20px",
    width: "100%",
    padding: "12px",
    borderRadius: "10px",
    border: "none",
    background: "#ff4444",
    color: "white",
    cursor: "pointer"
  },

  main: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "20px"
  },

  aiOrb: {
  width: "130px",
  height: "130px",
  borderRadius: "50%",
  marginBottom: "20px",
  background:
    "radial-gradient(circle, #8f7bff 0%, #5b4dff 40%, #2d1eff 100%)",
  boxShadow:
    "0 0 20px #6c63ff, 0 0 60px #6c63ff, 0 0 100px #6c63ff",
  animation: "pulse 2s infinite ease-in-out"
},

  chatArea: {
    flex: 1,
    width: "100%",
    overflowY: "auto",
    padding: "10px"
  },

  userBubble: {
    background: "#6c63ff",
    padding: "12px",
    borderRadius: "16px",
    marginBottom: "12px",
    maxWidth: "70%",
    marginLeft: "auto"
  },

  botBubble: {
    background: "#151525",
    padding: "12px",
    borderRadius: "16px",
    marginBottom: "12px",
    maxWidth: "70%"
  },

  bottomBar: {
    width: "100%",
    display: "flex",
    gap: "10px"
  },

  chatInput: {
    flex: 1,
    padding: "14px",
    borderRadius: "12px",
    border: "none",
    outline: "none"
  },

  sendBtn: {
    padding: "14px 20px",
    borderRadius: "12px",
    border: "none",
    background: "#6c63ff",
    color: "white",
    cursor: "pointer"
  },

  micBtn: {
    padding: "14px 20px",
    borderRadius: "12px",
    border: "none",
    background: "#00ffd5",
    cursor: "pointer"
  }
};