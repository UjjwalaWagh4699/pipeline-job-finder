import { useState } from "react";
import { STAGES, TYPES, PRIORITIES, today } from "../data";

const blank = () => ({ company: "", role: "", location: "", type: "Internship", stage: "Applied", priority: "Medium", stipend: "", date: today(), followUp: "", link: "", notes: "" });

export default function JobForm({ job, onSave, onClose }) {
  const [f, setF] = useState(job.id ? job : blank());
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const submit = async (e) => { e.preventDefault(); setBusy(true); await onSave(f); setBusy(false); };
  const pick = (k, list) => <select value={f[k]} onChange={set(k)}>{list.map((x) => <option key={x}>{x}</option>)}</select>;
  return (
    <div className="overlay" onClick={onClose}>
      <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <h3>{f.id ? "Edit application" : "Add application"}</h3>
        <div className="row">
          <label>Company<input required value={f.company} onChange={set("company")} autoFocus /></label>
          <label>Role<input required value={f.role} onChange={set("role")} /></label>
        </div>
        <div className="row">
          <label>Location<input value={f.location} onChange={set("location")} /></label>
          <label>Stipend / salary<input value={f.stipend} onChange={set("stipend")} placeholder="e.g. 8000/month" /></label>
        </div>
        <div className="row3">
          <label>Type{pick("type", TYPES)}</label>
          <label>Stage{pick("stage", STAGES.map((s) => s.key))}</label>
          <label>Priority{pick("priority", PRIORITIES)}</label>
        </div>
        <div className="row">
          <label>Applied on<input type="date" value={f.date} onChange={set("date")} /></label>
          <label>Follow up by<input type="date" value={f.followUp} onChange={set("followUp")} /></label>
        </div>
        <label>Posting link<input type="url" placeholder="https://" value={f.link} onChange={set("link")} /></label>
        <label>Notes<textarea rows="3" value={f.notes} onChange={set("notes")} /></label>
        <div className="form-actions">
          <button type="button" className="btn ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn" disabled={busy}>{busy ? "Saving..." : "Save application"}</button>
        </div>
      </form>
    </div>
  );
}
