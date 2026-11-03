import { Route, Routes, Link } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Setup from "./pages/Setup.jsx";
import Interview from "./pages/Interview.jsx";
import Report from "./pages/Report.jsx";
import History from "./pages/History.jsx";
import Playground from "./pages/Playground.jsx";

const NotFound = () => (
  <div className="py-20 text-center">
    <h1 className="text-3xl font-bold">Page not found</h1>
    <Link to="/" className="btn-primary mt-6">Back to dashboard</Link>
  </div>
);

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="setup" element={<Setup />} />
        <Route path="interview/:id" element={<Interview />} />
        <Route path="report/:id" element={<Report />} />
        <Route path="history" element={<History />} />
        <Route path="practice" element={<Playground />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
