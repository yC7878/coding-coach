import { Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import { Dashboard } from "./pages/Dashboard";
import { ProblemDetails } from "./pages/ProblemDetails";
import { Problems } from "./pages/Problems";
import { Settings } from "./pages/Settings";

export default function App() {
  return <Routes><Route element={<AppLayout />}><Route index element={<Dashboard />} /><Route path="problems" element={<Problems />} /><Route path="problems/:id" element={<ProblemDetails />} /><Route path="settings" element={<Settings />} /><Route path="*" element={<Navigate to="/" replace />} /></Route></Routes>;
}
