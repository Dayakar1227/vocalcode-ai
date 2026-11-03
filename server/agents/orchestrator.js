/**
 * AI ORCHESTRATOR
 * Coordinates the four agents for each interview turn.
 *
 * Turn flow for POST /answer:
 *  1. Evaluator Agent  -> scores the spoken answer, finds missing concepts
 *  2. Learning Agent   -> updates weak topics, adapts difficulty, decides follow-up vs next topic
 *  3. Interviewer Agent-> generates the follow-up or next question (using interview memory)
 *  4. Report Agent     -> runs on finish, consuming everything saved in MongoDB
 */
const { v4: uuid } = require("uuid");
const Session = require("../models/Session");
const interviewer = require("./interviewer");
const evaluator = require("./evaluator");
const learner = require("./learner");
const reporter = require("./reporter");

const pending = (s) => s.questions.find((q) => !q.answer);
const mainAnswered = (s) => s.questions.filter((q) => q.answer && !q.isFollowUp).length;

function progress(s) {
  return { answered: mainAnswered(s), total: s.config.total, asked: s.questions.length };
}

async function startInterview(config) {
  const session = new Session({
    sessionId: uuid(),
    config,
    currentDifficulty: config.difficulty,
  });
  const q = await interviewer.nextQuestion(session);
  session.questions.push(q);
  await session.save();
  return session;
}

async function nextQuestion(session) {
  const open = pending(session);
  if (open) return { question: open, done: false };
  if (mainAnswered(session) >= session.config.total) return { question: null, done: true };
  const q = await interviewer.nextQuestion(session);
  session.questions.push(q);
  await session.save();
  return { question: session.questions.at(-1), done: false };
}

async function submitAnswer(session, answer) {
  const current = pending(session);
  if (!current) throw Object.assign(new Error("No open question to answer."), { status: 400 });

  current.answer = answer.trim();
  current.answeredAt = new Date();

  // 1. Evaluator
  current.evaluation = await evaluator.evaluate({ question: current, session });

  // 2. Learning agent
  const plan = learner.analyse(session, current);
  session.currentDifficulty = plan.nextDifficulty;

  // 3. Interviewer (follow-up or next question)
  let next = null;
  const reachedEnd = mainAnswered(session) >= session.config.total;
  if (!reachedEnd && plan.followUp.needed) {
    next = await interviewer.followUp(session, plan.followUp);
  } else if (!reachedEnd) {
    next = await interviewer.nextQuestion(session);
  }
  if (next) session.questions.push(next);

  session.markModified("questions");
  await session.save();

  return {
    evaluation: current.evaluation,
    plan,
    next: next ? session.questions.at(-1) : null,
    done: !next,
    progress: progress(session),
  };
}

// Manually force a follow-up for the latest answered question (POST /followup)
async function forceFollowUp(session) {
  const last = [...session.questions].reverse().find((q) => q.answer);
  if (!last) throw Object.assign(new Error("Answer a question first."), { status: 400 });
  if (pending(session)) return { question: pending(session) };
  const concept = last.evaluation?.missingConcepts?.[0] || last.topic;
  const q = await interviewer.followUp(session, { concept, simplify: false, reason: `Manual follow-up on ${concept}` });
  session.questions.push(q);
  await session.save();
  return { question: session.questions.at(-1) };
}

async function finish(session) {
  if (session.status === "completed" && session.report) return session.report;
  // Drop an unanswered trailing question
  session.questions = session.questions.filter((q) => q.answer);
  if (!session.questions.length) {
    throw Object.assign(new Error("Answer at least one question before finishing."), { status: 400 });
  }
  session.finishedAt = new Date();
  session.report = await reporter.buildReport(session);
  session.status = "completed";
  session.markModified("report");
  await session.save();
  return session.report;
}

module.exports = { startInterview, nextQuestion, submitAnswer, forceFollowUp, finish, progress };
