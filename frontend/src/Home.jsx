import {
  TrendingUp,
  BarChart2,
  Clock,
  Sun,
  Moon,
  ArrowRight,
  ChevronDown,
} from "lucide-react";
import "./Home.css";

const PLC_CARDS = [
  {
    cls: "intro",
    num: "01",
    name: "Introduction",
    desc: "Product enters the market. Low sales, high investment, minimal competition — focus is on building awareness.",
    tag: "Build Awareness",
  },
  {
    cls: "growth",
    num: "02",
    name: "Growth",
    desc: "Sales rise rapidly, competitors enter, brand loyalty forms. Invest aggressively to capture market share.",
    tag: "Expand Fast",
  },
  {
    cls: "mature",
    num: "03",
    name: "Maturity",
    desc: "Sales peak and stabilise. Fierce competition, price pressure — strategy shifts to differentiation and retention.",
    tag: "Defend & Differentiate",
  },
  {
    cls: "decline",
    num: "04",
    name: "Decline",
    desc: "Demand falls, market shrinks. Time to reposition, harvest profits, or discontinue strategically.",
    tag: "Reposition or Exit",
  },
];

const FEATURES = [
  {
    Icon: TrendingUp,
    iconCls: "market-icon",
    title: "Lifecycle Analysis",
    desc: "Instantly identify which of the 4 PLC stages a product is in — backed by real sales, competition, and profit trend reasoning.",
  },
  {
    Icon: BarChart2,
    iconCls: "strategy-icon",
    title: "Strategic Insights",
    desc: "Get concrete, stage-appropriate business strategies: what to invest in, how to price, and what challenge to solve first.",
  },
  {
    Icon: Clock,
    iconCls: "forecast-icon",
    title: "Lifecycle Forecast",
    desc: "Predict where the product is headed next, what risks could accelerate the transition, and what opportunity to act on now.",
  },
];

const STATS = [
  { num: "4",  label: "PLC Stages" },
  { num: "3",  label: "Analysis Sections" },
  { num: "AI", label: "Powered Engine" },
  { num: "∞",  label: "Products Supported" },
];

export default function Home({ onEnter, theme, onToggleTheme }) {
  return (
    <div className="home" data-theme={theme}>
      {/* Ambient glows */}
      <div className="home-glow" />

      {/* Nav */}
      <nav className="home-nav">
        <span className="nav-logo">
          Product<em>Life</em> AI
        </span>
        <div className="nav-right">
          <span className="nav-badge">INT428 · AI Essentials</span>
          <button className="nav-theme-btn" onClick={onToggleTheme} title="Toggle theme">
            <span>
              {theme === "dark"
                ? <Sun size={14} strokeWidth={2} />
                : <Moon size={14} strokeWidth={2} />}
            </span>
            {theme === "dark" ? "Light" : "Dark"}
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero">
        <div className="hero-tag">
          <span className="hero-tag-dot" />
          Domain-Specific Generative AI Chatbot
        </div>

        <h1 className="hero-title">
          Track every stage of a{" "}
          <span className="accent-market">product's</span>{" "}
          <span className="accent-forecast">market journey</span>
        </h1>

        <p className="hero-sub">
          ProductLife AI analyses any product's position in the Business Product
          Lifecycle — giving you stage classification, strategic recommendations,
          and a market forecast in seconds.
        </p>

        <div className="hero-cta-row">
          <button className="btn-primary" onClick={onEnter} id="launch-chatbot-btn">
            Launch Chatbot
            <ArrowRight size={16} strokeWidth={2} />
          </button>
          <button
            className="btn-secondary"
            onClick={() => document.getElementById("plc-section").scrollIntoView({ behavior: "smooth" })}
          >
            Learn the Model <ChevronDown size={14} strokeWidth={2} style={{ display: "inline", verticalAlign: "middle" }} />
          </button>
        </div>
      </section>

      {/* Stats */}
      <div className="stats-row">
        {STATS.map((s) => (
          <div className="stat-item" key={s.label}>
            <span className="stat-num">{s.num}</span>
            <span className="stat-label">{s.label}</span>
          </div>
        ))}
      </div>

      {/* PLC Timeline */}
      <section className="plc-section" id="plc-section">
        <div className="section-label">The Product Lifecycle Model</div>
        <div className="plc-track">
          {PLC_CARDS.map((c) => (
            <div className={`plc-card ${c.cls}`} key={c.name}>
              <div className="plc-num">{c.num}</div>
              <div className="plc-stage-name">{c.name}</div>
              <div className="plc-stage-desc">{c.desc}</div>
              <span className="plc-tag">{c.tag}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Feature Cards */}
      <section className="features-section">
        <div className="section-label">What the AI gives you</div>
        <div className="features-grid">
          {FEATURES.map(({ Icon, iconCls, title, desc }) => (
            <div className="feat-card" key={title}>
              <div className={`feat-icon ${iconCls}`}>
                <Icon size={22} strokeWidth={1.8} />
              </div>
              <div className="feat-title">{title}</div>
              <div className="feat-desc">{desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <div className="bottom-cta">
        <h2>Ready to analyse a product?</h2>
        <p>Ask about any product — from iPhones to instant noodles.</p>
        <button className="btn-primary" onClick={onEnter} id="bottom-launch-btn">
          Open Chatbot <ArrowRight size={15} strokeWidth={2} />
        </button>
      </div>

      {/* Footer */}
      <footer className="home-footer">
        ProductLife AI · INT428 Artificial Intelligence Essentials · Groq × LLaMA 3.1 8B
      </footer>
    </div>
  );
}
