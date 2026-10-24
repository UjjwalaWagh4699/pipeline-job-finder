import { STAGES, fmt, isOverdue } from "../data";

export default function JobCard({ job, onMove, onEdit, onDelete }) {
  return (
    <article className={`card pri-${job.priority}`} draggable onDragStart={(e) => e.dataTransfer.setData("id", String(job.id))}>
      <div className="card-top">
        <h4>{job.company}</h4>
        <span className={`tag ${job.type === "Job" ? "tag-job" : ""}`}>{job.type}</span>
      </div>
      <p className="role">{job.role}</p>
      <p className="meta">{job.location || "Location not set"} · Applied {fmt(job.date)}{job.stipend && ` · ${job.stipend}`}</p>
      {job.followUp && <p className={`meta ${isOverdue(job) ? "due" : ""}`}>Follow up by {fmt(job.followUp)}{isOverdue(job) && " (overdue)"}</p>}
      {job.notes && <p className="notes">{job.notes}</p>}
      <div className="card-actions">
        <select value={job.stage} onChange={(e) => onMove(job.id, e.target.value)} aria-label="Move to stage">
          {STAGES.map((s) => <option key={s.key}>{s.key}</option>)}
        </select>
        {job.link && <a href={job.link} target="_blank" rel="noreferrer">Posting</a>}
        <button className="link" onClick={() => onEdit(job)}>Edit</button>
        <button className="link danger" onClick={() => onDelete(job.id)}>Delete</button>
      </div>
    </article>
  );
}
