import axios from "axios";

const http = axios.create({ baseURL: import.meta.env.VITE_API_URL || "/api", timeout: 60000 });

// Normalise errors into readable messages
http.interceptors.response.use(
  (r) => r.data,
  (err) => {
    const msg =
      err.response?.data?.error ||
      (err.code === "ECONNABORTED"
        ? "The AI took too long to respond. Please try again."
        : "Can't reach the server. Check that the backend is running.");
    return Promise.reject(new Error(msg));
  }
);

export const api = {
  health: () => http.get("/health"),
  stats: () => http.get("/stats"),
  list: () => http.get("/interview"),
  start: (body) => http.post("/interview/start", body),
  get: (id) => http.get(`/interview/${id}`),
  question: (sessionId) => http.post("/interview/question", { sessionId }),
  answer: (sessionId, answer) => http.post("/interview/answer", { sessionId, answer }),
  followup: (sessionId) => http.post("/interview/followup", { sessionId }),
  finish: (sessionId) => http.post("/interview/finish", { sessionId }),
  report: (id) => http.get(`/report/${id}`),
  remove: (id) => http.delete(`/interview/${id}`),
  runCode: (language, code, stdin = "") => http.post("/code/run", { language, code, stdin }),
};
