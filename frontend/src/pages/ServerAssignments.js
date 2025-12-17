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
  const [currentUser, setCurrentUser] = useState({ username: "", role: "moderator", is_admin: false });
  const [formData, setFormData] = useState({
    server: "",
    tag: "",
    start_date: "",
    end_date: "",
    reason: "",
    comments: ""
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
  }, [navigate]);

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
        comments: ""
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
    const headers = ["Server", "Tag", "Start Date", "End Date", "Reason", "Comments", "Created By", "Created At"];
    const csvContent = [
      headers.join(","),
      ...assignments.map(a => [
        a.server,
        `"${a.tag}"`,
        a.start_date,
        a.end_date || "",
        `"${a.reason}"`,
        `"${(a.comments || "").replace(/"/g, '""')}"`,
        a.created_by,
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
    <div className="min-h-screen bg-slate-950 text-slate-200 py-12 px-4 sm:px-6 lg:px-8 grid-texture">
      <div className="max-w-7xl mx-auto">
        <Button
          data-testid="back-to-portal-btn"
          onClick={() => navigate('/moderator/portal')}
          variant="ghost"
          className="mb-8 text-amber-500 hover:text-amber-400 hover:bg-slate-900"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Portal
        </Button>

        <h1 className="text-4xl font-bold uppercase tracking-wider mb-4 text-amber-500" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
          <Server className="inline-block mr-3 h-10 w-10" />
          Server Assignments
        </h1>

        {/* Instruction Text */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-8">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1 text-slate-300">
              <p>Please use this form to log your main server account and all moderator accounts you use. 🗂️</p>
              <p>Make sure to select the correct reason for why each account exists. ✅</p>
              <p>Once your information has been submitted, you will only be able to edit the end date. ⏳</p>
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

                <div className="space-y-2 md:col-span-2">
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

        {/* Assignments Table */}
        <Card className="glass-card border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold uppercase tracking-wide text-amber-500" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                Server Assignment Records
              </CardTitle>
              <CardDescription className="text-slate-400">
                All server assignments
              </CardDescription>
            </div>
            {currentUser.is_admin && (
              <Button
                data-testid="download-excel-btn"
                onClick={downloadExcel}
                className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-sm"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Excel
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full" data-testid="assignments-table">
                <thead className="bg-slate-900/70">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase" style={{ fontFamily: 'Rajdhani, sans-serif' }}>Server</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase" style={{ fontFamily: 'Rajdhani, sans-serif' }}>Tag</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase" style={{ fontFamily: 'Rajdhani, sans-serif' }}>Start Date</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase" style={{ fontFamily: 'Rajdhani, sans-serif' }}>End Date</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase" style={{ fontFamily: 'Rajdhani, sans-serif' }}>Reason</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase" style={{ fontFamily: 'Rajdhani, sans-serif' }}>Comments</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase" style={{ fontFamily: 'Rajdhani, sans-serif' }}>Created By</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase" style={{ fontFamily: 'Rajdhani, sans-serif' }}>Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {assignments.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="px-4 py-8 text-center text-slate-400">
                        No server assignments found
                      </td>
                    </tr>
                  ) : (
                    assignments.map((assignment) => (
                      <tr key={assignment.id} className="hover:bg-slate-900/30">
                        <td className="px-4 py-3 text-slate-200 mono">{assignment.server}</td>
                        <td className="px-4 py-3 text-slate-200 mono">{assignment.tag}</td>
                        <td className="px-4 py-3 text-slate-200">{assignment.start_date}</td>
                        <td className="px-4 py-3">
                          {assignment.end_date || (
                            <Input
                              type="text"
                              placeholder="DD/MM/YYYY"
                              pattern="\d{2}/\d{2}/\d{4}"
                              onBlur={(e) => {
                                if (e.target.value) {
                                  handleUpdateEndDate(assignment.id, e.target.value);
                                }
                              }}
                              className="bg-slate-900 border-slate-700 text-slate-200 text-sm rounded-sm w-32"
                            />
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-200 text-sm">{assignment.reason}</td>
                        <td className="px-4 py-3 text-slate-400 text-sm max-w-xs truncate">{assignment.comments || "-"}</td>
                        <td className="px-4 py-3 text-slate-300 mono text-sm">{assignment.created_by}</td>
                        <td className="px-4 py-3">
                          {currentUser.is_admin && (
                            <Button
                              data-testid={`delete-${assignment.id}`}
                              onClick={() => handleDelete(assignment.id)}
                              disabled={loading}
                              size="sm"
                              className="bg-red-500 hover:bg-red-600 text-white rounded-sm"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))
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
