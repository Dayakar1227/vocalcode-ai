const LEVELS = ["beginner", "intermediate", "advanced"];

const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, Number.isFinite(+n) ? +n : lo));
const avg = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);

// Weighted per-answer score on a 0-100 scale
function weightedScore({ correctness, conceptual, clarity }) {
  return Math.round((correctness * 0.5 + conceptual * 0.3 + clarity * 0.2) * 10);
}

function shiftLevel(level, delta) {
  const i = LEVELS.indexOf(level);
  return LEVELS[clamp((i < 0 ? 1 : i) + delta, 0, LEVELS.length - 1)];
}

module.exports = { LEVELS, clamp, avg, weightedScore, shiftLevel };
