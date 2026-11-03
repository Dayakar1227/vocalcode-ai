import { NavLink, Outlet } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { LayoutDashboard, Mic, History, Chrome, Code2, Sparkles, UsersRound } from "lucide-react";
import Logo from "./Logo.jsx";

const links = [
  { to: "/", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/setup", label: "New interview", icon: Mic },
  { to: "/history", label: "Interview history", icon: History },
  { to: "/practice", label: "Code practice", icon: Code2 },
];

const linkClass = ({ isActive }) =>
  `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
    isActive ? "bg-cobalt-tint text-cobalt" : "text-ink-mute hover:bg-canvas hover:text-ink"
  }`;

export default function Layout() {
  const { pathname } = useLocation();
  const pageTitle = pathname.startsWith("/interview/")
    ? "Live interview"
    : pathname.startsWith("/report/")
      ? "Interview report"
      : links.find((link) => link.to === pathname)?.label || "VocalCode AI";

  return (
    <div className="app-shell min-h-screen lg:flex">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-line/80 bg-white px-4 py-6 lg:flex">
        <div className="px-2">
          <Logo />
          <p className="mt-1 pl-[42px] text-[11px] font-medium tracking-wide text-ink-faint">PRACTICE WITH PURPOSE</p>
        </div>
        <div className="mt-9 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-ink-faint">Workspace</div>
        <nav className="mt-2 flex flex-col gap-1" aria-label="Main">
          {links.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={linkClass}>
              {({ isActive }) => (
                <>
                  <Icon size={18} strokeWidth={isActive ? 2.3 : 1.9} />
                  <span className="flex-1">{label}</span>
                  {isActive && <span className="h-1.5 w-1.5 rounded-full bg-cobalt" />}
                </>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto rounded-2xl border border-line/80 bg-canvas/70 p-4 text-xs leading-relaxed text-ink-mute">
          <div className="mb-2 flex items-center gap-2 font-semibold text-ink">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-cobalt shadow-sm"><Chrome size={15} /></span>
            Voice-ready browsers
          </div>
          Chrome or Edge works best for voice input. Camera checks run locally; video is never recorded.
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-b border-line/80 bg-white/90 px-4 py-3 backdrop-blur lg:px-8 lg:py-4">
          <div className="mx-auto flex max-w-7xl items-center justify-between">
            <div className="lg:hidden"><Logo /></div>
            <div className="hidden lg:block">
              <p className="text-xs font-medium text-ink-faint">VOCALCODE AI <span className="mx-1.5 text-line">/</span> WORKSPACE</p>
              <h1 className="mt-0.5 text-base font-semibold text-ink">{pageTitle}</h1>
            </div>
            <nav className="flex gap-1 lg:hidden" aria-label="Main mobile">
              {links.map(({ to, label, icon: Icon, end }) => (
                <NavLink key={to} to={to} end={end} aria-label={label} title={label} className={({ isActive }) =>
                  `rounded-xl p-2.5 transition-colors ${isActive ? "bg-cobalt-tint text-cobalt" : "text-ink-mute hover:bg-canvas"}`}>
                  <Icon size={19} />
                </NavLink>
              ))}
            </nav>
            <div className="hidden items-center gap-2 rounded-full border border-line bg-white px-3 py-1.5 text-xs font-medium text-ink-mute sm:flex">
              <span className="h-2 w-2 rounded-full bg-mint" />
              <Sparkles size={14} className="text-cobalt" />
              Personal practice
            </div>
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-8 sm:py-9">
          {import.meta.env.VITE_PUBLIC_DEMO === "true" && (
            <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber/25 bg-amber-tint/70 px-4 py-3 text-sm text-amber" role="note">
              <UsersRound size={17} className="mt-0.5 shrink-0" />
              <p><strong>Shared public demo:</strong> interviews are visible to other visitors and can be deleted by them. Enabled AI/code services use a shared quota. Don’t enter personal information, secrets, or private code.</p>
            </div>
          )}
          <Outlet />
        </main>
      </div>
    </div>
  );
}
