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

  const chatRef = useRef(null);

  // ================= PERSIST LOGIN =================
  useEffect(() => {
    if (userId) {
      localStorage.setItem("uid", userId);
      loadHistory();
    }
  }, [userId]);

  // ================= AUTO SCROLL =================
  useEffect(() => {
    chatRef.current?.scrollTo(0, chatRef.current.scrollHeight);
  }, [messages]);

  // ================= LOAD HISTORY (ChatGPT style) =================
  const loadHistory = async () => {

    const res = await fetch(`${API}/history/${userId}`);
    const data = await res.json();

    setHistory(data.chats);

    if (data.chats.length > 0) {
      openChat(data.chats[0]); // last active chat
    }
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

  // ================= NEW CHAT (DOES NOT DELETE OLD) =================
  const newChat = () => {

    const id = Date.now().toString();

    setChatId(id);
    setMessages([]);

    // reload sidebar history
    loadHistory();
  };

  // ================= LOGOUT =================
  const logout = () => {
    localStorage.removeItem("uid");
    setUserId(null);
  };

  // ================= VOICE (FIXED PRONUNCIATION) =================
  const speak = (text) => {

    window.speechSynthesis.cancel();

    const speech = new SpeechSynthesisUtterance(text);

    speech.rate = 1;
    speech.pitch = 1;
    speech.volume = 1;

    // better pronunciation stability
    speech.lang = "en-US";

    window.speechSynthesis.speak(speech);
  };

  // ================= TYPEWRITER ANIMATION =================
  const typeWriter = (text, callback) => {

    let i = 0;
    let current = "";

    const interval = setInterval(() => {

      current += text[i];
      i++;

      callback(current);

      if (i >= text.length) clearInterval(interval);

    }, 18);
  };

  // ================= SEND MESSAGE =================
  const send = async (customText) => {

    const text = customText || input;
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

    // placeholder AI message
    const placeholder = [...updated, { role: "ai", text: "" }];
    setMessages(placeholder);

    // animation reply
    typeWriter(data.reply, (val) => {

      setMessages(prev => {
        const copy = [...prev];
        copy[copy.length - 1] = { role: "ai", text: val };
        return copy;
      });

    });

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

    if (data.user_id) {
      setUserId(data.user_id);
    }
  };

  // ================= LOGIN UI =================
  if (!userId) {
    return (
      <div style={styles.loginWrap}>

        <div style={styles.loginCard}>
          <h2 style={styles.title}>✨ MOTI AI ✨</h2>

          <input style={styles.inputSmall} placeholder="username"
            onChange={(e)=>setUsername(e.target.value)} />

          <input style={styles.inputSmall} type="password"
            placeholder="password"
            onChange={(e)=>setPassword(e.target.value)} />

          <button style={styles.btn} onClick={login}>
            Enter AI World
          </button>

        </div>

      </div>
    );
  }

  // ================= MAIN UI =================
  return (
    <div style={styles.app}>

      {/* SIDEBAR */}
      <div style={styles.sidebar}>

        <button style={styles.newChat} onClick={newChat}>
          + New Chat
        </button>

        <div style={styles.history}>
          {history.map((h,i)=>(
            <div
              key={i}
              style={styles.chatItem}
              onClick={()=>openChat(h)}
            >
              💬 Chat {i+1}
            </div>
          ))}
        </div>

        <button style={styles.logout} onClick={logout}>
          Logout
        </button>

      </div>

      {/* CHAT AREA */}
      <div style={styles.main}>

        <div style={styles.header}>
          💖 MOTI AI GIRL CHAT
        </div>

        <div style={styles.chat} ref={chatRef}>
          {messages.map((m,i)=>(
            <div
              key={i}
              style={{
                ...styles.msg,
                alignSelf: m.role==="user"?"flex-end":"flex-start",
                background: m.role==="user"
                  ? "linear-gradient(135deg,#6a11cb,#2575fc)"
                  : "rgba(255,255,255,0.08)"
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
            onKeyDown={(e)=> e.key==="Enter" && send()}
            placeholder="Say something..."
          />

          <button style={styles.send} onClick={()=>send()}>
            ✨
          </button>

        </div>

      </div>

    </div>
  );
}

// ================= CUTE UI DESIGN =================
const styles = {

  app: {
    display: "flex",
    height: "100vh",
    background: "linear-gradient(135deg,#0f0c29,#302b63,#24243e)",
    color: "#fff",
    fontFamily: "sans-serif"
  },

  sidebar: {
    width: 260,
    background: "rgba(0,0,0,0.3)",
    backdropFilter: "blur(10px)",
    padding: 10,
    display: "flex",
    flexDirection: "column"
  },

  main: {
    flex: 1,
    display: "flex",
    flexDirection: "column"
  },

  header: {
    padding: 12,
    textAlign: "center",
    fontSize: 18,
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
    borderRadius: 15,
    maxWidth: "70%",
    color: "white",
    backdropFilter: "blur(10px)"
  },

  bottom: {
    display: "flex",
    padding: 10,
    gap: 8
  },

  input: {
    flex: 1,
    padding: 12,
    borderRadius: 20,
    border: "none",
    outline: "none"
  },

  send: {
    padding: "10px 14px",
    borderRadius: 20,
    border: "none",
    background: "#ff4ecd",
    color: "white"
  },

  newChat: {
    padding: 10,
    background: "#ff4ecd",
    border: "none",
    borderRadius: 10,
    marginBottom: 10
  },

  history: {
    flex: 1,
    overflowY: "auto"
  },

  chatItem: {
    padding: 10,
    background: "rgba(255,255,255,0.1)",
    marginBottom: 5,
    borderRadius: 10,
    cursor: "pointer"
  },

  logout: {
    padding: 10,
    background: "red",
    border: "none",
    borderRadius: 10,
    color: "white"
  },

  loginWrap: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "linear-gradient(135deg,#0f0c29,#302b63,#24243e)"
  },

  loginCard: {
    width: 260,
    padding: 20,
    borderRadius: 15,
    background: "rgba(255,255,255,0.1)",
    backdropFilter: "blur(10px)",
    display: "flex",
    flexDirection: "column",
    gap: 10
  },

  inputSmall: {
    padding: 10,
    borderRadius: 10,
    border: "none"
  },

  btn: {
    padding: 10,
    borderRadius: 10,
    border: "none",
    background: "#ff4ecd",
    color: "white"
  },

  title: {
    textAlign: "center"
  }
};