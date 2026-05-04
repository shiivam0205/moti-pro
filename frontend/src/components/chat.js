import React, { useState, useEffect } from "react";
import { chat, history } from "../api";

export default function Chat({ user }) {
  const [msg, setMsg] = useState("");
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    const res = await history(user.user_id);
    setMessages(res.data);
  };

  const send = async () => {
    const res = await chat(user.user_id, { message: msg });
    setMessages([...messages, { message: msg, response: res.data.response }]);
    setMsg("");
  };

  return (
    <div className="chat-container">
      <h3>MOTI AI</h3>

      <div className="chat-box">
        {messages.map((m, i) => (
          <div key={i}>
            <p><b>You:</b> {m.message}</p>
            <p><b>MOTI:</b> {m.response}</p>
          </div>
        ))}
      </div>

      <input value={msg} onChange={(e)=>setMsg(e.target.value)} />
      <button onClick={send}>Send</button>
    </div>
  );
}