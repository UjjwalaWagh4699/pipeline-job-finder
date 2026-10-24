import { useEffect, useState } from "react";
import { api } from "../api";

function Bars({ title, rows }) {
  const max = Math.max(1, ...rows.map((r) => r.n));
  return (
    <section className="panel">
      <h3>{title}</h3>
      {rows.map((r) => (
        <div className="brow" key={r.label}>
          <span>{r.label}</span>
          <div><i style={{ width: `${(r.n / max) * 100}%` }} /></div>
          <b>{r.n}</b>
        </div>
      ))}
    </section>
  );
}

export default function Insights() {
  const [d, setD] = useState(null);
  const [err, setErr] = useState("");
  useEffect(() => { api.insights().then(setD).catch((e) => setErr(e.message)); }, []);
  if (err) return <p className="banner">{err}</p>;
  if (!d) return <p className="empty">Loading insights...</p>;
  const max = Math.max(1, ...d.perDay.map((r) => r.n));
  return (
    <>
      <header className="head"><div><h2>Insights</h2><p className="sub">What the job market looks like in the live data right now</p></div></header>
      <div className="stats"><div className="stats-head">
        <h3>{d.total} listings</h3>
        <p>{d.internships} internships · {d.remote} remote</p>
      </div></div>
      <section className="panel">
        <h3>New listings per day</h3>
        <div className="cols">
          {d.perDay.map((r) => (
            <div key={r.label} title={`${r.label}: ${r.n}`}><i style={{ height: `${(r.n / max) * 100}%` }} /><small>{r.label.slice(8)}</small></div>
          ))}
        </div>
      </section>
      <div className="grid2">
        <Bars title="Most requested skills" rows={d.topTags} />
        <Bars title="Companies hiring the most" rows={d.topCompanies} />
        <Bars title="Listings by type" rows={d.byType} />
        <Bars title="Listings by source" rows={d.bySource} />
      </div>
    </>
  );
}
