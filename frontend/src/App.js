import React, { useState } from "react";
import axios from "axios";

function App() {
  const [input, setInput] = useState("");
  const [chat, setChat] = useState([]);

  const API = "https://moti-pro07.onrender.com";

  const sendMessage = async () => {
    if (!input) return;

    const userText = input;

    // show user instantly
    setChat([...chat, { user: userText, bot: "..." }]);

    setInput("");

    try {
      const res = await axios.post(`${API}/chat`, {
        message: userText
      });

      const reply = res.data.reply;

      // update last message
      setChat((prev) => {
        const updated = [...prev];
        updated[updated.length - 1].bot = reply;
        return updated;
      });

    } catch (err) {
      setChat((prev) => {
        const updated = [...prev];
        updated[updated.length - 1].bot = "Error connecting";
        return updated;
      });
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>MOTI AI</h2>

      <div style={{ minHeight: 300, border: "1px solid black", padding: 10 }}>
        {chat.map((c, i) => (
          <div key={i}>
            <p><b>You:</b> {c.user}</p>
            <p><b>Bot:</b> {c.bot}</p>
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