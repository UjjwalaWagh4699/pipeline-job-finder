import { useEffect, useMemo, useState } from "react";
import { api, setToken } from "./api";
import { today } from "./data";
import Login from "./components/Login";
import Home from "./components/Home";
import Discover from "./components/Discover";
import Tracker from "./components/Tracker";
import Insights from "./components/Insights";
import JobForm from "./components/JobForm";

export default function App() {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem("user") || "null"));
  const [screen, setScreen] = useState(null); // null = home page, "login" | "register" = auth form
  const [tab, setTab] = useState("discover");
  const [jobs, setJobs] = useState([]);
  const [editing, setEditing] = useState(null);
  const [dark, setDark] = useState(() => localStorage.getItem("dark") === "1");
  const [toast, setToast] = useState(null);

  const notify = (msg, bad = false) => { setToast({ msg, bad }); setTimeout(() => setToast(null), 2800); };
  const logout = () => { setToken(""); localStorage.removeItem("user"); setUser(null); setJobs([]); setScreen(null); setTab("discover"); };
  const login = ({ token, user }) => { setToken(token); localStorage.setItem("user", JSON.stringify(user)); setUser(user); };

  useEffect(() => { window.addEventListener("logout", logout); return () => window.removeEventListener("logout", logout); }, []);
  useEffect(() => { if (user) api.list().then(setJobs).catch((e) => notify(e.message, true)); }, [user]);
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    localStorage.setItem("dark", dark ? "1" : "0");
  }, [dark]);

  const saved = useMemo(() => new Set(jobs.map((j) => j.link)), [jobs]);

  const save = async (job, msg) => {
    try {
      if (job.id) { const u = await api.update(job); setJobs((js) => js.map((j) => (j.id === u.id ? u : j))); notify("Application updated"); }
      else { const c = await api.create(job); setJobs((js) => [c, ...js]); notify(msg || "Application added"); }
      setEditing(null);
    } catch (e) { notify(e.message, true); }
  };
  const saveListing = (l) => save({
    company: l.company, role: l.title, location: l.location, type: l.type === "Internship" ? "Internship" : "Job", stage: "Saved",
    priority: "Medium", stipend: l.salary, date: today(), followUp: "", link: l.url, notes: `Found on ${l.source}`,
  }, "Saved to your tracker");
  const move = async (id, stage) => {
    const prev = jobs;
    setJobs((js) => js.map((j) => (j.id === id ? { ...j, stage } : j)));
    try { await api.stage(id, stage); } catch { setJobs(prev); notify("Could not move the application", true); }
  };
  const remove = async (id) => {
    if (!window.confirm("Delete this application?")) return;
    try { await api.remove(id); setJobs((js) => js.filter((j) => j.id !== id)); notify("Application deleted"); }
    catch (e) { notify(e.message, true); }
  };

  if (!user) {
    return screen
      ? <Login key={screen} initialMode={screen} onLogin={login} onBack={() => setScreen(null)} />
      : <Home dark={dark} onToggleDark={() => setDark(!dark)} onLogin={() => setScreen("login")} onRegister={() => setScreen("register")} />;
  }

  return (
    <div className="shell">
      <aside className="side">
        <div>
          <h1>Pipeline</h1>
          <p className="tagline">Live jobs and your tracker</p>
        </div>
        <nav>
          {[["discover", "Discover"], ["tracker", `My applications (${jobs.length})`], ["insights", "Insights"]].map(([k, l]) => (
            <button key={k} className={tab === k ? "on" : ""} onClick={() => setTab(k)}>{l}</button>
          ))}
        </nav>
        <div className="side-foot">
          <p className="tagline">Signed in as {user.name}</p>
          <button onClick={() => setDark(!dark)}>{dark ? "Light mode" : "Dark mode"}</button>
          <button onClick={logout}>Log out</button>
        </div>
      </aside>

      <div className="content">
        {tab === "discover" && <Discover saved={saved} onSave={saveListing} />}
        {tab === "tracker" && <Tracker jobs={jobs} onAdd={() => setEditing({})} onEdit={setEditing} onDelete={remove} onMove={move} />}
        {tab === "insights" && <Insights />}
      </div>

      {editing && <JobForm job={editing} onSave={save} onClose={() => setEditing(null)} />}
      {toast && <div className={`toast ${toast.bad ? "bad" : ""}`} role="status">{toast.msg}</div>}
    </div>
  );
}
