import { STAGES, fmt, isOverdue } from "../data";

export default function JobTable({ jobs, onMove, onEdit, onDelete }) {
  if (jobs.length === 0) return <p className="empty">No applications match your filters.</p>;
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr><th>Company</th><th>Role</th><th>Type</th><th>Stage</th><th>Priority</th><th>Applied</th><th>Follow-up</th><th></th></tr>
        </thead>
        <tbody>
          {jobs.map((j) => (
            <tr key={j.id}>
              <td><b>{j.company}</b><small>{j.location}</small></td>
              <td>{j.role}</td>
              <td>{j.type}</td>
              <td>
                <select value={j.stage} onChange={(e) => onMove(j.id, e.target.value)} aria-label="Stage">
                  {STAGES.map((s) => <option key={s.key}>{s.key}</option>)}
                </select>
              </td>
              <td><span className={`dot pri-${j.priority}`} />{j.priority}</td>
              <td>{fmt(j.date)}</td>
              <td className={isOverdue(j) ? "due" : ""}>{fmt(j.followUp)}</td>
              <td className="row-actions">
                <button className="link" onClick={() => onEdit(j)}>Edit</button>
                <button className="link danger" onClick={() => onDelete(j.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
