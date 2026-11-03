const mongoose = require("mongoose");

const EvaluationSchema = new mongoose.Schema(
  {
    correctness: Number,
    conceptual: Number,
    clarity: Number,
    score: Number, // 0-100 weighted
    missingConcepts: [String],
    strengths: [String],
    feedback: String,
    idealAnswer: String,
    source: { type: String, default: "ai" }, // "ai" | "fallback"
  },
  { _id: false }
);

const QuestionSchema = new mongoose.Schema(
  {
    text: { type: String, required: true },
    topic: { type: String, default: "General" },
    difficulty: { type: String, default: "intermediate" },
    isFollowUp: { type: Boolean, default: false },
    followUpReason: String,
    keys: [String], // fallback evaluator hints
    expectedAnswer: String,
    answer: String,
    evaluation: EvaluationSchema,
    askedAt: { type: Date, default: Date.now },
    answeredAt: Date,
  },
  { _id: true }
);

const SessionSchema = new mongoose.Schema(
  {
    sessionId: { type: String, required: true, unique: true, index: true },
    config: {
      language: { type: String, enum: ["Java", "Python", "JavaScript"], required: true },
      difficulty: { type: String, enum: ["beginner", "intermediate", "advanced"], required: true },
      type: { type: String, enum: ["Technical", "OOP", "DSA", "Coding"], default: "Technical" },
      total: { type: Number, default: 5 },
    },
    currentDifficulty: { type: String, default: "intermediate" },
    questions: [QuestionSchema],
    status: { type: String, enum: ["in_progress", "completed"], default: "in_progress" },
    report: mongoose.Schema.Types.Mixed,
    finishedAt: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Session", SessionSchema);
