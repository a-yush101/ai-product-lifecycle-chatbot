# ProductLife AI — Product Lifecycle Chatbot
### INT428 · Artificial Intelligence Essentials

A domain-specific Generative AI chatbot that analyses any product through the lens of the **4-stage Business Product Lifecycle (PLC) model**. It classifies products into lifecycle stages, provides strategic business insights, and forecasts market trajectory — all powered by Groq's LLaMA 3.1 8B model.

---

## Features

- 🏠 **Landing page** — hero section, animated ambient glows, PLC model explainer, and feature overview
- 💬 **Chat interface** — structured 3-card bot responses (Lifecycle Analysis · Strategic Insights · Lifecycle Forecast)
- 🌓 **Dark / Light mode** — fully themed UI with smooth transitions, persisted to `localStorage`
- 📈 **ML Sales Forecasting** — integrated scikit-learn Linear Regression engine to predict sales trends from CSV data or mock scenarios
- 📊 **Interactive Analytics** — beautiful charts powered by Recharts showing historical vs. forecasted performance
- 🔒 **Domain-locked AI** — the system prompt strictly enforces business PLC analysis; off-topic queries are politely redirected

---

## The 4-Stage PLC Model

| # | Stage | Characteristics |
|---|-------|-----------------|
| 1 | **Introduction** | Low sales · High costs · Build awareness |
| 2 | **Growth** | Rising sales · New rivals · Expand fast |
| 3 | **Maturity** | Peak sales · Fierce competition · Defend & differentiate |
| 4 | **Decline** | Falling sales · Shrinking market · Reposition or exit |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18 + Vite 5 + Recharts |
| **Backend** | Node.js + Express 4 |
| **ML Engine** | Python 3 + Scikit-Learn + Pandas |
| **AI API** | [Groq Cloud](https://console.groq.com) — `llama-3.1-8b-instant` |
| **Styling** | Vanilla CSS (CSS custom properties / variables) |
| **Fonts** | DM Mono · Playfair Display · Inter (Google Fonts) |

---

## Project Structure

```
product-lifecycle-chatbot/
├── README.md
│
├── backend/
│   ├── server.js          ← Express server · Groq API integration · ML child process
│   ├── forecast.py        ← Python ML engine (Linear Regression)
│   ├── requirements.txt   ← Python dependencies
│   ├── model.pkl          ← Persisted ML model (generated)
│   ├── .env               ← GROQ_API_KEY (not committed)
│   ├── .env.example       ← env template
│   └── package.json
│
└── frontend/
    ├── index.html
    ├── vite.config.js
    ├── package.json
    └── src/
        ├── main.jsx       ← React entry point
        ├── App.jsx        ← Chat page · theme state · message parsing
        ├── App.css        ← CSS variables (dark + light) · chat UI styles
        ├── Home.jsx       ← Landing page component
        └── Home.css       ← Landing page styles · light-mode overrides
```

---

## How It Works

```
User types a query
      ↓
React frontend (App.jsx)
      ↓
POST /api/chat  →  Express backend (server.js)
      ↓
Groq API  →  LLaMA 3.1 8B
      (system prompt + full conversation history)
      ↓
Structured response (📈 / 📊 / 🔮 emoji anchors)
      ↓
Parsed into 3 colour-coded cards and displayed
```

### Response Format

The system prompt enforces a strict 3-section format. The frontend parses it by splitting on emoji anchors:

| Emoji | Section | Card colour |
|-------|---------|-------------|
| 📈 | Lifecycle Analysis | Amber / gold |
| 📊 | Strategic Insights | Blue |
| 🔮 | Lifecycle Forecast | Purple |

---

## Model Configuration

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| Model | `llama-3.1-8b-instant` | Fast, capable of structured business reasoning |
| Temperature | `0.3` | Low = consistent, factual lifecycle data |
| Top-p | `0.9` | Wide enough vocabulary for detailed explanations |
| Max Tokens | `1000` | Sufficient for all three analysis sections |
| Memory | Session-based | Full conversation history sent on each request |

---

## Setup & Running

### Prerequisites
- Node.js 18+
- Python 3.8+
- A free [Groq API key](https://console.groq.com)

### Step 1 — Backend
```bash
cd backend
npm install
# Install Python dependencies
pip install -r requirements.txt
cp .env.example .env
# Open .env and set: GROQ_API_KEY=gsk_...
node server.js
```
Server runs at **http://localhost:5000**

Health check: http://localhost:5000/api/health

### Step 2 — Frontend
```bash
cd frontend
npm install
npm run dev
```
App runs at **http://localhost:5173**

> Both the backend and frontend must be running simultaneously.

---

## API Reference

### `POST /api/chat`

Send a conversation and receive an AI-generated PLC analysis.

**Request body:**
```json
{
  "messages": [
    { "role": "user", "content": "Analyse the lifecycle of iPhone" }
  ]
}
```

**Response:**
```json
{
  "reply": "📈 LIFECYCLE ANALYSIS\n...\n📊 STRATEGIC INSIGHTS\n...\n🔮 LIFECYCLE FORECAST\n...",
  "model": "llama-3.1-8b-instant",
  "tokens_used": 487
}
```

### `POST /api/forecast`

Execute a machine learning forecast based on sales data.

**Request body:**
```json
{
  "productName": "Smartphone X",
  "data": [
    {"month": "Jan", "sales": 1200},
    {"month": "Feb", "sales": 1500}
  ]
}
```

**Response:**
```json
{
  "forecast": [...],
  "trend": "upward",
  "growth_rate": 300,
  "analysis": "Based on the growth trend, the product is in the Growth stage..."
}
```

### `GET /api/health`
Returns `{ "status": "ok" }` when the server is running.

---

## Theme System

Themes are implemented entirely via **CSS custom properties** scoped to a `data-theme` attribute:

- `data-theme="dark"` → default dark palette (near-black surfaces, bright accent colours)
- `data-theme="light"` → light palette (off-white surfaces, solid tinted card backgrounds, high-contrast text)

The chosen theme is **persisted to `localStorage`** under the key `plc-theme` and applied on every page load. A toggle button is present in both the home nav and the chat header.

---

## Deployment

| Part | Platform | Notes |
|------|----------|-------|
| **Frontend** | [Vercel](https://vercel.com) | `npm run build` → deploy `dist/` |
| **Backend** | [Render](https://render.com) | Free tier · set `GROQ_API_KEY` as an env var |

When deploying, update the `API` base URL in `App.jsx` from `http://127.0.0.1:5000` to your deployed backend URL.

---

## Project Info

| Field | Value |
|-------|-------|
| **Course** | INT428 — Artificial Intelligence Essentials |
| **Domain** | Business Strategy / Product Marketing |
| **Chatbot Type** | Generative (LLM-based) |
| **AI Role** | Domain Expert — Product Lifecycle Analyst |
| **PLC Model** | 4-stage Business Product Lifecycle (Introduction → Growth → Maturity → Decline) |
