import React, { useEffect, useState, useRef } from "react";

const API = "https://moti-proo.onrender.com";

export default function App() {

  // ================= LOGIN =================

  const [loggedIn, setLoggedIn] = useState(
    localStorage.getItem("moti_login") === "true"
  );

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // ================= USER STORAGE =================

  const currentUser =
    localStorage.getItem("moti_current_user") || "";

  // ================= CHAT =================

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  // ================= CHATS =================

  const [chatList, setChatList] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);

  const endRef = useRef(null);

  // ================= LOAD USER CHATS =================

  useEffect(() => {

    if (!loggedIn) return;

    const saved =
      JSON.parse(
        localStorage.getItem(
          `moti_chats_${currentUser}`
        ) || "[]"
      );

    setChatList(saved);

    if (saved.length > 0) {

      setCurrentChatId(saved[0].id);
      setMessages(saved[0].messages);

    } else {

      createNewChat();

    }

  }, [loggedIn]);

  // ================= SAVE CHATS =================

  useEffect(() => {

    if (!loggedIn) return;

    localStorage.setItem(
      `moti_chats_${currentUser}`,
      JSON.stringify(chatList)
    );

  }, [chatList]);

  // ================= AUTO SCROLL =================

  useEffect(() => {

    endRef.current?.scrollIntoView({
      behavior: "smooth",
    });

  }, [messages]);

  // ================= LOGIN =================

  const login = () => {

    if (!username || !password) {
      alert("Enter username and password");
      return;
    }

    localStorage.setItem("moti_login", "true");
    localStorage.setItem(
      "moti_current_user",
      username
    );

    setLoggedIn(true);

  };

  // ================= LOGOUT =================

  const logout = () => {

    localStorage.removeItem("moti_login");

    setLoggedIn(false);

    setMessages([]);
    setChatList([]);

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

    setCurrentChatId(newChat.id);

    setMessages([]);

  };

  // ================= OPEN CHAT =================

  const openChat = (chat) => {

    setCurrentChatId(chat.id);

    setMessages(chat.messages);

  };

  // ================= SAVE CURRENT CHAT =================

  const updateCurrentChat = (newMessages) => {

    const updated = chatList.map((chat) => {

      if (chat.id === currentChatId) {

        return {
          ...chat,
          title:
            newMessages[0]?.text?.slice(0, 20) ||
            "New Chat",
          messages: newMessages,
        };

      }

      return chat;

    });

    setChatList(updated);

  };

  // ================= SPEAK =================

  const speak = (text) => {

    speechSynthesis.cancel();

    const utter =
      new SpeechSynthesisUtterance(text);

    utter.rate = 1;
    utter.pitch = 1;

    speechSynthesis.speak(utter);

  };

  // ================= SEND =================

  const sendMessage = async (customText = null) => {

    const text = customText || input;

    if (!text.trim()) return;

    const userMsg = {
      role: "user",
      text,
    };

    const newMessages = [...messages, userMsg];

    setMessages(newMessages);

    updateCurrentChat(newMessages);

    setInput("");

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
        data.reply || "Hello from MOTI AI";

      const botMsg = {
        role: "assistant",
        text: "",
      };

      setMessages((prev) => [...prev, botMsg]);

      let current = "";

      for (let i = 0; i < reply.length; i++) {

        current += reply[i];

        await new Promise((r) =>
          setTimeout(r, 10)
        );

        setMessages((prev) => {

          const copy = [...prev];

          copy[copy.length - 1] = {
            role: "assistant",
            text: current,
          };

          return copy;

        });

      }

      const finalMessages = [
        ...newMessages,
        {
          role: "assistant",
          text: reply,
        },
      ];

      updateCurrentChat(finalMessages);

      speak(reply);

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

  // ================= MIC =================

  const startMic = () => {

    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Mic not supported");
      return;
    }

    const recognition =
      new SpeechRecognition();

    recognition.lang = "en-US";

    recognition.onresult = (e) => {

      const text =
        e.results[0][0].transcript;

      sendMessage(text);

    };

    recognition.start();

  };

  // ================= LOGIN UI =================

  if (!loggedIn) {

    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          background:
            "linear-gradient(135deg,#0f172a,#1e1b4b)",
          fontFamily: "Arial",
        }}
      >
        <div
          style={{
            width: "320px",
            padding: "30px",
            borderRadius: "20px",
            background: "rgba(255,255,255,0.1)",
            backdropFilter: "blur(15px)",
          }}
        >
          <h1
            style={{
              textAlign: "center",
              color: "white",
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
              marginTop: "20px",
              borderRadius: "10px",
              border: "none",
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
              marginTop: "15px",
              borderRadius: "10px",
              border: "none",
            }}
          />

          <button
            onClick={login}
            style={{
              width: "100%",
              marginTop: "20px",
              padding: "12px",
              border: "none",
              borderRadius: "10px",
              background:
                "linear-gradient(90deg,#7c3aed,#2563eb)",
              color: "white",
              cursor: "pointer",
              fontWeight: "bold",
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
        }}
      >

        <button
          onClick={createNewChat}
          style={{
            padding: "12px",
            border: "none",
            borderRadius: "12px",
            background:
              "linear-gradient(90deg,#7c3aed,#2563eb)",
            color: "white",
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
                borderRadius: "10px",
                cursor: "pointer",
                marginBottom: "10px",
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
            border: "none",
            borderRadius: "10px",
            background: "#dc2626",
            color: "white",
            cursor: "pointer",
          }}
        >
          Logout
        </button>

      </div>

      {/* CHAT */}

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
            background: "#111827",
            borderBottom: "1px solid #222",
            fontSize: "22px",
            fontWeight: "bold",
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
                  borderRadius: "16px",
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

          <div ref={endRef}></div>

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
            }}
          />

          <button
            onClick={() => sendMessage()}
            style={{
              padding: "14px 20px",
              border: "none",
              borderRadius: "14px",
              background: "#2563eb",
              color: "white",
              cursor: "pointer",
            }}
          >
            Send
          </button>

        </div>

      </div>

    </div>
  );
}