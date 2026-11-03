const express = require("express");
const Session = require("../models/Session");

const router = express.Router();

router.get("/:id", async (req, res, next) => {
  try {
    const s = await Session.findOne({ sessionId: req.params.id });
    if (!s) return res.status(404).json({ error: "Interview not found." });
    if (!s.report) return res.status(409).json({ error: "Interview not finished yet." });
    res.json({
      sessionId: s.sessionId,
      config: s.config,
      createdAt: s.createdAt,
      finishedAt: s.finishedAt,
      report: s.report,
      questions: s.questions.map((q) => ({
        text: q.text,
        topic: q.topic,
        isFollowUp: q.isFollowUp,
        followUpReason: q.followUpReason,
        answer: q.answer,
        evaluation: q.evaluation,
      })),
    });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
