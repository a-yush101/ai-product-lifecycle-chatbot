import { useState, useRef, useEffect, useCallback } from "react";
import "./App.css";
import Home from "./Home";

const PLC_STAGES = [
  { name: "Introduction", desc: "Low sales · High costs · Build awareness" },
  { name: "Growth", desc: "Rising sales · New rivals · Expand fast" },
  { name: "Maturity", desc: "Peak sales · Fierce competition · Defend" },
  { name: "Decline", desc: "Falling sales · Shrinking market · Pivot" },
];

const PRODUCTS = [
  { name: "iPhone", emoji: "📱" },
  { name: "Tesla Model 3", emoji: "🚗" },
  { name: "ChatGPT", emoji: "🤖" },
  { name: "Cotton T-Shirt", emoji: "👕" },
  { name: "Nokia 3310", emoji: "📟" },
  { name: "Solar Panel", emoji: "☀️" },
  { name: "Instant Noodles", emoji: "🍜" },
  { name: "Netflix", emoji: "🎬" },
];

const QUICK = [
  "Analyse the lifecycle of iPhone",
  "What stage is Netflix in and why?",
  "Compare Nokia vs Samsung lifecycle",
  "Is ChatGPT in Growth or Maturity?",
];

function parseMsg(text) {
  const lca = text.match(/📈[\s\S]*?(?=📊|🔮|$)/)?.[0]?.trim() || "";
  const strat = text.match(/📊[\s\S]*?(?=🔮|$)/)?.[0]?.trim() || "";
  const fore = text.match(/🔮[\s\S]*$/)?.[0]?.trim() || "";
  if (!lca && !strat) return { plain: text };
  return { lca, strat, fore };
}

function fmt(s) {
  return s.replace(/\*\*(.*?)\*\*/g, "<b>$1</b>").replace(/\n/g, "<br/>");
}

function BotMsg({ text }) {
  const p = parseMsg(text);
  if (p.plain) {
    return (
      <div className="card plain">
        <div dangerouslySetInnerHTML={{ __html: fmt(p.plain) }} />
      </div>
    );
  }
  return (
    <div className="bot-cards">
      {p.lca && (
        <div className="card market">
          <span className="card-label">📈 Lifecycle Analysis</span>
          <div dangerouslySetInnerHTML={{ __html: fmt(p.lca.replace(/^📈[^\n]*\n?/, "")) }} />
        </div>
      )}
      {p.strat && (
        <div className="card strategy">
          <span className="card-label">📊 Strategic Insights</span>
          <div dangerouslySetInnerHTML={{ __html: fmt(p.strat.replace(/^📊[^\n]*\n?/, "")) }} />
        </div>
      )}
      {p.fore && (
        <div className="card forecast">
          <span className="card-label">🔮 Lifecycle Forecast</span>
          <div dangerouslySetInnerHTML={{ __html: fmt(p.fore.replace(/^🔮[^\n]*\n?/, "")) }} />
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [page, setPage] = useState("home");
  const [msgs, setMsgs] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sidebar, setSidebar] = useState(true);
  const [theme, setTheme] = useState(() => localStorage.getItem("plc-theme") || "dark");
  const bottom = useRef(null);
  const API = "http://127.0.0.1:5000";

  const toggleTheme = useCallback(() => {
    setTheme(t => {
      const next = t === "dark" ? "light" : "dark";
      localStorage.setItem("plc-theme", next);
      return next;
    });
  }, []);

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, loading]);

  if (page === "home") return <Home onEnter={() => setPage("chat")} theme={theme} onToggleTheme={toggleTheme} />;

  const send = async (text) => {
    const t = text || input.trim();
    if (!t || loading) return;
    setInput(""); setError("");
    const next = [...msgs, { role: "user", content: t }];
    setMsgs(next);
    setLoading(true);
    try {
      const r = await fetch(`${API}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      const d = await r.json();
      if (d.error) throw new Error(d.error);
      setMsgs([...next, { role: "assistant", content: d.reply }]);
    } catch (err) {
      setError(err.message);
      setMsgs(next.slice(0, -1));
    } finally {
      setLoading(false);
    }
  };

  const onKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  return (
    <div className="app" data-theme={theme}>
      <header className="header">
        <div className="header-left">
          <button className="menu-btn" onClick={() => setPage("home")} title="Back to Home">←</button>
          <button className="menu-btn" onClick={() => setSidebar(s => !s)}>☰</button>
          <span className="wordmark">Product<em>Life</em> AI</span>
        </div>
        <div className="header-pills">
          <span className="pill pill-market">📈 Lifecycle Analysis</span>
          <span className="pill pill-strategy">📊 Strategic Insights</span>
          <span className="pill pill-forecast">🔮 Lifecycle Forecast</span>
          <button className="theme-toggle" onClick={toggleTheme} title="Toggle theme">
            <span className="toggle-icon">{theme === "dark" ? "☀️" : "🌙"}</span>
            {theme === "dark" ? "Light" : "Dark"}
          </button>
        </div>
      </header>

      <div className="body">
        {sidebar && (
          <aside className="sidebar">
            <div className="sb-section">
              <div className="sb-label">Sample products</div>
              <div className="product-grid">
                {PRODUCTS.map(p => (
                  <button key={p.name} className="product-btn"
                    onClick={() => send(`Analyse the lifecycle of ${p.name}`)}>
                    <span className="p-emoji">{p.emoji}</span>
                    <span>{p.name}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="sb-section">
              <div className="sb-label">PLC Stages</div>
              <div className="stage-rows">
                {PLC_STAGES.map((s, i) => (
                  <div key={s.name} className="stage-row plc">
                    <span className="stage-num">{i + 1}</span>
                    <div className="stage-info">
                      <div className="stage-name">{s.name}</div>
                      <div className="stage-desc">{s.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        )}

        <div className="chat-wrap">
          <main className="chat-area">
            {msgs.length === 0 && (
              <div className="welcome">
                <div className="welcome-orb"><span>📈</span></div>
                <h2>Product Lifecycle Intelligence</h2>
                <p>
                  Ask about any product to identify its{" "}
                  <span className="hi-market">lifecycle stage</span>,{" "}
                  <span className="hi-strategy">strategic position</span>, and{" "}
                  <span className="hi-forecast">market forecast</span>.
                </p>
                <div className="quick-btns">
                  {QUICK.map(q => (
                    <button key={q} className="quick-btn" onClick={() => send(q)}>{q}</button>
                  ))}
                </div>
              </div>
            )}

            {msgs.map((m, i) =>
              m.role === "user" ? (
                <div key={i} className="msg user">
                  <div className="bubble">{m.content}</div>
                  <div className="avatar">👤</div>
                </div>
              ) : (
                <div key={i} className="msg assistant">
                  <div className="avatar">🔬</div>
                  <BotMsg text={m.content} />
                </div>
              )
            )}

            {loading && (
              <div className="msg assistant">
                <div className="avatar">🔬</div>
                <div className="card plain">
                  <div className="typing-wrap">
                    <div className="typing-hint">Analysing product lifecycle…</div>
                    <div className="dots"><span /><span /><span /></div>
                  </div>
                </div>
              </div>
            )}

            {error && <div className="err">{error}</div>}
            <div ref={bottom} />
          </main>

          <footer className="input-footer">
            <div className="input-row">
              <textarea
                className="input-box"
                rows={1}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={onKey}
                placeholder='Ask about any product… e.g. "Analyse the lifecycle of a smartphone"'
              />
              <button className="send-btn" onClick={() => send()} disabled={loading || !input.trim()}>
                {loading ? "…" : "Analyse ↑"}
              </button>
            </div>
            <div className="meta-row">
              <span className="meta">
                <strong>LLaMA 3.1 8B</strong> · temp 0.3 · top-p 0.9
              </span>
              <span className="meta">Enter to send · Shift+Enter for new line</span>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
