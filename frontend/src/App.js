import React, { useEffect, useRef, useState } from "react";

const API = "https://moti-proo.onrender.com";

export default function App() {

  // ================= AUTH =================

  const [loggedIn, setLoggedIn] = useState(
    localStorage.getItem("moti_login") === "true"
  );

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // ================= CHAT =================

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  // ================= CHAT HISTORY =================

  const [chatList, setChatList] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);

  // ================= VOICE =================

  const recognitionRef = useRef(null);
  const messagesEndRef = useRef(null);

  // ================= LOAD USER =================

  useEffect(() => {

    if (!loggedIn) return;

    const savedChats = JSON.parse(
      localStorage.getItem("moti_chats") || "[]"
    );

    setChatList(savedChats);

    if (savedChats.length > 0) {

      setCurrentChatId(savedChats[0].id);
      setMessages(savedChats[0].messages);

    } else {

      createNewChat();

    }

  }, [loggedIn]);

  // ================= AUTO SCROLL =================

  useEffect(() => {

    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });

  }, [messages]);

  // ================= SAVE CHAT =================

  useEffect(() => {

    if (!currentChatId) return;

    const updated = chatList.map((chat) => {

      if (chat.id === currentChatId) {

        return {
          ...chat,
          messages,
        };

      }

      return chat;

    });

    setChatList(updated);

    localStorage.setItem(
      "moti_chats",
      JSON.stringify(updated)
    );

  }, [messages]);

  // ================= LOGIN =================

  const login = () => {

    if (!username || !password) {
      alert("Enter username and password");
      return;
    }

    localStorage.setItem("moti_login", "true");
    localStorage.setItem("moti_user", username);

    setLoggedIn(true);

  };

  // ================= LOGOUT =================

  const logout = () => {

    localStorage.removeItem("moti_login");

    setLoggedIn(false);

  };

  // ================= NEW CHAT =================

  const createNewChat = () => {

    const newChat = {
      id: Date.now(),
      title: "New Chat",
      messages: [],
    };

    const updated = [newChat, ...chatList];

    setChatList(updated);

    localStorage.setItem(
      "moti_chats",
      JSON.stringify(updated)
    );

    setCurrentChatId(newChat.id);
    setMessages([]);

  };

  // ================= OPEN OLD CHAT =================

  const openChat = (chat) => {

    setCurrentChatId(chat.id);
    setMessages(chat.messages);

  };

  // ================= VOICE OUTPUT =================

  const speakText = (text) => {

    speechSynthesis.cancel();

    const utter = new SpeechSynthesisUtterance(text);

    utter.rate = 1;
    utter.pitch = 1;
    utter.volume = 1;

    const voices = speechSynthesis.getVoices();

    if (voices.length > 0) {

      const preferred =
        voices.find((v) =>
          v.name.toLowerCase().includes("female")
        ) || voices[0];

      utter.voice = preferred;

    }

    speechSynthesis.speak(utter);

  };

  // ================= SEND MESSAGE =================

  const sendMessage = async (customText = null) => {

    const text = customText || input;

    if (!text.trim()) return;

    const userMsg = {
      role: "user",
      text,
    };

    const updatedMessages = [...messages, userMsg];

    setMessages(updatedMessages);

    setInput("");

    setLoading(true);

    try {

      const res = await fetch(`${API}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: text,
        }),
      });

      const data = await res.json();

      const reply =
        data.reply ||
        "Hello, I am MOTI AI.";

      let animatedText = "";

      const botMsg = {
        role: "assistant",
        text: "",
      };

      setMessages((prev) => [...prev, botMsg]);

      for (let i = 0; i < reply.length; i++) {

        animatedText += reply[i];

        await new Promise((r) =>
          setTimeout(r, 10)
        );

        setMessages((prev) => {

          const copy = [...prev];

          copy[copy.length - 1] = {
            role: "assistant",
            text: animatedText,
          };

          return copy;

        });

      }

      speakText(reply);

      // update title

      const updatedChats = chatList.map((chat) => {

        if (chat.id === currentChatId) {

          return {
            ...chat,
            title: text.slice(0, 25),
            messages: [
              ...updatedMessages,
              {
                role: "assistant",
                text: reply,
              },
            ],
          };

        }

        return chat;

      });

      setChatList(updatedChats);

      localStorage.setItem(
        "moti_chats",
        JSON.stringify(updatedChats)
      );

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

    setLoading(false);

  };

  // ================= MIC =================

  const startMic = () => {

    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Mic not supported");
      return;
    }

    const recognition = new SpeechRecognition();

    recognition.lang = "en-US";

    recognition.interimResults = false;

    recognition.onresult = (event) => {

      const text =
        event.results[0][0].transcript;

      sendMessage(text);

    };

    recognition.start();

    recognitionRef.current = recognition;

  };

  // ================= LOGIN SCREEN =================

  if (!loggedIn) {

    return (
      <div
        style={{
          height: "100vh",
          background:
            "linear-gradient(135deg,#0f172a,#1e1b4b,#312e81)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          fontFamily: "Arial",
        }}
      >
        <div
          style={{
            width: "320px",
            background: "rgba(255,255,255,0.08)",
            padding: "30px",
            borderRadius: "24px",
            backdropFilter: "blur(15px)",
            boxShadow:
              "0 0 30px rgba(0,0,0,0.4)",
          }}
        >
          <h1
            style={{
              color: "white",
              textAlign: "center",
              marginBottom: "25px",
            }}
          >
            MOTI AI
          </h1>

          <input
            placeholder="Username"
            value={username}
            onChange={(e) =>
              setUsername(e.target.value)
            }
            style={{
              width: "100%",
              padding: "12px",
              marginBottom: "15px",
              borderRadius: "12px",
              border: "none",
              outline: "none",
            }}
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
            style={{
              width: "100%",
              padding: "12px",
              marginBottom: "20px",
              borderRadius: "12px",
              border: "none",
              outline: "none",
            }}
          />

          <button
            onClick={login}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "12px",
              border: "none",
              background:
                "linear-gradient(90deg,#7c3aed,#2563eb)",
              color: "white",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            Login
          </button>
        </div>
      </div>
    );

  }

  // ================= MAIN UI =================

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        background: "#0f172a",
        color: "white",
        fontFamily: "Arial",
      }}
    >

      {/* SIDEBAR */}

      <div
        style={{
          width: "260px",
          background: "#111827",
          padding: "15px",
          display: "flex",
          flexDirection: "column",
          borderRight: "1px solid #222",
        }}
      >

        <button
          onClick={createNewChat}
          style={{
            padding: "12px",
            borderRadius: "12px",
            border: "none",
            background:
              "linear-gradient(90deg,#7c3aed,#2563eb)",
            color: "white",
            fontWeight: "bold",
            cursor: "pointer",
            marginBottom: "15px",
          }}
        >
          + New Chat
        </button>

        <div
          style={{
            flex: 1,
            overflowY: "auto",
          }}
        >
          {chatList.map((chat) => (
            <div
              key={chat.id}
              onClick={() => openChat(chat)}
              style={{
                padding: "12px",
                borderRadius: "12px",
                marginBottom: "10px",
                cursor: "pointer",
                background:
                  chat.id === currentChatId
                    ? "#1e293b"
                    : "transparent",
              }}
            >
              {chat.title}
            </div>
          ))}
        </div>

        <button
          onClick={logout}
          style={{
            padding: "12px",
            borderRadius: "12px",
            border: "none",
            background: "#dc2626",
            color: "white",
            cursor: "pointer",
          }}
        >
          Logout
        </button>
      </div>

      {/* CHAT AREA */}

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
        }}
      >

        {/* HEADER */}

        <div
          style={{
            padding: "18px",
            fontSize: "22px",
            fontWeight: "bold",
            borderBottom: "1px solid #222",
            background: "#111827",
          }}
        >
          MOTI AI ✨
        </div>

        {/* MESSAGES */}

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
                  msg.role === "user"
                    ? "flex-end"
                    : "flex-start",
                marginBottom: "15px",
              }}
            >

              <div
                style={{
                  maxWidth: "75%",
                  padding: "14px",
                  borderRadius: "18px",
                  lineHeight: "1.5",
                  background:
                    msg.role === "user"
                      ? "#2563eb"
                      : "#1e293b",
                }}
              >
                {msg.text}
              </div>

            </div>

          ))}

          {loading && (
            <div
              style={{
                opacity: 0.7,
              }}
            >
              MOTI typing...
            </div>
          )}

          <div ref={messagesEndRef}></div>
        </div>

        {/* INPUT */}

        <div
          style={{
            display: "flex",
            gap: "10px",
            padding: "15px",
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
            onChange={(e) =>
              setInput(e.target.value)
            }
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                sendMessage();
              }
            }}
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
            onClick={() => sendMessage()}
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
    </div>
  );
}