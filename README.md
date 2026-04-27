# LifeCycle AI — Product Lifecycle Chatbot
### INT428 - AI Essentials Project

A domain-specific Generative AI chatbot for tracking product lifecycles across 6 stages:
**Raw Materials → Manufacturing → Distribution → Consumer Use → End of Life → Recycling**

---

## Tech Stack
- **Frontend:** React.js + Vite
- **Backend:** Node.js + Express
- **AI API:** Anthropic Claude API (claude-sonnet-4-20250514)
- **Model Config:** Temperature: 0.3 | Top-p: 0.9

---

## Project Structure
```
product-lifecycle-chatbot/
├── frontend/          ← React app
│   ├── src/
│   │   ├── App.jsx    ← Main chatbot UI
│   │   ├── App.css    ← Styling
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
└── backend/           ← Express API server
    ├── server.js      ← API route + Claude integration
    └── package.json
```

---

## Setup & Run

### Step 1: Get Claude API Key
1. Go to https://console.anthropic.com
2. Create account → API Keys → Create Key
3. Copy the key

### Step 2: Setup Backend
```bash
cd backend
npm install
cp .env.example .env
# Edit .env and paste your API key: ANTHROPIC_API_KEY=sk-ant-...
node server.js
```
Backend runs at: http://localhost:5000

### Step 3: Setup Frontend
```bash
cd frontend
npm install
npm run dev
```
Open: http://localhost:5173

---

## How It Works (Data Flow)
```
User types question
      ↓
React frontend (App.jsx)
      ↓
POST /api/chat → Express backend (server.js)
      ↓
Anthropic Claude API (with system prompt + chat history)
      ↓
Response returned → displayed in chat
```

## Model Configuration Justification
| Parameter | Value | Reason |
|-----------|-------|--------|
| Temperature | 0.3 | Low = factual, consistent lifecycle data |
| Top-p | 0.9 | Broad enough for detailed explanations |
| Max Tokens | 1000 | Sufficient for detailed lifecycle answers |
| Memory | Session-based | Full conversation history sent each call |

## Deployment
- **Frontend:** Deploy to Vercel (`npm run build` → upload dist/)
- **Backend:** Deploy to Render.com (free tier, set env vars)

---

## Project Info
- **Course:** INT428 - Artificial Intelligence Essentials
- **Domain:** E-commerce / Supply Chain
- **Chatbot Type:** Generative (LLM-based)
- **Role Assigned:** Domain Expert (Product Lifecycle Analyst)
- **Thinking Level:** Intermediate (context-aware reasoning)
