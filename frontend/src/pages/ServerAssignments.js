import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, Server, Plus, Trash2, Download, Info } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Role color configuration for displaying moderator names
const ROLE_COLORS = {
  admin: "text-red-400",
  mmod: "text-red-500",
  moderator: "text-blue-400",
  lmod: "text-purple-400",
  smod: "text-pink-400",
  developer: "text-yellow-400"
};

const REASON_OPTIONS = [
  "Racism",
  "Inappropriate Language",
  "Sexism",
  "Buying / Selling accounts",
  "Mediation",
  "Main Server",
  "Religion",
  "Political",
  "Dev Request",
  "Buddy",
  "Other (State in comments)"
];

const TAG_OPTIONS = [
  { label: "1/3/6/12 Without Mod Chat", value: "Tag 2" },
  { label: "1/3/6/12 with Mod Chat", value: "Tag 5" },
  { label: "Only Mod Chat", value: "Tag 8" }
];

export default function ServerAssignments() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [assignments, setAssignments] = useState([]);
  const [moderators, setModerators] = useState([]);
  const [currentUser, setCurrentUser] = useState({ username: "", role: "moderator", is_admin: false });
  const [formData, setFormData] = useState({
    server: "",
    tag: "",
    start_date: "",
    end_date: "",
    reason: "",
    comments: "",
    moderator_name: ""
  });

  useEffect(() => {
    const token = localStorage.getItem('moderator_token');
    const role = localStorage.getItem('moderator_role');
    const username = localStorage.getItem('moderator_username');
    
    if (!token) {
      navigate('/moderator/login');
      return;
    }
    
    fetchCurrentUser(token, username, role);
    fetchAssignments();
    fetchModerators();
  }, [navigate]);

  const fetchModerators = async () => {
    try {
      const token = localStorage.getItem('moderator_token');
      const response = await axios.get(`${API}/moderators`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Filter out developers and store moderators with their roles
      const filteredMods = response.data.filter(mod => mod.role !== 'developer' && mod.status === 'active');
      setModerators(filteredMods);
    } catch (error) {
      console.error("Failed to fetch moderators:", error);
      // If user doesn't have permission to view moderators, silently fail
    }
  };

  const fetchCurrentUser = async (token, username, role) => {
    try {
      const response = await axios.get(`${API}/moderators`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const currentMod = response.data.find(m => m.username === username);
      setCurrentUser({ 
        username, 
        role,
        is_admin: currentMod?.is_admin || role === 'admin'
      });
    } catch (error) {
      setCurrentUser({ username, role, is_admin: role === 'admin' });
    }
  };

  const fetchAssignments = async () => {
    try {
      const token = localStorage.getItem('moderator_token');
      const response = await axios.get(`${API}/server-assignments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAssignments(response.data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch server assignments");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('moderator_token');
      await axios.post(`${API}/server-assignments`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Server assignment added successfully!");
      setFormData({
        server: "",
        tag: "",
        start_date: "",
        end_date: "",
        reason: "",
        comments: "",
        moderator_name: ""
      });
      fetchAssignments();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.detail || "Failed to add server assignment");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateEndDate = async (assignmentId, newEndDate) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('moderator_token');
      await axios.patch(
        `${API}/server-assignments/${assignmentId}`,
        { end_date: newEndDate },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("End date updated!");
      fetchAssignments();
    } catch (error) {
      console.error(error);
      toast.error("Failed to update end date");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (assignmentId) => {
    if (!window.confirm("Are you sure you want to delete this server assignment?")) {
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('moderator_token');
      await axios.delete(`${API}/server-assignments/${assignmentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Server assignment deleted!");
      fetchAssignments();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.detail || "Failed to delete server assignment");
    } finally {
      setLoading(false);
    }
  };

  const downloadExcel = () => {
    if (assignments.length === 0) {
      toast.error("No data to download");
      return;
    }

    // Create CSV content (Excel compatible)
    const headers = ["Server", "Moderator", "Tag", "Start Date", "End Date", "Reason", "Comments", "Created At"];
    const csvContent = [
      headers.join(","),
      ...assignments.map(a => [
        a.server,
        a.moderator_name || a.created_by,
        `"${a.tag}"`,
        a.start_date,
        a.end_date || "",
        `"${a.reason}"`,
        `"${(a.comments || "").replace(/"/g, '""')}"`,
        new Date(a.created_at).toLocaleDateString()
      ].join(","))
    ].join("\n");

    // Create and download file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `server_assignments_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Download started!");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 py-6 sm:py-12 px-3 sm:px-6 lg:px-8 grid-texture">
      <div className="max-w-7xl mx-auto">
        <Button
          data-testid="back-to-portal-btn"
          onClick={() => navigate('/moderator/portal')}
          variant="ghost"
          size="sm"
          className="mb-4 sm:mb-8 text-amber-500 hover:text-amber-400 hover:bg-slate-900 text-sm"
        >
          <ArrowLeft className="mr-1 sm:mr-2 h-4 w-4" />
          Back to Portal
        </Button>

        <h1 className="text-2xl sm:text-4xl font-bold uppercase tracking-wider mb-3 sm:mb-4 text-amber-500" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
          <Server className="inline-block mr-2 sm:mr-3 h-6 w-6 sm:h-10 sm:w-10" />
          Server Assignments
        </h1>

        {/* Instruction Text */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 sm:p-4 mb-4 sm:mb-8">
          <div className="flex items-start gap-2 sm:gap-3">
            <Info className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1 text-slate-300 text-xs sm:text-base">
              <p>Please use this form to log your main server account and all moderator accounts you use. 🗂️</p>
              <p className="hidden sm:block">Make sure to select the correct reason for why each account exists. ✅</p>
              <p className="hidden sm:block">Once your information has been submitted, you will only be able to edit the end date. ⏳</p>
            </div>
          </div>
        </div>

        {/* Add Assignment Form */}
        <Card className="glass-card border-slate-700 mb-8">
          <CardHeader>
            <CardTitle className="text-2xl font-bold uppercase tracking-wide text-emerald-500" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
              <Plus className="inline-block mr-2 h-6 w-6" />
              Add New Server Assignment
            </CardTitle>
            <CardDescription className="text-slate-400">
              Record a new server assignment
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4" data-testid="server-assignment-form">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="server" className="text-slate-300">Server *</Label>
                  <Input
                    id="server"
                    name="server"
                    data-testid="server-input"
                    type="number"
                    value={formData.server}
                    onChange={handleChange}
                    required
                    min="1"
                    className="bg-slate-900/50 border-slate-700 focus:border-amber-500 text-slate-200 rounded-sm"
                    placeholder="Enter server number"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="tag" className="text-slate-300">Tag *</Label>
                  <Select
                    value={formData.tag}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, tag: value }))}
                    required
                  >
                    <SelectTrigger 
                      data-testid="tag-select"
                      className="bg-slate-900/50 border-slate-700 focus:border-amber-500 text-slate-200 rounded-sm"
                    >
                      <SelectValue placeholder="Select tag type..." />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-700">
                      {TAG_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value} className="text-slate-200">
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="start_date" className="text-slate-300">Start Date (DD/MM/YYYY) *</Label>
                  <Input
                    id="start_date"
                    name="start_date"
                    data-testid="start-date-input"
                    type="text"
                    value={formData.start_date}
                    onChange={handleChange}
                    required
                    placeholder="DD/MM/YYYY"
                    pattern="\d{2}/\d{2}/\d{4}"
                    className="bg-slate-900/50 border-slate-700 focus:border-amber-500 text-slate-200 rounded-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="end_date" className="text-slate-300">End Date (DD/MM/YYYY)</Label>
                  <Input
                    id="end_date"
                    name="end_date"
                    data-testid="end-date-input"
                    type="text"
                    value={formData.end_date}
                    onChange={handleChange}
                    placeholder="DD/MM/YYYY"
                    pattern="\d{2}/\d{2}/\d{4}"
                    className="bg-slate-900/50 border-slate-700 focus:border-amber-500 text-slate-200 rounded-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reason" className="text-slate-300">Reason *</Label>
                  <Select
                    value={formData.reason}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, reason: value }))}
                    required
                  >
                    <SelectTrigger 
                      data-testid="reason-select"
                      className="bg-slate-900/50 border-slate-700 focus:border-amber-500 text-slate-200 rounded-sm"
                    >
                      <SelectValue placeholder="Select reason..." />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-700">
                      {REASON_OPTIONS.map((option) => (
                        <SelectItem key={option} value={option} className="text-slate-200">
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="moderator_name" className="text-slate-300">Moderator on Server *</Label>
                  <Select
                    value={formData.moderator_name}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, moderator_name: value }))}
                    required
                  >
                    <SelectTrigger 
                      data-testid="moderator-select"
                      className="bg-slate-900/50 border-slate-700 focus:border-amber-500 text-slate-200 rounded-sm"
                    >
                      <SelectValue placeholder="Select moderator..." />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-700">
                      {moderators.map((mod) => (
                        <SelectItem 
                          key={mod.username} 
                          value={mod.username} 
                          className={ROLE_COLORS[mod.role] || "text-slate-200"}
                        >
                          {mod.username} ({mod.role.toUpperCase()})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="comments" className="text-slate-300">Comments</Label>
                  <Textarea
                    id="comments"
                    name="comments"
                    data-testid="comments-input"
                    value={formData.comments}
                    onChange={handleChange}
                    className="bg-slate-900/50 border-slate-700 focus:border-amber-500 text-slate-200 min-h-[100px] rounded-sm"
                    placeholder="Optional comments..."
                  />
                </div>
              </div>

              <Button
                data-testid="submit-assignment-btn"
                type="submit"
                disabled={loading}
                className="bg-amber-500 hover:bg-amber-600 text-white font-bold uppercase tracking-wide px-8 py-3 rounded-sm btn-glow"
              >
                {loading ? "Adding..." : "Add Assignment"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Assignments Table/Cards */}
        <Card className="glass-card border-slate-700">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-lg sm:text-2xl font-bold uppercase tracking-wide text-amber-500" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                Server Assignment Records
              </CardTitle>
              <CardDescription className="text-slate-400 text-sm">
                All server assignments
              </CardDescription>
            </div>
            {currentUser.is_admin && (
              <Button
                data-testid="download-excel-btn"
                onClick={downloadExcel}
                size="sm"
                className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-sm text-xs sm:text-sm w-full sm:w-auto"
              >
                <Download className="h-4 w-4 mr-1 sm:mr-2" />
                Download Excel
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {/* Mobile Card View */}
            <div className="sm:hidden space-y-3">
              {assignments.length === 0 ? (
                <p className="text-center text-slate-400 py-8">No server assignments found</p>
              ) : (
                assignments.map((assignment) => {
                  const modInfo = moderators.find(m => m.username === assignment.moderator_name);
                  const modRoleColor = modInfo ? ROLE_COLORS[modInfo.role] : "text-slate-300";
                  
                  return (
                    <div key={assignment.id} className="p-3 bg-slate-900/50 rounded border border-slate-800">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-amber-500 font-bold mono">S{assignment.server}</span>
                        <span className={`text-sm font-semibold ${modRoleColor}`}>
                          {assignment.moderator_name || assignment.created_by}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                        <div>
                          <span className="text-slate-500">Tag:</span>
                          <span className="text-slate-300 ml-1">{assignment.tag}</span>
                        </div>
                        <div>
                          <span className="text-slate-500">Reason:</span>
                          <span className="text-slate-300 ml-1 truncate">{assignment.reason}</span>
                        </div>
                        <div>
                          <span className="text-slate-500">Start:</span>
                          <span className="text-slate-300 ml-1">{assignment.start_date}</span>
                        </div>
                        <div>
                          <span className="text-slate-500">End:</span>
                          {assignment.end_date ? (
                            <span className="text-slate-300 ml-1">{assignment.end_date}</span>
                          ) : (
                            <Input
                              type="text"
                              placeholder="DD/MM/YYYY"
                              className="bg-slate-800 border-slate-700 text-slate-200 text-xs h-6 w-24 ml-1 inline-block"
                              onBlur={(e) => {
                                if (e.target.value) handleUpdateEndDate(assignment.id, e.target.value);
                              }}
                            />
                          )}
                        </div>
                      </div>
                      {currentUser.is_admin && (
                        <Button
                          onClick={() => handleDelete(assignment.id)}
                          disabled={loading}
                          size="sm"
                          className="bg-red-500/20 text-red-400 hover:bg-red-500/30 text-xs w-full"
                        >
                          <Trash2 className="h-3 w-3 mr-1" /> Delete
                        </Button>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Desktop Table View */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full" data-testid="assignments-table">
                <thead className="bg-slate-900/70">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase" style={{ fontFamily: 'Rajdhani, sans-serif' }}>Server</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase" style={{ fontFamily: 'Rajdhani, sans-serif' }}>Moderator</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase" style={{ fontFamily: 'Rajdhani, sans-serif' }}>Tag</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase" style={{ fontFamily: 'Rajdhani, sans-serif' }}>Start</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase" style={{ fontFamily: 'Rajdhani, sans-serif' }}>End</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase" style={{ fontFamily: 'Rajdhani, sans-serif' }}>Reason</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase" style={{ fontFamily: 'Rajdhani, sans-serif' }}>Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {assignments.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-4 py-8 text-center text-slate-400">
                        No server assignments found
                      </td>
                    </tr>
                  ) : (
                    assignments.map((assignment) => {
                      const modInfo = moderators.find(m => m.username === assignment.moderator_name);
                      const modRoleColor = modInfo ? ROLE_COLORS[modInfo.role] : "text-slate-300";
                      
                      return (
                        <tr key={assignment.id} className="hover:bg-slate-900/30">
                          <td className="px-3 py-2 text-slate-200 mono text-sm">{assignment.server}</td>
                          <td className={`px-3 py-2 mono text-sm font-semibold ${modRoleColor}`}>
                            {assignment.moderator_name || assignment.created_by}
                          </td>
                          <td className="px-3 py-2 text-slate-200 mono text-sm">{assignment.tag}</td>
                          <td className="px-3 py-2 text-slate-200 text-sm">{assignment.start_date}</td>
                          <td className="px-3 py-2">
                            {assignment.end_date || (
                              <Input
                                type="text"
                                placeholder="DD/MM/YYYY"
                                onBlur={(e) => {
                                  if (e.target.value) handleUpdateEndDate(assignment.id, e.target.value);
                                }}
                                className="bg-slate-900 border-slate-700 text-slate-200 text-xs rounded-sm w-28 h-7"
                              />
                            )}
                          </td>
                          <td className="px-3 py-2 text-slate-200 text-xs max-w-[120px] truncate">{assignment.reason}</td>
                          <td className="px-3 py-2">
                            {currentUser.is_admin && (
                              <Button
                                data-testid={`delete-${assignment.id}`}
                                onClick={() => handleDelete(assignment.id)}
                                disabled={loading}
                                size="sm"
                                className="bg-red-500 hover:bg-red-600 text-white rounded-sm h-7 w-7 p-0"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
