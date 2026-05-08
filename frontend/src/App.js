import React, { useEffect, useState } from "react";

const API = "https://moti-proo.onrender.com";

export default function App() {

  // ================= STATES =================

  const [userId, setUserId] = useState(
    localStorage.getItem("uid") || ""
  );

  const [loggedIn, setLoggedIn] = useState(
    !!localStorage.getItem("uid")
  );

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [messages, setMessages] = useState([]);

  const [input, setInput] = useState("");

  const [chatId, setChatId] = useState(
    Date.now().toString()
  );

  const [history, setHistory] = useState([]);

  const [listening, setListening] = useState(false);

  // ================= LOAD HISTORY =================

  const loadHistory = async () => {

    if (!userId) return;

    try {

      const res = await fetch(
        `${API}/history/${userId}`
      );

      const data = await res.json();

      setHistory(data.chats || []);

    } catch (err) {

      console.log(err);

    }

  };

  // ================= LOAD CHAT =================

  const loadChat = async (id) => {

    try {

      const res = await fetch(
        `${API}/load/${userId}/${id}`
      );

      const data = await res.json();

      const loaded = (data.messages || []).map((m) => ({
        role: m[0],
        text: m[1]
      }));

      setMessages(loaded);

      setChatId(id);

    } catch (err) {

      console.log(err);

    }

  };

  // ================= LOGIN =================

  const login = async () => {

    if (!username || !password) {
      alert("Enter username and password");
      return;
    }

    try {

      const res = await fetch(`${API}/login`, {

        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({
          username,
          password
        })

      });

      const data = await res.json();

      if (data.user_id) {

        localStorage.setItem("uid", data.user_id);

        setUserId(data.user_id);

        setLoggedIn(true);

        loadHistory();

      } else {

        alert(data.error || "Login failed");

      }

    } catch (err) {

      console.log(err);

      alert("Backend connection failed");

    }

  };

  // ================= LOGOUT =================

  const logout = () => {

    localStorage.removeItem("uid");

    setLoggedIn(false);

    setUserId("");

    setMessages([]);

    setHistory([]);

  };

  // ================= NEW CHAT =================

  const newChat = () => {

    const freshId = Date.now().toString();

    setChatId(freshId);

    setMessages([]);

    setInput("");

  };

  // ================= SEND =================

  const send = async (customText = null) => {

    const text = customText || input;

    if (!text || !text.trim()) return;

    let activeChatId = chatId;

    if (!activeChatId) {

      activeChatId = Date.now().toString();

      setChatId(activeChatId);

    }

    const userMessage = {
      role: "user",
      text
    };

    const updatedMessages = [
      ...messages,
      userMessage
    ];

    setMessages(updatedMessages);

    setInput("");

    try {

      const res = await fetch(`${API}/chat`, {

        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({

          user_id: userId,

          chat_id: activeChatId,

          message: text

        })

      });

      const data = await res.json();

      const aiMessage = {
        role: "ai",
        text: data.reply || "No response"
      };

      // AI VOICE
      const speech =
        new SpeechSynthesisUtterance(
          data.reply || "No response"
        );

      speech.lang = "en-US";
      speech.rate = 1;

      window.speechSynthesis.speak(speech);

      setMessages([
        ...updatedMessages,
        aiMessage
      ]);

      loadHistory();

    } catch (err) {

      console.log(err);

    }

  };

  // ================= MIC =================

  const startVoice = () => {

    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech Recognition not supported");
      return;
    }

    const recognition =
      new SpeechRecognition();

    recognition.lang = "en-US";

    recognition.interimResults = false;

    recognition.continuous = false;

    setListening(true);

    recognition.start();

    recognition.onresult = (event) => {

      const transcript =
        event.results[0][0].transcript;

      setInput(transcript);

      setTimeout(() => {
        send(transcript);
      }, 300);

    };

    recognition.onend = () => {
      setListening(false);
    };

    recognition.onerror = () => {
      setListening(false);
    };

  };

  // ================= ENTER =================

  const handleKey = (e) => {

    if (e.key === "Enter") {
      send();
    }

  };

  // ================= EFFECT =================

  useEffect(() => {

    if (userId) {
      loadHistory();
    }

  }, [userId]);

  // ================= LOGIN UI =================

  if (!loggedIn) {

    return (

      <div style={styles.loginPage}>

        <div style={styles.loginBox}>

          <h1>MOTI AI</h1>

          <input
            placeholder="Username"
            value={username}
            onChange={(e) =>
              setUsername(e.target.value)
            }
            style={styles.input}
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
            style={styles.input}
          />

          <button
            onClick={login}
            style={styles.button}
          >
            Login
          </button>

        </div>

      </div>

    );

  }

  // ================= MAIN UI =================

  return (

    <div style={styles.container}>

      {/* SIDEBAR */}

      <div style={styles.sidebar}>

        <button
          onClick={newChat}
          style={styles.newChat}
        >
          + New Chat
        </button>

        <button
          onClick={logout}
          style={styles.logout}
        >
          Logout
        </button>

        <div style={styles.history}>

          {history.map((id, index) => (

            <div
              key={index}
              onClick={() => loadChat(id)}
              style={styles.chatItem}
            >
              Chat {index + 1}
            </div>

          ))}

        </div>

      </div>

      {/* MAIN */}

      <div style={styles.main}>

        <div style={styles.messages}>

          {messages.map((msg, index) => (

            <div
              key={index}
              style={{
                ...styles.message,
                alignSelf:
                  msg.role === "user"
                    ? "flex-end"
                    : "flex-start",

                background:
                  msg.role === "user"
                    ? "#2563eb"
                    : "#1e293b"
              }}
            >
              {msg.text}
            </div>

          ))}

        </div>

        {/* BOTTOM */}

        <div style={styles.bottom}>

          <button
            onClick={startVoice}
            style={{
              ...styles.mic,
              background:
                listening
                  ? "#dc2626"
                  : "#2563eb"
            }}
          >
            🎤
          </button>

          <input
            value={input}
            onChange={(e) =>
              setInput(e.target.value)
            }
            onKeyDown={handleKey}
            placeholder="Message MOTI..."
            style={styles.chatInput}
          />

          <button
            onClick={() => send()}
            style={styles.send}
          >
            Send
          </button>

        </div>

      </div>

    </div>

  );

}

// ================= STYLES =================

const styles = {

  container: {
    display: "flex",
    height: "100vh",
    background: "#0f172a",
    color: "white",
    fontFamily: "Arial"
  },

  sidebar: {
    width: "250px",
    background: "#111827",
    padding: "15px",
    display: "flex",
    flexDirection: "column"
  },

  history: {
    marginTop: "20px",
    overflowY: "auto"
  },

  chatItem: {
    padding: "10px",
    background: "#1e293b",
    borderRadius: "10px",
    marginBottom: "10px",
    cursor: "pointer"
  },

  newChat: {
    padding: "12px",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    background: "#2563eb",
    color: "white",
    fontWeight: "bold"
  },

  logout: {
    padding: "12px",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    background: "#dc2626",
    color: "white",
    fontWeight: "bold",
    marginTop: "10px"
  },

  main: {
    flex: 1,
    display: "flex",
    flexDirection: "column"
  },

  messages: {
    flex: 1,
    overflowY: "auto",
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    gap: "10px"
  },

  message: {
    maxWidth: "70%",
    padding: "12px",
    borderRadius: "12px"
  },

  bottom: {
    display: "flex",
    padding: "15px",
    borderTop: "1px solid #1e293b"
  },

  chatInput: {
    flex: 1,
    padding: "14px",
    borderRadius: "10px",
    border: "none",
    outline: "none",
    fontSize: "16px"
  },

  send: {
    marginLeft: "10px",
    padding: "14px 20px",
    border: "none",
    borderRadius: "10px",
    background: "#2563eb",
    color: "white",
    cursor: "pointer"
  },

  mic: {
    width: "50px",
    border: "none",
    borderRadius: "10px",
    color: "white",
    cursor: "pointer",
    marginRight: "10px",
    fontSize: "20px"
  },

  loginPage: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#0f172a"
  },

  loginBox: {
    width: "320px",
    background: "#111827",
    padding: "30px",
    borderRadius: "20px",
    display: "flex",
    flexDirection: "column",
    gap: "15px",
    color: "white"
  },

  input: {
    padding: "14px",
    borderRadius: "10px",
    border: "none",
    outline: "none"
  },

  button: {
    padding: "14px",
    borderRadius: "10px",
    border: "none",
    background: "#2563eb",
    color: "white",
    cursor: "pointer",
    fontWeight: "bold"
  }

};