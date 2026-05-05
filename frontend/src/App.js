import React, { useState } from "react";
import axios from "axios";

function App() {
  const [input, setInput] = useState("");
  const [chat, setChat] = useState([]);

  const API = "https://moti-pro07.onrender.com";

  const speakText = (text) => {
  const speech = new SpeechSynthesisUtterance(text);
  const voices = window.speechSynthesis.getVoices();

  const femaleVoice =
    voices.find(v => v.name.includes("Female")) ||
    voices.find(v => v.name.includes("Samantha")) ||
    voices.find(v => v.name.includes("Google US English")) ||
    voices.find(v => v.name.includes("Zira")) ||
    voices[0];

  speech.voice = femaleVoice;
  speech.lang = "en-US";
  speech.rate = 0.95;
  speech.pitch = 1.2;

  window.speechSynthesis.speak(speech);
};

  const startListening = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech Recognition not supported");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.start();

    recognition.onresult = async (event) => {
      const voiceText = event.results[0][0].transcript;

      setInput(voiceText);

      setTimeout(async () => {
        const text = voiceText;

        setInput("");
        setChat((prev) => [...prev, { role: "user", text }]);
        setChat((prev) => [...prev, { role: "bot", text: "..." }]);

        try {
          const res = await axios.post(`${API}/chat`, {
            message: text,
          });

          const reply = res.data.reply;

          speakText(reply);

          setChat((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = { role: "bot", text: reply };
            return updated;
          });
        } catch (err) {
          setChat((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = {
              role: "bot",
              text: "⚠️ Server error",
            };
            return updated;
          });
        }
      }, 500);
    };
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const text = input.trim();
    setInput("");

    setChat((prev) => [...prev, { role: "user", text }]);
    setChat((prev) => [...prev, { role: "bot", text: "..." }]);

    try {
      const res = await axios.post(`${API}/chat`, {
        message: text,
      });

      const reply = res.data.reply;

      speakText(reply);

      setChat((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: "bot", text: reply };
        return updated;
      });
    } catch (err) {
      setChat((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "bot",
          text: "⚠️ Server error",
        };
        return updated;
      });
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.orb}></div>
      <div style={styles.title}>MOTI AI ASSISTANT</div>

      <div style={styles.chatContainer}>
        {chat.map((msg, i) => (
          <div
            key={i}
            style={msg.role === "user" ? styles.userBubble : styles.botBubble}
          >
            {msg.text}
          </div>
        ))}
      </div>

      <div style={styles.inputArea}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Talk or type to MOTI..."
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
    fontFamily: "Arial",
    background: "linear-gradient(135deg, #0f2027, #203a43, #2c5364)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: 20,
    color: "white",
  },

  orb: {
    width: 90,
    height: 90,
    borderRadius: "50%",
    marginTop: 10,
    background: "radial-gradient(circle, #00e5ff, #006064)",
    boxShadow: "0 0 40px #00e5ff",
    animation: "pulse 2s infinite",
  },

  title: {
    marginTop: 10,
    marginBottom: 15,
    fontSize: 24,
    fontWeight: "bold",
    letterSpacing: 2,
  },

  chatContainer: {
    flex: 1,
    width: "100%",
    maxWidth: 700,
    overflowY: "auto",
    background: "rgba(255,255,255,0.08)",
    backdropFilter: "blur(12px)",
    borderRadius: 20,
    padding: 20,
    display: "flex",
    flexDirection: "column",
    gap: 12,
    boxShadow: "0 8px 30px rgba(0,0,0,0.3)",
  },

  userBubble: {
    alignSelf: "flex-end",
    background: "#00acc1",
    color: "white",
    padding: "12px 16px",
    borderRadius: "20px 20px 0 20px",
    maxWidth: "75%",
  },

  botBubble: {
    alignSelf: "flex-start",
    background: "rgba(255,255,255,0.15)",
    color: "white",
    padding: "12px 16px",
    borderRadius: "20px 20px 20px 0",
    maxWidth: "75%",
  },

  inputArea: {
    width: "100%",
    maxWidth: 700,
    display: "flex",
    gap: 10,
    marginTop: 15,
  },

  input: {
    flex: 1,
    padding: 14,
    borderRadius: 30,
    border: "none",
    outline: "none",
    fontSize: 15,
  },

  micButton: {
    width: 55,
    height: 55,
    borderRadius: "50%",
    border: "none",
    background: "#ff9800",
    color: "white",
    fontSize: 20,
    cursor: "pointer",
  },

  sendButton: {
    width: 55,
    height: 55,
    borderRadius: "50%",
    border: "none",
    background: "#00c853",
    color: "white",
    fontSize: 20,
    cursor: "pointer",
  },
};

export default App;