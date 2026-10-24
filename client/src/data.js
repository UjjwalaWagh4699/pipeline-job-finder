export const STAGES = [
  { key: "Saved", color: "#7A8699" },
  { key: "Applied", color: "#3B6FB6" },
  { key: "Interview", color: "#D9980B" },
  { key: "Offer", color: "#1F8A5B" },
  { key: "Rejected", color: "#C4503A" },
];
export const TYPES = ["Internship", "Job"];
export const PRIORITIES = ["High", "Medium", "Low"];
export const today = () => new Date().toISOString().slice(0, 10);
export const isOverdue = (j) => j.followUp && j.followUp < today() && (j.stage === "Applied" || j.stage === "Interview");
export const fmt = (d) => (d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "-");
export const ago = (iso) => {
  if (!iso) return "never";
  const m = Math.max(1, Math.round((Date.now() - new Date(iso)) / 6e4));
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  return h < 48 ? `${h}h ago` : `${Math.round(h / 24)}d ago`;
};
