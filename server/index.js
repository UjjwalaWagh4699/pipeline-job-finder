import express from "express";
import cors from "cors";
import crypto from "node:crypto";
import { DatabaseSync } from "node:sqlite"; // built into Node 22.13+, no native install needed

const db = new DatabaseSync("pipeline.db");
const SECRET = process.env.JWT_SECRET || "change-this-secret-before-deploying";
const FIELDS = ["company", "role", "location", "type", "stage", "priority", "stipend", "date", "followUp", "link", "notes"];
const DEFAULTS = { type: "Internship", stage: "Applied", priority: "Medium" };

db.exec(`
CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, email TEXT UNIQUE, pass TEXT);
CREATE TABLE IF NOT EXISTS jobs (id INTEGER PRIMARY KEY AUTOINCREMENT, userId INTEGER, ${FIELDS.map((f) => `${f} TEXT DEFAULT ''`).join(", ")});
CREATE TABLE IF NOT EXISTS listings (id INTEGER PRIMARY KEY AUTOINCREMENT, source TEXT, extId TEXT, title TEXT, company TEXT, location TEXT, remote INTEGER, type TEXT, tags TEXT, url TEXT, logo TEXT, salary TEXT, summary TEXT, postedAt TEXT, UNIQUE(source, extId));
`);

/* ---------- auth (password hashing + signed token, using only node:crypto) ---------- */
const hashPw = (pw) => { const salt = crypto.randomBytes(16).toString("hex"); return `${salt}:${crypto.scryptSync(pw, salt, 64).toString("hex")}`; };
const checkPw = (pw, stored) => {
  const [salt, hash] = stored.split(":");
  return crypto.timingSafeEqual(Buffer.from(hash, "hex"), crypto.scryptSync(pw, salt, 64));
};
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
const mac = (s) => crypto.createHmac("sha256", SECRET).update(s).digest("base64url");
const sign = (user) => { const body = `${b64({ alg: "HS256" })}.${b64({ ...user, exp: Date.now() + 7 * 864e5 })}`; return `${body}.${mac(body)}`; };
const verify = (token = "") => {
  const [h, p, s] = token.split(".");
  if (!s || s.length !== mac(`${h}.${p}`).length || !crypto.timingSafeEqual(Buffer.from(s), Buffer.from(mac(`${h}.${p}`)))) return null;
  const data = JSON.parse(Buffer.from(p, "base64url"));
  return data.exp > Date.now() ? data : null;
};

/* ---------- live listings aggregator ---------- */
const getJson = async (url) => { const r = await fetch(url, { headers: { "User-Agent": "pipeline-app" } }); if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); };
const strip = (h = "") => h.replace(/<[^>]+>/g, " ").replace(/&[a-z#0-9]+;/gi, " ").replace(/\s+/g, " ").trim().slice(0, 240);
const kind = (...t) => { const s = t.join(" "); return /intern|trainee|apprentice|working student/i.test(s) ? "Internship" : /contract|freelance/i.test(s) ? "Contract" : /part[ _-]?time/i.test(s) ? "Part-time" : "Full-time"; };
const iso = (d) => { const x = new Date(d); return isNaN(x) ? new Date().toISOString() : x.toISOString(); };

const SOURCES = {
  Remotive: async () => (await getJson("https://remotive.com/api/remote-jobs?category=software-dev&limit=200")).jobs.map((j) => ({
    extId: String(j.id), title: j.title, company: j.company_name, location: j.candidate_required_location || "Anywhere", remote: 1,
    type: kind(j.title, j.job_type), tags: JSON.stringify((j.tags || []).slice(0, 8)), url: j.url, logo: j.company_logo || "",
    salary: j.salary || "", summary: strip(j.description), postedAt: iso(j.publication_date),
  })),
  Arbeitnow: async () => (await getJson("https://www.arbeitnow.com/api/job-board-api")).data.map((j) => ({
    extId: j.slug, title: j.title, company: j.company_name, location: j.location || "", remote: j.remote ? 1 : 0,
    type: kind(j.title, (j.job_types || []).join(" ")), tags: JSON.stringify((j.tags || []).slice(0, 8)), url: j.url, logo: "",
    salary: "", summary: strip(j.description), postedAt: iso(j.created_at * 1000),
  })),
};

const L = ["extId", "title", "company", "location", "remote", "type", "tags", "url", "logo", "salary", "summary", "postedAt"];
const upsert = db.prepare(
  `INSERT INTO listings (source,${L}) VALUES (@source,${L.map((f) => "@" + f)}) ON CONFLICT(source,extId) DO UPDATE SET ${L.filter((f) => f !== "extId").map((f) => `${f}=excluded.${f}`)}`
);
const sync = { at: null, running: false, results: {} };

async function runSync() {
  if (sync.running) return sync;
  sync.running = true;
  await Promise.all(Object.entries(SOURCES).map(async ([name, fetchRows]) => {
    try {
      const rows = await fetchRows();
      db.exec("BEGIN");
      rows.forEach((r) => upsert.run({ source: name, ...r }));
      db.exec("COMMIT");
      sync.results[name] = { ok: true, count: rows.length };
    } catch (e) {
      try { db.exec("ROLLBACK"); } catch {}
      sync.results[name] = { ok: false, error: e.message };
    }
  }));
  db.prepare("DELETE FROM listings WHERE postedAt < ?").run(new Date(Date.now() - 60 * 864e5).toISOString());
  sync.at = new Date().toISOString();
  sync.running = false;
  console.log("Sync done:", JSON.stringify(sync.results));
  return sync;
}

/* ---------- app ---------- */
const app = express();
app.use(cors());
app.use(express.json());

app.post("/api/auth/register", (req, res) => {
  const { name = "", email = "", password = "" } = req.body;
  if (!name.trim() || !/^\S+@\S+\.\S+$/.test(email) || password.length < 6)
    return res.status(400).json({ error: "Enter your name, a valid email and a password of at least 6 characters" });
  try {
    const id = Number(db.prepare("INSERT INTO users (name,email,pass) VALUES (?,?,?)").run(name.trim(), email.toLowerCase(), hashPw(password)).lastInsertRowid);
    const user = { id, name: name.trim() };
    res.status(201).json({ token: sign(user), user });
  } catch { res.status(409).json({ error: "This email is already registered" }); }
});

app.post("/api/auth/login", (req, res) => {
  const { email = "", password = "" } = req.body;
  const row = db.prepare("SELECT * FROM users WHERE email=?").get(email.toLowerCase());
  if (!row || !checkPw(password, row.pass)) return res.status(401).json({ error: "Wrong email or password" });
  const user = { id: row.id, name: row.name };
  res.json({ token: sign(user), user });
});

app.use("/api", (req, res, next) => {
  if (req.path.startsWith("/auth/")) return next();
  const user = verify((req.headers.authorization || "").replace("Bearer ", ""));
  if (!user) return res.status(401).json({ error: "Please log in again" });
  req.user = user;
  next();
});

/* tracker CRUD (each user sees only their own rows) */
const clean = (b = {}) => Object.fromEntries(FIELDS.map((f) => [f, String(b[f] ?? (f === "date" ? new Date().toISOString().slice(0, 10) : DEFAULTS[f] ?? "")).trim()]));
const insert = db.prepare(`INSERT INTO jobs (userId,${FIELDS}) VALUES (@userId,${FIELDS.map((f) => "@" + f)})`);
const update = db.prepare(`UPDATE jobs SET ${FIELDS.map((f) => `${f}=@${f}`)} WHERE id=@id AND userId=@userId`);
const getOne = (id, userId) => db.prepare("SELECT * FROM jobs WHERE id=? AND userId=?").get(id, userId);
const valid = (j) => j.company && j.role;

app.get("/api/jobs", (req, res) => res.json(db.prepare("SELECT * FROM jobs WHERE userId=? ORDER BY id DESC").all(req.user.id)));

app.post("/api/jobs", (req, res) => {
  const job = clean(req.body);
  if (!valid(job)) return res.status(400).json({ error: "Company and role are required" });
  const id = insert.run({ ...job, userId: req.user.id }).lastInsertRowid;
  res.status(201).json(getOne(id, req.user.id));
});

app.put("/api/jobs/:id", (req, res) => {
  const job = clean(req.body);
  if (!valid(job)) return res.status(400).json({ error: "Company and role are required" });
  if (update.run({ ...job, id: req.params.id, userId: req.user.id }).changes === 0) return res.status(404).json({ error: "Application not found" });
  res.json(getOne(req.params.id, req.user.id));
});

app.patch("/api/jobs/:id/stage", (req, res) => {
  const { changes } = db.prepare("UPDATE jobs SET stage=? WHERE id=? AND userId=?").run(String(req.body.stage), req.params.id, req.user.id);
  if (changes === 0) return res.status(404).json({ error: "Application not found" });
  res.json(getOne(req.params.id, req.user.id));
});

app.delete("/api/jobs/:id", (req, res) => {
  db.prepare("DELETE FROM jobs WHERE id=? AND userId=?").run(req.params.id, req.user.id);
  res.status(204).end();
});

/* live listings */
app.get("/api/listings", (req, res) => {
  const { q = "", type = "", remote = "", source = "", sort = "new", page = 1, size = 12 } = req.query;
  const where = [], args = {};
  if (q) { where.push("(title LIKE @q OR company LIKE @q OR tags LIKE @q)"); args.q = `%${q}%`; }
  if (type) { where.push("type=@type"); args.type = type; }
  if (source) { where.push("source=@source"); args.source = source; }
  if (remote === "1") where.push("remote=1");
  const w = where.length ? "WHERE " + where.join(" AND ") : "";
  const order = sort === "company" ? "company COLLATE NOCASE" : "postedAt DESC";
  const total = db.prepare(`SELECT COUNT(*) AS c FROM listings ${w}`).get(args).c;
  const rows = db.prepare(`SELECT * FROM listings ${w} ORDER BY ${order} LIMIT @limit OFFSET @offset`).all({ ...args, limit: +size, offset: (+page - 1) * +size });
  res.json({ total, rows: rows.map((r) => ({ ...r, tags: JSON.parse(r.tags || "[]") })) });
});

app.get("/api/sync", (_req, res) => res.json(sync));
app.post("/api/sync", async (_req, res) => res.json(await runSync()));

app.get("/api/insights", (_req, res) => {
  const one = (s) => db.prepare(s).get().c;
  const all = (s) => db.prepare(s).all();
  const tagCount = {};
  all("SELECT tags FROM listings").forEach((r) => JSON.parse(r.tags || "[]").forEach((t) => { const k = t.toLowerCase(); tagCount[k] = (tagCount[k] || 0) + 1; }));
  res.json({
    total: one("SELECT COUNT(*) AS c FROM listings"),
    internships: one("SELECT COUNT(*) AS c FROM listings WHERE type='Internship'"),
    remote: one("SELECT COUNT(*) AS c FROM listings WHERE remote=1"),
    bySource: all("SELECT source AS label, COUNT(*) AS n FROM listings GROUP BY source"),
    byType: all("SELECT type AS label, COUNT(*) AS n FROM listings GROUP BY type ORDER BY n DESC"),
    topCompanies: all("SELECT company AS label, COUNT(*) AS n FROM listings GROUP BY company ORDER BY n DESC LIMIT 8"),
    topTags: Object.entries(tagCount).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([label, n]) => ({ label, n })),
    perDay: all("SELECT substr(postedAt,1,10) AS label, COUNT(*) AS n FROM listings GROUP BY label ORDER BY label DESC LIMIT 14").reverse(),
  });
});

app.listen(3001, () => {
  console.log("API running on http://localhost:3001");
  runSync();
  setInterval(runSync, 30 * 60 * 1000); // refresh live data every 30 minutes
});
