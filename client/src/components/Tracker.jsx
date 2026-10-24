import { useMemo, useState } from "react";
import { STAGES } from "../data";
import StatsBar from "./StatsBar";
import JobCard from "./JobCard";
import JobTable from "./JobTable";

const PRI = { High: 0, Medium: 1, Low: 2 };
const SORTS = {
  Newest: (a, b) => b.id - a.id,
  Oldest: (a, b) => a.id - b.id,
  "Company A-Z": (a, b) => a.company.localeCompare(b.company),
  Priority: (a, b) => PRI[a.priority] - PRI[b.priority],
};

export default function Tracker({ jobs, onAdd, onEdit, onDelete, onMove }) {
  const [view, setView] = useState("board");
  const [q, setQ] = useState("");
  const [type, setType] = useState("All");
  const [sort, setSort] = useState("Newest");
  const [over, setOver] = useState(null);

  const shown = useMemo(
    () => jobs.filter((j) => (type === "All" || j.type === type) && `${j.company} ${j.role} ${j.location}`.toLowerCase().includes(q.toLowerCase())).sort(SORTS[sort]),
    [jobs, q, type, sort]
  );

  const exportCsv = () => {
    const cols = ["company", "role", "location", "type", "stage", "priority", "stipend", "date", "followUp", "link", "notes"];
    const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const csv = [cols.join(","), ...jobs.map((j) => cols.map((c) => esc(j[c])).join(","))].join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "applications.csv";
    a.click();
  };

  return (
    <>
      <header className="head">
        <h2>My applications</h2>
        <div className="head-actions">
          <button className="btn ghost" onClick={() => setView(view === "board" ? "table" : "board")}>{view === "board" ? "Table view" : "Board view"}</button>
          <button className="btn ghost" onClick={exportCsv}>Export CSV</button>
          <button className="btn" onClick={onAdd}>Add application</button>
        </div>
      </header>

      <StatsBar jobs={jobs} />

      <div className="filters">
        <input type="search" placeholder="Search company, role or city" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search" />
        {["All", "Internship", "Job"].map((t) => <button key={t} className={`chip ${type === t ? "on" : ""}`} onClick={() => setType(t)}>{t}</button>)}
        <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort by">
          {Object.keys(SORTS).map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>

      {view === "board" ? (
        <main className="board">
          {STAGES.map((s) => {
            const list = shown.filter((j) => j.stage === s.key);
            return (
              <section key={s.key} className={`col ${over === s.key ? "over" : ""}`} style={{ "--stage": s.color }}
                onDragOver={(e) => { e.preventDefault(); setOver(s.key); }} onDragLeave={() => setOver(null)}
                onDrop={(e) => { e.preventDefault(); onMove(Number(e.dataTransfer.getData("id")), s.key); setOver(null); }}>
                <h3>{s.key} <span>{list.length}</span></h3>
                {list.map((j) => <JobCard key={j.id} job={j} onMove={onMove} onEdit={onEdit} onDelete={onDelete} />)}
                {list.length === 0 && <p className="empty">Nothing here yet.</p>}
              </section>
            );
          })}
        </main>
      ) : (
        <JobTable jobs={shown} onMove={onMove} onEdit={onEdit} onDelete={onDelete} />
      )}
    </>
  );
}
