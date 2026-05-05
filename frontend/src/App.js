import React, { useState, useEffect, useRef } from "react";
import axios from "axios";

function App() {
  const API = "https://moti-pro07.onrender.com";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [userId, setUserId] = useState(localStorage.getItem("user_id") || "");
  const [loggedIn, setLoggedIn] = useState(false);

  const [input, setInput] = useState("");
  const [chat, setChat] = useState([]);

  const micRef = useRef(null);
  const audioRef = useRef(null);

  // ---------------- INIT ----------------
  useEffect(() => {
    if (userId) {
      setLoggedIn(true);
      loadHistory(userId);
    }

    initMic();
  }, []);

  // ---------------- LOGIN ----------------
  const login = async () => {
    try {
      const res = await axios.post(`${API}/login`, {
        username,
        password,
      });

      localStorage.setItem("user_id", res.data.user_id);
      setUserId(res.data.user_id);
      setLoggedIn(true);

      loadHistory(res.data.user_id);
    } catch {
      alert("Login failed");
    }
  };

  // ---------------- HISTORY ----------------
  const loadHistory = async (uid) => {
    const res = await axios.get(`${API}/history/${uid}`);

    const formatted = res.data.history.map((h) => ({
      role: h[0] === "assistant" ? "bot" : "user",
      text: h[1],
    }));

    setChat(formatted);
  };

  // ---------------- STOP VOICE ----------------
  const stopVoice = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    window.speechSynthesis.cancel();
  };

  // ---------------- VOICE ----------------
  const speak = async (text) => {
    try {
      stopVoice();

      const res = await axios.post(`${API}/voice`, { text }, {
        responseType: "blob",
      });

      const url = URL.createObjectURL(res.data);
      const audio = new Audio(url);

      audioRef.current = audio;
      audio.play();
    } catch {
      const utter = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(utter);
    }
  };

  // ---------------- MIC ----------------
  const initMic = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) return;

    const recog = new SpeechRecognition();
    recog.lang = "en-IN";

    recog.onresult = (e) => {
      const text = e.results[0][0].transcript;
      sendMessage(text);
    };

    micRef.current = recog;
  };

  const startMic = () => {
    micRef.current?.start();
  };

  // ---------------- CHAT ----------------
  const sendMessage = async (msg) => {
    const text = msg || input;
    if (!text.trim()) return;

    stopVoice();

    setInput("");

    setChat((p) => [...p, { role: "user", text }]);
    setChat((p) => [...p, { role: "bot", text: "..." }]);

    try {
      const res = await axios.post(`${API}/chat`, {
        user_id: userId,
        message: text,
      });

      const reply = res.data.reply;

      setChat((p) => {
        const updated = [...p];
        updated[updated.length - 1] = { role: "bot", text: reply };
        return updated;
      });

      speak(reply);

    } catch {
      alert("Server error");
    }
  };

  // ---------------- LOGIN UI ----------------
  if (!loggedIn) {
    return (
      <div style={styles.login}>
        <h1>MOTI AI</h1>

        <input placeholder="Username" onChange={(e) => setUsername(e.target.value)} />
        <input placeholder="Password" type="password" onChange={(e) => setPassword(e.target.value)} />

        <button onClick={login}>Login</button>
      </div>
    );
  }

  // ---------------- CHAT UI ----------------
  return (
    <div style={styles.app}>
      <div style={styles.header}>MOTI Voice AI</div>

      <div style={styles.chat}>
        {chat.map((c, i) => (
          <div key={i} style={{ textAlign: c.role === "user" ? "right" : "left" }}>
            {c.text}
          </div>
        ))}
      </div>

      <div style={styles.bottom}>
        <input value={input} onChange={(e) => setInput(e.target.value)} />

        <button onClick={() => sendMessage()}>Send</button>
        <button onClick={startMic}>🎤</button>
        <button onClick={stopVoice}>⛔</button>
      </div>
    </div>
  );
}

const styles = {
  app: { background: "#000", color: "#fff", height: "100vh" },
  header: { padding: 10 },
  chat: { padding: 10, flex: 1 },
  bottom: { display: "flex", gap: 5, padding: 10 },
  login: { padding: 20 }
};

export default App;