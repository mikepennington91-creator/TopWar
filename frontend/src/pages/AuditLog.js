import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, ClipboardList, RefreshCw } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function AuditLog() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [auditLogs, setAuditLogs] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('moderator_token');
    const role = localStorage.getItem('moderator_role');
    const username = localStorage.getItem('moderator_username');
    
    if (!token) {
      navigate('/moderator/login');
      return;
    }
    
    // Only admin and mmod can view audit logs
    if (role !== 'admin' && role !== 'mmod') {
      toast.error("You don't have permission to view audit logs");
      navigate('/moderator/dashboard');
      return;
    }
    
    setCurrentUser({ username, role });
    fetchAuditLogs();
  }, [navigate]);

  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('moderator_token');
      const response = await axios.get(`${API}/audit-logs`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAuditLogs(response.data);
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.detail || "Failed to fetch audit logs");
    } finally {
      setLoading(false);
    }
  };

  const getActionBadge = (log) => {
    if (log.action === "deleted") {
      return <Badge className="bg-red-900/50 text-red-400 border-red-800 text-xs uppercase">Deleted</Badge>;
    } else if (log.new_status === "approved") {
      return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/50 text-xs uppercase">Approved</Badge>;
    } else if (log.new_status === "rejected") {
      return <Badge className="bg-red-500/20 text-red-400 border-red-500/50 text-xs uppercase">Rejected</Badge>;
    } else {
      return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/50 text-xs uppercase">Status Change</Badge>;
    }
  };

  if (!currentUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 py-6 sm:py-12 px-3 sm:px-6 lg:px-8 grid-texture">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h1 className="text-2xl sm:text-4xl font-bold uppercase tracking-wider text-purple-500" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
            <ClipboardList className="inline-block mr-2 sm:mr-3 h-6 w-6 sm:h-10 sm:w-10" />
            Audit Log
          </h1>
          <Button
            onClick={fetchAuditLogs}
            disabled={loading}
            variant="outline"
            size="sm"
            className="border-purple-500 text-purple-500 hover:bg-purple-500/20"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        <p className="text-slate-400 mb-6 text-sm sm:text-base">
          Record of all application status changes and deletions. Only visible to Admin and MMOD.
        </p>

        <Card className="glass-card border-slate-700">
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl font-bold uppercase tracking-wide text-slate-300" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
              Activity History
            </CardTitle>
            <CardDescription className="text-slate-400">
              {auditLogs.length} {auditLogs.length === 1 ? 'entry' : 'entries'} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12">
                <RefreshCw className="h-8 w-8 animate-spin text-purple-500 mx-auto mb-4" />
                <p className="text-slate-400">Loading audit logs...</p>
              </div>
            ) : auditLogs.length === 0 ? (
              <div className="text-center py-12">
                <ClipboardList className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">No audit log entries found.</p>
                <p className="text-slate-500 text-sm mt-2">Entries will appear here when applications are approved, rejected, or deleted.</p>
              </div>
            ) : (
              <>
                {/* Mobile Card View */}
                <div className="sm:hidden space-y-3">
                  {auditLogs.map((log) => (
                    <div key={log.id} className="p-3 bg-slate-900/50 rounded border border-slate-800">
                      <div className="flex items-center justify-between mb-2">
                        {getActionBadge(log)}
                        <span className="text-xs text-slate-500">
                          {new Date(log.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-slate-200 font-medium mb-1">{log.application_name}</p>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">
                          By: <span className="text-amber-400 font-semibold">{log.performed_by}</span>
                        </span>
                        {log.old_status && log.new_status && (
                          <span className="text-slate-500">{log.old_status} → {log.new_status}</span>
                        )}
                      </div>
                      {log.comment && (
                        <p className="text-xs text-slate-500 mt-2 border-t border-slate-700 pt-2">
                          {log.comment}
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                {/* Desktop Table View */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-800/50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Date & Time</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Action</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Applicant</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Performed By</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Status Change</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Comment</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {auditLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-800/30">
                          <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">
                            {new Date(log.created_at).toLocaleString()}
                          </td>
                          <td className="px-4 py-3">
                            {getActionBadge(log)}
                          </td>
                          <td className="px-4 py-3 text-slate-200 font-medium">{log.application_name}</td>
                          <td className="px-4 py-3 text-amber-400 font-semibold">{log.performed_by}</td>
                          <td className="px-4 py-3 text-slate-400 text-xs">
                            {log.old_status && log.new_status ? (
                              <span>
                                <span className="text-slate-500">{log.old_status}</span>
                                <span className="mx-1">→</span>
                                <span className="text-slate-300">{log.new_status}</span>
                              </span>
                            ) : (
                              <span className="text-slate-500">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-slate-400 text-xs max-w-[250px]">
                            <span className="line-clamp-2" title={log.comment}>
                              {log.comment || "-"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
