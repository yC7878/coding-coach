import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { syncIfGithubCacheStale } from "../../services/githubSubmissionService";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";

export function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  useEffect(() => { void syncIfGithubCacheStale(); }, []);
  return <div className="min-h-screen bg-[#0b1020]"><Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} /><main className="min-h-screen px-4 py-6 sm:px-7 lg:ml-64 lg:px-10 lg:py-9"><div className="mx-auto max-w-7xl"><Header onOpenMenu={() => setMobileOpen(true)} /><Outlet /></div></main></div>;
}
