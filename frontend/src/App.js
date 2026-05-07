import React, { useState, useEffect, useRef } from "react";

export default function App() {

  const API = "https://moti-pro07.onrender.com";

  const [userId, setUserId] = useState(localStorage.getItem("uid"));
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [chatId, setChatId] = useState(null);
  const [history, setHistory] = useState([]);

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  const recognitionRef = useRef(null);

  // ================= LOGIN PERSIST =================
  useEffect(() => {
    if (userId) {
      localStorage.setItem("uid", userId);
      loadChats();
    }
  }, [userId]);

  // ================= LOAD CHAT HISTORY =================
  const loadChats = async () => {

    const res = await fetch(`${API}/history/${userId}`);
    const data = await res.json();

    setHistory(data.chats);

    if (data.chats.length > 0) {
      openChat(data.chats[0]);
    }
  };

  // ================= OPEN CHAT =================
  const openChat = async (id) => {

    setChatId(id);

    const res = await fetch(`${API}/load/${userId}/${id}`);
    const data = await res.json();

    setMessages(data.messages.map(m => ({
      role: m[0],
      text: m[1]
    })));
  };

  // ================= NEW CHAT =================
  const newChat = () => {
    const id = Date.now().toString();
    setChatId(id);
    setMessages([]);
  };

  // ================= LOGOUT =================
  const logout = () => {
    localStorage.removeItem("uid");
    setUserId(null);
  };

  // ================= VOICE FIX =================
  const speak = (text) => {

    window.speechSynthesis.cancel();

    const s = new SpeechSynthesisUtterance(text);
    s.rate = 1;
    window.speechSynthesis.speak(s);
  };

  // ================= MIC AUTO SEND =================
  const startMic = () => {

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    const recog = new SpeechRecognition();

    recog.lang = "auto";
    recog.continuous = true;

    recog.onresult = (e) => {

      const text = e.results[e.results.length - 1][0].transcript;

      setInput(text);

      setTimeout(() => send(text), 300); // AUTO SEND FIX
    };

    recog.start();
    recognitionRef.current = recog;
  };

  // ================= SEND =================
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

  // ================= LOGIN =================
  const login = async () => {

    const res = await fetch(`${API}/login`, {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();

    if (data.user_id) setUserId(data.user_id);
  };

  // ================= LOGIN UI =================
  if (!userId) {
    return (
      <div style={styles.login}>
        <h2>MOTI AI</h2>

        <input style={styles.small} placeholder="username"
          onChange={(e)=>setUsername(e.target.value)} />

        <input style={styles.small} type="password"
          placeholder="password"
          onChange={(e)=>setPassword(e.target.value)} />

        <button style={styles.btn} onClick={login}>
          Login
        </button>
      </div>
    );
  }

  // ================= CHAT UI =================
  return (
    <div style={styles.app}>

      {/* SIDEBAR */}
      <div style={styles.sidebar}>

        <button onClick={newChat} style={styles.sideBtn}>
          + New Chat
        </button>

        {history.map((h,i)=>(
          <div key={i}
            style={styles.chatItem}
            onClick={()=>openChat(h)}
          >
            Chat {i+1}
          </div>
        ))}

        <button onClick={logout} style={styles.logout}>
          Logout
        </button>

      </div>

      {/* MAIN */}
      <div style={styles.main}>

        <div style={styles.header}>MOTI AI CHATGPT</div>

        <div style={styles.chat}>
          {messages.map((m,i)=>(
            <div key={i}
              style={{
                ...styles.msg,
                alignSelf: m.role==="user"?"flex-end":"flex-start"
              }}
            >
              {m.text}
            </div>
          ))}
        </div>

        <div style={styles.bottom}>
          <input style={styles.input}
            value={input}
            onChange={(e)=>setInput(e.target.value)}
          />

          <button style={styles.btn} onClick={()=>send()}>
            Send
          </button>

          <button style={styles.btn} onClick={startMic}>
            🎤
          </button>
        </div>

      </div>

    </div>
  );
}

// ================= STYLES =================
const styles = {

  app: {
    display: "flex",
    height: "100vh",
    background: "#0b0b0b",
    color: "white"
  },

  sidebar: {
    width: 200,
    background: "#111",
    padding: 10,
    display: "flex",
    flexDirection: "column",
    gap: 8
  },

  main: {
    flex: 1,
    display: "flex",
    flexDirection: "column"
  },

  header: {
    padding: 10,
    textAlign: "center",
    background: "#111"
  },

  chat: {
    flex: 1,
    overflowY: "auto",
    padding: 10,
    display: "flex",
    flexDirection: "column",
    gap: 8
  },

  msg: {
    padding: 10,
    borderRadius: 10,
    maxWidth: "70%",
    background: "#222"
  },

  bottom: {
    display: "flex",
    padding: 10,
    gap: 5
  },

  input: {
    flex: 1,
    padding: 10
  },

  btn: {
    padding: 10,
    background: "#4a90e2",
    color: "white"
  },

  sideBtn: {
    padding: 8,
    background: "#4a90e2",
    color: "white"
  },

  chatItem: {
    padding: 8,
    background: "#222",
    cursor: "pointer"
  },

  logout: {
    marginTop: "auto",
    padding: 8,
    background: "red",
    color: "white"
  },

  login: {
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    background: "#0b0b0b",
    color: "white"
  },

  small: {
    padding: 8,
    width: 180
  }
};