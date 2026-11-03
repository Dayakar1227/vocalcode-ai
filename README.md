# VocalCode AI - Intelligent Coding Interview Trainer
*Speak. Think. Answer. Improve.*

A voice-based technical interviewer. It asks questions aloud, listens to your spoken answer,
evaluates the meaning of what you said, decides whether to ask a follow-up or change topic,
adapts difficulty, and produces a scored report with a study plan. Coding interviews include
a code editor, a code runner, and code review.

**Flow:** voice input -> AI understanding -> real action (evaluation + saved report) -> voice output.

## Quick start

Requirements: Node 18+, MongoDB (local or Atlas), Chrome or Edge. A Gemini API key improves
answer quality but is optional. Running code uses JDoodle's free Compiler API plan (20 runs/day)
and requires JDoodle client credentials.

```bash
npm run install:all
cp server/.env.example server/.env      # then edit: GEMINI_API_KEY, MONGODB_URI
npm run dev                             # API on :5000, web app on :5173
```
Open http://localhost:5173 and allow the microphone and camera when starting an interview.
Spoken interviews run hands-free: after each question the app listens, submits the answer
after four seconds of silence, speaks feedback, and continues automatically. Speech recognition
must be supported and available in the browser; if it fails, use the manual transcript controls.
Coding interviews remain manual because code is written in the editor.

Production-style single server: `npm run build && npm start` (Express serves `client/dist`).

Check `http://localhost:5000/api/health`: it reports `gemini` or `fallback`.
Without a Gemini key the agents run an offline fallback (keyword scoring, built-in question bank)
so the interview still works, but scores are approximate. To enable code execution, create a
free [JDoodle Compiler API account](https://www.jdoodle.com/compiler-api/) (the free API plan
currently provides 20 executions per day). On Windows, run
`powershell -ExecutionPolicy Bypass -File .\server\scripts\setup-jdoodle.ps1` from the project
root. The script prompts for your client ID and a hidden client secret and saves them to the
git-ignored `server/.env`. The dev server watches that file and restarts automatically. Never
put credentials in the React app, share them in chat, or commit them.

The code runner sends submitted source code and optional stdin to JDoodle for execution. Do not
submit secrets or private code. Camera preview and face-presence checks run locally in the
browser; video and face data are not recorded or sent. Presence checks can be inaccurate and
are not a way to determine cheating.

## Deploy to Render

This repository includes a Render Blueprint (`render.yaml`) for one Node web service that
serves both the built frontend and API on Render's free service tier. The free service may
sleep when idle. Interview data must be stored in an external MongoDB deployment such as
MongoDB Atlas; the local MongoDB URI does not work on Render.

1. Push this project to GitHub and connect that repository to Render.
2. In Render, create a new Blueprint from the repository and apply `render.yaml`.
3. Create an Atlas database and set `MONGODB_URI` in the Render service's environment.
   Never commit the URI or other credentials. Use the Atlas network access rules appropriate
   for your cluster and Render plan.
4. Optionally configure `GEMINI_API_KEY`, `GEMINI_MODEL`, `JDOODLE_CLIENT_ID`, and
   `JDOODLE_CLIENT_SECRET` in Render's environment settings. Do not add these to GitHub or
   the frontend. The public demo API has no sign-in or rate limits; anyone can use configured
   service quota and read or delete shared interview records. Set provider quotas and do not
   enter personal or sensitive information.

The deployed UI displays a notice that interview history is shared with other visitors.
Camera and microphone access require HTTPS; Render provides HTTPS for its hosted URL.

## Architecture (multi-agent, one LLM)

| Layer | File | Role |
|---|---|---|
| React frontend | `client/src` | Dashboard, setup, live interview, report |
| Speech-to-text / Text-to-speech | `client/src/hooks/useVoice.js` | Web Speech API + SpeechSynthesis |
| Express backend | `server/server.js`, `routes/` | REST API |
| Orchestrator | `server/agents/orchestrator.js` | Coordinates agents each turn |
| Interviewer Agent | `agents/interviewer.js` | Questions, difficulty, follow-ups, interview memory |
| Evaluator Agent | `agents/evaluator.js` | Semantic scoring, missing concepts, feedback |
| Learning Agent | `agents/learner.js` | Weak topics, adaptive difficulty, follow-up decision |
| Report Agent | `agents/reporter.js` | Scores, strengths/weaknesses, study plan, practice questions |
| MongoDB | `models/Session.js` | One document per interview |
| Code runner | `server/routes/code.js` | Validates and forwards code to JDoodle |

Per answer: Evaluator -> Learning agent -> Interviewer (2 LLM calls, so feedback stays fast).
The Learning agent is rule-based by design: predictable and instant on stage. The Report agent computes all numbers
in code and only asks the LLM for the narrative.

### Adaptive rules
- Correctness <= 3/10: ask a *simpler* follow-up on the same topic.
- Missing concepts and score < 85: ask a follow-up probing the first missing concept.
- Max one follow-up per main question (no loops). Follow-ups don't count toward the question total.
- Average of last two scores >= 80: harder questions. <= 40: easier.

## API

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/interview/start` | `{language, difficulty, type, total}` creates a session + first question |
| POST | `/api/interview/question` | Generate (or return the open) next question |
| POST | `/api/interview/answer` | `{sessionId, answer}` evaluate + adapt + next question |
| POST | `/api/interview/followup` | Force an adaptive follow-up |
| GET | `/api/interview/:id` | Session details |
| GET | `/api/interview` | History list |
| DELETE | `/api/interview/:id` | Delete a session |
| POST | `/api/interview/finish` | Finish and generate the report |
| GET | `/api/report/:id` | Retrieve final report |
| GET | `/api/stats` | Dashboard aggregates |

Values: language `Java|Python|JavaScript`, difficulty `beginner|intermediate|advanced`, type `Technical|OOP|DSA|Coding`, total `3|5|10`.

The browser uses the Web Speech API for speech recognition and speech synthesis. Recognition
availability depends on the browser and its network/service; answers can always be typed.

## 3-minute demo script
1. (0:00) Problem: nobody lets you practise *speaking* technical answers.
2. (0:20) Setup: Java, Intermediate, OOP, 5 questions.
3. (0:40) AI asks a question aloud.
4. (1:10) Click **Start speaking** and give an incomplete answer, e.g. *"Inheritance in Java allows one class to acquire properties and methods from another class."*
5. (1:40) Point at **What the agents decided**: the Evaluator flagged a missing concept, and the Interviewer asks a follow-up.
6. (2:10) Finish, show the report and click **Listen to summary**.
7. (2:40) Explain the four agents and the orchestrator.

Rehearse the exact incomplete answer beforehand. The transcript box is editable if recognition mishears you.

## Troubleshooting
- **No voice input:** use Chrome/Edge, allow the mic, and serve from `localhost` or HTTPS.
- **No spoken questions:** some browsers block audio until you click once on the page. Use **Replay question**.
- **"Could not connect to MongoDB":** start `mongod` or use an Atlas URI in `server/.env`.
- **Gemini errors/quota:** set `GEMINI_MODEL` to a model your key supports. The app falls back automatically.
- Never put the Gemini key in the React app. It lives only in `server/.env`.

## Not included (planned)
Code execution sandbox, video analysis, long-term candidate memory across sessions.
