import { Menu } from "lucide-react";
import { useLocation } from "react-router-dom";

const getHeading = (pathname: string) => {
  if (pathname === "/") return { title: "Dashboard", subtitle: "Track your progress, one thoughtful problem at a time." };
  if (pathname === "/problems") return { title: "Problems", subtitle: "The complete NeetCode 150, organized for focused practice." };
  if (pathname === "/syntax") return { title: "Syntax & Recall", subtitle: "Practice the Java APIs your sessions show need attention." };
  if (pathname === "/settings") return { title: "Settings", subtitle: "Keep a portable copy of your study progress." };
  return { title: "Problem details", subtitle: "Review the problem and save your progress." };
};

export function Header({ onOpenMenu }: { onOpenMenu: () => void }) {
  const { pathname } = useLocation();
  const { title, subtitle } = getHeading(pathname);
  return <header className="mb-7 flex items-start gap-3"><button onClick={onOpenMenu} aria-label="Open navigation" className="mt-0.5 rounded-lg border border-slate-800 bg-slate-900 p-2 text-slate-300 hover:border-slate-700 lg:hidden"><Menu size={20} /></button><div><h1 className="page-title">{title}</h1><p className="mt-1 text-sm text-slate-400">{subtitle}</p></div></header>;
}
