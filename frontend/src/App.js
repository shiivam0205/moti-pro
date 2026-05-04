import React, { useState } from "react";
import axios from "axios";

function App() {
  const [input, setInput] = useState("");
  const [chat, setChat] = useState([]);

  // IMPORTANT: no trailing slash
  const API = "https://moti-pro07.onrender.com";

  const sendMessage = async () => {
    if (!input.trim()) return;

    try {
      // add user message first
      const userMessage = input;

      setChat((prev) => [
        ...prev,
        { user: userMessage, bot: "..." }
      ]);

      setInput("");

      // API call
      const res = await axios.post(`${API}/chat`, {
        message: userMessage
      });

      console.log("Backend response:", res.data);

      const botReply = res.data.reply || "No response";

      // update last bot message
      setChat((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          user: userMessage,
          bot: botReply
        };
        return updated;
      });

    } catch (error) {
      console.log("Error:", error);

      setChat((prev) => [
        ...prev,
        { user: input, bot: "Error connecting to server" }
      ]);
    }
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      <h2>MOTI AI Chat</h2>

      {/* CHAT BOX */}
      <div
        style={{
          border: "1px solid #ccc",
          height: "400px",
          overflowY: "auto",
          padding: "10px",
          marginBottom: "10px"
        }}
      >
        {chat.map((c, i) => (
          <div key={i} style={{ marginBottom: "10px" }}>
            <p><b>You:</b> {c.user}</p>
            <p><b>MOTI:</b> {c.bot}</p>
            <hr />
          </div>
        ))}
      </div>

      {/* INPUT */}
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Type message..."
        style={{ width: "70%", padding: "10px" }}
      />

      <button onClick={sendMessage} style={{ padding: "10px" }}>
        Send
      </button>
    </div>
  );
}

export default App;