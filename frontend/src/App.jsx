import { useState, useRef, useEffect } from "react";
import "./App.css";

const MARKET_STAGES = ["Introduction", "Growth", "Maturity", "Decline"];
const ENV_STAGES = ["Raw Materials", "Manufacturing", "Distribution", "Consumer Use", "End of Life", "Recycling"];

const PRODUCTS = [
  { name: "iPhone",        emoji: "📱" },
  { name: "Tesla Model 3", emoji: "🚗" },
  { name: "Plastic Bottle",emoji: "🧴" },
  { name: "ChatGPT",       emoji: "🤖" },
  { name: "Cotton T-Shirt",emoji: "👕" },
  { name: "Nokia 3310",    emoji: "📟" },
  { name: "Solar Panel",   emoji: "☀️" },
  { name: "Instant Noodles",emoji: "🍜" },
];

const QUICK = [
  "Analyse the lifecycle of iPhone",
  "Compare plastic bottle vs glass bottle",
  "What stage is Tesla in?",
  "Analyse instant noodles lifecycle",
];

function parseMsg(text) {
  const mkt = text.match(/📈[\s\S]*?(?=🌍|$)/)?.[0]?.trim() || "";
  const env = text.match(/🌍[\s\S]*?(?=⚡|$)/)?.[0]?.trim() || "";
  const com = text.match(/⚡[\s\S]*$/)?.[0]?.trim() || "";
  if (!mkt && !env) return { plain: text };
  return { mkt, env, com };
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
      {p.mkt && (
        <div className="card market">
          <span className="card-label">📈 Market lifecycle</span>
          <div dangerouslySetInnerHTML={{ __html: fmt(p.mkt.replace(/^📈[^\n]*\n?/, "")) }} />
        </div>
      )}
      {p.env && (
        <div className="card env">
          <span className="card-label">🌍 Environmental lifecycle</span>
          <div dangerouslySetInnerHTML={{ __html: fmt(p.env.replace(/^🌍[^\n]*\n?/, "")) }} />
        </div>
      )}
      {p.com && (
        <div className="card combined">
          <span className="card-label">⚡ Combined insight</span>
          <div dangerouslySetInnerHTML={{ __html: fmt(p.com.replace(/^⚡[^\n]*\n?/, "")) }} />
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [msgs, setMsgs] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sidebar, setSidebar] = useState(true);
  const bottom = useRef(null);
  const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, loading]);

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
    } catch {
      setError("Could not reach backend. Check that server.js is running and GEMINI_API_KEY is set.");
      setMsgs(next.slice(0, -1));
    } finally {
      setLoading(false);
    }
  };

  const onKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  return (
    <div className="app">
      <header className="header">
        <div className="header-left">
          <button className="menu-btn" onClick={() => setSidebar(s => !s)}>☰</button>
          <span className="wordmark">Product<em>Life</em> AI</span>
        </div>
        <div className="header-pills">
          <span className="pill pill-market">📈 Market</span>
          <span className="pill pill-env">🌍 Environmental</span>
          <span className="pill pill-combo">⚡ Combined</span>
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
              <div className="sb-label">Market stages</div>
              <div className="stage-rows">
                {MARKET_STAGES.map((s, i) => (
                  <div key={s} className="stage-row market">
                    <span className="stage-num">{i + 1}</span>{s}
                  </div>
                ))}
              </div>
            </div>
            <div className="sb-section">
              <div className="sb-label">LCA stages</div>
              <div className="stage-rows">
                {ENV_STAGES.map((s, i) => (
                  <div key={s} className="stage-row env">
                    <span className="stage-num">{i + 1}</span>{s}
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
                <div className="welcome-orb"><span>🔄</span></div>
                <h2>Dual Lifecycle Analysis</h2>
                <p>
                  Ask about any product to instantly see its{" "}
                  <span className="hi-market">market stage</span> and{" "}
                  <span className="hi-env">environmental footprint</span> together.
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
                    <div className="typing-hint">Analysing market & environmental lifecycle…</div>
                    <div className="dots"><span/><span/><span/></div>
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
                <strong>Gemini 2.0 Flash</strong> · temp 0.3 · top-p 0.9
              </span>
              <span className="meta">Enter to send · Shift+Enter for new line</span>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
