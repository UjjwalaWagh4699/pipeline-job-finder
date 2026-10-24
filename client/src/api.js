let token = localStorage.getItem("token") || "";
export const setToken = (t) => { token = t || ""; t ? localStorage.setItem("token", t) : localStorage.removeItem("token"); };

async function req(url, opts = {}) {
  const res = await fetch(url, { ...opts, headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
  if (res.status === 401 && token) { setToken(""); window.dispatchEvent(new Event("logout")); }
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "Request failed");
  return res.status === 204 ? null : res.json();
}
const body = (o) => JSON.stringify(o);

export const api = {
  register: (u) => req("/api/auth/register", { method: "POST", body: body(u) }),
  login: (u) => req("/api/auth/login", { method: "POST", body: body(u) }),
  list: () => req("/api/jobs"),
  create: (j) => req("/api/jobs", { method: "POST", body: body(j) }),
  update: (j) => req(`/api/jobs/${j.id}`, { method: "PUT", body: body(j) }),
  stage: (id, stage) => req(`/api/jobs/${id}/stage`, { method: "PATCH", body: body({ stage }) }),
  remove: (id) => req(`/api/jobs/${id}`, { method: "DELETE" }),
  listings: (p) => req("/api/listings?" + new URLSearchParams(p)),
  insights: () => req("/api/insights"),
  syncStatus: () => req("/api/sync"),
  syncNow: () => req("/api/sync", { method: "POST" }),
};
