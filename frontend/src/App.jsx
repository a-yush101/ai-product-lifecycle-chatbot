import { useState, useRef, useEffect, useCallback } from "react";
import {
  TrendingUp,
  BarChart2,
  Clock,
  Sun,
  Moon,
  User,
  Bot,
  Menu,
  ArrowLeft,
  Smartphone,
  Car,
  Cpu,
  Shirt,
  PhoneCall,
  Zap,
  UtensilsCrossed,
  Clapperboard,
  SendHorizonal,
  History,
  Trash2,
  MessageSquare,
  PlusCircle,
} from "lucide-react";
import "./App.css";
import Home from "./Home";

/* ── Constants ──────────────────────────────────────────────────── */
const HISTORY_KEY  = "plc-history";
const HISTORY_LIMIT = 20;

const PLC_STAGES = [
  { name: "Introduction", desc: "Low sales · High costs · Build awareness" },
  { name: "Growth",       desc: "Rising sales · New rivals · Expand fast" },
  { name: "Maturity",     desc: "Peak sales · Fierce competition · Defend" },
  { name: "Decline",      desc: "Falling sales · Shrinking market · Pivot" },
];

const PRODUCTS = [
  { name: "iPhone",          Icon: Smartphone },
  { name: "Tesla Model 3",   Icon: Car },
  { name: "ChatGPT",         Icon: Cpu },
  { name: "Cotton T-Shirt",  Icon: Shirt },
  { name: "Nokia 3310",      Icon: PhoneCall },
  { name: "Solar Panel",     Icon: Zap },
  { name: "Instant Noodles", Icon: UtensilsCrossed },
  { name: "Netflix",         Icon: Clapperboard },
];

const QUICK = [
  "Analyse the lifecycle of iPhone",
  "What stage is Netflix in and why?",
  "Compare Nokia vs Samsung lifecycle",
  "Is ChatGPT in Growth or Maturity?",
];

/* ── History helpers ────────────────────────────────────────────── */
function loadHistory() {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveHistory(sessions) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(sessions.slice(0, HISTORY_LIMIT)));
}

function sessionTitle(messages) {
  const first = messages.find(m => m.role === "user");
  if (!first) return "Untitled session";
  return first.content.length > 46
    ? first.content.slice(0, 46) + "…"
    : first.content;
}

function formatDate(ts) {
  const d = new Date(ts);
  const now = new Date();
  const diffDays = Math.floor((now - d) / 86400000);
  if (diffDays === 0) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7)  return d.toLocaleDateString([], { weekday: "short" });
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

/* ── Message parser & formatter ────────────────────────────────── */
function parseMsg(text) {
  const lca   = text.match(/📈[\s\S]*?(?=📊|🔮|$)/)?.[0]?.trim() || "";
  const strat = text.match(/📊[\s\S]*?(?=🔮|$)/)?.[0]?.trim()   || "";
  const fore  = text.match(/🔮[\s\S]*$/)?.[0]?.trim()            || "";
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
          <span className="card-label">
            <TrendingUp size={11} strokeWidth={2} /> Lifecycle Analysis
          </span>
          <div dangerouslySetInnerHTML={{ __html: fmt(p.lca.replace(/^📈[^\n]*\n?/, "")) }} />
        </div>
      )}
      {p.strat && (
        <div className="card strategy">
          <span className="card-label">
            <BarChart2 size={11} strokeWidth={2} /> Strategic Insights
          </span>
          <div dangerouslySetInnerHTML={{ __html: fmt(p.strat.replace(/^📊[^\n]*\n?/, "")) }} />
        </div>
      )}
      {p.fore && (
        <div className="card forecast">
          <span className="card-label">
            <Clock size={11} strokeWidth={2} /> Lifecycle Forecast
          </span>
          <div dangerouslySetInnerHTML={{ __html: fmt(p.fore.replace(/^🔮[^\n]*\n?/, "")) }} />
        </div>
      )}
    </div>
  );
}

/* ── Main App ───────────────────────────────────────────────────── */
export default function App() {
  const [page, setPage]         = useState("home");
  const [msgs, setMsgs]         = useState([]);
  const [input, setInput]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [sidebar, setSidebar]   = useState(true);
  const [activeSession, setActiveSession] = useState(null); // id of loaded session
  const [history, setHistory]   = useState(loadHistory);
  const [historyOpen, setHistoryOpen] = useState(true);
  const [theme, setTheme]       = useState(() => localStorage.getItem("plc-theme") || "dark");
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

  /* Persist a finished conversation to history */
  const persistSession = useCallback((finalMsgs) => {
    if (finalMsgs.length < 2) return; // need at least one exchange
    setHistory(prev => {
      let updated;
      if (activeSession) {
        // Update existing session
        updated = prev.map(s =>
          s.id === activeSession ? { ...s, messages: finalMsgs, updatedAt: Date.now() } : s
        );
      } else {
        const newSession = {
          id: Date.now().toString(),
          title: sessionTitle(finalMsgs),
          messages: finalMsgs,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        setActiveSession(newSession.id);
        updated = [newSession, ...prev];
      }
      saveHistory(updated);
      return updated;
    });
  }, [activeSession]);

  /* Load a history session into the chat */
  const loadSession = useCallback((session) => {
    setMsgs(session.messages);
    setActiveSession(session.id);
    setError("");
    setInput("");
  }, []);

  /* Delete a single session */
  const deleteSession = useCallback((id, e) => {
    e.stopPropagation();
    setHistory(prev => {
      const updated = prev.filter(s => s.id !== id);
      saveHistory(updated);
      return updated;
    });
    if (activeSession === id) {
      setMsgs([]);
      setActiveSession(null);
    }
  }, [activeSession]);

  /* Clear all history */
  const clearHistory = useCallback(() => {
    setHistory([]);
    localStorage.removeItem(HISTORY_KEY);
    setMsgs([]);
    setActiveSession(null);
  }, []);

  /* Start a fresh chat */
  const newChat = useCallback(() => {
    setMsgs([]);
    setActiveSession(null);
    setInput("");
    setError("");
  }, []);

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
      const finalMsgs = [...next, { role: "assistant", content: d.reply }];
      setMsgs(finalMsgs);
      persistSession(finalMsgs);
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
          <button className="menu-btn" onClick={() => setPage("home")} title="Back to Home">
            <ArrowLeft size={14} strokeWidth={2} />
          </button>
          <button className="menu-btn" onClick={() => setSidebar(s => !s)} title="Toggle sidebar">
            <Menu size={14} strokeWidth={2} />
          </button>
          <span className="wordmark">Product<em>Life</em> AI</span>
        </div>
        <div className="header-pills">
          <span className="pill pill-market">
            <TrendingUp size={10} strokeWidth={2} /> Lifecycle Analysis
          </span>
          <span className="pill pill-strategy">
            <BarChart2 size={10} strokeWidth={2} /> Strategic Insights
          </span>
          <span className="pill pill-forecast">
            <Clock size={10} strokeWidth={2} /> Lifecycle Forecast
          </span>
          <button className="theme-toggle" onClick={toggleTheme} title="Toggle theme">
            <span className="toggle-icon">
              {theme === "dark" ? <Sun size={13} strokeWidth={2} /> : <Moon size={13} strokeWidth={2} />}
            </span>
            {theme === "dark" ? "Light" : "Dark"}
          </button>
        </div>
      </header>

      <div className="body">
        {sidebar && (
          <aside className="sidebar">

            {/* New Chat button */}
            <div className="sb-section">
              <button className="new-chat-btn" onClick={newChat}>
                <PlusCircle size={13} strokeWidth={2} />
                New Chat
              </button>
            </div>

            {/* History section */}
            <div className="sb-section sb-history-section">
              <div className="sb-label-row">
                <div
                  className="sb-label sb-label-clickable"
                  onClick={() => setHistoryOpen(o => !o)}
                >
                  <History size={10} strokeWidth={2} />
                  History
                  <span className="sb-label-count">{history.length}</span>
                </div>
                {history.length > 0 && (
                  <button className="sb-clear-btn" onClick={clearHistory} title="Clear all history">
                    <Trash2 size={10} strokeWidth={2} />
                  </button>
                )}
              </div>

              {historyOpen && (
                <div className="history-list">
                  {history.length === 0 ? (
                    <div className="history-empty">No saved analyses yet</div>
                  ) : (
                    history.map(session => (
                      <div
                        key={session.id}
                        className={`history-item ${activeSession === session.id ? "history-item--active" : ""}`}
                        onClick={() => loadSession(session)}
                        title={session.title}
                      >
                        <MessageSquare size={11} strokeWidth={1.8} className="history-icon" />
                        <div className="history-item-body">
                          <div className="history-title">{session.title}</div>
                          <div className="history-meta">{formatDate(session.updatedAt)}</div>
                        </div>
                        <button
                          className="history-delete"
                          onClick={(e) => deleteSession(session.id, e)}
                          title="Delete"
                        >
                          <Trash2 size={10} strokeWidth={2} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Sample products */}
            <div className="sb-section">
              <div className="sb-label">Sample products</div>
              <div className="product-grid">
                {PRODUCTS.map(({ name, Icon }) => (
                  <button key={name} className="product-btn"
                    onClick={() => send(`Analyse the lifecycle of ${name}`)}>
                    <span className="p-emoji"><Icon size={14} strokeWidth={1.8} /></span>
                    <span>{name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* PLC stages */}
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
                <div className="welcome-orb">
                  <span><TrendingUp size={26} strokeWidth={1.8} /></span>
                </div>
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
                  <div className="avatar"><User size={14} strokeWidth={1.8} /></div>
                </div>
              ) : (
                <div key={i} className="msg assistant">
                  <div className="avatar"><Bot size={14} strokeWidth={1.8} /></div>
                  <BotMsg text={m.content} />
                </div>
              )
            )}

            {loading && (
              <div className="msg assistant">
                <div className="avatar"><Bot size={14} strokeWidth={1.8} /></div>
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
                {loading ? "…" : <><SendHorizonal size={13} strokeWidth={2} /> Analyse</>}
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
