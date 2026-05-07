import React, { useState, useEffect, useRef } from "react";
import axios from "axios";

function App() {
  const API = "https://moti-pro07.onrender.com";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [userId, setUserId] = useState("");
  const [chat, setChat] = useState([]);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState("idle");
  const [typing, setTyping] = useState(false);

  const recognitionRef = useRef(null);

  // ---------------- INIT ----------------
  useEffect(() => {
  const savedUser = localStorage.getItem("moti_user");

  if (savedUser) {
    setUserId(savedUser);
    loadHistory(savedUser);
  }

  initVoiceRecognition();
}, []);

  // ---------------- LOAD HISTORY ----------------
  const loadHistory = async (uid) => {
    try {
      const res = await axios.get(`${API}/history/${uid}`);
      const formatted = res.data.history.map((m) => ({
        role: m[0],
        text: m[1]
      }));
      setChat(formatted);
    } catch (e) {
      console.log(e);
    }
  };

  // ---------------- LOGIN ----------------
  const login = async () => {
    try {
      const res = await axios.post(`${API}/login`, {
        username: username,
        password: password
      });

      localStorage.setItem("moti_user", res.data.user_id);
      setUserId(res.data.user_id);
    } catch (e) {
      alert("Login failed");
    }
  };

  // ---------------- SPEAK ----------------
  const speak = (text) => {
    window.speechSynthesis.cancel();

    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "en-US";
    utter.rate = 1;
    utter.pitch = 1;

    utter.onstart = () => setStatus("speaking");
    utter.onend = () => setStatus("idle");

    window.speechSynthesis.speak(utter);
  };

  // ---------------- SEND CHAT ----------------
  const sendMessage = async (customText = null) => {
    const msg = customText || input;
    if (!msg.trim()) return;

    window.speechSynthesis.cancel();

    setChat((prev) => [...prev, { role: "user", text: msg }]);
    setTyping(true);
    setStatus("thinking");

    try {
      const res = await axios.post(`${API}/chat`, {
        user_id: userId,
        message: msg
      });

      setTyping(false);

      const reply = res.data.reply;

      setChat((prev) => [...prev, { role: "assistant", text: reply }]);
      speak(reply);

    } catch (e) {
      setTyping(false);
      setChat((prev) => [...prev, { role: "assistant", text: "Server error." }]);
      setStatus("idle");
    }

    setInput("");
  };

  // ---------------- VOICE RECOGNITION ----------------
  const initVoiceRecognition = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) return;

    const recog = new SpeechRecognition();
    recog.lang = "en-IN";
    recog.continuous = false;

    recog.onstart = () => {
      window.speechSynthesis.cancel();
      setStatus("listening");
    };

    recog.onend = () => {
      if (status === "listening") setStatus("idle");
    };

    recog.onresult = (event) => {
      const spoken = event.results[0][0].transcript;
      sendMessage(spoken);
    };

    recognitionRef.current = recog;
  };

  const startListening = () => {
    recognitionRef.current?.start();
  };

  // ---------------- BRAIN ANIMATION ----------------
  const brainColor =
    status === "listening"
      ? "#00ffd5"
      : status === "thinking"
      ? "#ffcc00"
      : status === "speaking"
      ? "#ff00aa"
      : "#6c63ff";

  // ---------------- LOGIN PAGE ----------------
  if (!userId) {
    return (
      <div style={styles.loginWrap}>
        <div style={styles.loginBox}>
          <div style={{ ...styles.brain, background: brainColor }}></div>
          <h1 style={styles.logo}>MOTI AI</h1>

          <input
            style={styles.input}
            placeholder="Username"
            onChange={(e) => setUsername(e.target.value)}
          />

          <input
            style={styles.input}
            type="password"
            placeholder="Password"
            onChange={(e) => setPassword(e.target.value)}
          />

          <button style={styles.button} onClick={login}>
            Enter Assistant
          </button>
        </div>
      </div>
    );
  }

  // ---------------- MAIN UI ----------------
  return (
    <div style={styles.container}>
      <div style={styles.sidebar}>
        <h2>MOTI</h2>
        <p>Premium AI Assistant</p>
        <p>Status: {status}</p>
      </div>

      <div style={styles.main}>
        <div style={{ ...styles.brain, background: brainColor }}></div>

        <div style={styles.chatBox}>
          {chat.map((m, i) => (
            <div
              key={i}
              style={
                m.role === "user" ? styles.userMsg : styles.botMsg
              }
            >
              {m.text}
            </div>
          ))}

          {typing && <div style={styles.botMsg}>MOTI is thinking...</div>}
        </div>

        <div style={styles.bottom}>
          <input
            style={styles.msgInput}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything..."
          />

          <button style={styles.sendBtn} onClick={() => sendMessage()}>
            Send
          </button>

          <button style={styles.micBtn} onClick={startListening}>
            🎤
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  loginWrap: {
    background: "#070710",
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    color: "white"
  },
  loginBox: {
    width: "320px",
    padding: "30px",
    borderRadius: "20px",
    background: "rgba(255,255,255,0.06)",
    backdropFilter: "blur(20px)",
    textAlign: "center",
    boxShadow: "0 0 30px rgba(108,99,255,0.4)"
  },
  logo: {
    marginBottom: "20px"
  },
  input: {
    width: "100%",
    padding: "14px",
    margin: "10px 0",
    borderRadius: "12px",
    border: "none",
    outline: "none"
  },
  button: {
    width: "100%",
    padding: "14px",
    marginTop: "15px",
    border: "none",
    borderRadius: "12px",
    background: "#6c63ff",
    color: "white",
    fontWeight: "bold"
  },
  container: {
    display: "flex",
    height: "100vh",
    background: "#05050d",
    color: "white"
  },
  sidebar: {
    width: "220px",
    padding: "20px",
    background: "rgba(255,255,255,0.04)",
    borderRight: "1px solid rgba(255,255,255,0.08)"
  }, 
<button
  onClick={() => {
    localStorage.removeItem("moti_user");
    setUserId("");
    setChat([]);
  }}
>
  Logout
</button>

  main: {
    flex: 1,
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center"
  },
  brain: {
    width: "100px",
    height: "100px",
    borderRadius: "50%",
    boxShadow: "0 0 50px currentColor",
    marginBottom: "20px"
  },
  chatBox: {
    flex: 1,
    width: "100%",
    overflowY: "auto",
    padding: "10px"
  },
  userMsg: {
    alignSelf: "flex-end",
    background: "#6c63ff",
    padding: "12px",
    borderRadius: "15px",
    margin: "8px",
    maxWidth: "70%"
  },
  botMsg: {
    alignSelf: "flex-start",
    background: "#151525",
    padding: "12px",
    borderRadius: "15px",
    margin: "8px",
    maxWidth: "70%"
  },
  bottom: {
    display: "flex",
    width: "100%",
    gap: "10px"
  },
  msgInput: {
    flex: 1,
    padding: "14px",
    borderRadius: "12px",
    border: "none"
  },
  sendBtn: {
    padding: "14px 20px",
    borderRadius: "12px",
    border: "none",
    background: "#6c63ff",
    color: "white"
  },
  micBtn: {
    padding: "14px 20px",
    borderRadius: "12px",
    border: "none",
    background: "#00ffd5"
  }
};

export default App;