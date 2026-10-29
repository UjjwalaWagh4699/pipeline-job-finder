import { useState } from "react";
import { api } from "../api";

export default function Login({ onLogin, initialMode = "login", onBack }) {
  const [mode, setMode] = useState(initialMode);
  const [f, setF] = useState({ name: "", email: "", password: "" });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setErr("");
    try { onLogin(await (mode === "login" ? api.login(f) : api.register(f))); }
    catch (x) { setErr(x.message); setBusy(false); }
  };
  return (
    <div className="auth">
      <form className="auth-box" onSubmit={submit}>
        {onBack && <button type="button" className="link auth-back" onClick={onBack}>&larr; Back to home</button>}
        <h1>Pipeline</h1>
        <p>Live internship and job listings, plus a tracker for your own applications.</p>
        {mode === "register" && <label>Name<input required value={f.name} onChange={set("name")} /></label>}
        <label>Email<input type="email" required value={f.email} onChange={set("email")} /></label>
        <label>Password<input type="password" required minLength={6} value={f.password} onChange={set("password")} /></label>
        {err && <p className="banner">{err}</p>}
        <button className="btn" disabled={busy}>{mode === "login" ? "Log in" : "Create account"}</button>
        <button type="button" className="link" onClick={() => { setMode(mode === "login" ? "register" : "login"); setErr(""); }}>
          {mode === "login" ? "New here? Create an account" : "Already have an account? Log in"}
        </button>
      </form>
    </div>
  );
}
