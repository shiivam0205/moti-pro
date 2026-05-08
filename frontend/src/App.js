import React, { useState, useEffect, useRef } from "react";

const API =
  process.env.REACT_APP_API ||
  "https://moti-proo.onrender.com";

export default function App() {

  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);

  const endRef = useRef(null);

  // ================= AUTO SCROLL =================
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ================= VOICE =================
  const speak = (text) => {

    window.speechSynthesis.cancel();

    const utter = new SpeechSynthesisUtterance(text);

    utter.rate = 1;
    utter.pitch = 1;

    const voices = speechSynthesis.getVoices();

    utter.voice =
      voices.find(v => v.lang === "en-US") ||
      voices.find(v => v.lang === "hi-IN") ||
      voices[0];

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
          message: msg
        })
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
        { role: "ai", text: "Backend connection failed" }
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

    const mic = new SpeechRecognition();

    mic.lang = "en-IN";

    mic.onresult = (e) => {
      const text = e.results[0][0].transcript;
      send(text);
    };

    mic.start();
  };

  // ================= UI =================
  return (
    <div style={styles.container}>

      {/* HEADER */}
      <div style={styles.header}>
        MOTI AI
      </div>

      {/* CHAT BOX */}
      <div style={styles.chatBox}>

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
  );
}

// ================= STYLES =================
const styles = {

  container: {
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    background: "#0f0f0f",
    color: "white"
  },

  header: {
    padding: 15,
    textAlign: "center",
    background: "#111",
    fontWeight: "bold"
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