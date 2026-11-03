/**
 * AGENT 4 - Report
 * Computes scores locally (reliable, auditable) and asks the LLM only for the narrative:
 * summary, strengths, weaknesses, learning plan, personalised practice questions.
 */
const { askJSON } = require("./llm");
const { avg } = require("../utils/scoring");
const { topicStats } = require("./learner");

async function buildReport(session) {
  const answered = session.questions.filter((q) => q.evaluation);
  const evs = answered.map((q) => q.evaluation);

  const correctness = Math.round(avg(evs.map((e) => e.correctness)) * 10);
  const conceptual = Math.round(avg(evs.map((e) => e.conceptual)) * 10);
  const clarity = Math.round(avg(evs.map((e) => e.clarity)) * 10);
  const overall = Math.round(avg(evs.map((e) => e.score)));
  const topicScores = topicStats(session).sort((a, b) => b.score - a.score);
  const weakTopics = topicScores.filter((t) => t.score < 60).map((t) => t.topic);
  const durationSec = Math.max(
    0,
    Math.round(((session.finishedAt || new Date()) - new Date(session.createdAt)) / 1000)
  );

  const digest = answered.map((q) => ({
    topic: q.topic,
    followUp: q.isFollowUp,
    score: q.evaluation.score,
    missing: q.evaluation.missingConcepts,
    strengths: q.evaluation.strengths,
  }));

  let narrative;
  try {
    narrative = await askJSON(`You are a career coach writing the final report of a spoken ${session.config.language} interview
(${session.config.type}, ${session.config.difficulty}). Overall score: ${overall}/100.
Per-answer digest: ${JSON.stringify(digest)}
Topic scores: ${JSON.stringify(topicScores)}

Return JSON: {
 "summary": string (2-3 encouraging, honest sentences),
 "strengths": [string] (max 4),
 "weaknesses": [string] (max 4),
 "studyPlan": [string] (4-5 concrete, ordered study actions),
 "practiceQuestions": [{"topic": string, "question": string, "level": "easier"|"same"|"harder"}] (3-4, targeted at weak topics)
}`);
  } catch (e) {
    narrative = null;
  }

  const fallbackWeak = weakTopics.length ? weakTopics : topicScores.slice(-1).map((t) => t.topic);
  const report = {
    overall,
    correctness,
    conceptual,
    clarity,
    topicScores,
    weakTopics,
    questionsAnswered: answered.length,
    durationSec,
    summary:
      narrative?.summary ||
      `You scored ${overall}/100 across ${answered.length} answers. Keep practising your weaker topics and add concrete examples to your answers.`,
    strengths:
      narrative?.strengths ||
      topicScores.filter((t) => t.score >= 70).map((t) => `Solid understanding of ${t.topic}`),
    weaknesses:
      narrative?.weaknesses ||
      [...new Set(evs.flatMap((e) => e.missingConcepts))].slice(0, 4).map((c) => `Missing detail: ${c}`),
    studyPlan:
      narrative?.studyPlan ||
      fallbackWeak.map((t, i) => `${i + 1}. Revise ${t} and practise explaining it out loud with an example.`),
    practiceQuestions:
      narrative?.practiceQuestions ||
      fallbackWeak.map((t) => ({ topic: t, question: `Explain ${t} in ${session.config.language} with an example.`, level: "easier" })),
    generatedBy: narrative ? "ai" : "fallback",
  };

  report.spokenSummary = `Interview complete. Your overall score is ${overall} out of 100. ${report.summary} ${
    report.weakTopics.length ? `Focus next on ${report.weakTopics.slice(0, 3).join(", ")}.` : "Great work across all topics."
  }`;
  return report;
}

module.exports = { buildReport };
