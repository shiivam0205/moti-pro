import React, { useState } from "react";
import { login } from "../api";

export default function Login({ setUser, setPage }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    const res = await login({ email, password });
    setUser(res.data);
  };

  return (
    <div className="auth">
      <h2>Login</h2>
      <input placeholder="Email" onChange={(e)=>setEmail(e.target.value)} />
      <input type="password" placeholder="Password" onChange={(e)=>setPassword(e.target.value)} />
      <button onClick={handleLogin}>Login</button>
      <p onClick={()=>setPage("signup")}>Create account</p>
    </div>
  );
}