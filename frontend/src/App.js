import React, { useState, useEffect, useRef } from "react";

export default function App() {

  const API = "https://moti-pro07.onrender.com";

  const [userId, setUserId] = useState(localStorage.getItem("uid"));
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [chatId, setChatId] = useState(Date.now().toString());
  const [history, setHistory] = useState([]);
  const [messages, setMessages] = useState([]);

  const [input, setInput] = useState("");
  const [listening, setListening] = useState(false);

  const chatRef = useRef(null);

  // ================= PERSIST LOGIN =================
  useEffect(() => {
    if (userId) localStorage.setItem("uid", userId);
  }, [userId]);

  // ================= AUTO SCROLL =================
  useEffect(() => {
    chatRef.current?.scrollTo(0, chatRef.current.scrollHeight);
  }, [messages]);

  // ================= LOGIN =================
  const login = async () => {

    const res = await fetch(`${API}/login`, {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();

    if (data.user_id) {
      setUserId(data.user_id);
      loadChats(data.user_id);
    }
  };

  // ================= LOAD CHATS =================
  const loadChats = async (uid = userId) => {

    const res = await fetch(`${API}/history/${uid}`);
    const data = await res.json();

    setHistory(data.chats);
  };

  // ================= OPEN CHAT =================
  const openChat = async (id) => {

    setChatId(id);

    const res = await fetch(`${API}/load/${userId}/${id}`);
    const data = await res.json();

    setMessages(
      data.messages.map(m => ({
        role: m[0],
        text: m[1]
      }))
    );
  };

  // ================= NEW CHAT =================
  const newChat = () => {
    setChatId(Date.now().toString());
    setMessages([]);
  };

  // ================= LOGOUT =================
  const logout = () => {
    localStorage.removeItem("uid");
    setUserId(null);
  };

  // ================= VOICE OUTPUT FIX =================
  const speak = (text) => {

    window.speechSynthesis.cancel();

    const s = new SpeechSynthesisUtterance(text);
    s.rate = 1;
    s.pitch = 1;

    window.speechSynthesis.speak(s);
  };

  // ================= MIC AUTO SEND =================
  const startMic = () => {

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    const recog = new SpeechRecognition();

    recog.lang = "auto";
    recog.continuous = false;
    recog.interimResults = false;

    recog.onstart = () => setListening(true);
    recog.onend = () => setListening(false);

    recog.onresult = (e) => {

      const text = e.results[0][0].transcript;

      setInput(text);

      setTimeout(() => send(text), 250);
    };

    recog.start();
  };

  // ================= SEND MESSAGE =================
  const send = async (textOverride) => {

    const text = textOverride || input;
    if (!text) return;

    const updated = [...messages, { role: "user", text }];
    setMessages(updated);

    setInput("");

    const res = await fetch(`${API}/chat`, {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({
        user_id: userId,
        chat_id: chatId,
        message: text
      })
    });

    const data = await res.json();

    const final = [...updated, { role: "ai", text: data.reply }];

    setMessages(final);

    speak(data.reply);
  };

  // ================= LOGIN UI =================
  if (!userId) {
    return (
      <div style={styles.loginWrap}>

        <div style={styles.loginCard}>
          <h2 style={{color:"#fff"}}>MOTI AI</h2>

          <input
            style={styles.inputSmall}
            placeholder="username"
            onChange={(e)=>setUsername(e.target.value)}
          />

          <input
            style={styles.inputSmall}
            type="password"
            placeholder="password"
            onChange={(e)=>setPassword(e.target.value)}
          />

          <button style={styles.primaryBtn} onClick={login}>
            Continue
          </button>

        </div>

      </div>
    );
  }

  // ================= CHAT UI =================
  return (
    <div style={styles.app}>

      {/* SIDEBAR */}
      <div style={styles.sidebar}>

        <button style={styles.newChatBtn} onClick={newChat}>
          + New chat
        </button>

        <div style={styles.history}>
          {history.map((h,i)=>(
            <div
              key={i}
              style={styles.chatItem}
              onClick={()=>openChat(h)}
            >
              Chat {i+1}
            </div>
          ))}
        </div>

        <button style={styles.logoutBtn} onClick={logout}>
          Logout
        </button>

      </div>

      {/* MAIN */}
      <div style={styles.main}>

        {/* TOP BAR */}
        <div style={styles.topBar}>
          MOTI ChatGPT 2026
        </div>

        {/* CHAT AREA */}
        <div style={styles.chat} ref={chatRef}>
          {messages.map((m,i)=>(
            <div
              key={i}
              style={{
                ...styles.msg,
                alignSelf: m.role==="user"?"flex-end":"flex-start",
                background: m.role==="user" ? "#4a90e2" : "#1f1f1f"
              }}
            >
              {m.text}
            </div>
          ))}
        </div>

        {/* INPUT */}
        <div style={styles.bottom}>

          <input
            style={styles.input}
            value={input}
            onChange={(e)=>setInput(e.target.value)}
            placeholder="Message MOTI..."
          />

          <button style={styles.sendBtn} onClick={()=>send()}>
            Send
          </button>

          <button
            style={styles.micBtn}
            onClick={startMic}
          >
            🎤
          </button>

        </div>

      </div>
    </div>
  );
}

// ================= MODERN CHATGPT 2026 UI =================
const styles = {

  app: {
    display: "flex",
    height: "100vh",
    background: "#0a0a0a",
    color: "#fff",
    fontFamily: "sans-serif"
  },

  sidebar: {
    width: 260,
    background: "#111",
    display: "flex",
    flexDirection: "column",
    padding: 10
  },

  main: {
    flex: 1,
    display: "flex",
    flexDirection: "column"
  },

  topBar: {
    padding: 12,
    textAlign: "center",
    background: "#111",
    fontWeight: "bold"
  },

  chat: {
    flex: 1,
    padding: 15,
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: 10
  },

  msg: {
    padding: 12,
    borderRadius: 12,
    maxWidth: "70%"
  },

  bottom: {
    display: "flex",
    padding: 10,
    gap: 8,
    background: "#111"
  },

  input: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    border: "none",
    outline: "none"
  },

  sendBtn: {
    padding: "10px 14px",
    background: "#4a90e2",
    border: "none",
    color: "white",
    borderRadius: 10
  },

  micBtn: {
    padding: "10px 14px",
    background: "#333",
    border: "none",
    borderRadius: 10,
    color: "white"
  },

  newChatBtn: {
    padding: 10,
    background: "#4a90e2",
    border: "none",
    color: "white",
    borderRadius: 10,
    marginBottom: 10
  },

  history: {
    flex: 1,
    overflowY: "auto"
  },

  chatItem: {
    padding: 10,
    background: "#222",
    marginBottom: 5,
    borderRadius: 8,
    cursor: "pointer"
  },

  logoutBtn: {
    padding: 10,
    background: "red",
    border: "none",
    color: "white",
    borderRadius: 10
  },

  loginWrap: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#0a0a0a"
  },

  loginCard: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
    padding: 20,
    background: "#111",
    borderRadius: 12,
    width: 260
  },

  inputSmall: {
    padding: 10,
    borderRadius: 8,
    border: "none"
  },

  primaryBtn: {
    padding: 10,
    background: "#4a90e2",
    border: "none",
    color: "white",
    borderRadius: 8
  }
};