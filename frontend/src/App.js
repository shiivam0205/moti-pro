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

  // ---------------- LOAD HISTORY ----------------
  useEffect(() => {
    if (userId) loadHistory();
    initMic();
  }, [userId]);

  const loadHistory = async () => {
    try {
      const res = await axios.get(`${API}/history/${userId}`);

      const formatted = res.data.history.map((h) => ({
        role: h[0],
        text: h[1],
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
        username,
        password,
      });

      localStorage.setItem("user_id", res.data.user_id);
      setUserId(res.data.user_id);
    } catch (e) {
      console.log("login error", e);
    }
  };

  // ---------------- CHAT ----------------
  const send = async (text) => {
    const msg = text || input;
    if (!msg) return;

    setChat((p) => [...p, { role: "user", text: msg }]);

    try {
      const res = await axios.post(`${API}/chat`, {
        user_id: userId,
        message: msg,
      });

      setChat((p) => [
        ...p,
        { role: "assistant", text: res.data.reply },
      ]);

    } catch (e) {
      console.log(e);
    }

    setInput("");
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

  // ---------------- UI ----------------
  if (!userId) {
    return (
      <div style={{ padding: 20 }}>
        <h2>MOTI AI Login</h2>

        <input
          placeholder="username"
          onChange={(e) => setUsername(e.target.value)}
        />

        <input
          placeholder="password"
          type="password"
          onChange={(e) => setPassword(e.target.value)}
        />

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

      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />

      <button onClick={() => send()}>Send</button>
      <button onClick={startMic}>🎤 Speak</button>
    </div>
  );
}

export default App;