import { useEffect, useRef, useState } from "react";
import { api } from "../api";
import { ago } from "../data";

const SIZE = 12;

export default function Discover({ saved, onSave }) {
  const [f, setF] = useState({ q: "", type: "", remote: "", source: "", sort: "new" });
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ total: 0, rows: [] });
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [sync, setSync] = useState(null);
  const [tick, setTick] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const lastAt = useRef(null);

  const set = (k, v) => { setF({ ...f, [k]: v }); setPage(1); };

  useEffect(() => {
    const t = setTimeout(() => {
      setLoading(true);
      api.listings({ ...f, page, size: SIZE }).then((d) => { setData(d); setErr(""); }).catch((e) => setErr(e.message)).finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(t);
  }, [f, page, tick]);

  // poll sync status every minute; reload listings when the server fetched fresh data
  useEffect(() => {
    const check = () => api.syncStatus().then((s) => {
      setSync(s);
      if (lastAt.current && lastAt.current !== s.at) setTick((t) => t + 1);
      lastAt.current = s.at;
    }).catch(() => {});
    check();
    const id = setInterval(check, 60000);
    return () => clearInterval(id);
  }, []);

  const refresh = async () => { setSyncing(true); try { setSync(await api.syncNow()); lastAt.current = null; setTick((t) => t + 1); } catch (e) { setErr(e.message); } setSyncing(false); };
  const pages = Math.max(1, Math.ceil(data.total / SIZE));
  const failed = sync ? Object.entries(sync.results).filter(([, r]) => !r.ok) : [];

  return (
    <>
      <header className="head">
        <div>
          <h2>Discover</h2>
          <p className="sub">{data.total} live listings · updated {ago(sync?.at)} · auto-refreshes every 30 minutes</p>
        </div>
        <button className="btn ghost" onClick={refresh} disabled={syncing}>{syncing ? "Fetching..." : "Refresh now"}</button>
      </header>

      {failed.length > 0 && <p className="banner">Could not load from {failed.map(([n, r]) => `${n} (${r.error})`).join(", ")}. Other sources are still shown.</p>}

      <div className="filters">
        <input type="search" placeholder="Search title, company or skill (react, flutter, node)" value={f.q} onChange={(e) => set("q", e.target.value)} aria-label="Search" />
        {[["", "All"], ["Internship", "Internships"], ["Full-time", "Full-time"], ["Contract", "Contract"]].map(([v, l]) => (
          <button key={l} className={`chip ${f.type === v ? "on" : ""}`} onClick={() => set("type", v)}>{l}</button>
        ))}
        <label className="check"><input type="checkbox" checked={f.remote === "1"} onChange={(e) => set("remote", e.target.checked ? "1" : "")} /> Remote only</label>
        <select value={f.source} onChange={(e) => set("source", e.target.value)} aria-label="Source">
          <option value="">All sources</option><option>Remotive</option><option>Arbeitnow</option>
        </select>
        <select value={f.sort} onChange={(e) => set("sort", e.target.value)} aria-label="Sort by">
          <option value="new">Newest</option><option value="company">Company A-Z</option>
        </select>
      </div>

      {err && <p className="banner">{err}</p>}
      {loading && <p className="empty">Loading listings...</p>}
      {!loading && !err && data.rows.length === 0 && <p className="empty">No listings match yet. If this is the first run, wait a few seconds for the first sync, then press Refresh now.</p>}

      <div className="listings">
        {data.rows.map((l) => (
          <article key={l.id} className="listing">
            <div className="l-head">
              {l.logo ? <img src={l.logo} alt="" onError={(e) => (e.currentTarget.style.display = "none")} /> : <span className="avatar">{l.company[0]}</span>}
              <div>
                <h4>{l.title}</h4>
                <p className="meta">{l.company} · {l.location || "Location not listed"}</p>
              </div>
            </div>
            <div className="chips">
              <span className={`tag ${l.type === "Internship" ? "tag-job" : ""}`}>{l.type}</span>
              {l.remote ? <span className="tag">Remote</span> : null}
              <span className="tag">{l.source}</span>
              {l.salary && <span className="tag">{l.salary}</span>}
            </div>
            {l.summary && <p className="summary">{l.summary}</p>}
            <p className="chips">{l.tags.slice(0, 5).map((t) => <small key={t}>#{t}</small>)}</p>
            <div className="l-foot">
              <span className="meta">Posted {ago(l.postedAt)}</span>
              <a href={l.url} target="_blank" rel="noreferrer">View posting</a>
              <button className="btn small" disabled={saved.has(l.url)} onClick={() => onSave(l)}>{saved.has(l.url) ? "Saved" : "Save to tracker"}</button>
            </div>
          </article>
        ))}
      </div>

      {data.total > SIZE && (
        <div className="pager">
          <button className="btn ghost" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
          <span>Page {page} of {pages}</span>
          <button className="btn ghost" disabled={page >= pages} onClick={() => setPage(page + 1)}>Next</button>
        </div>
      )}
    </>
  );
}
