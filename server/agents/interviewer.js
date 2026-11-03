/**
 * AGENT 1 - Interviewer
 * Generates questions, picks difficulty, keeps flow, and writes adaptive follow-ups
 * using interview memory (earlier questions + answers).
 */
const { askJSON } = require("./llm");
const bank = require("./questionBank");

const memoryOf = (session) =>
  session.questions
    .filter((q) => q.answer)
    .slice(-4)
    .map((q) => ({ topic: q.topic, question: q.text, answerSummary: String(q.answer).slice(0, 220), score: q.evaluation?.score }));

async function nextQuestion(session) {
  const { language, type } = session.config;
  const difficulty = session.currentDifficulty;
  const asked = session.questions.map((q) => q.text);
  const askedTopics = [...new Set(session.questions.map((q) => q.topic))];

  try {
    const out = await askJSON(`You are a senior ${language} technical interviewer.
Interview type: ${type}. Difficulty: ${difficulty}.
Topics already covered: ${JSON.stringify(askedTopics)}.
Questions already asked (never repeat): ${JSON.stringify(asked)}.
Interview memory (recent answers): ${JSON.stringify(memoryOf(session))}.

${type === "Coding"
    ? "Ask exactly ONE short coding challenge that the candidate can solve in a small function. State the task and expected input/output clearly; do not ask for a spoken explanation instead of code."
    : "Ask exactly ONE new question on a topic not yet covered. It must be answerable out loud in 30-90 seconds, so do NOT ask the candidate to write long code."}
Keep it under 45 words, plain text, no markdown.
Return JSON: {"question": string, "topic": string (2-3 words)}`);
    if (!out.question) throw new Error("empty question");
    return { text: out.question, topic: out.topic || "General", difficulty, isFollowUp: false };
  } catch (e) {
    return fallbackQuestion(session);
  }
}

async function followUp(session, { concept, simplify = false, reason }) {
  const last = [...session.questions].reverse().find((q) => q.answer);
  const { language } = session.config;
  try {
    const out = await askJSON(`You are a ${language} technical interviewer conducting a spoken interview.
The candidate was asked: "${last.text}"
They answered: "${String(last.answer).slice(0, 600)}"
Their answer was missing or weak on: "${concept}".
${simplify
  ? "The candidate struggled badly. Ask ONE simpler follow-up on the same topic that rebuilds the basics."
  : "Ask ONE short follow-up that probes the missing concept, for example by asking for a concrete example."}
Keep it under 25 words, plain text, no markdown, speak directly to the candidate.
Return JSON: {"question": string}`);
    if (!out.question) throw new Error("empty follow-up");
    return {
      text: out.question,
      topic: last.topic,
      difficulty: simplify ? "beginner" : last.difficulty,
      isFollowUp: true,
      followUpReason: reason || concept,
    };
  } catch (e) {
    return {
      text: simplify
        ? `Let's go back to basics. In simple words, what is the core idea behind ${last.topic} in ${language}?`
        : `Can you explain ${concept} using a short ${language} example?`,
      topic: last.topic,
      difficulty: simplify ? "beginner" : last.difficulty,
      isFollowUp: true,
      followUpReason: reason || concept,
    };
  }
}

function fallbackQuestion(session) {
  const { language, type } = session.config;
  const used = new Set(session.questions.map((q) => q.text));
  const all = bank[language] || bank.Java;
  const level = session.currentDifficulty;
  const pick =
    all.find((b) => !used.has(b.q) && b.type === type && b.difficulty === level) ||
    all.find((b) => !used.has(b.q) && b.type === type) ||
    all.find((b) => !used.has(b.q)) ||
    all[Math.floor(Math.random() * all.length)];
  return {
    text: pick.q,
    topic: pick.topic,
    difficulty: pick.difficulty,
    isFollowUp: false,
    keys: pick.keys,
    expectedAnswer: pick.idealAnswer || "",
  };
}

module.exports = { nextQuestion, followUp };
