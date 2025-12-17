import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Landing from "@/pages/Landing";
import ApplicationForm from "@/pages/ApplicationForm";
import ModeratorLogin from "@/pages/ModeratorLogin";
import ModeratorDashboard from "@/pages/ModeratorDashboard";
import ModeratorPortal from "@/pages/ModeratorPortal";
import Settings from "@/pages/Settings";
import ServerAssignments from "@/pages/ServerAssignments";
import { Toaster } from "@/components/ui/sonner";

function App() {
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
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" richColors />
    </div>
  );
}

export default App;