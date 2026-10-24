import { STAGES, isOverdue } from "../data";

export default function StatsBar({ jobs }) {
  const total = jobs.length;
  const count = (k) => jobs.filter((j) => j.stage === k).length;
  const rate = total ? Math.round(((count("Interview") + count("Offer")) / total) * 100) : 0;
  const due = jobs.filter(isOverdue).length;
  return (
    <section className="stats" aria-label="Pipeline summary">
      <div className="stats-head">
        <h3>{total} applications</h3>
        <p>{rate}% reached interview or offer{due > 0 && <b className="due"> · {due} follow-up{due > 1 ? "s" : ""} overdue</b>}</p>
      </div>
      <div className="bar" role="img" aria-label="Applications by stage">
        {STAGES.map((s) => <span key={s.key} style={{ flexGrow: count(s.key), background: s.color }} title={`${s.key}: ${count(s.key)}`} />)}
        {total === 0 && <span style={{ flexGrow: 1, background: "var(--line)" }} />}
      </div>
      <ul className="legend">
        {STAGES.map((s) => <li key={s.key}><i style={{ background: s.color }} />{s.key} {count(s.key)}</li>)}
      </ul>
    </section>
  );
}
