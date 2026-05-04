import React, { useState, useEffect } from "react";
import axios from "axios";

const API = "https://moti-pro07.onrender.com";

export default function App() {
  const [msg, setMsg] = useState("");
  const [chat, setChat] = useState([]);

  // =========================
  // 🎤 MANUAL VOICE INPUT
  // =========================
  const startVoice = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Voice not supported in this browser (use Chrome)");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.start();

    recognition.onresult = (event) => {
      const text = event.results[0][0].transcript;
      setMsg(text);
    };
  };

  // =========================
  // 📩 SEND MESSAGE
  // =========================
 const sendMessage = async () => {
  try {
    const res = await axios.post(`${API}/chat`, {
      message: input
    });

    console.log(res.data);

    setChat([...chat, { user: input, bot: res.data.reply }]);
    setInput("");
  } catch (error) {
    console.log(error);
  }
};

    const reply = res.data.response;

    setChat((prev) => [
      ...prev,
      { user: messageToSend, bot: reply },
    ]);

    setMsg("");

    // 🔊 AI SPEAKS RESPONSE
    const speech = new SpeechSynthesisUtterance(reply);
    speech.lang = "en-US";
    window.speechSynthesis.speak(speech);
  };

  // =========================
  // 🎯 COMMAND LISTENER (WAKE WORD FLOW)
  // =========================
  const listenCommand = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";

    recognition.start();

    recognition.onresult = (event) => {
      const command = event.results[0][0].transcript;

      send(command);
    };
  };

  // =========================
  // 🎤 CONTINUOUS WAKE WORD ENGINE
  // =========================
  const startWakeWord = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      const text =
        event.results[event.results.length - 1][0].transcript.toLowerCase();

      console.log("Heard:", text);

      // 🎯 WAKE WORD DETECTION
      if (text.includes("hey moti")) {
        const speech = new SpeechSynthesisUtterance("Yes, I'm listening");
        window.speechSynthesis.speak(speech);

        listenCommand();
      }
    };

    recognition.start();
  };

  // =========================
  // 🚀 AUTO START WAKE WORD
  // =========================
  useEffect(() => {
    startWakeWord();
  }, []);

  // =========================
  // 🔥 UI (RETURN SECTION)
  // =========================
  return (
    <div
      style={{
        background: "#0a0a0a",
        color: "white",
        minHeight: "100vh",
        padding: 20,
        fontFamily: "Arial",
      }}
    >
      <h1>MOTI VOICE AI 🎤</h1>

      {/* CHAT BOX */}
      <div style={{ marginBottom: 20 }}>
        {chat.map((c, i) => (
          <div key={i} style={{ marginBottom: 10 }}>
            <p><b>You:</b> {c.user}</p>
            <p><b>MOTI:</b> {c.bot}</p>
            <hr />
          </div>
        ))}
      </div>

      {/* INPUT */}
      <input
        value={msg}
        onChange={(e) => setMsg(e.target.value)}
        placeholder="Type or say 'Hey MOTI'..."
        style={{ padding: 10, width: "60%" }}
      />

      {/* BUTTONS */}
      <button onClick={() => send()} style={{ padding: 10, marginLeft: 10 }}>
        Send
      </button>

      <button onClick={startVoice} style={{ padding: 10, marginLeft: 10 }}>
        🎤 Speak
      </button>
    </div>
  );
}