import React, { useState, useEffect, useRef } from "react";

export default function App() {

  const API = "https://moti-pro07.onrender.com";

  const [userId, setUserId] = useState(localStorage.getItem("uid"));
  const [u, setU] = useState("");
  const [p, setP] = useState("");

  const [msg, setMsg] = useState("");
  const [chat, setChat] = useState([]);

  const [listening, setListening] = useState(false);

  const recognitionRef = useRef(null);

  // ================= PERSIST LOGIN =================
  useEffect(() => {
    if (userId) localStorage.setItem("uid", userId);
  }, [userId]);

  // ================= VOICE OUTPUT =================
  const speak = (text) => {

    window.speechSynthesis.cancel(); // FIX delay

    const s = new SpeechSynthesisUtterance(text);
    s.rate = 1;
    s.pitch = 1;

    window.speechSynthesis.speak(s);
  };

  // ================= MIC AUTO =================
  const startMic = () => {

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    const recog = new SpeechRecognition();

    recog.continuous = true;
    recog.lang = "auto";
    recog.interimResults = false;

    recog.onresult = (e) => {

      const text = e.results[e.results.length - 1][0].transcript;

      setMsg(text);
    };

    recognitionRef.current = recog;

    recog.start();
    setListening(true);
  };

  const stopMic = () => {
    recognitionRef.current?.stop();
    setListening(false);
  };

  // ================= LOGIN =================
  const login = async () => {

    const r = await fetch(`${API}/login`, {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({ username: u, password: p })
    });

    const d = await r.json();

    if (d.user_id) setUserId(d.user_id);
  };

  // ================= SEND =================
  const send = async () => {

    if (!msg) return;

    const updated = [...chat, { role: "user", text: msg }];
    setChat(updated);

    const text = msg;
    setMsg("");

    const r = await fetch(`${API}/chat`, {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({ user_id: userId, message: text })
    });

    const d = await r.json();

    setChat([...updated, { role: "ai", text: d.reply }]);

    speak(d.reply);
  };

  // ================= LOGIN UI =================
  if (!userId) {
    return (
      <div style={styles.login}>
        <h2>MOTI AI</h2>

        <input style={styles.small} placeholder="username"
          onChange={(e)=>setU(e.target.value)} />

        <input style={styles.small} type="password"
          placeholder="password"
          onChange={(e)=>setP(e.target.value)} />

        <button style={styles.btn} onClick={login}>
          Enter
        </button>
      </div>
    );
  }

  // ================= CHAT UI =================
  return (
    <div style={styles.app}>

      {/* AVATAR */}
      <div style={styles.avatar}>
        🤖 {listening ? "🎤 Speaking..." : "MOTI AI"}
      </div>

      <div style={styles.chat}>
        {chat.map((c,i)=>(
          <div key={i}
            style={{
              ...styles.msg,
              alignSelf: c.role==="user"?"flex-end":"flex-start"
            }}
          >
            {c.text}
          </div>
        ))}
      </div>

      <div style={styles.bottom}>

        <input style={styles.input}
          value={msg}
          onChange={(e)=>setMsg(e.target.value)}
          placeholder="Speak or type..."
        />

        <button style={styles.btn} onClick={send}>Send</button>

        <button style={styles.btn}
          onClick={listening ? stopMic : startMic}>
          🎤
        </button>

      </div>

    </div>
  );
}

// ================= STYLE =================
const styles = {

  app: {
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    background: "linear-gradient(#0a0a0a,#111)"
  },

  avatar: {
    padding: 10,
    textAlign: "center",
    color: "white"
  },

  chat: {
    flex: 1,
    padding: 10,
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: 8
  },

  msg: {
    padding: 10,
    borderRadius: 10,
    maxWidth: "70%",
    background: "#222",
    color: "white"
  },

  bottom: {
    display: "flex",
    padding: 10,
    gap: 5
  },

  input: {
    flex: 1,
    padding: 10,
    borderRadius: 8
  },

  btn: {
    padding: 10,
    background: "#4a90e2",
    color: "white",
    border: "none",
    borderRadius: 8
  },

  login: {
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    background: "#0a0a0a",
    color: "white"
  },

  small: {
    padding: 8,
    width: 180,
    borderRadius: 6
  }
};