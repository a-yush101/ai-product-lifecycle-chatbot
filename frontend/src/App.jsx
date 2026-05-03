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
  Package,
  FileUp,
  Database,
  LineChart as LineChartIcon
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import "./App.css";
import Home from "./Home";

/* ── Constants ──────────────────────────────────────────────────── */
const HISTORY_KEY = "plc-history";
const HISTORY_LIMIT = 20;

const PLC_STAGES = [
  { name: "Introduction", desc: "Low sales · High costs · Build awareness" },
  { name: "Growth", desc: "Rising sales · New rivals · Expand fast" },
  { name: "Maturity", desc: "Peak sales · Fierce competition · Defend" },
  { name: "Decline", desc: "Falling sales · Shrinking market · Pivot" },
];

const PRODUCTS = [
  { name: "iPhone", Icon: Smartphone },
  { name: "Tesla Model 3", Icon: Car },
  { name: "ChatGPT", Icon: Cpu },
  { name: "Cotton T-Shirt", Icon: Shirt },
  { name: "Nokia 3310", Icon: PhoneCall },
  { name: "Solar Panel", Icon: Zap },
  { name: "Instant Noodles", Icon: UtensilsCrossed },
  { name: "Netflix", Icon: Clapperboard },
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
  if (diffDays < 7) return d.toLocaleDateString([], { weekday: "short" });
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

/* ── Message parser & formatter ────────────────────────────────── */
function parseMsg(text) {
  const intro = text.match(/🌟[\s\S]*?(?=📈|📊|🔮|❓|$)/)?.[0]?.trim() || "";
  const lca = text.match(/📈[\s\S]*?(?=📊|🔮|❓|$)/)?.[0]?.trim() || "";
  const strat = text.match(/📊[\s\S]*?(?=🔮|❓|$)/)?.[0]?.trim() || "";
  const fore = text.match(/🔮[\s\S]*?(?=❓|$)/)?.[0]?.trim() || "";
  const followup = text.match(/❓[\s\S]*$/)?.[0]?.trim() || "";
  if (!intro && !lca && !strat) return { plain: text };
  return { intro, lca, strat, fore, followup };
}

function fmt(s) {
  return s.replace(/\*\*(.*?)\*\*/g, "<b>$1</b>").replace(/\n/g, "<br/>");
}

function BotMsg({ text, onSend }) {
  const p = parseMsg(text);
  if (p.plain) {
    return (
      <div className="bot-cards">
        <div className="card plain">
          <div dangerouslySetInnerHTML={{ __html: fmt(p.plain) }} />
        </div>
      </div>
    );
  }
  return (
    <div className="bot-cards">
      {p.intro && (
        <div className="card intro">
          <span className="card-label">
            <Package size={11} strokeWidth={2} /> Product Introduction
          </span>
          <div dangerouslySetInnerHTML={{ __html: fmt(p.intro.replace(/^🌟[^\n]*\n?/, "")) }} />
        </div>
      )}
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
      {p.followup && (
        <button 
          className="followup-btn" 
          onClick={() => onSend(p.followup.replace(/^❓[^\n]*\n?/, "").replace(/\*\*/g, "").trim())}
        >
          <span className="followup-icon">❓</span> 
          <span>{p.followup.replace(/^❓[^\n]*\n?/, "").replace(/\*\*/g, "").trim()}</span>
        </button>
      )}
    </div>
  );
}

/* ── Forecast Card ────────────────────────────────────────────────── */
const CustomForecastTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const hasHistorical = payload.find(p => p.dataKey === 'historical');
    const filteredPayload = payload.filter(p => {
      if (p.dataKey === 'forecast' && hasHistorical) {
        return false;
      }
      return true;
    });

    return (
      <div style={{ backgroundColor: 'var(--surface2)', borderColor: 'var(--border)', borderRadius: '12px', padding: '10px 14px', boxShadow: '0 8px 30px rgba(0,0,0,0.2)' }}>
        <p style={{ color: 'var(--text-2)', marginBottom: '6px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0, paddingBottom: '4px' }}>{label}</p>
        {filteredPayload.map((entry, index) => (
          <p key={`item-${index}`} style={{ color: entry.color, fontSize: '13px', fontWeight: 500, margin: '4px 0 0 0' }}>
            {entry.name} : {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const CustomForecastDot = (props) => {
  const { cx, cy, payload } = props;
  
  // If there is no forecast value for this point (it's purely historical), return null.
  if (payload.forecast == null) return null;
  
  // If this point has both historical and forecast data, it's the connection point.
  // Hide the forecast dot so it doesn't look like an extra forecast period.
  if (payload.historical != null && payload.forecast != null) {
    return null;
  }
  return (
    <circle cx={cx} cy={cy} r={4} stroke="var(--market)" strokeWidth={2} fill="var(--surface)" />
  );
};

function ForecastCard({ data, analysis, onSend }) {
  const chartData = [
    ...(data.historical || []).map(d => ({ name: d.month, historical: d.sales, forecast: null })),
    ...(data.forecast || []).map(d => ({ name: d.period, historical: null, forecast: d.sales }))
  ];
  
  if (data.historical && data.historical.length > 0 && data.forecast && data.forecast.length > 0) {
    const lastHistIndex = data.historical.length - 1;
    chartData[lastHistIndex].forecast = chartData[lastHistIndex].historical;
  }

  return (
    <div className="bot-cards forecast-card-wrap">
      <div className="card forecast-chart-card">
        <span className="card-label">
          <BarChart2 size={11} strokeWidth={2} /> Sales Analytics & Forecast
        </span>
        <div className="forecast-chart-container">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 20, right: 20, bottom: 10, left: 0 }}>
              <defs>
                <linearGradient id="colorHist" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--strategy)" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="var(--strategy)" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorFore" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--market)" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="var(--market)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="4 4" stroke="var(--border)" vertical={false} opacity={0.4} />
              <XAxis dataKey="name" stroke="var(--text-3)" fontSize={11} tickMargin={12} axisLine={false} tickLine={false} />
              <YAxis stroke="var(--text-3)" fontSize={11} tickFormatter={(v) => v >= 1000 ? (v/1000)+'k' : v} axisLine={false} tickLine={false} tickMargin={8} />
              <Tooltip 
                content={<CustomForecastTooltip />}
                cursor={{ stroke: 'var(--border)', strokeWidth: 1, strokeDasharray: '4 4' }}
              />
              <Area type="monotone" dataKey="historical" stroke="var(--strategy)" fill="url(#colorHist)" strokeWidth={2.5} dot={{ r: 4, fill: "var(--surface)", strokeWidth: 2, stroke: "var(--strategy)" }} activeDot={{ r: 6, strokeWidth: 0, fill: "var(--strategy)" }} name="Historical" connectNulls={true} />
              <Area type="monotone" dataKey="forecast" stroke="var(--market)" fill="url(#colorFore)" strokeWidth={2.5} strokeDasharray="6 4" dot={<CustomForecastDot />} activeDot={{ r: 6, strokeWidth: 0, fill: "var(--market)" }} name="Forecast" connectNulls={true} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="forecast-metrics">
          <div className="metric">
            <div className="metric-label">Trend</div>
            <div className="metric-val" style={{color: data.trend === 'upward' ? 'var(--intro)' : 'var(--market)'}}>
              {data.trend === 'upward' ? '📈 Upward' : '📉 Downward'}
            </div>
          </div>
          <div className="metric">
            <div className="metric-label">Growth Rate</div>
            <div className="metric-val">{data.growth_rate > 0 ? '+' : ''}{data.growth_rate} / period</div>
          </div>
        </div>
      </div>
      
      <div className="card strategy">
        <span className="card-label">
          <Bot size={11} strokeWidth={2} /> AI Strategic Analysis
        </span>
        <div dangerouslySetInnerHTML={{ __html: fmt(analysis) }} />
      </div>
    </div>
  );
}

/* ── Main App ───────────────────────────────────────────────────── */
export default function App() {
  const [page, setPage] = useState("home");
  const [msgs, setMsgs] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sidebar, setSidebar] = useState(true);
  const [activeSession, setActiveSession] = useState(null); // id of loaded session
  const [history, setHistory] = useState(loadHistory);
  const [historyOpen, setHistoryOpen] = useState(true);
  const [theme, setTheme] = useState(() => localStorage.getItem("plc-theme") || "dark");
  const [showForecastModal, setShowForecastModal] = useState(false);
  const [forecastProductName, setForecastProductName] = useState("");
  const [uploading, setUploading] = useState(false);
  const bottom = useRef(null);
  const API = import.meta.env.VITE_API_URL || "http://127.0.0.1:5000";

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

  const submitForecast = async (data, productName) => {
    const next = [...msgs, { role: "user", content: `Analyse sales forecast for ${productName}` }];
    setMsgs(next);
    setLoading(true);
    try {
      const r = await fetch(`${API}/api/forecast`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data, productName }),
      });
      const d = await r.json();
      if (d.error) throw new Error(d.error);
      
      const finalMsgs = [...next, { 
        role: "assistant", 
        type: "forecast", 
        forecastData: { historical: data, ...d.forecastData }, 
        analysis: d.analysis 
      }];
      setMsgs(finalMsgs);
      persistSession(finalMsgs);
    } catch (err) {
      setError(err.message);
      setMsgs(next.slice(0, -1));
    } finally {
      setLoading(false);
    }
  };

  const handleMockForecast = async () => {
    setShowForecastModal(false);
    const mockData = Array.from({length: 12}, (_, i) => ({
      month: `Month ${i+1}`,
      sales: 1000 + (i * 150) + Math.floor(Math.random() * 200) - 100
    }));
    const pName = forecastProductName.trim() || "Mock Product (Smartphone)";
    await submitForecast(mockData, pName);
    setForecastProductName("");
  };

  const handleCSVUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target.result;
      const lines = text.split('\n').filter(l => l.trim());
      if (lines.length < 2) {
        setError("CSV must contain at least a header and one row");
        setUploading(false);
        return;
      }
      
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const salesIdx = headers.findIndex(h => h.includes('sale') || h.includes('value'));
      const monthIdx = headers.findIndex(h => h.includes('month') || h.includes('date') || h.includes('period'));
      
      if (salesIdx === -1) {
        setError("Could not find a 'sales' column in the CSV");
        setUploading(false);
        return;
      }
      
      const data = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',');
        const salesVal = parseFloat(cols[salesIdx]);
        if (!isNaN(salesVal)) {
          data.push({
            month: monthIdx !== -1 ? cols[monthIdx] : `Period ${i}`,
            sales: salesVal
          });
        }
      }
      
      setShowForecastModal(false);
      setUploading(false);
      const pName = forecastProductName.trim() || "Uploaded CSV Data";
      await submitForecast(data, pName);
      setForecastProductName("");
    };
    reader.readAsText(file);
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
                  {m.type === "forecast" ? (
                    <ForecastCard data={m.forecastData} analysis={m.analysis} onSend={send} />
                  ) : (
                    <BotMsg text={m.content} onSend={send} />
                  )}
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
              <button className="forecast-action-btn" onClick={() => setShowForecastModal(true)} disabled={loading}>
                <LineChartIcon size={13} strokeWidth={2} /> Forecast
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
      {showForecastModal && (
        <div className="modal-overlay" onClick={() => !uploading && setShowForecastModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>📈 Forecast Sales</h3>
              <p>Upload a CSV with historical sales data to generate a linear regression forecast and strategic LLM analysis.</p>
            </div>
            
            <div className="modal-actions">
              <input 
                type="text" 
                className="input-box" 
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px' }}
                placeholder="Product Name (e.g. Smartphone)" 
                value={forecastProductName}
                onChange={(e) => setForecastProductName(e.target.value)}
                disabled={uploading}
              />
              <div className="upload-wrapper">
                <input 
                  type="file" 
                  accept=".csv" 
                  id="csv-upload" 
                  onChange={handleCSVUpload}
                  disabled={uploading}
                />
                <label htmlFor="csv-upload" className={`modal-action-btn primary ${uploading ? 'disabled' : ''}`}>
                  <FileUp size={16} />
                  {uploading ? "Analysing CSV..." : "Upload CSV Data"}
                </label>
              </div>
              
              <div className="modal-divider"><span>OR</span></div>
              
              <button 
                className="modal-action-btn secondary"
                onClick={handleMockForecast}
                disabled={uploading}
              >
                <Database size={16} />
                Generate Mock Data
              </button>
            </div>
            <button className="modal-close" onClick={() => !uploading && setShowForecastModal(false)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
