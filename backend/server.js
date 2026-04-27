require("dotenv").config();

const express = require("express");
const cors = require("cors");

// Uncomment if Node <18
// const fetch = require("node-fetch");

const app = express();

app.use(cors());
app.use(express.json());

/* ===============================
   CONFIG
================================= */
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = "llama-3.1-8b-instant";

/* ===============================
   SYSTEM PROMPT
================================= */
const SYSTEM_PROMPT = `You are ProductLifeAI, a dual-domain expert that analyzes products from TWO perspectives simultaneously.

## PERSPECTIVE 1 — Business Product Lifecycle (Marketing)
The 4 market stages a product goes through:

- Introduction: New to market, low sales, high investment, building awareness
- Growth: Rising sales, competition entering, brand expansion
- Maturity: Peak market share, heavy competition, focus on differentiation/retention
- Decline: Falling sales, shrinking market, discontinuation approaching

## PERSPECTIVE 2 — Environmental Life Cycle Assessment (LCA)
The 6 physical stages of a product's existence:

- Raw Material Sourcing: Extraction, mining, farming, environmental cost
- Manufacturing: Factory processes, energy use, carbon footprint, labor
- Distribution: Packaging, logistics, shipping emissions
- Consumer Use: Usage patterns, lifespan, energy consumption, maintenance
- End of Life: Disposal, landfill, product lifespan estimation
- Recycling: Recyclability rating, circular economy potential, upcycling

## YOUR RESPONSE FORMAT

📈 MARKET LIFECYCLE ANALYSIS
- Current Stage: [Introduction/Growth/Maturity/Decline]
- Market Position: [brief explanation]
- Business Insight: [1 actionable insight]

🌍 ENVIRONMENTAL LIFECYCLE ANALYSIS
- Critical Stage: [most impactful stage]
- Environmental Impact: [key facts]
- Sustainability Tip: [1 practical advice]

⚡ COMBINED INSIGHT
[1-2 lines connecting both perspectives]

[End with one follow-up question]

## RULES

- ONLY answer product lifecycle related questions
- If unrelated query, politely redirect user
- Keep responses concise but rich
- For comparison queries, compare both products side by side`;

/* ===============================
   CHAT ROUTE
================================= */
app.post("/api/chat", async (req, res) => {
  console.log("📨 Chat request received");

  const { messages } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({
      error: "Invalid messages array",
    });
  }

  if (!GROQ_API_KEY) {
    return res.status(500).json({
      error: "GROQ_API_KEY not found in .env file",
    });
  }

  try {
    const chatMessages = [
      {
        role: "system",
        content: SYSTEM_PROMPT,
      },
      ...messages.map((msg) => ({
        role: msg.role === "assistant" ? "assistant" : "user",
        content: msg.content,
      })),
    ];

    console.log("🚀 Sending request to Groq...");

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: GROQ_MODEL,
          messages: chatMessages,
          temperature: 0.3,
          max_tokens: 1000,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok || data.error) {
      console.error("❌ Groq API Error:", data);

      return res.status(500).json({
        error: data.error?.message || "Groq API request failed",
      });
    }

    const reply =
      data.choices?.[0]?.message?.content ||
      "No response received.";

    console.log("✅ Reply sent");

    return res.json({
      reply,
      model: GROQ_MODEL,
      tokens_used: data.usage?.total_tokens || 0,
    });
  } catch (err) {
    console.error("❌ Server Error:", err);

    return res.status(500).json({
      error: "Failed to connect to Groq: " + err.message,
    });
  }
});

/* ===============================
   HEALTH CHECK
================================= */
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
  });
});

/* ===============================
   START SERVER
================================= */
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`✅ Server running on http://127.0.0.1:${PORT}`);
  console.log(`📡 Health check: http://127.0.0.1:${PORT}/api/health`);
});