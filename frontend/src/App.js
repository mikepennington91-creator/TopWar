import "@/App.css";
import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Landing from "@/pages/Landing";
import ApplicationForm from "@/pages/ApplicationForm";
import ModeratorLogin from "@/pages/ModeratorLogin";
import ModeratorDashboard from "@/pages/ModeratorDashboard";
import ModeratorPortal from "@/pages/ModeratorPortal";
import Settings from "@/pages/Settings";
import ServerAssignments from "@/pages/ServerAssignments";
import AuditLog from "@/pages/AuditLog";
import Polls from "@/pages/Polls";
import Changelog from "@/pages/Changelog";
import ModeratorActivity from "@/pages/ModeratorActivity";
import { Toaster } from "@/components/ui/sonner";

const REFRESH_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const LAST_REFRESH_KEY = "lastPageRefresh";

function App() {
  useEffect(() => {
    // Set initial timestamp if not exists
    if (!localStorage.getItem(LAST_REFRESH_KEY)) {
      localStorage.setItem(LAST_REFRESH_KEY, Date.now().toString());
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        const lastRefresh = parseInt(localStorage.getItem(LAST_REFRESH_KEY) || "0", 10);
        const now = Date.now();
        
        if (now - lastRefresh >= REFRESH_INTERVAL_MS) {
          // Update timestamp before refresh to prevent refresh loops
          localStorage.setItem(LAST_REFRESH_KEY, now.toString());
          window.location.reload();
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/apply" element={<ApplicationForm />} />
          <Route path="/moderator/login" element={<ModeratorLogin />} />
          <Route path="/moderator/portal" element={<ModeratorPortal />} />
          <Route path="/moderator/dashboard" element={<ModeratorDashboard />} />
          <Route path="/moderator/settings" element={<Settings />} />
          <Route path="/moderator/server-assignments" element={<ServerAssignments />} />
          <Route path="/moderator/audit-log" element={<AuditLog />} />
          <Route path="/moderator/polls" element={<Polls />} />
          <Route path="/moderator/changelog" element={<Changelog />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" richColors />
    </div>
  );
}

export default App;