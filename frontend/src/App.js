import React, { useState, useEffect, useRef } from "react";

const API = "https://moti-proo.onrender.com";

export default function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMsg = {
      role: "user",
      text: input,
    };

    setMessages((prev) => [...prev, userMsg]);

    const currentInput = input;
    setInput("");
    setLoading(true);

    try {
      const response = await fetch(`${API}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: currentInput,
        }),
      });

      if (!response.ok) {
        throw new Error("Backend error");
      }

      const data = await response.json();

      const botMsg = {
        role: "assistant",
        text: data.reply || "No reply",
      };

      setMessages((prev) => [...prev, botMsg]);

      // Voice reply
      if ("speechSynthesis" in window) {
        const utter = new SpeechSynthesisUtterance(botMsg.text);
        utter.rate = 1;
        utter.pitch = 1;
        speechSynthesis.speak(utter);
      }
    } catch (err) {
      console.error(err);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "Backend connection failed",
        },
      ]);
    }

    setLoading(false);
  };

  const handleKey = (e) => {
    if (e.key === "Enter") {
      sendMessage();
    }
  };

  // ================= MIC =================

  const startMic = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech recognition not supported");
      return;
    }

    const recognition = new SpeechRecognition();

    recognition.lang = "en-US";
    recognition.interimResults = false;

    recognition.onresult = (event) => {
      const text = event.results[0][0].transcript;
      setInput(text);

      setTimeout(() => {
        sendVoice(text);
      }, 300);
    };

    recognition.start();
  };

  const sendVoice = async (voiceText) => {
    if (!voiceText.trim()) return;

    const userMsg = {
      role: "user",
      text: voiceText,
    };

    setMessages((prev) => [...prev, userMsg]);

    try {
      const response = await fetch(`${API}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: voiceText,
        }),
      });

      const data = await response.json();

      const botMsg = {
        role: "assistant",
        text: data.reply || "No reply",
      };

      setMessages((prev) => [...prev, botMsg]);

      if ("speechSynthesis" in window) {
        const utter = new SpeechSynthesisUtterance(botMsg.text);
        speechSynthesis.speak(utter);
      }
    } catch (err) {
      console.log(err);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "Backend connection failed",
        },
      ]);
    }
  };

  return (
    <div
      style={{
        background: "#0f172a",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        color: "white",
        fontFamily: "Arial",
      }}
    >
      {/* HEADER */}

      <div
        style={{
          padding: "18px",
          fontSize: "24px",
          fontWeight: "bold",
          background: "#111827",
          borderBottom: "1px solid #222",
        }}
      >
        MOTI AI
      </div>

      {/* CHAT */}

      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "20px",
        }}
      >
        {messages.map((msg, index) => (
          <div
            key={index}
            style={{
              display: "flex",
              justifyContent:
                msg.role === "user" ? "flex-end" : "flex-start",
              marginBottom: "15px",
            }}
          >
            <div
              style={{
                background:
                  msg.role === "user" ? "#2563eb" : "#1e293b",
                padding: "14px",
                borderRadius: "16px",
                maxWidth: "75%",
                lineHeight: "1.5",
                fontSize: "15px",
              }}
            >
              {msg.text}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ opacity: 0.7 }}>
            MOTI typing...
          </div>
        )}

        <div ref={bottomRef}></div>
      </div>

      {/* INPUT */}

      <div
        style={{
          display: "flex",
          padding: "15px",
          gap: "10px",
          background: "#111827",
        }}
      >
        <button
          onClick={startMic}
          style={{
            width: "55px",
            borderRadius: "14px",
            border: "none",
            background: "#7c3aed",
            color: "white",
            fontSize: "20px",
            cursor: "pointer",
          }}
        >
          🎤
        </button>

        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Message MOTI..."
          style={{
            flex: 1,
            padding: "14px",
            borderRadius: "14px",
            border: "none",
            outline: "none",
            background: "#1e293b",
            color: "white",
            fontSize: "15px",
          }}
        />

        <button
          onClick={sendMessage}
          style={{
            padding: "14px 20px",
            borderRadius: "14px",
            border: "none",
            background: "#2563eb",
            color: "white",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}