const express = require("express");
const Session = require("../models/Session");
const { avg } = require("../utils/scoring");

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const done = await Session.find({ status: "completed" }).sort({ finishedAt: 1 });
    const trend = done.map((s) => ({
      sessionId: s.sessionId,
      date: s.finishedAt,
      score: s.report.overall,
      language: s.config.language,
    }));

    const topics = {};
    done.forEach((s) =>
      (s.report.topicScores || []).forEach((t) => (topics[t.topic] ||= []).push(t.score))
    );
    const topicList = Object.entries(topics)
      .map(([topic, scores]) => ({ topic, score: Math.round(avg(scores)) }))
      .sort((a, b) => b.score - a.score);

    const inProgress = await Session.countDocuments({ status: "in_progress" });
    const scores = trend.map((t) => t.score);

    res.json({
      totalInterviews: done.length,
      inProgress,
      averageScore: Math.round(avg(scores)),
      bestScore: scores.length ? Math.max(...scores) : 0,
      strongest: topicList[0] || null,
      weakest: topicList.length > 1 ? topicList.at(-1) : null,
      topics: topicList,
      trend: trend.slice(-12),
      recent: [...done].reverse().slice(0, 5).map((s) => ({
        sessionId: s.sessionId,
        language: s.config.language,
        difficulty: s.config.difficulty,
        type: s.config.type,
        overall: s.report.overall,
        finishedAt: s.finishedAt,
      })),
    });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
