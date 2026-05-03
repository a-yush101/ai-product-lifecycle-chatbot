require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { exec } = require("child_process");
const path = require("path");

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
const SYSTEM_PROMPT = `You are ProductLifeAI, a specialist in Business Product Lifecycle Management (PLM). You analyze products strictly through the lens of the 4-stage Product Lifecycle model used in marketing and business strategy.

## THE PRODUCT LIFECYCLE — 4 STAGES

- Introduction: Product enters market. Low sales, high costs, minimal competition, focus on creating awareness and educating consumers.
- Growth: Rapid sales increase, new competitors enter, brand loyalty builds, profits start rising, market expands.
- Maturity: Sales peak and stabilize, fierce competition, price wars, focus shifts to differentiation, retention, and market share defense.
- Decline: Sales fall, market shrinks, competitors exit, product may be discontinued, harvested, or repositioned.

## KEY ANALYSIS DIMENSIONS

For each product consider:
- Sales Trajectory: Rising / Peaked / Falling
- Competition Level: Low / Moderate / Intense / Diminishing
- Marketing Focus: Awareness / Penetration / Differentiation / Harvesting
- Pricing Strategy: Skimming / Competitive / Defensive / Discounting
- Profit Margin Trend: Growing / High / Compressing / Shrinking
- Strategic Options: Invest / Grow / Defend / Reposition / Divest

## YOUR RESPONSE FORMAT

FOR INITIAL PRODUCT ANALYSES, you MUST use the following strict format:

🌟 PRODUCT INTRODUCTION
- Description: [A brief, 1-2 sentence overview of what the product is and its primary value proposition]
- Target Market: [Who the product is primarily for]

📈 LIFECYCLE ANALYSIS
- Current Stage: [Introduction / Growth / Maturity / Decline]
- Sales Trend: [description with supporting reasoning]
- Competition Level: [Low / Moderate / Intense / Diminishing — explain why]
- Profit Outlook: [brief financial perspective]

📊 STRATEGIC INSIGHTS
- Core Challenge: [the #1 challenge at this lifecycle stage]
- Recommended Strategy: [2–3 concrete, actionable business strategies]
- Pricing Approach: [what pricing tactic fits this stage]

🔮 LIFECYCLE FORECAST
- Next Stage: [predicted stage and rough timeline estimate]
- Risk Factors: [2 key things that could accelerate stage transition]
- Opportunity Window: [the key opportunity to act on right now]

❓ FOLLOW-UP
[One short, sharp follow-up question (max 15 words) about the product's strategy]

FOR FOLLOW-UP QUESTIONS (e.g., asking for more details on a specific strategy, clarifying a concept, or answering your follow-up question):
Respond conversationally and directly to the user's question. Do NOT use the 4-stage emoji format above. Keep your response insightful, concise, and focused on business strategy.

## RULES

- CRITICAL BOUNDARY: You are a strict Business and Product Lifecycle expert. You MUST ONLY answer questions related to business, marketing, product strategy, and lifecycles.
- If the user asks about ANYTHING else (e.g., geography, general knowledge, currencies, coding, weather, etc.), you MUST politely decline and redirect them to ask about a product's lifecycle. Do NOT answer the irrelevant question.
- If asked about environmental or sustainability topics, politely clarify your focus is business PLC.
- Keep responses concise but data-rich and insightful.
- For comparison queries, compare both products side-by-side across all three sections.
- Always justify your stage classification with real market reasoning.`;

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
    let optimizedMessages = messages;
    if (messages.length > 6) {
      // Keep the first 2 messages (initial analysis) and the last 4 messages (recent context)
      optimizedMessages = [
        ...messages.slice(0, 2),
        ...messages.slice(-4)
      ];
    }

    const chatMessages = [
      {
        role: "system",
        content: SYSTEM_PROMPT,
      },
      ...optimizedMessages.map((msg) => ({
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
          top_p: 0.9,
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
   FORECAST ROUTE
================================= */
app.post("/api/forecast", (req, res) => {
  console.log("📈 Forecast request received");
  const { data, productName } = req.body;
  if (!data || !Array.isArray(data)) {
    return res.status(400).json({ error: "Invalid data array" });
  }

  const pythonExec = path.join(__dirname, 'venv', 'bin', 'python3');
  const scriptPath = path.join(__dirname, 'forecast.py');
  
  // Stringify and escape JSON for the command line
  const jsonData = JSON.stringify(data).replace(/"/g, '\\"');
  
  const runPython = (cmd) => {
    return new Promise((resolve, reject) => {
      exec(cmd, (error, stdout, stderr) => {
        if (error) {
          reject({ error, stderr });
        } else {
          resolve(stdout);
        }
      });
    });
  };

  runPython(`"${pythonExec}" "${scriptPath}" "${jsonData}"`)
    .catch(() => runPython(`python3 "${scriptPath}" "${jsonData}"`))
    .then(async (stdout) => {
      let pyResult;
      try {
        pyResult = JSON.parse(stdout);
        if (pyResult.error) {
          return res.status(500).json({ error: pyResult.error });
        }
      } catch (err) {
        return res.status(500).json({ error: "Failed to parse python output" });
      }

      const prompt = `You are a Product Lifecycle (PLC) expert and strategic business analyst. We have performed a linear regression forecast for ${productName || 'the product'}. 
Historical Data: ${JSON.stringify(data)}
Forecast (Next 3 periods): ${JSON.stringify(pyResult.forecast)}
Trend: ${pyResult.trend} (Growth rate: ${pyResult.growth_rate})

Based strictly on this data, provide a short, professional analysis (max 3 short paragraphs).
1. Classify the product into one of the 4 PLC stages (Introduction, Growth, Maturity, or Decline) based on the historical trend and forecast growth rate. Briefly explain your reasoning.
2. Discuss what these forecasted numbers mean for the business's market position.
3. Recommend 2 concrete, actionable strategies appropriate for this specific lifecycle stage.
DO NOT use emojis. Format it clearly using bold headings.`;

      try {
        console.log("🚀 Sending forecast analysis to Groq...");
        const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${GROQ_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: GROQ_MODEL,
            messages: [{ role: "user", content: prompt }],
            temperature: 0.3,
            max_tokens: 600,
          }),
        });

        const groqData = await groqRes.json();
        if (!groqRes.ok || groqData.error) {
          throw new Error(groqData.error?.message || "Groq API request failed");
        }

        const analysis = groqData.choices?.[0]?.message?.content || "No analysis available.";
        
        return res.json({
          forecastData: pyResult,
          analysis: analysis
        });

      } catch (llmErr) {
        console.error("❌ Groq Error in Forecast:", llmErr);
        return res.json({
          forecastData: pyResult,
          analysis: "LLM analysis failed. Please review the forecast data manually."
        });
      }
    })
    .catch((err) => {
      console.error(`exec error:`, err);
      return res.status(500).json({ error: "Failed to run python script" });
    });
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