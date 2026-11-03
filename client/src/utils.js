export const tone = (score) =>
  score >= 75
    ? { text: "text-mint", bg: "bg-mint-tint", bar: "bg-mint", hex: "#0E9F77", label: "Strong" }
    : score >= 50
    ? { text: "text-amber", bg: "bg-amber-tint", bar: "bg-amber", hex: "#C97A04", label: "Developing" }
    : { text: "text-coral", bg: "bg-coral-tint", bar: "bg-coral", hex: "#D6453D", label: "Needs work" };

export const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : "";

export const fmtDuration = (sec = 0) => {
  const m = Math.floor(sec / 60);
  return m ? `${m} min ${sec % 60}s` : `${sec}s`;
};

export const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
};

export const cap = (s = "") => s.charAt(0).toUpperCase() + s.slice(1);
