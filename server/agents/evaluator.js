/**
 * AGENT 2 - Answer Evaluator
 * Semantic evaluation (meaning, not keyword matching): correctness, conceptual depth,
 * clarity, missing concepts, feedback. Falls back to a keyword heuristic if the LLM is down.
 */
const { askJSON } = require("./llm");
const { clamp, weightedScore } = require("../utils/scoring");

async function evaluate({ question, session }) {
  const { language, type } = session.config;
  const isCoding = type === "Coding";
  try {
    const out = await askJSON(`You are a strict but fair ${language} interviewer evaluating ${isCoding ? "a source-code submission" : "a spoken answer transcribed by speech recognition"}.
${isCoding ? "Judge whether the code solves the problem, including correctness, edge cases, and complexity." : "Ignore minor transcription errors and filler words. Judge the meaning, not keyword matching."}
Interview type: ${type}. Question difficulty: ${question.difficulty}.

Question: ${question.text}
Candidate ${isCoding ? "code submission" : "answer"}: ${question.answer}

Scoring (integers 0-10):
- correctness: ${isCoding ? "does the code solve the stated task and handle relevant cases?" : "is what they said technically right?"}
- conceptual: ${isCoding ? "is the approach appropriate, efficient, and well-structured?" : "depth of understanding, coverage of key concepts, examples"}
- clarity: ${isCoding ? "is the code readable and appropriately organized?" : "structure and communication of the explanation"}
List missingConcepts (max 3, short noun phrases) that a strong response would include and the candidate omitted.
"idealAnswer" is a concise correction with a model answer${isCoding ? " or a short code solution" : ""}. "feedback" is 2 specific, encouraging sentences spoken directly to the candidate.
Return JSON: {"correctness":int,"conceptual":int,"clarity":int,"missingConcepts":[string],"strengths":[string],"feedback":string,"idealAnswer":string}`);
    return normalise(out, "ai");
  } catch (e) {
    return heuristic(question);
  }
}

function normalise(out, source) {
  const ev = {
    correctness: clamp(out.correctness, 0, 10),
    conceptual: clamp(out.conceptual, 0, 10),
    clarity: clamp(out.clarity, 0, 10),
    missingConcepts: (out.missingConcepts || []).map(String).slice(0, 3),
    strengths: (out.strengths || []).map(String).slice(0, 3),
    feedback: String(out.feedback || "Thanks for your answer."),
    idealAnswer: String(out.idealAnswer || ""),
    source,
  };
  ev.score = weightedScore(ev);
  return ev;
}

function heuristic(question) {
  const text = String(question.answer || "").toLowerCase();
  const keys = question.keys?.length ? question.keys : [];
  const hit = keys.filter((k) => text.includes(k.toLowerCase()));
  const missing = keys.filter((k) => !hit.includes(k));
  const words = text.split(/\s+/).filter(Boolean).length;
  const coverage = keys.length ? hit.length / keys.length : Math.min(1, words / 40);
  const base = Math.round(coverage * 8 + (words > 25 ? 2 : words > 10 ? 1 : 0));
  return normalise(
    {
      correctness: base,
      conceptual: Math.max(0, base - 1),
      clarity: words > 15 ? Math.min(10, base + 1) : Math.max(2, base - 1),
      missingConcepts: missing.slice(0, 3),
      strengths: hit.slice(0, 2),
      feedback: missing.length
        ? `You covered the basics, but you didn't mention ${missing.slice(0, 2).join(" or ")}. Try adding an example.`
        : "That was a thorough answer. Nicely explained.",
      idealAnswer: question.expectedAnswer || (keys.length ? `A strong answer should cover: ${keys.join(", ")}.` : ""),
    },
    "fallback"
  );
}

module.exports = { evaluate };
