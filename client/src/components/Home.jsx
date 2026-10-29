const FEATURES = [
  ["Live listings", "Fresh internship and job posts pulled from public job APIs and refreshed automatically every 30 minutes."],
  ["Search and filters", "Filter by type, remote, source and keyword, then sort and page through results quickly."],
  ["Drag-and-drop tracker", "Save any listing in one click and move it through Saved, Applied, Interview, Offer and Rejected."],
  ["Follow-up dates", "Set a follow-up date and priority on every application so nothing slips through."],
  ["Market insights", "See the most requested skills, top hiring companies and listings per day at a glance."],
  ["Private by design", "Passwords are hashed and every account only ever sees its own applications. Export to CSV anytime."],
];

const STEPS = [
  ["Create a free account", "Sign up with your name, email and a password. It takes under a minute."],
  ["Discover live roles", "Browse and filter real listings, and save the ones that match your skills."],
  ["Track until you are hired", "Move each application across your board and follow up on time."],
];

const STATS = [["2", "Live job sources"], ["30 min", "Auto refresh"], ["5", "Tracker stages"], ["100%", "Private to you"]];

const PREVIEW = [
  ["Saved", "#3B6FB6", [["React Intern", "Remote"], ["Frontend Developer", "Berlin"]]],
  ["Applied", "#D9980B", [["MERN Developer", "Remote"]]],
  ["Interview", "#8A5CC2", [["Flutter Intern", "Remote"]]],
  ["Offer", "#2E9D6B", [["Junior Web Developer", "Remote"]]],
];

export default function Home({ dark, onToggleDark, onLogin, onRegister }) {
  return (
    <div className="home">
      <header className="home-nav">
        <a className="home-brand" href="#top">Pipeline</a>
        <nav className="home-links" aria-label="Sections">
          <a href="#features">Features</a>
          <a href="#how">How it works</a>
          <a href="#get-started">Get started</a>
        </nav>
        <div className="home-actions">
          <button className="icon-btn" onClick={onToggleDark} aria-label="Toggle dark mode">{dark ? "Light" : "Dark"}</button>
          <button className="btn ghost" onClick={onLogin}>Log in</button>
          <button className="btn" onClick={onRegister}>Sign up</button>
        </div>
      </header>

      <main id="top">
        <section className="hero">
          <div className="hero-text">
            <span className="pill">Free job and internship tracker</span>
            <h1>Find the role. Track every application. <em>Land the offer.</em></h1>
            <p>Pipeline brings live internship and job listings together with a simple board to track your applications, so your whole job search lives in one place.</p>
            <div className="hero-cta">
              <button className="btn big" onClick={onRegister}>Get started free</button>
              <button className="btn ghost big" onClick={onLogin}>I already have an account</button>
            </div>
            <p className="hero-note">Live data from Remotive and Arbeitnow. No credit card needed.</p>
          </div>

          <div className="hero-art" aria-hidden="true">
            <div className="mock">
              <div className="mock-bar"><i /><i /><i /><span>My applications</span></div>
              <div className="mock-board">
                {PREVIEW.map(([name, color, cards]) => (
                  <div className="mock-col" key={name} style={{ "--stage": color }}>
                    <h4>{name}<span>{cards.length}</span></h4>
                    {cards.map(([role, place]) => (
                      <div className="mock-card" key={role}><b>{role}</b><small>{place}</small></div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="strip" aria-label="Highlights">
          {STATS.map(([n, l]) => <div key={l}><b>{n}</b><span>{l}</span></div>)}
        </section>

        <section id="features" className="section">
          <h2>Everything you need for your job hunt</h2>
          <p className="section-sub">Stop juggling spreadsheets, bookmarks and notes. Pipeline keeps it all together.</p>
          <div className="feat-grid">
            {FEATURES.map(([t, d], i) => (
              <article className="feat" key={t}>
                <span className="feat-num">{String(i + 1).padStart(2, "0")}</span>
                <h3>{t}</h3>
                <p>{d}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="how" className="section alt">
          <h2>How it works</h2>
          <p className="section-sub">From sign up to offer in three simple steps.</p>
          <ol className="steps">
            {STEPS.map(([t, d], i) => (
              <li key={t}><span>{i + 1}</span><h3>{t}</h3><p>{d}</p></li>
            ))}
          </ol>
        </section>

        <section id="get-started" className="cta">
          <h2>Ready to organise your job search?</h2>
          <p>Create your free account and start tracking in under a minute.</p>
          <div className="hero-cta center">
            <button className="btn big light" onClick={onRegister}>Create free account</button>
            <button className="btn big outline" onClick={onLogin}>Log in</button>
          </div>
        </section>
      </main>

      <footer className="home-foot">
        <b>Pipeline</b>
        <span>Live Job and Internship Tracker. Built with React, Node.js and SQLite.</span>
      </footer>
    </div>
  );
}
