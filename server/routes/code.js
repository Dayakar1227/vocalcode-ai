const express = require("express");

const router = express.Router();
const LANGUAGES = {
  Java: { language: "java", versionIndex: "5" },
  Python: { language: "python3", versionIndex: "5" },
  JavaScript: { language: "nodejs", versionIndex: "5" },
};

router.post("/run", async (req, res, next) => {
  try {
    const { language, code, stdin = "" } = req.body || {};
    if (!Object.hasOwn(LANGUAGES, language)) {
      return res.status(400).json({ error: "Choose Java, Python, or JavaScript." });
    }
    if (typeof code !== "string" || code.trim().length < 1 || code.length > 20000) {
      return res.status(400).json({ error: "Code must contain 1 to 20,000 characters." });
    }
    if (typeof stdin !== "string" || stdin.length > 4000) {
      return res.status(400).json({ error: "Input must be 4,000 characters or fewer." });
    }

    const clientId = process.env.JDOODLE_CLIENT_ID;
    const clientSecret = process.env.JDOODLE_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      return res.status(503).json({
        error: "Online code execution is not configured. Create a free JDoodle Compiler API account, add JDOODLE_CLIENT_ID and JDOODLE_CLIENT_SECRET to server/.env, and restart the API.",
      });
    }

    const response = await fetch("https://api.jdoodle.com/v1/execute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId,
        clientSecret,
        script: code,
        language: LANGUAGES[language].language,
        versionIndex: LANGUAGES[language].versionIndex,
        stdin,
      }),
      signal: AbortSignal.timeout(20000),
    });

    const result = await response.json();
    if (!response.ok) {
      const status = response.status === 429 ? 429 : 502;
      return res.status(status).json({
        error: result.error || result.message || (status === 429
          ? "The JDoodle daily free execution limit has been reached. Try again after the daily reset."
          : "The code runner rejected the request."),
      });
    }
    res.json({
      status: result.error ? "Error" : "Completed",
      output: result.output || result.error || "",
      time: result.cpuTime || null,
      memory: result.memory || null,
    });
  } catch (error) {
    if (error.name === "TimeoutError" || error.name === "AbortError") {
      return res.status(504).json({ error: "The code runner timed out. Try a smaller program." });
    }
    next(error);
  }
});

module.exports = router;
