import React, { useState } from "react";
import axios from "axios";

function App() {
  const [input, setInput] = useState("");
  const [chat, setChat] = useState([]);

  const API = "https://moti-pro07.onrender.com";

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

    // auto send voice message
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
const speakText = (text) => {
  const speech = new SpeechSynthesisUtterance(text);
  speech.lang = "en-US";
  speech.rate = 1;
  speech.pitch = 1;
  window.speechSynthesis.speak(speech);
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
      <div style={styles.header}>😠
 MOTI AI Assistant</div>

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
          placeholder="Type or use mic..."
          style={styles.input}
        />

        <button onClick={startListening} style={styles.micButton}>
          🎤
        </button>

        <button onClick={sendMessage} style={styles.button}>
          Send
        </button>
      </div>
    </div>
  );
}

const styles = {
  page: {
    fontFamily: "Arial",
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    background: "linear-gradient(135deg, #89f7fe, #66a6ff)",
    padding: 15,
  },

  header: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 10,
  },

  chatContainer: {
    flex: 1,
    width: "100%",
    maxWidth: 650,
    overflowY: "auto",
    padding: 15,
    borderRadius: 16,
    background: "rgba(255,255,255,0.25)",
    backdropFilter: "blur(10px)",
    boxShadow: "0 8px 25px rgba(0,0,0,0.1)",
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },

  userBubble: {
    alignSelf: "flex-end",
    background: "#1976d2",
    color: "white",
    padding: "10px 14px",
    borderRadius: "18px 18px 0 18px",
    maxWidth: "75%",
  },

  botBubble: {
    alignSelf: "flex-start",
    background: "white",
    color: "#333",
    padding: "10px 14px",
    borderRadius: "18px 18px 18px 0",
    maxWidth: "75%",
  },

  inputArea: {
    display: "flex",
    gap: 10,
    width: "100%",
    maxWidth: 650,
    marginTop: 10,
  },

  input: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    border: "none",
    outline: "none",
  },

  micButton: {
    padding: "12px 14px",
    borderRadius: 12,
    border: "none",
    background: "#ff9800",
    color: "white",
    cursor: "pointer",
    fontSize: 18,
  },

  button: {
    padding: "12px 18px",
    borderRadius: 12,
    border: "none",
    background: "#6a1b9a",
    color: "white",
    cursor: "pointer",
  },
};

export default App;