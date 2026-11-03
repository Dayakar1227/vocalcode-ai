/**
 * AGENT 3 - Adaptive Learning
 * Tracks weak topics, adapts difficulty and decides whether the NEXT turn is a follow-up.
 * Deterministic rules keep decisions fast and predictable during a live demo.
 */
const { avg, shiftLevel } = require("../utils/scoring");

function topicStats(session) {
  const map = {};
  session.questions
    .filter((q) => q.evaluation)
    .forEach((q) => {
      (map[q.topic] ||= []).push(q.evaluation.score);
    });
  return Object.entries(map)
    .map(([topic, scores]) => ({ topic, score: Math.round(avg(scores)), attempts: scores.length }))
    .sort((a, b) => a.score - b.score);
}

function analyse(session, current) {
  const ev = current.evaluation;
  const answered = session.questions.filter((q) => q.evaluation);
  const recent = answered.slice(-2).map((q) => q.evaluation.score);
  const recentAvg = avg(recent);

  // Adaptive difficulty
  let delta = 0;
  if (recent.length && recentAvg >= 80) delta = 1;
  else if (recent.length && recentAvg <= 40) delta = -1;
  const nextDifficulty = shiftLevel(session.currentDifficulty, delta);

  const stats = topicStats(session);
  const weakTopics = stats.filter((t) => t.score < 60).map((t) => t.topic);

  // Follow-up decision (at most one follow-up per main question)
  let followUp = { needed: false };
  if (!current.isFollowUp) {
    if (ev.correctness <= 3) {
      followUp = {
        needed: true,
        simplify: true,
        concept: ev.missingConcepts[0] || current.topic,
        reason: `Weak understanding of ${current.topic} - rebuilding the basics`,
      };
    } else if (ev.missingConcepts.length && ev.score < 85) {
      followUp = {
        needed: true,
        simplify: false,
        concept: ev.missingConcepts[0],
        reason: `Missing concept: ${ev.missingConcepts[0]}`,
      };
    }
  }

  return {
    weakTopics,
    topicStats: stats,
    currentDifficulty: session.currentDifficulty,
    nextDifficulty,
    difficultyChange: delta === 0 ? "same" : delta > 0 ? "harder" : "easier",
    followUp,
  };
}

module.exports = { analyse, topicStats };
