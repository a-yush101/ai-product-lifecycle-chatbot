const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const SYSTEM_PROMPT = `You are ProductLifeAI, a dual-domain expert that analyzes products from TWO perspectives simultaneously:

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
When a user asks about any product, ALWAYS respond in this exact structure:

📈 MARKET LIFECYCLE ANALYSIS
- Current Stage: [Introduction/Growth/Maturity/Decline]
- Market Position: [brief explanation]
- Business Insight: [1 actionable insight for businesses]

🌍 ENVIRONMENTAL LIFECYCLE ANALYSIS
- Critical Stage: [the most impactful LCA stage for this product]
- Environmental Impact: [key facts about footprint]
- Sustainability Tip: [1 practical advice]

⚡ COMBINED INSIGHT
[1-2 sentences connecting both perspectives]

[End with one follow-up question]

## RULES
- ONLY answer questions related to product lifecycles (business or environmental)
- If asked something unrelated, politely redirect to product analysis
- Keep responses concise but data-rich
- For comparison queries, apply the format to both products side by side`;

app.post("/api/chat", async (req, res) => {
  const { messages } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Invalid messages array" });
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY || "";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    const geminiContents = messages.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: geminiContents,
        generationConfig: {
          temperature: 0.3,
          topP: 0.9,
          maxOutputTokens: 1000,
        },
      }),
    });

    const data = await response.json();

    if (data.error) {
      return res.status(500).json({ error: data.error.message });
    }

    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "No response received.";
    res.json({ reply });
  } catch (err) {
    console.error("API Error:", err);
    res.status(500).json({ error: "Failed to connect to AI service." });
  }
});

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
