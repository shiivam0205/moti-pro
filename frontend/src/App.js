import React, { useState } from "react";
import axios from "axios";

function App() {
  const [input, setInput] = useState("");
  const [chat, setChat] = useState([]);
  const [status, setStatus] = useState("Idle");

  const API = "https://moti-pro07.onrender.com";
const userId = localStorage.getItem("moti_user") || Date.now().toString();
localStorage.setItem("moti_user", userId);
  const speakText = (text) => {
    window.speechSynthesis.cancel();

    const speech = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();

    const femaleVoice =
      voices.find((v) => v.name.includes("Female")) ||
      voices.find((v) => v.name.includes("Samantha")) ||
      voices.find((v) => v.name.includes("Google US English")) ||
      voices.find((v) => v.name.includes("Zira")) ||
      voices[0];

    speech.voice = femaleVoice;
    speech.lang = "en-US";
    speech.rate = 0.95;
    speech.pitch = 1.2;

    speech.onstart = () => setStatus("Speaking...");
    speech.onend = () => setStatus("Idle");

    window.speechSynthesis.speak(speech);
  };

  const sendToAI = async (text) => {
    if (!text.trim()) return;

    setChat((prev) => [...prev, { role: "user", text }]);
    setChat((prev) => [...prev, { role: "bot", text: "..." }]);
    setStatus("Thinking...");

    try {
    const res = await axios.post(`${API}/chat`, {
  message: text,
  user_id: userId
});
     const reply = res.data.reply;

setTimeout(() => {
  speakText(reply);

  setChat((prev) => {
    const updated = [...prev];
    updated[updated.length - 1] = { role: "bot", text: reply };
    return updated;
  });
}, 1200);
    } catch (err) {
      setStatus("Idle");
      setChat((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: "bot", text: "⚠️ Server error" };
        return updated;
      });
    }
  };

  const startListening = () => {
    window.speechSynthesis.cancel();

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech Recognition not supported");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.start();
    setStatus("Listening...");

    recognition.onresult = (event) => {
      const voiceText = event.results[0][0].transcript;
      setInput("");
      sendToAI(voiceText);
    };

    recognition.onerror = () => setStatus("Idle");
  };

  const sendMessage = () => {
    const text = input;
    setInput("");
    sendToAI(text);
  };

  return (
    <div style={styles.page}>
      <div style={styles.glow1}></div>
      <div style={styles.glow2}></div>

     <div
  style={{
    ...styles.orb,
    listeningOrb: {
  boxShadow: "0 0 70px #ff9800",
  background: "radial-gradient(circle,#ffb74d,#ef6c00,#e65100)",
  transform: "scale(1.08)",
typingDots: {
  fontSize: 26,
  letterSpacing: 4,
},

thinkingOrb: {
  boxShadow: "0 0 70px #b388ff",
  background: "radial-gradient(circle,#b388ff,#7c4dff,#512da8)",
  transform: "scale(1.08)",
},

speakingOrb: {
  boxShadow: "0 0 70px #00e676",
  background: "radial-gradient(circle,#69f0ae,#00c853,#1b5e20)",
  transform: "scale(1.08)",
},
></div>

      <div style={styles.chatContainer}>
        {chat.map((msg, i) => (
  <div
    key={i}
    style={msg.role === "user" ? styles.userBubble : styles.botBubble}
  >
    {msg.text === "..." ? (
      <span style={{ fontSize: "28px", letterSpacing: "6px" }}>● ● ●</span>
    ) : (
      msg.text
    )}
  </div>
))}

      <div style={styles.inputArea}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Talk or type..."
          style={styles.input}
        />

        <button onClick={startListening} style={styles.micButton}>
          🎙
        </button>

        <button onClick={sendMessage} style={styles.sendButton}>
          ➤
        </button>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(160deg,#050816,#0b1026,#111827)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: 20,
    overflow: "hidden",
    fontFamily: "Segoe UI",
    color: "white",
    position: "relative",
  },

  glow1: {
    position: "absolute",
    width: 300,
    height: 300,
    borderRadius: "50%",
    background: "#00e5ff33",
    top: -50,
    left: -50,
    filter: "blur(80px)",
  },

  glow2: {
    position: "absolute",
    width: 250,
    height: 250,
    borderRadius: "50%",
    background: "#7c4dff33",
    bottom: -50,
    right: -50,
    filter: "blur(80px)",
  },

  orb: {
    width: 100,
    height: 100,
    borderRadius: "50%",
    marginTop: 10,
    background: "radial-gradient(circle,#00e5ff,#1565c0,#0d47a1)",
    boxShadow: "0 0 50px #00e5ff",
  },

  title: {
    marginTop: 12,
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: 3,
  },

  status: {
    marginTop: 6,
    marginBottom: 15,
    color: "#9be7ff",
    fontSize: 14,
  },

  chatContainer: {
    flex: 1,
    width: "100%",
    maxWidth: 760,
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.08)",
    backdropFilter: "blur(18px)",
    borderRadius: 24,
    padding: 20,
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: 14,
    boxShadow: "0 10px 40px rgba(0,0,0,0.35)",
    zIndex: 2,
  },

  userBubble: {
    alignSelf: "flex-end",
    background: "linear-gradient(135deg,#00bcd4,#00838f)",
    padding: "13px 18px",
    borderRadius: "22px 22px 4px 22px",
    maxWidth: "75%",
    fontSize: 15,
  },

  botBubble: {
    alignSelf: "flex-start",
    background: "rgba(255,255,255,0.10)",
    padding: "13px 18px",
    borderRadius: "22px 22px 22px 4px",
    maxWidth: "75%",
    fontSize: 15,
  },

  inputArea: {
    width: "100%",
    maxWidth: 760,
    display: "flex",
    gap: 12,
    marginTop: 16,
    zIndex: 2,
  },

  input: {
    flex: 1,
    padding: 16,
    borderRadius: 35,
    border: "1px solid rgba(255,255,255,0.08)",
    outline: "none",
    background: "rgba(255,255,255,0.08)",
    color: "white",
    fontSize: 15,
  },

  micButton: {
    width: 58,
    height: 58,
    borderRadius: "50%",
    border: "none",
    background: "linear-gradient(135deg,#ff9800,#ef6c00)",
    color: "white",
    fontSize: 22,
    cursor: "pointer",
    boxShadow: "0 0 18px #ff980055",
  },

  sendButton: {
    width: 58,
    height: 58,
    borderRadius: "50%",
    border: "none",
    background: "linear-gradient(135deg,#00e676,#00c853)",
    color: "white",
    fontSize: 22,
    cursor: "pointer",
    boxShadow: "0 0 18px #00e67655",
  },
};

export default App;