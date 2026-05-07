import React, { useState } from "react";

export default function App() {
  const [user, setUser] = useState(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);

  // LOGIN
  const login = async () => {
    const res = await fetch("https://moti-pro07.onrender.com/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();

    if (data.user_id) {
      setUser(data.user_id);
    }
  };

  // SEND MESSAGE
  const sendMessage = async () => {
    if (!message) return;

    const newChat = [...chat, { role: "user", text: message }];
    setChat(newChat);

    const res = await fetch("https://moti-pro07.onrender.com/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: user,
        message: message
      })
    });

    const data = await res.json();

    setChat([
      ...newChat,
      { role: "ai", text: data.reply }
    ]);

    setMessage("");
  };

  // LOGIN SCREEN
  if (!user) {
    return (
      <div style={{ padding: 40 }}>
        <h1>MOTI AI Login</h1>

        <input
          placeholder="username"
          onChange={(e) => setUsername(e.target.value)}
        />

        <br />

        <input
          type="password"
          placeholder="password"
          onChange={(e) => setPassword(e.target.value)}
        />

        <br />

        <button onClick={login}>Login</button>
      </div>
    );
  }

  // CHAT UI
  return (
    <div style={{ padding: 20 }}>
      <h2>MOTI Chat AI</h2>

      <div style={{ height: 400, overflowY: "scroll", border: "1px solid gray" }}>
        {chat.map((c, i) => (
          <div key={i}>
            <b>{c.role === "user" ? "You" : "MOTI"}:</b> {c.text}
          </div>
        ))}
      </div>

      <input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Ask something..."
      />

      <button onClick={sendMessage}>Send</button>
    </div>
  );
}