import React, { useState, useEffect, useRef } from "react";

const API = process.env.REACT_APP_API || "http://localhost:5000";

export default function App() {

  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ================= VOICE =================
  const speak = (text) => {

    window.speechSynthesis.cancel();

    const utter = new SpeechSynthesisUtterance(text);

    utter.rate = 1;
    utter.pitch = 1;
    utter.volume = 1;

    const voices = speechSynthesis.getVoices();

    utter.voice =
      voices.find(v => v.lang === "en-US") ||
      voices.find(v => v.lang === "hi-IN") ||
      voices[0];

    speechSynthesis.speak(utter);
  };

  // ================= SEND =================
  const send = async (customText) => {

    const text = customText || input;
    if (!text.trim()) return;

    setInput("");

    setMessages(prev => [
      ...prev,
      { role: "user", text }
    ]);

    setLoading(true);

    try {

      const res = await fetch(`${API}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ message: text })
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

    setLoading(false);
  };

  // ================= MIC =================
  const startMic = () => {

    window.speechSynthesis.cancel();

    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognition) return alert("Mic not supported");

    const recognition = new SpeechRecognition();

    recognition.lang = "en-IN";

    recognition.onresult = (e) => {
      const text = e.results[0][0].transcript;
      send(text);
    };

    recognition.start();
  };

  return (

    <div style={styles.container}>

      {/* HEADER */}
      <div style={styles.header}>
        MOTI AI
      </div>

      {/* CHAT */}
      <div style={styles.chatBox}>

        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              ...styles.msg,
              alignSelf: m.role === "user" ? "flex-end" : "flex-start",
              background: m.role === "user" ? "#4f46e5" : "#222"
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
          style={styles.input}
          placeholder="Ask MOTI..."
          onKeyDown={(e) => e.key === "Enter" && send()}
        />

        <button onClick={() => send()} style={styles.btn}>
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
    background: "#0f0f0f",
    display: "flex",
    flexDirection: "column",
    color: "white"
  },

  header: {
    padding: 15,
    background: "#111",
    fontWeight: "bold",
    textAlign: "center"
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
    cursor: "pointer"
  }
};