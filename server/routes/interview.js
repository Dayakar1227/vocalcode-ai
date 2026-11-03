const express = require("express");
const Session = require("../models/Session");
const orch = require("../agents/orchestrator");

const router = express.Router();
const LANGS = ["Java", "Python", "JavaScript"];
const LEVELS = ["beginner", "intermediate", "advanced"];
const TYPES = ["Technical", "OOP", "DSA", "Coding"];

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const bad = (msg, status = 400) => Object.assign(new Error(msg), { status });

async function load(sessionId) {
  if (!sessionId) throw bad("sessionId is required.");
  const s = await Session.findOne({ sessionId });
  if (!s) throw bad("Interview not found.", 404);
  return s;
}

const publicSession = (s) => ({
  sessionId: s.sessionId,
  config: s.config,
  status: s.status,
  currentDifficulty: s.currentDifficulty,
  questions: s.questions.map((q) => ({
    id: q._id,
    text: q.text,
    topic: q.topic,
    difficulty: q.difficulty,
    isFollowUp: q.isFollowUp,
    followUpReason: q.followUpReason,
    answer: q.answer,
    evaluation: q.evaluation,
  })),
  progress: orch.progress(s),
  createdAt: s.createdAt,
  finishedAt: s.finishedAt,
});

const publicQuestion = (q) =>
  q && { id: q._id, text: q.text, topic: q.topic, difficulty: q.difficulty, isFollowUp: q.isFollowUp, followUpReason: q.followUpReason };

// List interviews (history)
router.get(
  "/",
  wrap(async (req, res) => {
    const list = await Session.find().sort({ createdAt: -1 }).limit(100);
    res.json(
      list.map((s) => ({
        sessionId: s.sessionId,
        config: s.config,
        status: s.status,
        overall: s.report?.overall ?? null,
        answered: s.questions.filter((q) => q.answer).length,
        createdAt: s.createdAt,
      }))
    );
  })
);

// Start interview (also generates the first question)
router.post(
  "/start",
  wrap(async (req, res) => {
    const { language, difficulty, type = "Technical", total = 5 } = req.body;
    if (!LANGS.includes(language)) throw bad(`language must be one of ${LANGS.join(", ")}`);
    if (!LEVELS.includes(difficulty)) throw bad(`difficulty must be one of ${LEVELS.join(", ")}`);
    if (!TYPES.includes(type)) throw bad(`type must be one of ${TYPES.join(", ")}`);
    const n = Number(total);
    if (![3, 5, 10].includes(n)) throw bad("total must be 3, 5 or 10.");
    const s = await orch.startInterview({ language, difficulty, type, total: n });
    res.status(201).json(publicSession(s));
  })
);

// Generate next question
router.post(
  "/question",
  wrap(async (req, res) => {
    const s = await load(req.body.sessionId);
    const { question, done } = await orch.nextQuestion(s);
    res.json({ question: publicQuestion(question), done, progress: orch.progress(s) });
  })
);

// Submit answer -> evaluate -> adapt -> next question
router.post(
  "/answer",
  wrap(async (req, res) => {
    const { sessionId, answer } = req.body;
    if (!answer || String(answer).trim().length < 3) throw bad("Please give an answer first.");
    const s = await load(sessionId);
    if (s.status === "completed") throw bad("This interview is already completed.");
    const maxLength = s.config.type === "Coding" ? 20000 : 4000;
    const out = await orch.submitAnswer(s, String(answer).slice(0, maxLength));
    res.json({ ...out, next: publicQuestion(out.next) });
  })
);

// Force an adaptive follow-up
router.post(
  "/followup",
  wrap(async (req, res) => {
    const s = await load(req.body.sessionId);
    const { question } = await orch.forceFollowUp(s);
    res.json({ question: publicQuestion(question), progress: orch.progress(s) });
  })
);

// Finish -> report
router.post(
  "/finish",
  wrap(async (req, res) => {
    const s = await load(req.body.sessionId);
    const report = await orch.finish(s);
    res.json({ sessionId: s.sessionId, report });
  })
);

router.get(
  "/:id",
  wrap(async (req, res) => {
    res.json(publicSession(await load(req.params.id)));
  })
);

router.delete(
  "/:id",
  wrap(async (req, res) => {
    const r = await Session.deleteOne({ sessionId: req.params.id });
    if (!r.deletedCount) throw bad("Interview not found.", 404);
    res.json({ ok: true });
  })
);

module.exports = router;
