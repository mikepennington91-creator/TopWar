import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import { ArrowLeft, Server, Plus, Trash2, Download, Info, ArrowUpDown, ArrowUp, ArrowDown, Search, CalendarIcon } from "lucide-react";
import { format, parse } from "date-fns";

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
  { label: "No tags", value: "No tags" },
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
  const [sortConfig, setSortConfig] = useState({ key: 'server', direction: 'asc' });
  const [searchTerm, setSearchTerm] = useState("");
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
      // Filter out developers, sort alphabetically, and store
      const filteredMods = response.data
        .filter(mod => mod.role !== 'developer' && mod.status === 'active')
        .sort((a, b) => a.username.toLowerCase().localeCompare(b.username.toLowerCase()));
      setModerators(filteredMods);
    } catch (error) {
      console.error("Failed to fetch moderators:", error);
      // If user doesn't have permission, use current user as fallback
      const username = localStorage.getItem('moderator_username');
      const role = localStorage.getItem('moderator_role');
      if (username && role !== 'developer') {
        setModerators([{ username, role }]);
      }
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

  // Sorting function
  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Get sort icon for column header
  const getSortIcon = (key) => {
    if (sortConfig.key !== key) {
      return <ArrowUpDown className="h-3 w-3 ml-1 opacity-40" />;
    }
    return sortConfig.direction === 'asc' 
      ? <ArrowUp className="h-3 w-3 ml-1 text-amber-500" />
      : <ArrowDown className="h-3 w-3 ml-1 text-amber-500" />;
  };

  // Filter and sort assignments
  const getFilteredAndSortedAssignments = () => {
    let filtered = [...assignments];
    
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(a => 
        a.server?.toString().includes(term) ||
        a.moderator_name?.toLowerCase().includes(term) ||
        a.reason?.toLowerCase().includes(term) ||
        a.tag?.toLowerCase().includes(term)
      );
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      let aVal, bVal;
      
      switch (sortConfig.key) {
        case 'server':
          aVal = parseInt(a.server) || 0;
          bVal = parseInt(b.server) || 0;
          break;
        case 'moderator':
          aVal = (a.moderator_name || a.created_by || '').toLowerCase();
          bVal = (b.moderator_name || b.created_by || '').toLowerCase();
          break;
        case 'tag':
          aVal = (a.tag || '').toLowerCase();
          bVal = (b.tag || '').toLowerCase();
          break;
        case 'start_date':
          // Parse DD/MM/YYYY to sortable format
          aVal = a.start_date ? a.start_date.split('/').reverse().join('') : '';
          bVal = b.start_date ? b.start_date.split('/').reverse().join('') : '';
          break;
        case 'reason':
          aVal = (a.reason || '').toLowerCase();
          bVal = (b.reason || '').toLowerCase();
          break;
        default:
          aVal = a[sortConfig.key];
          bVal = b[sortConfig.key];
      }
      
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    
    return filtered;
  };

  const sortedAssignments = getFilteredAndSortedAssignments();

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
          <CardHeader className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-lg sm:text-2xl font-bold uppercase tracking-wide text-amber-500" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                  Server Assignment Records
                </CardTitle>
                <CardDescription className="text-slate-400 text-sm">
                  {sortedAssignments.length} record{sortedAssignments.length !== 1 ? 's' : ''} found
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
            </div>
            
            {/* Search and Sort Controls */}
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search Input */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500" />
                <Input
                  type="text"
                  placeholder="Search by server, moderator, reason..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-slate-900/50 border-slate-700 focus:border-amber-500 text-slate-200 pl-10 rounded-sm"
                />
              </div>
              
              {/* Mobile Sort Dropdown */}
              <div className="sm:hidden">
                <Select
                  value={`${sortConfig.key}-${sortConfig.direction}`}
                  onValueChange={(value) => {
                    const [key, direction] = value.split('-');
                    setSortConfig({ key, direction });
                  }}
                >
                  <SelectTrigger className="bg-slate-900/50 border-slate-700 text-slate-200 rounded-sm">
                    <SelectValue placeholder="Sort by..." />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700">
                    <SelectItem value="server-asc" className="text-slate-200">Server ↑</SelectItem>
                    <SelectItem value="server-desc" className="text-slate-200">Server ↓</SelectItem>
                    <SelectItem value="moderator-asc" className="text-slate-200">Moderator A-Z</SelectItem>
                    <SelectItem value="moderator-desc" className="text-slate-200">Moderator Z-A</SelectItem>
                    <SelectItem value="start_date-asc" className="text-slate-200">Date (Oldest)</SelectItem>
                    <SelectItem value="start_date-desc" className="text-slate-200">Date (Newest)</SelectItem>
                    <SelectItem value="reason-asc" className="text-slate-200">Reason A-Z</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Mobile Card View */}
            <div className="sm:hidden space-y-3">
              {sortedAssignments.length === 0 ? (
                <p className="text-center text-slate-400 py-8">No server assignments found</p>
              ) : (
                sortedAssignments.map((assignment) => {
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
                        <div className="overflow-hidden">
                          <span className="text-slate-500">Tag:</span>
                          <span className="text-slate-300 ml-1">{assignment.tag}</span>
                        </div>
                        <div className="overflow-hidden">
                          <span className="text-slate-500">Reason:</span>
                          <span className="text-slate-300 ml-1 block truncate">{assignment.reason}</span>
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

            {/* Desktop Spreadsheet View */}
            <div className="hidden sm:block overflow-x-auto rounded-lg border border-slate-700">
              <table className="w-full border-collapse" data-testid="assignments-table">
                <thead>
                  <tr className="bg-slate-800/80">
                    <th 
                      className="px-4 py-3 text-left text-xs font-bold text-slate-300 uppercase tracking-wider cursor-pointer hover:bg-slate-700/50 transition-colors border-b border-slate-700 select-none"
                      style={{ fontFamily: 'Rajdhani, sans-serif' }}
                      onClick={() => handleSort('server')}
                    >
                      <div className="flex items-center">
                        Server
                        {getSortIcon('server')}
                      </div>
                    </th>
                    <th 
                      className="px-4 py-3 text-left text-xs font-bold text-slate-300 uppercase tracking-wider cursor-pointer hover:bg-slate-700/50 transition-colors border-b border-slate-700 select-none"
                      style={{ fontFamily: 'Rajdhani, sans-serif' }}
                      onClick={() => handleSort('moderator')}
                    >
                      <div className="flex items-center">
                        Moderator
                        {getSortIcon('moderator')}
                      </div>
                    </th>
                    <th 
                      className="px-4 py-3 text-left text-xs font-bold text-slate-300 uppercase tracking-wider cursor-pointer hover:bg-slate-700/50 transition-colors border-b border-slate-700 select-none"
                      style={{ fontFamily: 'Rajdhani, sans-serif' }}
                      onClick={() => handleSort('tag')}
                    >
                      <div className="flex items-center">
                        Tag
                        {getSortIcon('tag')}
                      </div>
                    </th>
                    <th 
                      className="px-4 py-3 text-left text-xs font-bold text-slate-300 uppercase tracking-wider cursor-pointer hover:bg-slate-700/50 transition-colors border-b border-slate-700 select-none"
                      style={{ fontFamily: 'Rajdhani, sans-serif' }}
                      onClick={() => handleSort('start_date')}
                    >
                      <div className="flex items-center">
                        Start
                        {getSortIcon('start_date')}
                      </div>
                    </th>
                    <th 
                      className="px-4 py-3 text-left text-xs font-bold text-slate-300 uppercase tracking-wider border-b border-slate-700"
                      style={{ fontFamily: 'Rajdhani, sans-serif' }}
                    >
                      End
                    </th>
                    <th 
                      className="px-4 py-3 text-left text-xs font-bold text-slate-300 uppercase tracking-wider cursor-pointer hover:bg-slate-700/50 transition-colors border-b border-slate-700 select-none"
                      style={{ fontFamily: 'Rajdhani, sans-serif' }}
                      onClick={() => handleSort('reason')}
                    >
                      <div className="flex items-center">
                        Reason
                        {getSortIcon('reason')}
                      </div>
                    </th>
                    {currentUser.is_admin && (
                      <th 
                        className="px-4 py-3 text-center text-xs font-bold text-slate-300 uppercase tracking-wider border-b border-slate-700 w-20"
                        style={{ fontFamily: 'Rajdhani, sans-serif' }}
                      >
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {sortedAssignments.length === 0 ? (
                    <tr>
                      <td colSpan={currentUser.is_admin ? 7 : 6} className="px-4 py-12 text-center text-slate-400">
                        <div className="flex flex-col items-center gap-2">
                          <Server className="h-8 w-8 opacity-40" />
                          <span>No server assignments found</span>
                          {searchTerm && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => setSearchTerm("")}
                              className="text-amber-500 hover:text-amber-400"
                            >
                              Clear search
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    sortedAssignments.map((assignment, index) => {
                      const modInfo = moderators.find(m => m.username === assignment.moderator_name);
                      const modRoleColor = modInfo ? ROLE_COLORS[modInfo.role] : "text-slate-300";
                      const isEven = index % 2 === 0;
                      
                      return (
                        <tr 
                          key={assignment.id} 
                          className={`${isEven ? 'bg-slate-900/30' : 'bg-slate-900/10'} hover:bg-slate-800/50 transition-colors`}
                        >
                          <td className="px-4 py-3 text-amber-500 font-bold mono text-sm border-b border-slate-800/50">
                            S{assignment.server}
                          </td>
                          <td className={`px-4 py-3 mono text-sm font-semibold border-b border-slate-800/50 ${modRoleColor}`}>
                            {assignment.moderator_name || assignment.created_by}
                          </td>
                          <td className="px-4 py-3 text-slate-300 text-sm border-b border-slate-800/50">
                            <span className="px-2 py-1 bg-slate-800/50 rounded text-xs">
                              {assignment.tag}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-300 text-sm border-b border-slate-800/50 mono">
                            {assignment.start_date}
                          </td>
                          <td className="px-4 py-3 border-b border-slate-800/50">
                            {assignment.end_date ? (
                              <span className="text-slate-300 text-sm mono">{assignment.end_date}</span>
                            ) : (
                              <Input
                                type="text"
                                placeholder="DD/MM/YYYY"
                                onBlur={(e) => {
                                  if (e.target.value) handleUpdateEndDate(assignment.id, e.target.value);
                                }}
                                className="bg-slate-800/50 border-slate-700 text-slate-200 text-xs rounded-sm w-28 h-7 mono"
                              />
                            )}
                          </td>
                          <td className="px-4 py-3 text-slate-300 text-sm border-b border-slate-800/50 max-w-[180px]">
                            <span className="block truncate" title={assignment.reason}>
                              {assignment.reason}
                            </span>
                          </td>
                          {currentUser.is_admin && (
                            <td className="px-4 py-3 text-center border-b border-slate-800/50">
                              <Button
                                data-testid={`delete-${assignment.id}`}
                                onClick={() => handleDelete(assignment.id)}
                                disabled={loading}
                                size="sm"
                                className="bg-red-500/20 hover:bg-red-500/40 text-red-400 rounded-sm h-7 w-7 p-0"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </td>
                          )}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
              
              {/* Table Footer with summary */}
              {sortedAssignments.length > 0 && (
                <div className="bg-slate-800/50 px-4 py-2 border-t border-slate-700 flex items-center justify-between text-xs text-slate-400">
                  <span>
                    Showing {sortedAssignments.length} of {assignments.length} records
                  </span>
                  <span>
                    Sorted by: <span className="text-amber-500 capitalize">{sortConfig.key.replace('_', ' ')}</span> ({sortConfig.direction === 'asc' ? 'ascending' : 'descending'})
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
