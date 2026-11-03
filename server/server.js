require("dotenv").config();
const path = require("path");
const fs = require("fs");
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const { hasLLM } = require("./agents/llm");

const app = express();
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173" }));
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (req, res) =>
  res.json({ ok: true, llm: hasLLM() ? "gemini" : "fallback (no GEMINI_API_KEY)" })
);
app.use("/api/interview", require("./routes/interview"));
app.use("/api/report", require("./routes/report"));
app.use("/api/stats", require("./routes/stats"));
app.use("/api/code", require("./routes/code"));

// Serve the built React app in production (npm run build in /client)
const dist = path.join(__dirname, "..", "client", "dist");
if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.get(/^(?!\/api).*/, (req, res) => res.sendFile(path.join(dist, "index.html")));
}

app.use((req, res) => res.status(404).json({ error: "Not found." }));
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const status = err.status || (err.name === "ValidationError" ? 400 : 500);
  if (status === 500) console.error(err);
  res.status(status).json({ error: status === 500 ? "Something went wrong on the server." : err.message });
});

const PORT = process.env.PORT || 5000;
connectDB()
  .then(() =>
    app.listen(PORT, () => {
      console.log(`API running on http://localhost:${PORT}`);
      if (!hasLLM()) console.warn("GEMINI_API_KEY missing: running with offline fallback agents.");
    })
  )
  .catch((e) => {
    console.error("Could not connect to MongoDB:", e.message);
    process.exit(1);
  });
