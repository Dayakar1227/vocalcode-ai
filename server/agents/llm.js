const { GoogleGenerativeAI } = require("@google/generative-ai");

let model = null;
function getModel() {
  if (!process.env.GEMINI_API_KEY) return null;
  if (!model) {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    model = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
      generationConfig: { responseMimeType: "application/json", temperature: 0.7 },
    });
  }
  return model;
}

const withTimeout = (p, ms) =>
  Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error("LLM timeout")), ms))]);

function parseJSON(text) {
  const cleaned = String(text).replace(/```json|```/g, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const m = cleaned.match(/\{[\s\S]*\}/);
    if (m) return JSON.parse(m[0]);
    throw new Error("LLM returned invalid JSON");
  }
}

/**
 * Ask Gemini for a JSON object. Retries once. Throws if unavailable,
 * so every agent can fall back to a deterministic path (the demo never breaks).
 */
async function askJSON(prompt, { timeoutMs = 25000, retries = 1 } = {}) {
  const m = getModel();
  if (!m) throw new Error("GEMINI_API_KEY not configured");
  let lastErr;
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await withTimeout(m.generateContent(prompt), timeoutMs);
      return parseJSON(res.response.text());
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr;
}

module.exports = { askJSON, hasLLM: () => !!process.env.GEMINI_API_KEY };
