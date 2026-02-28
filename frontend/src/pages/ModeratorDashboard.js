import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Search, LogOut, CheckCircle, XCircle, Eye, EyeOff, ThumbsUp, ThumbsDown, MessageSquare, Settings, Server, ArrowUpDown, Filter, Menu, X, Trash2, Edit, ClipboardList, LayoutDashboard, Clock, UserCheck } from "lucide-react";
import { useCMod } from "@/hooks/useCMod";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function ModeratorDashboard() {
  const navigate = useNavigate();
  const { disableCMod } = useCMod();
  const [applications, setApplications] = useState([]);
  const [filteredApplications, setFilteredApplications] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedApp, setSelectedApp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState({ username: "", role: "moderator", roles: ["moderator"], is_training_manager: false, is_in_game_leader: false, is_discord_leader: false });
  const [newComment, setNewComment] = useState("");
  const [sortOrder, setSortOrder] = useState("newest"); // newest, oldest, most_positive_votes, most_negative_votes
  const [statusFilter, setStatusFilter] = useState(["all"]); // all, awaiting_review, pending, approved, rejected
  const [positionFilter, setPositionFilter] = useState(["all"]); // all, Discord, In-Game, Both
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showStatusChangeDialog, setShowStatusChangeDialog] = useState(false);
  const [statusChangeData, setStatusChangeData] = useState({ status: "", comment: "" });
  const [showFullQuestions, setShowFullQuestions] = useState(false);
  const [activeTab, setActiveTab] = useState("pending"); // pending, team_approved, approved, rejected, waiting
  // Audit log moved to separate page

  useEffect(() => {
    const token = localStorage.getItem('moderator_token');
    const role = localStorage.getItem('moderator_role');
    const username = localStorage.getItem('moderator_username');
    const storedRoles = JSON.parse(localStorage.getItem('moderator_roles') || '[]');
    
    if (!token) {
      navigate('/moderator/login');
      return;
    }
    
    fetchCurrentUser(token, username, role, storedRoles);
    fetchApplications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  const fetchCurrentUser = async (token, username, role, storedRoles = []) => {
    try {
      // Fetch moderator list to check training manager and admin status
      const response = await axios.get(`${API}/moderators`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const currentMod = response.data.find(m => m.username === username);
      const roles = (currentMod?.roles && currentMod.roles.length > 0) ? currentMod.roles : (storedRoles.length > 0 ? storedRoles : [role]);
      setCurrentUser({ 
        username, 
        role: currentMod?.role || role,
        roles,
        is_training_manager: currentMod?.is_training_manager || false,
        is_in_game_leader: currentMod?.is_in_game_leader || false,
        is_discord_leader: currentMod?.is_discord_leader || false,
        is_admin: currentMod?.is_admin || role === 'admin'
      });
    } catch (error) {
      // If can't fetch (non-admin), just set basic info
      const roles = storedRoles.length > 0 ? storedRoles : [role];
      setCurrentUser({
        username,
        role,
        roles,
        is_training_manager: localStorage.getItem('moderator_is_training_manager') === "true",
        is_in_game_leader: localStorage.getItem('moderator_is_in_game_leader') === "true",
        is_discord_leader: localStorage.getItem('moderator_is_discord_leader') === "true",
        is_admin: role === 'admin'
      });
    }
  };

  useEffect(() => {
    let filtered = [...applications];
    
    // Apply tab-based filtering first
    if (activeTab === "pending") {
      // Pending tab shows: awaiting_review and pending (needs votes)
      filtered = filtered.filter(app => app.status === 'awaiting_review' || app.status === 'pending');
    } else if (activeTab === "team_approved") {
      // Team Approved: apps that have at least one team approval based on position
      // Support both new boolean fields AND old status format
      filtered = filtered.filter(app => {
        const hasDiscordApproval = app.discord_approved || app.status === 'discord_approved';
        const hasInGameApproval = app.in_game_approved || app.status === 'in_game_approved';
        
        if (app.position === 'Both') {
          return hasDiscordApproval || hasInGameApproval;
        } else if (app.position === 'Discord') {
          return hasDiscordApproval;
        } else if (app.position === 'In-Game') {
          return hasInGameApproval;
        }
        return false;
      });
    } else if (activeTab === "approved") {
      filtered = filtered.filter(app => app.status === 'approved');
    } else if (activeTab === "rejected") {
      filtered = filtered.filter(app => app.status === 'rejected');
    } else if (activeTab === "waiting") {
      filtered = filtered.filter(app => app.status === 'waiting');
    }
    
    // Apply search filter
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(app => 
        app.name.toLowerCase().includes(query) ||
        app.discord_handle.toLowerCase().includes(query) ||
        app.ingame_name.toLowerCase().includes(query) ||
        app.server.toLowerCase().includes(query)
      );
    }
    
    // Apply status filter (within tab)
    if (!statusFilter.includes("all")) {
      filtered = filtered.filter(app => statusFilter.includes(app.status));
    }
    
    // Apply position filter
    if (!positionFilter.includes("all")) {
      filtered = filtered.filter(app => positionFilter.includes(app.position));
    }
    
    // Apply sort order
    filtered.sort((a, b) => {
      const dateA = new Date(a.submitted_at);
      const dateB = new Date(b.submitted_at);
      const votesA = getVoteCounts(a.votes || []);
      const votesB = getVoteCounts(b.votes || []);

      if (sortOrder === "most_positive_votes") {
        return votesB.approve - votesA.approve;
      }

      if (sortOrder === "most_negative_votes") {
        return votesB.reject - votesA.reject;
      }

      return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
    });
    
    setFilteredApplications(filtered);
  }, [searchQuery, applications, sortOrder, statusFilter, positionFilter, activeTab]);

  const toggleStatusFilter = (status) => {
    if (status === "all") {
      setStatusFilter(["all"]);
    } else {
      setStatusFilter(prev => {
        // Remove "all" if selecting specific status
        let newFilter = prev.filter(s => s !== "all");
        
        if (newFilter.includes(status)) {
          // Remove status if already selected
          newFilter = newFilter.filter(s => s !== status);
        } else {
          // Add status
          newFilter = [...newFilter, status];
        }
        
        // If no filters selected, default to "all"
        return newFilter.length === 0 ? ["all"] : newFilter;
      });
    }
  };

  const togglePositionFilter = (position) => {
    if (position === "all") {
      setPositionFilter(["all"]);
    } else {
      setPositionFilter(prev => {
        // Remove "all" if selecting specific position
        let newFilter = prev.filter(p => p !== "all");
        
        if (newFilter.includes(position)) {
          // Remove position if already selected
          newFilter = newFilter.filter(p => p !== position);
        } else {
          // Add position
          newFilter = [...newFilter, position];
        }
        
        // If no filters selected, default to "all"
        return newFilter.length === 0 ? ["all"] : newFilter;
      });
    }
  };

  const fetchApplications = async () => {
    try {
      const token = localStorage.getItem('moderator_token');
      const response = await axios.get(`${API}/applications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setApplications(response.data);
      setFilteredApplications(response.data);
    } catch (error) {
      console.error(error);
      if (error.response?.status === 401) {
        toast.error("Session expired. Please login again.");
        localStorage.removeItem('moderator_token');
        navigate('/moderator/login');
      } else if (error.response?.status === 403) {
        // User doesn't have permission to view applications
        toast.info("Redirecting to Server Assignments...");
        navigate('/moderator/server-assignments');
      } else {
        toast.error("Failed to fetch applications");
      }
    } finally {
      setLoading(false);
    }
  };

  // View application and track the view
  const viewApplication = async (app) => {
    try {
      const token = localStorage.getItem('moderator_token');
      // Fetch the individual application to record the view
      const response = await axios.get(`${API}/applications/${app.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedApp(response.data);
      
      // Update the local application list to reflect viewed status
      setApplications(prev => prev.map(a => 
        a.id === app.id 
          ? { ...a, viewed_by: response.data.viewed_by || [...(a.viewed_by || []), currentUser.username] }
          : a
      ));
    } catch (error) {
      console.error(error);
      // Fallback to just showing the app if fetch fails
      setSelectedApp(app);
    }
  };

  const handleVote = async (applicationId, vote) => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem('moderator_token');
      await axios.post(
        `${API}/applications/${applicationId}/vote`,
        { vote },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`Vote recorded: ${vote}`);
      fetchApplications();
      // Refresh selected app
      const response = await axios.get(`${API}/applications/${applicationId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedApp(response.data);
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.detail || `Failed to vote`);
    } finally {
      setActionLoading(false);
    }
  };

  const currentUserHasAnyRole = (allowedRoles) => {
    const roleSet = new Set([...(currentUser.roles || []), currentUser.role]);
    return allowedRoles.some((roleName) => roleSet.has(roleName));
  };

  const handleComment = async (applicationId) => {
    if (!newComment.trim()) {
      toast.error("Comment cannot be empty");
      return;
    }
    
    setActionLoading(true);
    try {
      const token = localStorage.getItem('moderator_token');
      await axios.post(
        `${API}/applications/${applicationId}/comment`,
        { comment: newComment },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Comment added!");
      setNewComment("");
      fetchApplications();
      // Refresh selected app
      const response = await axios.get(`${API}/applications/${applicationId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedApp(response.data);
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.detail || "Failed to add comment");
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatusUpdate = async (applicationId, status, comment) => {
    if (!comment || !comment.trim()) {
      toast.error("A comment is required when changing status");
      return;
    }
    
    setActionLoading(true);
    try {
      const token = localStorage.getItem('moderator_token');
      await axios.patch(
        `${API}/applications/${applicationId}`,
        { status, comment },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`Application status changed to ${status}!`);
      setSelectedApp(null);
      setShowStatusChangeDialog(false);
      setStatusChangeData({ status: "", comment: "" });
      fetchApplications();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.detail || `Failed to update application`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteApplication = async (applicationId, appName) => {
    if (!window.confirm(`Are you sure you want to DELETE the application from "${appName}"? This action cannot be undone!`)) {
      return;
    }
    
    setActionLoading(true);
    try {
      const token = localStorage.getItem('moderator_token');
      await axios.delete(`${API}/applications/${applicationId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(`Application from ${appName} deleted`);
      setSelectedApp(null);
      fetchApplications();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.detail || "Failed to delete application");
    } finally {
      setActionLoading(false);
    }
  };

  // Audit log fetch moved to separate page

  const handleLogout = () => {
    disableCMod(); // Disable CMod mode on logout (must be before localStorage.clear)
    localStorage.clear();
    toast.success("Logged out successfully");
    navigate('/');
  };
  
  const getUserVote = (votes) => {
    if (!votes || votes.length === 0) return null;
    return votes.find(v => v.moderator === currentUser.username);
  };
  
  const getVoteCounts = (votes) => {
    if (!votes || votes.length === 0) return { approve: 0, reject: 0 };
    return {
      approve: votes.filter(v => v.vote === 'approve').length,
      reject: votes.filter(v => v.vote === 'reject').length
    };
  };

  const canApplyIntermediateStatus = currentUser.role === 'admin' || currentUser.role === 'mmod' || currentUser.is_training_manager || currentUser.is_in_game_leader || currentUser.is_discord_leader;

  const canApplyFinalApproval = canApplyIntermediateStatus && (selectedApp?.status === 'in_game_approved' || selectedApp?.status === 'discord_approved');

  // Check if app is fully team approved based on position
  // Support both new boolean fields AND old status format
  const isFullyTeamApproved = (app) => {
    if (!app) return false;
    const hasDiscordApproval = app.discord_approved || app.status === 'discord_approved';
    const hasInGameApproval = app.in_game_approved || app.status === 'in_game_approved';
    
    if (app.position === 'Both') {
      return hasDiscordApproval && hasInGameApproval;
    } else if (app.position === 'Discord') {
      return hasDiscordApproval;
    } else if (app.position === 'In-Game') {
      return hasInGameApproval;
    }
    return false;
  };

  // Get team approval count for stats
  // Support both new boolean fields AND old status format
  const getTeamApprovedCount = () => {
    return applications.filter(app => {
      if (app.status === 'approved') return false; // Don't count fully approved
      const hasDiscordApproval = app.discord_approved || app.status === 'discord_approved';
      const hasInGameApproval = app.in_game_approved || app.status === 'in_game_approved';
      
      if (app.position === 'Both') {
        return hasDiscordApproval || hasInGameApproval;
      } else if (app.position === 'Discord') {
        return hasDiscordApproval;
      } else if (app.position === 'In-Game') {
        return hasInGameApproval;
      }
      return false;
    }).length;
  };

  const handleTeamApproval = async (applicationId, approvalType) => {
    const comment = prompt(`Enter a comment for your ${approvalType === 'discord' ? 'Discord' : 'In-Game'} approval:`);
    if (!comment || !comment.trim()) {
      toast.error("A comment is required");
      return;
    }
    
    setActionLoading(true);
    try {
      const token = localStorage.getItem('moderator_token');
      await axios.post(
        `${API}/applications/${applicationId}/team-approve`,
        { approval_type: approvalType, comment },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`${approvalType === 'discord' ? 'Discord' : 'In-Game'} approval granted!`);
      fetchApplications();
      // Refresh selected app
      const response = await axios.get(`${API}/applications/${applicationId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedApp(response.data);
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.detail || "Failed to approve");
    } finally {
      setActionLoading(false);
    }
  };

  const handleTeamUnapproval = async (applicationId, approvalType) => {
    if (!window.confirm(`Are you sure you want to remove ${approvalType === 'discord' ? 'Discord' : 'In-Game'} approval?`)) {
      return;
    }
    
    setActionLoading(true);
    try {
      const token = localStorage.getItem('moderator_token');
      await axios.post(
        `${API}/applications/${applicationId}/team-unapprove`,
        { approval_type: approvalType, comment: "Approval removed" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`${approvalType === 'discord' ? 'Discord' : 'In-Game'} approval removed`);
      fetchApplications();
      // Refresh selected app
      const response = await axios.get(`${API}/applications/${applicationId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedApp(response.data);
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.detail || "Failed to remove approval");
    } finally {
      setActionLoading(false);
    }
  };


  // Get team approval badges for an application
  // Support both new boolean fields AND old status format
  const getTeamApprovalBadges = (app) => {
    const badges = [];
    const hasDiscordApproval = app.discord_approved || app.status === 'discord_approved';
    const hasInGameApproval = app.in_game_approved || app.status === 'in_game_approved';
    
    if (hasDiscordApproval) {
      badges.push(
        <Badge key="discord" className="bg-indigo-500/20 text-indigo-400 border-indigo-500/30 text-xs">
          Discord ✓
        </Badge>
      );
    }
    if (hasInGameApproval) {
      badges.push(
        <Badge key="ingame" className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 text-xs">
          In-Game ✓
        </Badge>
      );
    }
    return badges;
  };

  // Check if current user has viewed the application
  const hasUserViewed = (viewedBy) => {
    if (!viewedBy || viewedBy.length === 0) return false;
    return viewedBy.includes(currentUser.username);
  };

  // Check if current user has voted on the application
  const hasUserVoted = (votes) => {
    if (!votes || votes.length === 0) return false;
    return votes.some(v => v.moderator === currentUser.username);
  };

  // Get the user's interaction status with an application
  const getUserInteractionBadge = (app) => {
    const voted = hasUserVoted(app.votes);
    const viewed = hasUserViewed(app.viewed_by);
    const userVote = getUserVote(app.votes);
    
    if (voted) {
      // User has voted - show their vote
      return userVote?.vote === 'approve' ? (
        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs gap-1">
          <ThumbsUp className="h-3 w-3" /> Voted
        </Badge>
      ) : (
        <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs gap-1">
          <ThumbsDown className="h-3 w-3" /> Voted
        </Badge>
      );
    } else if (viewed) {
      // User has viewed but not voted
      return (
        <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs gap-1">
          <Eye className="h-3 w-3" /> Viewed
        </Badge>
      );
    }
    // User hasn't viewed or voted - show "New" indicator
    return (
      <Badge variant="outline" className="border-slate-600 text-slate-500 text-xs gap-1">
        <EyeOff className="h-3 w-3" /> New
      </Badge>
    );
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "awaiting_review":
        return <Badge data-testid={`badge-awaiting-review`} variant="outline" className="uppercase border-slate-600 text-slate-400 font-semibold">Awaiting Review</Badge>;
      case "pending":
        return <Badge data-testid={`badge-pending`} className="uppercase bg-blue-500/20 text-blue-400 border-blue-500/50 font-semibold">Pending</Badge>;
      case "approved":
        return <Badge data-testid={`badge-approved`} className="uppercase bg-emerald-500/20 text-emerald-400 border-emerald-500/50 font-semibold">Approved</Badge>;
      case "in_game_approved":
        return <Badge data-testid={`badge-in-game-approved`} className="uppercase bg-cyan-500/20 text-cyan-400 border-cyan-500/50 font-semibold">In-Game Approved</Badge>;
      case "discord_approved":
        return <Badge data-testid={`badge-discord-approved`} className="uppercase bg-indigo-500/20 text-indigo-400 border-indigo-500/50 font-semibold">Discord Approved</Badge>;
      case "rejected":
        return <Badge data-testid={`badge-rejected`} className="uppercase bg-red-500/20 text-red-400 border-red-500/50 font-semibold">Rejected</Badge>;
      case "waiting":
        return <Badge data-testid={`badge-waiting`} className="uppercase bg-amber-500/20 text-amber-400 border-amber-500/50 font-semibold">Waiting</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-200 flex items-center justify-center">
        <p className="text-xl">Loading applications...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 grid-texture">
      {/* Header */}
      <div className="bg-slate-900/50 border-b border-slate-800 sticky top-0 z-10 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-lg sm:text-2xl md:text-3xl font-bold uppercase tracking-wider text-amber-500" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
              Moderator Command Center
            </h1>
            
            {/* Mobile Menu Button */}
            <Button
              className="md:hidden border-slate-600 text-slate-300"
              variant="outline"
              size="sm"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex gap-2 lg:gap-3">
              {currentUserHasAnyRole(["admin", "mmod"]) && (
                <Button
                  data-testid="audit-log-btn"
                  onClick={() => navigate('/moderator/audit-log')}
                  variant="outline"
                  size="sm"
                  className="border-purple-500 text-purple-500 hover:bg-purple-500/20 uppercase tracking-wide rounded-sm text-xs lg:text-sm"
                >
                  <ClipboardList className="mr-1 lg:mr-2 h-3 w-3 lg:h-4 lg:w-4" />
                  Audit Log
                </Button>
              )}
              <Button
                data-testid="portal-btn"
                onClick={() => navigate('/moderator/portal')}
                variant="outline"
                size="sm"
                className="border-blue-500 text-blue-500 hover:bg-blue-500/20 uppercase tracking-wide rounded-sm text-xs lg:text-sm"
              >
                <LayoutDashboard className="mr-1 lg:mr-2 h-3 w-3 lg:h-4 lg:w-4" />
                Dashboard
              </Button>
              <Button
                data-testid="server-assignments-btn"
                onClick={() => navigate('/moderator/server-assignments')}
                variant="outline"
                size="sm"
                className="border-emerald-500 text-emerald-500 hover:bg-emerald-500/20 uppercase tracking-wide rounded-sm text-xs lg:text-sm"
              >
                <Server className="mr-1 lg:mr-2 h-3 w-3 lg:h-4 lg:w-4" />
                Servers
              </Button>
              <Button
                data-testid="settings-btn"
                onClick={() => navigate('/moderator/settings')}
                variant="outline"
                size="sm"
                className="border-amber-500 text-amber-500 hover:bg-amber-500/20 uppercase tracking-wide rounded-sm text-xs lg:text-sm"
              >
                <Settings className="mr-1 lg:mr-2 h-3 w-3 lg:h-4 lg:w-4" />
                Settings
              </Button>
              <Button
                data-testid="logout-btn"
                onClick={handleLogout}
                variant="outline"
                size="sm"
                className="border-red-500 text-red-500 hover:bg-red-500/20 uppercase tracking-wide rounded-sm text-xs lg:text-sm"
              >
                <LogOut className="mr-1 lg:mr-2 h-3 w-3 lg:h-4 lg:w-4" />
                Logout
              </Button>
            </div>
          </div>
          
          {/* Mobile Navigation Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden mt-3 pt-3 border-t border-slate-700 grid grid-cols-2 gap-2">
              {currentUserHasAnyRole(["admin", "mmod"]) && (
                <Button
                  onClick={() => { navigate('/moderator/audit-log'); setMobileMenuOpen(false); }}
                  variant="outline"
                  size="sm"
                  className="border-purple-500 text-purple-500 hover:bg-purple-500/20 uppercase tracking-wide rounded-sm text-xs w-full"
                >
                  <ClipboardList className="mr-1 h-3 w-3" />
                  Audit Log
                </Button>
              )}
              <Button
                onClick={() => { navigate('/moderator/portal'); setMobileMenuOpen(false); }}
                variant="outline"
                size="sm"
                className="border-blue-500 text-blue-500 hover:bg-blue-500/20 uppercase tracking-wide rounded-sm text-xs w-full"
              >
                <LayoutDashboard className="mr-1 h-3 w-3" />
                Dashboard
              </Button>
              <Button
                onClick={() => { navigate('/moderator/server-assignments'); setMobileMenuOpen(false); }}
                variant="outline"
                size="sm"
                className="border-emerald-500 text-emerald-500 hover:bg-emerald-500/20 uppercase tracking-wide rounded-sm text-xs w-full"
              >
                <Server className="mr-1 h-3 w-3" />
                Servers
              </Button>
              <Button
                onClick={() => { navigate('/moderator/settings'); setMobileMenuOpen(false); }}
                variant="outline"
                size="sm"
                className="border-amber-500 text-amber-500 hover:bg-amber-500/20 uppercase tracking-wide rounded-sm text-xs w-full"
              >
                <Settings className="mr-1 h-3 w-3" />
                Settings
              </Button>
              <Button
                onClick={handleLogout}
                variant="outline"
                size="sm"
                className="border-red-500 text-red-500 hover:bg-red-500/20 uppercase tracking-wide rounded-sm text-xs w-full"
              >
                <LogOut className="mr-1 h-3 w-3" />
                Logout
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Search Bar */}
        <div className="mb-4 sm:mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 h-4 w-4 sm:h-5 sm:w-5" />
            <Input
              data-testid="search-input"
              type="text"
              placeholder="Search by name, Discord, in-game name, or server..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 sm:pl-10 bg-slate-900/50 border-slate-700 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-slate-200 rounded-sm py-4 sm:py-6 text-sm sm:text-base"
            />
          </div>
        </div>

        {/* Filters Row */}
        <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row gap-3">
          {/* Date Sort Filter */}
          <div className="flex items-center gap-2">
            <ArrowUpDown className="h-4 w-4 text-slate-400 hidden sm:block" />
            <Select value={sortOrder} onValueChange={setSortOrder}>
              <SelectTrigger 
                data-testid="sort-order-select"
                className="w-full sm:w-[180px] bg-slate-900/50 border-slate-700 text-slate-200 text-sm"
              >
                <ArrowUpDown className="h-4 w-4 mr-2 sm:hidden" />
                <SelectValue placeholder="Sort by date" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-700">
                <SelectItem value="newest" className="text-slate-200">Newest First</SelectItem>
                <SelectItem value="oldest" className="text-slate-200">Oldest First</SelectItem>
                <SelectItem value="most_positive_votes" className="text-emerald-400">Most Positive Votes</SelectItem>
                <SelectItem value="most_negative_votes" className="text-red-400">Most Negative Votes</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-6">
          <div className="glass-card p-3 sm:p-4 rounded-lg">
            <p className="text-slate-400 text-xs uppercase tracking-wide" style={{ fontFamily: 'Rajdhani, sans-serif' }}>Needs Review</p>
            <p className="text-xl sm:text-3xl font-bold text-blue-400 mt-1" style={{ fontFamily: 'Rajdhani, sans-serif' }}>{applications.filter(a => a.status === 'awaiting_review' || a.status === 'pending').length}</p>
          </div>
          <div className="glass-card p-3 sm:p-4 rounded-lg">
            <p className="text-slate-400 text-xs uppercase tracking-wide" style={{ fontFamily: 'Rajdhani, sans-serif' }}>Approved</p>
            <p className="text-xl sm:text-3xl font-bold text-emerald-500 mt-1" style={{ fontFamily: 'Rajdhani, sans-serif' }}>{applications.filter(a => ['approved', 'in_game_approved', 'discord_approved'].includes(a.status)).length}</p>
          </div>
          <div className="glass-card p-3 sm:p-4 rounded-lg">
            <p className="text-slate-400 text-xs uppercase tracking-wide" style={{ fontFamily: 'Rajdhani, sans-serif' }}>Waiting</p>
            <p className="text-xl sm:text-3xl font-bold text-amber-400 mt-1" style={{ fontFamily: 'Rajdhani, sans-serif' }}>{applications.filter(a => a.status === 'waiting').length}</p>
          </div>
          <div className="glass-card p-3 sm:p-4 rounded-lg">
            <p className="text-slate-400 text-xs uppercase tracking-wide" style={{ fontFamily: 'Rajdhani, sans-serif' }}>Rejected</p>
            <p className="text-xl sm:text-3xl font-bold text-red-400 mt-1" style={{ fontFamily: 'Rajdhani, sans-serif' }}>{applications.filter(a => a.status === 'rejected').length}</p>
          </div>
        </div>

        {/* Tabs for Application Categories */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full grid grid-cols-5 bg-slate-900/50 border border-slate-700 rounded-sm mb-4 h-auto p-1">
            <TabsTrigger 
              value="pending" 
              data-testid="tab-pending"
              className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400 text-slate-400 rounded-sm py-2 text-xs sm:text-sm uppercase tracking-wide font-semibold"
            >
              <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Pending</span>
              <span className="sm:hidden">Vote</span>
              <Badge className="ml-1 sm:ml-2 bg-blue-500/20 text-blue-400 text-xs h-5 px-1.5">{applications.filter(a => a.status === 'awaiting_review' || a.status === 'pending').length}</Badge>
            </TabsTrigger>
            <TabsTrigger 
              value="team_approved" 
              data-testid="tab-team-approved"
              className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400 text-slate-400 rounded-sm py-2 text-xs sm:text-sm uppercase tracking-wide font-semibold"
            >
              <UserCheck className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Team OK</span>
              <span className="sm:hidden">Team</span>
              <Badge className="ml-1 sm:ml-2 bg-cyan-500/20 text-cyan-400 text-xs h-5 px-1.5">{getTeamApprovedCount()}</Badge>
            </TabsTrigger>
            <TabsTrigger 
              value="approved" 
              data-testid="tab-approved"
              className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400 text-slate-400 rounded-sm py-2 text-xs sm:text-sm uppercase tracking-wide font-semibold"
            >
              <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Approved</span>
              <span className="sm:hidden">OK</span>
              <Badge className="ml-1 sm:ml-2 bg-emerald-500/20 text-emerald-400 text-xs h-5 px-1.5">{applications.filter(a => a.status === 'approved').length}</Badge>
            </TabsTrigger>
            <TabsTrigger 
              value="waiting" 
              data-testid="tab-waiting"
              className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400 text-slate-400 rounded-sm py-2 text-xs sm:text-sm uppercase tracking-wide font-semibold"
            >
              <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Waiting</span>
              <span className="sm:hidden">Wait</span>
              <Badge className="ml-1 sm:ml-2 bg-amber-500/20 text-amber-400 text-xs h-5 px-1.5">{applications.filter(a => a.status === 'waiting').length}</Badge>
            </TabsTrigger>
            <TabsTrigger 
              value="rejected" 
              data-testid="tab-rejected"
              className="data-[state=active]:bg-red-500/20 data-[state=active]:text-red-400 text-slate-400 rounded-sm py-2 text-xs sm:text-sm uppercase tracking-wide font-semibold"
            >
              <XCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Rejected</span>
              <span className="sm:hidden">No</span>
              <Badge className="ml-1 sm:ml-2 bg-red-500/20 text-red-400 text-xs h-5 px-1.5">{applications.filter(a => a.status === 'rejected').length}</Badge>
            </TabsTrigger>
          </TabsList>

          {/* Position Filter Buttons - Multiselect */}
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="text-slate-400 text-xs uppercase tracking-wide flex items-center mr-2" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
              <Filter className="h-3 w-3 mr-1" /> Position:
            </span>
            <Button
              data-testid="filter-all-positions"
              onClick={() => togglePositionFilter("all")}
              variant="outline"
              size="sm"
              className={`rounded-sm text-xs uppercase tracking-wide transition-all ${
                positionFilter.includes("all")
                  ? "bg-slate-500/30 border-slate-400 text-slate-200"
                  : "bg-slate-900/50 border-slate-700 text-slate-500 hover:border-slate-500 hover:text-slate-300"
              }`}
            >
              All
            </Button>
            <Button
              data-testid="filter-discord"
              onClick={() => togglePositionFilter("Discord")}
              variant="outline"
              size="sm"
              className={`rounded-sm text-xs uppercase tracking-wide transition-all ${
                positionFilter.includes("Discord")
                  ? "bg-indigo-500/30 border-indigo-400 text-indigo-300"
                  : "bg-slate-900/50 border-slate-700 text-slate-500 hover:border-indigo-500 hover:text-indigo-400"
              }`}
            >
              Discord
            </Button>
            <Button
              data-testid="filter-in-game"
              onClick={() => togglePositionFilter("In-Game")}
              variant="outline"
              size="sm"
              className={`rounded-sm text-xs uppercase tracking-wide transition-all ${
                positionFilter.includes("In-Game")
                  ? "bg-cyan-500/30 border-cyan-400 text-cyan-300"
                  : "bg-slate-900/50 border-slate-700 text-slate-500 hover:border-cyan-500 hover:text-cyan-400"
              }`}
            >
              In-Game
            </Button>
            <Button
              data-testid="filter-both"
              onClick={() => togglePositionFilter("Both")}
              variant="outline"
              size="sm"
              className={`rounded-sm text-xs uppercase tracking-wide transition-all ${
                positionFilter.includes("Both")
                  ? "bg-amber-500/30 border-amber-400 text-amber-300"
                  : "bg-slate-900/50 border-slate-700 text-slate-500 hover:border-amber-500 hover:text-amber-400"
              }`}
            >
              Both
            </Button>
          </div>

        {/* Applications - Mobile Card View */}
        <div className="sm:hidden space-y-3" data-testid="applications-mobile">
          {filteredApplications.length === 0 ? (
            <div className="glass-card p-6 text-center text-slate-400 rounded-lg">
              No applications found.
            </div>
          ) : (
            filteredApplications.map((app) => {
              const voteCounts = getVoteCounts(app.votes);
              return (
                <div 
                  key={app.id} 
                  data-testid={`application-card-${app.id}`}
                  className="glass-card p-4 rounded-lg"
                  onClick={() => viewApplication(app)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-amber-400 truncate">{app.ingame_name}</p>
                      <p className="text-xs text-slate-500 mono truncate">{app.discord_handle}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {getStatusBadge(app.status)}
                      {getUserInteractionBadge(app)}
                      <div className="flex gap-1">
                        {getTeamApprovalBadges(app)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex gap-3">
                      <span className="text-slate-400">{app.position}</span>
                      <span className="text-slate-400 mono">S{app.server}</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-emerald-400 font-semibold flex items-center gap-0.5">
                        <ThumbsUp className="h-3 w-3" /> {voteCounts.approve}
                      </span>
                      <span className="text-red-400 font-semibold flex items-center gap-0.5">
                        <ThumbsDown className="h-3 w-3" /> {voteCounts.reject}
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 pt-2 border-t border-slate-700 flex items-center justify-between">
                    <span className="text-xs text-slate-500">
                      {new Date(app.submitted_at).toLocaleDateString()}
                    </span>
                    <Button
                      size="sm"
                      className="bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 text-xs px-3 py-1 h-auto rounded-sm"
                    >
                      <Eye className="h-3 w-3 mr-1" /> View
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Applications - Desktop Table View */}
        <div className="hidden sm:block glass-card rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full" data-testid="applications-table">
              <thead className="bg-slate-900/70">
                <tr>
                  <th className="px-4 lg:px-6 py-3 lg:py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider" style={{ fontFamily: 'Rajdhani, sans-serif' }}>In-Game Name</th>
                  <th className="px-4 lg:px-6 py-3 lg:py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider" style={{ fontFamily: 'Rajdhani, sans-serif' }}>Position</th>
                  <th className="px-4 lg:px-6 py-3 lg:py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider" style={{ fontFamily: 'Rajdhani, sans-serif' }}>Server</th>
                  <th className="px-4 lg:px-6 py-3 lg:py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider" style={{ fontFamily: 'Rajdhani, sans-serif' }}>Votes</th>
                  <th className="px-4 lg:px-6 py-3 lg:py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider" style={{ fontFamily: 'Rajdhani, sans-serif' }}>Status</th>
                  <th className="px-4 lg:px-6 py-3 lg:py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider" style={{ fontFamily: 'Rajdhani, sans-serif' }}>My Status</th>
                  <th className="px-4 lg:px-6 py-3 lg:py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider" style={{ fontFamily: 'Rajdhani, sans-serif' }}>Submitted</th>
                  <th className="px-4 lg:px-6 py-3 lg:py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider" style={{ fontFamily: 'Rajdhani, sans-serif' }}>Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredApplications.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-8 text-center text-slate-400">
                      No applications found.
                    </td>
                  </tr>
                ) : (
                  filteredApplications.map((app) => {
                    const voteCounts = getVoteCounts(app.votes);
                    return (
                      <tr
                        key={app.id}
                        data-testid={`application-row-${app.id}`}
                        className="hover:bg-slate-900/30 transition-colors cursor-pointer"
                        onClick={() => viewApplication(app)}
                      >
                        <td className="px-4 lg:px-6 py-3 lg:py-4">
                          <div>
                            <p className="font-semibold text-amber-400 text-sm lg:text-base">{app.ingame_name}</p>
                            <p className="text-xs lg:text-sm text-slate-500 mono truncate max-w-[150px] lg:max-w-none">{app.discord_handle}</p>
                          </div>
                        </td>
                        <td className="px-4 lg:px-6 py-3 lg:py-4 text-slate-300 text-sm">{app.position}</td>
                        <td className="px-4 lg:px-6 py-3 lg:py-4 text-slate-300 mono text-sm">{app.server}</td>
                        <td className="px-4 lg:px-6 py-3 lg:py-4">
                          <div className="flex gap-2 lg:gap-3">
                            <span className="text-emerald-400 font-semibold flex items-center gap-1 text-sm">
                              <ThumbsUp className="h-3 w-3" /> {voteCounts.approve}
                            </span>
                            <span className="text-red-400 font-semibold flex items-center gap-1 text-sm">
                              <ThumbsDown className="h-3 w-3" /> {voteCounts.reject}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 lg:px-6 py-3 lg:py-4">
                          <div className="flex flex-col gap-1">
                            {getStatusBadge(app.status)}
                            <div className="flex gap-1 flex-wrap">
                              {getTeamApprovalBadges(app)}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 lg:px-6 py-3 lg:py-4">{getUserInteractionBadge(app)}</td>
                        <td className="px-4 lg:px-6 py-3 lg:py-4 text-slate-400 text-xs lg:text-sm">
                          {new Date(app.submitted_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 lg:px-6 py-3 lg:py-4">
                          <Button
                            data-testid={`view-btn-${app.id}`}
                            onClick={(event) => {
                              event.stopPropagation();
                              viewApplication(app);
                            }}
                            size="sm"
                            className="bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-sm"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
        </Tabs>
      </div>

      {/* Application Detail Dialog */}
      <Dialog open={!!selectedApp} onOpenChange={() => setSelectedApp(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto overflow-x-hidden bg-slate-900 border-slate-700 text-slate-200 w-[95vw] sm:w-auto" data-testid="application-detail-dialog">
          {selectedApp && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold uppercase tracking-wider text-amber-500" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                  Application Details
                </DialogTitle>
                <DialogDescription className="text-slate-400">
                  Review and take action on this application
                </DialogDescription>
              </DialogHeader>

              {/* Highlighted Applicant Info */}
              <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-lg p-4 mt-2">
                <p className="text-slate-400 text-xs uppercase tracking-wide mb-1" style={{ fontFamily: 'Rajdhani, sans-serif' }}>In-Game Name</p>
                <p className="text-2xl font-bold text-amber-400" style={{ fontFamily: 'Rajdhani, sans-serif' }} data-testid="highlighted-ingame-name">
                  {selectedApp.ingame_name}
                </p>
                <p className="text-slate-400 mono text-sm mt-1" data-testid="highlighted-discord">
                  {selectedApp.discord_handle}
                </p>
              </div>

              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-slate-500 text-sm uppercase font-semibold" style={{ fontFamily: 'Rajdhani, sans-serif' }}>Name</p>
                    <p className="text-slate-200" data-testid="detail-name">{selectedApp.name}</p>
                  </div>
                  {currentUser.is_training_manager && (
                    <div>
                      <p className="text-slate-500 text-sm uppercase font-semibold" style={{ fontFamily: 'Rajdhani, sans-serif' }}>Email</p>
                      <p className="text-emerald-400 mono" data-testid="detail-email">{selectedApp.email || "Not provided"}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-slate-500 text-sm uppercase font-semibold" style={{ fontFamily: 'Rajdhani, sans-serif' }}>Position</p>
                    <p className="text-slate-200" data-testid="detail-position">{selectedApp.position}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-sm uppercase font-semibold" style={{ fontFamily: 'Rajdhani, sans-serif' }}>Discord Handle</p>
                    <p className="text-slate-200 mono" data-testid="detail-discord">{selectedApp.discord_handle}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-sm uppercase font-semibold" style={{ fontFamily: 'Rajdhani, sans-serif' }}>In-Game Name</p>
                    <p className="text-slate-200" data-testid="detail-ingame">{selectedApp.ingame_name}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-sm uppercase font-semibold" style={{ fontFamily: 'Rajdhani, sans-serif' }}>Age</p>
                    <p className="text-slate-200">{selectedApp.age}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-sm uppercase font-semibold" style={{ fontFamily: 'Rajdhani, sans-serif' }}>Country</p>
                    <p className="text-slate-200">{selectedApp.country}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-sm uppercase font-semibold" style={{ fontFamily: 'Rajdhani, sans-serif' }}>Server</p>
                    <p className="text-slate-200 mono">{selectedApp.server}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-sm uppercase font-semibold" style={{ fontFamily: 'Rajdhani, sans-serif' }}>Status</p>
                    {getStatusBadge(selectedApp.status)}
                  </div>
                </div>

                <div className="border-t border-slate-700 pt-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold uppercase tracking-wide text-amber-500" style={{ fontFamily: 'Rajdhani, sans-serif' }}>Detailed Responses</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-400">Show full questions</span>
                      <Switch
                        checked={showFullQuestions}
                        onCheckedChange={setShowFullQuestions}
                        data-testid="toggle-full-questions"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    {[
                      { 
                        shortLabel: "Activity Times", 
                        fullLabel: "What are your typical activity times per day? i.e. Reset - 5 to reset.",
                        value: selectedApp.activity_times 
                      },
                      { 
                        shortLabel: "Native Language", 
                        fullLabel: "What is your native language?",
                        value: selectedApp.native_language 
                      },
                      { 
                        shortLabel: "Other Languages", 
                        fullLabel: "What other languages do you speak?",
                        value: selectedApp.other_languages 
                      },
                      { 
                        shortLabel: "Previous Experience", 
                        fullLabel: "Describe your previous experience with online moderation, if any (platforms, roles, duration).",
                        value: selectedApp.previous_experience 
                      },
                      { 
                        shortLabel: "Basic Qualities of a Mod", 
                        fullLabel: "What do you think are the most basic qualities that a mod should possess?",
                        value: selectedApp.basic_qualities 
                      },
                      { 
                        shortLabel: "Favourite Event", 
                        fullLabel: "What is your favourite in-game event, and why?",
                        value: selectedApp.favourite_event 
                      },
                      { 
                        shortLabel: "Free Ways to Gain Gems", 
                        fullLabel: "What are the free ways to gain gems?",
                        value: selectedApp.free_gems 
                      },
                      { 
                        shortLabel: "Heroes That Can Be Mutated", 
                        fullLabel: "How many heroes can be mutated? (Numerical)",
                        value: selectedApp.heroes_mutated 
                      },
                      { 
                        shortLabel: "Highest Character Level", 
                        fullLabel: "What is your highest character level",
                        value: selectedApp.highest_character_level 
                      },
                      { 
                        shortLabel: "Discord Tools Comfort Level (1-5)", 
                        fullLabel: "What is your comfort level with using discord moderation tools & bots? (1 = Not comfortable, 5 = Very comfortable)",
                        value: selectedApp.discord_tools_comfort,
                        isRating: true
                      },
                      { 
                        shortLabel: "Guidelines Understanding", 
                        fullLabel: "Rate your understanding of community guidelines enforcement and conflict resolution. (Be honest, you will be tested)",
                        value: selectedApp.guidelines_rating
                      },
                      { 
                        shortLabel: "Complex Game Mechanic", 
                        fullLabel: "Describe a complex game mechanic you understand well.",
                        value: selectedApp.complex_mechanic 
                      },
                      { 
                        shortLabel: "Unknown Question Response", 
                        fullLabel: "A new player asks a question you don't know the answer to. What do you do?",
                        value: selectedApp.unknown_question 
                      },
                      { 
                        shortLabel: "Hero Development Advice", 
                        fullLabel: "What advice would you give a new player struggling with hero development?",
                        value: selectedApp.hero_development 
                      },
                      { 
                        shortLabel: "Racist R4 Scenario", 
                        fullLabel: "You see your R4's being racist to another player in Alliance chat on your main server. How would you handle the situation?",
                        value: selectedApp.racist_r4 
                      },
                      { 
                        shortLabel: "Moderator Swearing Scenario", 
                        fullLabel: "In a shared language channel you see another moderator swearing and joking with players. How would you approach this situation?",
                        value: selectedApp.moderator_swearing 
                      },
                      // In-Game specific questions
                      { 
                        shortLabel: "Time Playing Top War", 
                        fullLabel: "How long have you been playing Top War for?",
                        value: selectedApp.time_playing_topwar 
                      },
                      { 
                        shortLabel: "Why Good Moderator", 
                        fullLabel: "Why do you think, you would make a good moderator?",
                        value: selectedApp.why_good_moderator 
                      },
                      // Discord-specific questions
                      { 
                        shortLabel: "Discord Moderation Tools Experience", 
                        fullLabel: "Are you familiar with Discord's moderation tools (e.g., roles, permissions, bans, mutes)? Please describe your experience.",
                        value: selectedApp.discord_moderation_tools 
                      },
                      { 
                        shortLabel: "Discord Spam Handling", 
                        fullLabel: "How would you handle a situation where someone is spamming in multiple channels?",
                        value: selectedApp.discord_spam_handling 
                      },
                      { 
                        shortLabel: "Discord Bots Experience", 
                        fullLabel: "Do you know how to use bots for moderation (e.g., setting up auto-moderation, commands)? If yes, which bots have you used?",
                        value: selectedApp.discord_bots_experience 
                      },
                      { 
                        shortLabel: "Discord Harassment Handling", 
                        fullLabel: "What steps would you take if a user reports harassment through Discord DMs?",
                        value: selectedApp.discord_harassment_handling 
                      },
                      { 
                        shortLabel: "Discord Voice Channel Management", 
                        fullLabel: "Are you comfortable managing voice channels (e.g., moving users, muting, handling disruptions)?",
                        value: selectedApp.discord_voice_channel_management 
                      }
                    ].filter(item => item.value && item.value !== "N/A").map((item, index) => (
                      <div key={index} className="bg-slate-800/50 p-4 rounded overflow-hidden">
                        <p className="text-slate-400 text-sm font-semibold mb-1 break-words">
                          {showFullQuestions ? item.fullLabel : item.shortLabel}
                        </p>
                        {item.isRating ? (
                          <div className="flex items-center gap-3">
                            <span className="text-2xl font-bold text-amber-400">{item.value}</span>
                            <span className="text-slate-400 text-sm">/ 5</span>
                            <div className="flex gap-1 ml-2">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <div
                                  key={star}
                                  className={`w-4 h-4 rounded-full ${
                                    star <= parseInt(item.value) 
                                      ? 'bg-amber-500' 
                                      : 'bg-slate-700'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                        ) : (
                          <p className="text-slate-200 break-words whitespace-pre-wrap">{item.value}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Voting Section */}
                <div className="border-t border-slate-700 pt-4">
                  <h3 className="text-lg font-semibold uppercase tracking-wide text-amber-500 mb-4" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                    Moderator Votes
                  </h3>
                  
                  {selectedApp.votes && selectedApp.votes.length > 0 ? (
                    <div className="space-y-2 mb-4">
                      {selectedApp.votes.map((vote, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-slate-800/50 rounded">
                          <span className="text-slate-200 font-medium">{vote.moderator}</span>
                          <div className="flex items-center gap-2">
                            {vote.vote === 'approve' ? (
                              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/50">
                                <ThumbsUp className="h-3 w-3 mr-1" /> APPROVE
                              </Badge>
                            ) : (
                              <Badge className="bg-red-500/20 text-red-400 border-red-500/50">
                                <ThumbsDown className="h-3 w-3 mr-1" /> REJECT
                              </Badge>
                            )}
                            <span className="text-xs text-slate-500 mono">
                              {new Date(vote.timestamp).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-400 mb-4">No votes yet</p>
                  )}
                  
                  {/* Vote Buttons */}
                  {(selectedApp.status === 'awaiting_review' || selectedApp.status === 'pending') && (
                    <div className="flex gap-4">
                      <Button
                        data-testid="vote-approve-btn"
                        onClick={() => handleVote(selectedApp.id, 'approve')}
                        disabled={actionLoading}
                        className="flex-1 bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400 hover:bg-emerald-500/30 font-bold uppercase tracking-wide py-3 rounded-sm"
                      >
                        <ThumbsUp className="mr-2 h-4 w-4" />
                        Vote Approve
                      </Button>
                      <Button
                        data-testid="vote-reject-btn"
                        onClick={() => handleVote(selectedApp.id, 'reject')}
                        disabled={actionLoading}
                        className="flex-1 bg-red-500/20 border-2 border-red-500 text-red-400 hover:bg-red-500/30 font-bold uppercase tracking-wide py-3 rounded-sm"
                      >
                        <ThumbsDown className="mr-2 h-4 w-4" />
                        Vote Reject
                      </Button>
                    </div>
                  )}
                </div>

                {/* Comments Section */}
                <div className="border-t border-slate-700 pt-4">
                  <h3 className="text-lg font-semibold uppercase tracking-wide text-amber-500 mb-4 flex items-center gap-2" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                    <MessageSquare className="h-5 w-5" />
                    Moderator Comments
                  </h3>
                  
                  {selectedApp.comments && selectedApp.comments.length > 0 ? (
                    <div className="space-y-3 mb-4">
                      {selectedApp.comments.map((comment, index) => (
                        <div key={index} className="p-4 bg-slate-800/50 rounded border-l-4 border-amber-500">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-amber-400 font-semibold">{comment.moderator}</span>
                            <span className="text-xs text-slate-500 mono">
                              {new Date(comment.timestamp).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-slate-200">{comment.comment}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-400 mb-4">No comments yet</p>
                  )}
                  
                  {/* Add Comment */}
                  <div className="space-y-2">
                    <Textarea
                      data-testid="comment-input"
                      placeholder="Add your comment..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="bg-slate-900/50 border-slate-700 focus:border-amber-500 text-slate-200 rounded-sm min-h-[100px]"
                    />
                    <Button
                      data-testid="add-comment-btn"
                      onClick={() => handleComment(selectedApp.id)}
                      disabled={actionLoading || !newComment.trim()}
                      className="bg-amber-500 hover:bg-amber-600 text-white font-bold uppercase tracking-wide rounded-sm btn-glow"
                    >
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Add Comment
                    </Button>
                  </div>
                </div>

                {/* Team Approval Section - Discord/In-Game Leaders */}
                {(currentUser.is_discord_leader || currentUser.is_in_game_leader || currentUser.is_admin) && 
                 (selectedApp.status === 'awaiting_review' || selectedApp.status === 'pending' || selectedApp.status === 'in_game_approved' || selectedApp.status === 'discord_approved') && (
                  <div className="border-t border-slate-700 pt-4">
                    <h3 className="text-lg font-semibold uppercase tracking-wide text-cyan-500 mb-4" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                      Team Approval
                    </h3>
                    
                    {/* Show current approval status - support both old and new format */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      <div className={`px-3 py-2 rounded ${(selectedApp.discord_approved || selectedApp.status === 'discord_approved') ? 'bg-indigo-500/20 border border-indigo-500' : 'bg-slate-800/50 border border-slate-700'}`}>
                        <span className={(selectedApp.discord_approved || selectedApp.status === 'discord_approved') ? 'text-indigo-400' : 'text-slate-500'}>
                          Discord: {(selectedApp.discord_approved || selectedApp.status === 'discord_approved') ? `✓ ${selectedApp.discord_approved_by || 'Approved'}` : 'Pending'}
                        </span>
                      </div>
                      <div className={`px-3 py-2 rounded ${(selectedApp.in_game_approved || selectedApp.status === 'in_game_approved') ? 'bg-cyan-500/20 border border-cyan-500' : 'bg-slate-800/50 border border-slate-700'}`}>
                        <span className={(selectedApp.in_game_approved || selectedApp.status === 'in_game_approved') ? 'text-cyan-400' : 'text-slate-500'}>
                          In-Game: {(selectedApp.in_game_approved || selectedApp.status === 'in_game_approved') ? `✓ ${selectedApp.in_game_approved_by || 'Approved'}` : 'Pending'}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                      {/* Discord Approval Button */}
                      {(currentUser.is_discord_leader || currentUser.is_admin) && (
                        (selectedApp.discord_approved || selectedApp.status === 'discord_approved') ? (
                          <Button
                            data-testid="remove-discord-approval-btn"
                            onClick={() => handleTeamUnapproval(selectedApp.id, 'discord')}
                            disabled={actionLoading}
                            className="flex-1 bg-indigo-500/20 border-2 border-indigo-500 text-indigo-400 hover:bg-indigo-500/30 font-bold uppercase tracking-wide py-3 rounded-sm"
                          >
                            <XCircle className="mr-2 h-4 w-4" />
                            Remove Discord Approval
                          </Button>
                        ) : (
                          <Button
                            data-testid="discord-approve-btn"
                            onClick={() => handleTeamApproval(selectedApp.id, 'discord')}
                            disabled={actionLoading}
                            className="flex-1 bg-indigo-500 hover:bg-indigo-600 text-white font-bold uppercase tracking-wide py-3 rounded-sm"
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Discord Approve
                          </Button>
                        )
                      )}
                      
                      {/* In-Game Approval Button */}
                      {(currentUser.is_in_game_leader || currentUser.is_admin) && (
                        (selectedApp.in_game_approved || selectedApp.status === 'in_game_approved') ? (
                          <Button
                            data-testid="remove-ingame-approval-btn"
                            onClick={() => handleTeamUnapproval(selectedApp.id, 'in_game')}
                            disabled={actionLoading}
                            className="flex-1 bg-cyan-500/20 border-2 border-cyan-500 text-cyan-400 hover:bg-cyan-500/30 font-bold uppercase tracking-wide py-3 rounded-sm"
                          >
                            <XCircle className="mr-2 h-4 w-4" />
                            Remove In-Game Approval
                          </Button>
                        ) : (
                          <Button
                            data-testid="ingame-approve-btn"
                            onClick={() => handleTeamApproval(selectedApp.id, 'in_game')}
                            disabled={actionLoading}
                            className="flex-1 bg-cyan-500 hover:bg-cyan-600 text-white font-bold uppercase tracking-wide py-3 rounded-sm"
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            In-Game Approve
                          </Button>
                        )
                      )}
                    </div>
                  </div>
                )}

                {/* Other Status Actions - Waiting/Reject */}
                {(selectedApp.status === 'pending' || selectedApp.status === 'in_game_approved' || selectedApp.status === 'discord_approved') && canApplyIntermediateStatus && (
                  <div className="border-t border-slate-700 pt-4">
                    <h3 className="text-lg font-semibold uppercase tracking-wide text-amber-500 mb-4" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                      Other Actions
                    </h3>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button
                        data-testid="waiting-btn"
                        onClick={() => {
                          setStatusChangeData({ status: "waiting", comment: "" });
                          setShowStatusChangeDialog(true);
                        }}
                        disabled={actionLoading}
                        className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-bold uppercase tracking-wide py-3 rounded-sm"
                      >
                        <Clock className="mr-2 h-4 w-4" />
                        Waiting List
                      </Button>
                      <Button
                        data-testid="reject-btn"
                        onClick={() => {
                          setStatusChangeData({ status: "rejected", comment: "" });
                          setShowStatusChangeDialog(true);
                        }}
                        disabled={actionLoading}
                        className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold uppercase tracking-wide py-3 rounded-sm"
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Reject Application
                      </Button>
                    </div>
                  </div>
                )}

                {/* Final Approval - Training Manager (when fully team approved) */}
                {isFullyTeamApproved(selectedApp) && selectedApp.status !== 'approved' && currentUser.is_training_manager && (
                  <div className="border-t border-slate-700 pt-4">
                    <h3 className="text-lg font-semibold uppercase tracking-wide text-emerald-500 mb-4" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                      Approve Application
                    </h3>
                    <p className="text-sm text-slate-400 mb-4">
                      This application has team approval. Finalize it as fully approved or reject it.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button
                        data-testid="convert-to-approved-btn"
                        onClick={() => {
                          setStatusChangeData({ status: "approved", comment: "" });
                          setShowStatusChangeDialog(true);
                        }}
                        disabled={actionLoading}
                        className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold uppercase tracking-wide py-3 rounded-sm"
                      >
                        <UserCheck className="mr-2 h-4 w-4" />
                        Approve Application
                      </Button>
                      <Button
                        data-testid="reject-waiting-btn"
                        onClick={() => {
                          setStatusChangeData({ status: "rejected", comment: "" });
                          setShowStatusChangeDialog(true);
                        }}
                        disabled={actionLoading}
                        className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold uppercase tracking-wide py-3 rounded-sm"
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Reject Application
                      </Button>
                    </div>
                  </div>
                )}

                {/* Admin Actions - Change Status & Delete */}
                {currentUser.is_admin && (
                  <div className="border-t border-slate-700 pt-4">
                    <h3 className="text-lg font-semibold uppercase tracking-wide text-amber-500 mb-4" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                      Admin Actions
                    </h3>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button
                        data-testid="change-status-btn"
                        onClick={() => {
                          setStatusChangeData({ status: "", comment: "" });
                          setShowStatusChangeDialog(true);
                        }}
                        disabled={actionLoading}
                        variant="outline"
                        className="flex-1 border-amber-500 text-amber-500 hover:bg-amber-500/20 font-bold uppercase tracking-wide py-3 rounded-sm"
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Change Status
                      </Button>
                      <Button
                        data-testid="delete-app-btn"
                        onClick={() => handleDeleteApplication(selectedApp.id, selectedApp.name)}
                        disabled={actionLoading}
                        className="flex-1 bg-red-900 hover:bg-red-800 text-white font-bold uppercase tracking-wide py-3 rounded-sm"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Application
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Status Change Dialog */}
      <Dialog open={showStatusChangeDialog} onOpenChange={setShowStatusChangeDialog}>
        <DialogContent className="max-w-md bg-slate-900 border-slate-700 text-slate-200">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold uppercase tracking-wider text-amber-500" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
              {statusChangeData.status ? `Confirm ${statusChangeData.status.charAt(0).toUpperCase() + statusChangeData.status.slice(1)}` : "Change Application Status"}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              A comment is required to explain this decision.
            </DialogDescription>
          </DialogHeader>
          
          {/* Warning for approval - comment will be shown to applicant */}
          {statusChangeData.status === "approved" && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-sm p-3 mt-2">
              <div className="flex items-start gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <p className="text-amber-400 text-sm">
                  <strong>Note:</strong> Your comment below will be included in the approval email sent to the applicant.
                </p>
              </div>
            </div>
          )}
          
          {/* Info for waiting status */}
          {statusChangeData.status === "waiting" && (
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-sm p-3 mt-2">
              <div className="flex items-start gap-2">
                <Clock className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <p className="text-blue-400 text-sm">
                  <strong>Waiting List:</strong> The applicant will receive an email informing them that their application has been accepted but there is currently no vacancy. They will be notified when a position becomes available.
                </p>
              </div>
            </div>
          )}
          
          <div className="space-y-4 mt-4">
            {!statusChangeData.status && (
              <div className="space-y-2">
                <label className="text-sm text-slate-400">Select new status:</label>
                <Select
                  value={statusChangeData.status}
                  onValueChange={(value) => setStatusChangeData(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-200">
                    <SelectValue placeholder="Select status..." />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700">
                    <SelectItem value="awaiting_review" className="text-slate-400">Awaiting Review</SelectItem>
                    <SelectItem value="pending" className="text-blue-400">Pending</SelectItem>
                    <SelectItem value="approved" className="text-emerald-400">Approved</SelectItem>
                    <SelectItem value="in_game_approved" className="text-cyan-400">In-Game Approved</SelectItem>
                    <SelectItem value="discord_approved" className="text-indigo-400">Discord Approved</SelectItem>
                    <SelectItem value="waiting" className="text-amber-400">Waiting (No Vacancy)</SelectItem>
                    <SelectItem value="rejected" className="text-red-400">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <div className="space-y-2">
              <label className="text-sm text-slate-400">
                Comment (required) <span className="text-red-400">*</span>
              </label>
              <Textarea
                placeholder="Explain the reason for this status change..."
                value={statusChangeData.comment}
                onChange={(e) => setStatusChangeData(prev => ({ ...prev, comment: e.target.value }))}
                className="bg-slate-800 border-slate-700 focus:border-amber-500 text-slate-200 rounded-sm min-h-[100px]"
              />
            </div>
            
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowStatusChangeDialog(false);
                  setStatusChangeData({ status: "", comment: "" });
                }}
                className="flex-1 border-slate-600 text-slate-400 hover:bg-slate-800"
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleStatusUpdate(selectedApp?.id, statusChangeData.status, statusChangeData.comment)}
                disabled={actionLoading || !statusChangeData.status || !statusChangeData.comment.trim()}
                className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-bold uppercase"
              >
                {actionLoading ? "Processing..." : "Confirm"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
