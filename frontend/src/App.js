import React, { useState, useEffect, useRef } from "react";
import axios from "axios";

function App() {
  const API = "https://moti-pro07.onrender.com";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [userId, setUserId] = useState(localStorage.getItem("user_id") || "");
  const [chat, setChat] = useState([]);
  const [input, setInput] = useState("");

  const micRef = useRef(null);
  const audioRef = useRef(null);

  // ---------------- INIT ----------------
  useEffect(() => {
    if (userId) loadHistory(userId);
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

      loadHistory(res.data.user_id);
    } catch {
      alert("Login failed");
    }
  };

  // ---------------- HISTORY ----------------
  const loadHistory = async (uid) => {
    try {
      const res = await axios.get(`${API}/history/${uid}`);

      const formatted = res.data.history.map((h) => ({
        role: h[0],
        text: h[1],
      }));

      setChat(formatted);
    } catch (e) {
      console.log(e);
    }
  };

  // ---------------- VOICE ----------------
  const speak = async (text) => {
    try {
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
      send(text);
    };

    micRef.current = recog;
  };

  const startMic = () => {
    micRef.current?.start();
  };

  // ---------------- CHAT ----------------
  const send = async (msg) => {
    const text = msg || input;
    if (!text) return;

    setChat((p) => [...p, { role: "user", text }]);

    const res = await axios.post(`${API}/chat`, {
      user_id: userId,
      message: text,
    });

    const reply = res.data.reply;

    setChat((p) => [...p, { role: "assistant", text: reply }]);

    speak(reply);
    setInput("");
  };

  // ---------------- UI ----------------
  if (!userId) {
    return (
      <div style={{ padding: 20 }}>
        <h2>MOTI AI Login</h2>

        <input placeholder="username" onChange={(e) => setUsername(e.target.value)} />
        <input placeholder="password" type="password" onChange={(e) => setPassword(e.target.value)} />

        <button onClick={login}>Login</button>
      </div>
    );
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>MOTI AI</h2>

      <div style={{ height: 300, overflow: "auto" }}>
        {chat.map((c, i) => (
          <p key={i}>
            <b>{c.role}:</b> {c.text}
          </p>
        ))}
      </div>

      <input value={input} onChange={(e) => setInput(e.target.value)} />

      <button onClick={() => send()}>Send</button>
      <button onClick={startMic}>🎤</button>
    </div>
  );
}

export default App;