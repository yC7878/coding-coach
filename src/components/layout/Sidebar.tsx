import { BarChart3, BrainCircuit, LayoutDashboard, ListChecks, Settings, X } from "lucide-react";
import { NavLink } from "react-router-dom";

const primaryLinks = [
  { to: "/", label: "Dashboard", Icon: LayoutDashboard, end: true },
  { to: "/problems", label: "Problems", Icon: ListChecks },
];

const secondaryLinks = [
  { to: "/", label: "Progress", Icon: BarChart3, end: true },
  { to: "/settings", label: "Settings", Icon: Settings },
];

interface SidebarProps { mobileOpen: boolean; onClose: () => void; }

export function Sidebar({ mobileOpen, onClose }: SidebarProps) {
  const navClass = ({ isActive }: { isActive: boolean }) => `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${isActive ? "bg-blue-500/15 text-blue-300" : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"}`;
  const content = <><div className="flex items-center justify-between"><NavLink to="/" end className="flex items-center gap-2.5 text-base font-semibold text-slate-100" onClick={onClose}><span className="rounded-lg bg-gradient-to-br from-blue-400 to-cyan-300 p-1.5 text-slate-950"><BrainCircuit size={19} strokeWidth={2.5} /></span>NeetCode Coach</NavLink><button onClick={onClose} aria-label="Close navigation" className="rounded-md p-2 text-slate-400 hover:bg-slate-800 lg:hidden"><X size={19} /></button></div><nav className="mt-9 space-y-1">{primaryLinks.map(({ to, label, Icon, end }) => <NavLink key={label} to={to} end={end} className={navClass} onClick={onClose}><Icon size={18} />{label}</NavLink>)}</nav><div className="my-6 border-t border-slate-800" /><nav className="space-y-1">{secondaryLinks.map(({ to, label, Icon, end }) => <NavLink key={label} to={to} end={end} className={navClass} onClick={onClose}><Icon size={18} />{label}</NavLink>)}</nav><p className="mt-auto pt-8 text-xs leading-5 text-slate-600">Phase 1 · Your progress stays in this browser.</p></>;
  return <><aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-slate-800 bg-[#0d1424] p-5 lg:flex">{content}</aside>{mobileOpen && <div className="fixed inset-0 z-40 bg-slate-950/75 backdrop-blur-sm lg:hidden" onClick={onClose}><aside className="flex h-full w-72 flex-col border-r border-slate-800 bg-[#0d1424] p-5" onClick={(event) => event.stopPropagation()}>{content}</aside></div>}</>;
}
