// Runs the agents WITHOUT MongoDB (uses fallback if no API key). Usage: npm run test:agents
require("dotenv").config();
const interviewer = require("../agents/interviewer");
const evaluator = require("../agents/evaluator");
const learner = require("../agents/learner");
const reporter = require("../agents/reporter");

(async () => {
  const session = {
    config: { language: "Java", difficulty: "intermediate", type: "OOP", total: 3 },
    currentDifficulty: "intermediate",
    createdAt: new Date(),
    questions: [],
  };
  const q = await interviewer.nextQuestion(session);
  console.log("Q1:", q.text);
  q.answer = "Inheritance in Java allows one class to acquire properties and methods from another class.";
  session.questions.push(q);
  q.evaluation = await evaluator.evaluate({ question: q, session });
  console.log("Evaluation:", q.evaluation);
  const plan = learner.analyse(session, q);
  console.log("Plan:", JSON.stringify(plan, null, 2));
  if (plan.followUp.needed) {
    const f = await interviewer.followUp(session, plan.followUp);
    console.log("Follow-up:", f.text);
  }
  session.finishedAt = new Date();
  console.log("Report:", JSON.stringify(await reporter.buildReport(session), null, 2));
})();
