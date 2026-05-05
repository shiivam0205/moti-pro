import React, { useState } from "react";
import axios from "axios";

function App() {
  const [input, setInput] = useState("");
  const [chat, setChat] = useState([]);

  const API = "https://moti-pro07.onrender.com";

  const sendMessage = async () => {
    if (!input.trim()) return;

    const text = input;

    setChat((prev) => [
      ...prev,
      { user: text, bot: "..." }
    ]);

    setInput("");

    try {
      const res = await axios.post(`${API}/chat`, {
        message: text
      });

      const reply = res.data.reply;

      setChat((prev) => {
        const updated = [...prev];
        updated[updated.length - 1].bot = reply;
        return updated;
      });

    } catch (err) {
      setChat((prev) => {
        const updated = [...prev];
        updated[updated.length - 1].bot = "Server error";
        return updated;
      });
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>MOTI Chat</h2>

      <div style={{ border: "1px solid black", height: 300, overflowY: "auto", padding: 10 }}>
        {chat.map((c, i) => (
          <div key={i}>
            <p><b>You:</b> {c.user}</p>
            <p><b>MOTI:</b> {c.bot}</p>
            <hr />
          </div>
        ))}
      </div>

      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Type..."
      />

      <button onClick={sendMessage}>Send</button>
    </div>
  );
}

export default App;