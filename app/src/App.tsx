import { Routes, Route, Navigate } from "react-router";
import { Toaster } from "@/components/ui/sonner";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import AppShell from "./components/AppShell";
import { defaultPath } from "./lib/registry";

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Navigate to={defaultPath} replace />} />
        <Route path="/m/*" element={<AppShell />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster richColors position="top-center" />
    </>
  );
}
