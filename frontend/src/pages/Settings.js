import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ArrowLeft, Lock, Users, Shield, UserPlus, UserX, UserCheck, AlertCircle, Snowflake, Clock, ChevronDown, ChevronUp, PartyPopper, Info, FileX } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Role hierarchy - higher index = higher rank
const ROLE_HIERARCHY = {
  'moderator': 0,
  'lmod': 2,
  'smod': 3,
  'mmod': 4,
  'developer': 5,
  'admin': 6  // Admin has highest privileges
};

// Get roles that a user can assign based on their role
const getAssignableRoles = (currentUserRole, targetUserRole, hasAdminAccess = false) => {
  const currentRank = ROLE_HIERARCHY[currentUserRole] || 0;
  const targetRank = ROLE_HIERARCHY[targetUserRole] || 0;
  
  // Admin or users with admin access can assign any role
  if (currentUserRole === 'admin' || hasAdminAccess) {
    return ['admin', 'developer', 'mmod', 'smod', 'lmod', 'moderator'];
  }
  
  // Can only change roles of users with lower rank
  if (currentRank <= targetRank) {
    return [];
  }
  
  // Return roles that are below the current user's rank
  return Object.entries(ROLE_HIERARCHY)
    .filter(([role, rank]) => rank < currentRank && role !== 'admin')
    .map(([role]) => role);
};

const LEADER_ROLES = ['in_game_leader', 'discord_leader'];

const getAssignablePrimaryRoles = (assignableRoles = []) => assignableRoles.filter((role) => !LEADER_ROLES.includes(role));

const canAssignLeaderRole = (assignableRoles = [], leaderRole) => assignableRoles.includes(leaderRole);

const getDefaultRoleEditState = (role = 'moderator', roles = [], mod = null) => ({
  role: role || 'moderator',
  in_game_leader: Boolean(mod?.is_in_game_leader || (Array.isArray(roles) && roles.includes('in_game_leader'))),
  discord_leader: Boolean(mod?.is_discord_leader || (Array.isArray(roles) && roles.includes('discord_leader')))
});

// Check if current user can modify target user's role
const canModifyRole = (currentUserRole, targetUserRole, isSelf, hasAdminAccess = false) => {
  // Admin or admin-access users can change their own role
  if ((currentUserRole === 'admin' || hasAdminAccess) && isSelf) {
    return true;
  }
  
  // No one else can change their own role
  if (isSelf) {
    return false;
  }
  
  const currentRank = ROLE_HIERARCHY[currentUserRole] || 0;
  const targetRank = ROLE_HIERARCHY[targetUserRole] || 0;
  
  // Admin or admin-access users can modify anyone
  if (currentUserRole === 'admin' || hasAdminAccess) {
    return true;
  }
  
  // Can only modify users with lower rank
  return currentRank > targetRank;
};

// Check if current user can modify permissions (checkboxes)
const canModifyPermissions = (currentUserRole, hasAdminAccess = false) => {
  return currentUserRole === 'admin' || hasAdminAccess;
};

// Check if current user can deactivate accounts (Admin and MMOD)
const canDeactivateAccounts = (currentUserRole, targetUserRole, isSelf, hasAdminAccess = false) => {
  if (isSelf) return false;
  
  // Admin or admin-access users can deactivate anyone
  if (currentUserRole === 'admin' || hasAdminAccess) return true;
  
  // MMOD can deactivate users with lower rank
  if (currentUserRole === 'mmod') {
    const currentRank = ROLE_HIERARCHY[currentUserRole] || 0;
    const targetRank = ROLE_HIERARCHY[targetUserRole] || 0;
    return currentRank > targetRank;
  }
  
  return false;
};

export default function Settings() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [moderators, setModerators] = useState([]);
  const [emailEdits, setEmailEdits] = useState({});
  const [roleEdits, setRoleEdits] = useState({});
  const [passwordForm, setPasswordForm] = useState({
    old_password: "",
    new_password: "",
    confirm_password: ""
  });
  const [resetForm, setResetForm] = useState({
    username: "",
    new_password: ""
  });
  const [addModForm, setAddModForm] = useState({
    username: "",
    password: "",
    role: "moderator",
    in_game_leader: false,
    discord_leader: false
  });
  const [changeUsernameForm, setChangeUsernameForm] = useState({
    old_username: "",
    new_username: ""
  });
  const [seasonalAnimationEnabled, setSeasonalAnimationEnabled] = useState(() => {
    const stored = localStorage.getItem('seasonal_animation_enabled');
    return stored !== 'false'; // Default to true if not set
  });
  const [holidayAnimationEnabled, setHolidayAnimationEnabled] = useState(() => {
    const stored = localStorage.getItem('holiday_animation_enabled');
    return stored !== 'false'; // Default to true if not set
  });
  const [easterEggs, setEasterEggs] = useState([]);
  const [selectedEasterEgg, setSelectedEasterEgg] = useState(null);
  const [easterEggForm, setEasterEggForm] = useState({
    username: "",
    password: "",
    title: "",
    content: {}
  });
  const [applicationsEnabled, setApplicationsEnabled] = useState(true);
  const [loadingAppSettings, setLoadingAppSettings] = useState(false);
  
  // Collapsible section states
  const [expandedSections, setExpandedSections] = useState({
    changePassword: true,
    resetPassword: false,
    addModerator: false,
    changeUsername: false,
    preferences: false,
    moderatorList: false,
    easterEggs: false,
    applicationControl: false
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  useEffect(() => {
    const token = localStorage.getItem('moderator_token');
    const role = localStorage.getItem('moderator_role');
    const username = localStorage.getItem('moderator_username');
    const isAdmin = localStorage.getItem('moderator_is_admin') === 'true';
    
    if (!token) {
      navigate('/moderator/login');
      return;
    }
    
    // User has admin access if role is 'admin' OR is_admin flag is true
    const hasAdminAccess = role === 'admin' || isAdmin;
    
    setCurrentUser({ role, username, isAdmin, hasAdminAccess });
    
    // All roles with hierarchy access can see moderators list
    if (['admin', 'developer', 'mmod', 'smod', 'lmod'].includes(role) || hasAdminAccess) {
      fetchModerators();
    }
    
    // Admin access users can see easter eggs
    if (hasAdminAccess) {
      fetchEasterEggs();
      fetchApplicationSettings();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  const fetchApplicationSettings = async () => {
    try {
      const token = localStorage.getItem('moderator_token');
      const response = await axios.get(`${API}/applications/settings/admin`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setApplicationsEnabled(response.data.applications_enabled);
    } catch (error) {
      console.error(error);
      // Default to enabled if fetch fails
      setApplicationsEnabled(true);
    }
  };

  const handleToggleApplications = async (enabled) => {
    setLoadingAppSettings(true);
    try {
      const token = localStorage.getItem('moderator_token');
      await axios.patch(
        `${API}/applications/settings/admin`,
        { applications_enabled: enabled },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setApplicationsEnabled(enabled);
      toast.success(`New applications ${enabled ? 'enabled' : 'disabled'} successfully!`);
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.detail || "Failed to update application settings");
    } finally {
      setLoadingAppSettings(false);
    }
  };

  const fetchModerators = async () => {
    try {
      const token = localStorage.getItem('moderator_token');
      const isAdmin = localStorage.getItem('moderator_is_admin') === 'true';
      const role = localStorage.getItem('moderator_role');
      const hasAdminAccess = role === 'admin' || isAdmin;
      
      const response = await axios.get(`${API}/moderators`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const normalizedModerators = response.data.map((mod) => {
        const roles = Array.isArray(mod.roles) && mod.roles.length > 0 ? mod.roles : [mod.role || "moderator"];
        const primaryRole = mod.role && !LEADER_ROLES.includes(mod.role)
          ? mod.role
          : (roles.find((r) => !LEADER_ROLES.includes(r)) || "moderator");

        return {
          ...mod,
          role: primaryRole,
          roles
        };
      });
      setModerators(normalizedModerators);
      setRoleEdits(() => {
        const next = {};
        normalizedModerators.forEach((mod) => {
          next[mod.username] = getDefaultRoleEditState(mod.role, mod.roles, mod);
        });
        return next;
      });
      setEmailEdits(() => {
        const next = {};
        normalizedModerators.forEach((mod) => {
          // Only pre-populate email for Admins who can view emails
          // MMODs cannot view emails so start with empty field
          next[mod.username] = hasAdminAccess ? (mod.email || "") : "";
        });
        return next;
      });
    } catch (error) {
      console.error(error);
      if (error.response?.status === 401) {
        localStorage.clear();
        navigate('/moderator/login');
      }
    }
  };

  const fetchEasterEggs = async () => {
    try {
      const token = localStorage.getItem('moderator_token');
      const response = await axios.get(`${API}/easter-eggs`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEasterEggs(response.data);
    } catch (error) {
      console.error(error);
      // Don't redirect on 403, just don't show easter eggs
    }
  };

  const handleEasterEggSelect = (egg) => {
    setSelectedEasterEgg(egg);
    setEasterEggForm({
      username: egg.username,
      password: egg.password,
      title: egg.title,
      content: egg.content || {}
    });
  };

  const handleEasterEggUpdate = async () => {
    if (!selectedEasterEgg) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('moderator_token');
      await axios.patch(
        `${API}/easter-eggs/${selectedEasterEgg.page_key}`,
        easterEggForm,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`Easter egg "${selectedEasterEgg.page_key}" updated successfully!`);
      fetchEasterEggs();
      setSelectedEasterEgg(null);
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.detail || "Failed to update easter egg");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      toast.error("New passwords do not match");
      return;
    }
    
    setLoading(true);
    try {
      const token = localStorage.getItem('moderator_token');
      await axios.patch(
        `${API}/auth/change-password`,
        {
          old_password: passwordForm.old_password,
          new_password: passwordForm.new_password
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Password changed successfully!");
      setPasswordForm({ old_password: "", new_password: "", confirm_password: "" });
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.detail || "Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    
    if (!resetForm.username || !resetForm.new_password) {
      toast.error("Please fill in all fields");
      return;
    }
    
    setLoading(true);
    try {
      const token = localStorage.getItem('moderator_token');
      await axios.patch(
        `${API}/auth/reset-password/${resetForm.username}`,
        { new_password: resetForm.new_password },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`Password reset successfully for ${resetForm.username}!`);
      setResetForm({ username: "", new_password: "" });
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.detail || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  const handleAddModerator = async (e) => {
    e.preventDefault();
    
    if (!addModForm.username || !addModForm.password) {
      toast.error("Please fill in all fields");
      return;
    }
    
    setLoading(true);
    try {
      const token = localStorage.getItem('moderator_token');
      const selectedRoles = [
        addModForm.role || 'moderator',
        ...(addModForm.in_game_leader ? ['in_game_leader'] : []),
        ...(addModForm.discord_leader ? ['discord_leader'] : [])
      ];

      await axios.post(
        `${API}/auth/register`,
        {
          username: addModForm.username,
          password: addModForm.password,
          role: addModForm.role,
          roles: selectedRoles
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`Moderator ${addModForm.username} added successfully!`);
      setAddModForm({ username: "", password: "", role: "moderator", in_game_leader: false, discord_leader: false });
      fetchModerators();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.detail || "Failed to add moderator");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (username, currentStatus) => {
    const newStatus = currentStatus === "active" ? "disabled" : "active";
    const action = newStatus === "active" ? "enable" : "disable";
    
    if (!window.confirm(`Are you sure you want to ${action} ${username}?`)) {
      return;
    }
    
    setLoading(true);
    try {
      const token = localStorage.getItem('moderator_token');
      await axios.patch(
        `${API}/moderators/${username}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`Moderator ${username} ${action}d successfully!`);
      fetchModerators();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.detail || `Failed to ${action} moderator`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteModerator = async (username) => {
    if (!window.confirm(`Are you sure you want to DELETE ${username}? This action cannot be undone!`)) {
      return;
    }
    
    setLoading(true);
    try {
      const token = localStorage.getItem('moderator_token');
      await axios.delete(
        `${API}/moderators/${username}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`Moderator ${username} deleted successfully!`);
      fetchModerators();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.detail || "Failed to delete moderator");
    } finally {
      setLoading(false);
    }
  };

  const updateRoleEdit = (username, updates) => {
    setRoleEdits(prev => ({
      ...prev,
      [username]: {
        ...getDefaultRoleEditState(),
        ...(prev[username] || {}),
        ...updates
      }
    }));
  };

  const handleSaveRoles = async (username) => {
    const editState = roleEdits[username] || getDefaultRoleEditState();

    if (!window.confirm(`Update ${username}'s role settings?`)) {
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('moderator_token');
      await axios.patch(
        `${API}/moderators/${username}/role`,
        { role: editState.role || 'moderator' },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      await axios.patch(
        `${API}/moderators/${username}/leader-roles`,
        {
          is_in_game_leader: Boolean(editState.in_game_leader),
          is_discord_leader: Boolean(editState.discord_leader)
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('Role settings updated successfully!');
      fetchModerators();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.detail || "Failed to update role settings");
    } finally {
      setLoading(false);
    }
  };

  const handleChangeUsername = async (e) => {
    e.preventDefault();
    
    if (!changeUsernameForm.old_username || !changeUsernameForm.new_username) {
      toast.error("Please fill in all fields");
      return;
    }
    
    setLoading(true);
    try {
      const token = localStorage.getItem('moderator_token');
      await axios.patch(
        `${API}/moderators/${changeUsernameForm.old_username}/username`,
        { new_username: changeUsernameForm.new_username },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`Username changed successfully!`);
      setChangeUsernameForm({ old_username: "", new_username: "" });
      fetchModerators();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.detail || "Failed to change username");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateEmail = async (username) => {
    const email = (emailEdits[username] || "").trim();
    if (!email) {
      toast.error("Please enter an email address");
      return;
    }

    if (!window.confirm(`Update email for ${username}?`)) {
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('moderator_token');
      await axios.patch(
        `${API}/moderators/${username}/email`,
        { email },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`Email updated for ${username}!`);
      fetchModerators();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.detail || "Failed to update email");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTrainingManager = async (username, currentStatus) => {
    const newStatus = !currentStatus;
    const action = newStatus ? "enable" : "disable";
    
    if (!window.confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} Training Manager for ${username}?`)) {
      return;
    }
    
    setLoading(true);
    try {
      const token = localStorage.getItem('moderator_token');
      await axios.patch(
        `${API}/moderators/${username}/training-manager`,
        { is_training_manager: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`Training Manager ${action}d for ${username}!`);
      fetchModerators();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.detail || `Failed to ${action} Training Manager`);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAdmin = async (username, currentStatus) => {
    const newStatus = !currentStatus;
    const action = newStatus ? "enable" : "disable";
    
    if (!window.confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} Admin for ${username}?`)) {
      return;
    }
    
    setLoading(true);
    try {
      const token = localStorage.getItem('moderator_token');
      await axios.patch(
        `${API}/moderators/${username}/admin`,
        { is_admin: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`Admin ${action}d for ${username}!`);
      fetchModerators();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.detail || `Failed to ${action} Admin`);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleApplicationViewer = async (username, currentStatus) => {
    const newStatus = !currentStatus;
    const action = newStatus ? "enable" : "disable";
    
    if (!window.confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} Application Viewer for ${username}?`)) {
      return;
    }
    
    setLoading(true);
    try {
      const token = localStorage.getItem('moderator_token');
      await axios.patch(
        `${API}/moderators/${username}/application-viewer`,
        { can_view_applications: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`Application Viewer ${action}d for ${username}!`);
      fetchModerators();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.detail || `Failed to ${action} Application Viewer`);
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadge = (role) => {
    const config = {
      admin: { color: "text-red-400", label: "ADMIN" },
      mmod: { color: "text-red-500", label: "MMOD" },
      moderator: { color: "text-blue-400", label: "MODERATOR" },
      lmod: { color: "text-purple-400", label: "LMOD" },
      smod: { color: "text-pink-400", label: "SMOD" },
      in_game_leader: { color: "text-cyan-400", label: "IN-GAME LEADER" },
      discord_leader: { color: "text-indigo-400", label: "DISCORD LEADER" },
      developer: { color: "text-yellow-400", label: "DEVELOPER" }
    };
    const roleConfig = config[role] || { color: "text-slate-400", label: role };
    return <span className={`uppercase font-semibold ${roleConfig.color}`}>{roleConfig.label}</span>;
  };

  const handleSeasonalAnimationToggle = (enabled) => {
    setSeasonalAnimationEnabled(enabled);
    localStorage.setItem('seasonal_animation_enabled', String(enabled));
    // Dispatch event so other components can react
    window.dispatchEvent(new CustomEvent('seasonalAnimationToggle', { detail: { enabled } }));
  };

  const handleHolidayAnimationToggle = (enabled) => {
    setHolidayAnimationEnabled(enabled);
    localStorage.setItem('holiday_animation_enabled', String(enabled));
    // Dispatch event so other components can react
    window.dispatchEvent(new CustomEvent('holidayAnimationToggle', { detail: { enabled } }));
  };

  const getStatusBadge = (status) => {
    if (status === "active") {
      return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/50">ACTIVE</Badge>;
    }
    return <Badge className="bg-red-500/20 text-red-400 border-red-500/50">DISABLED</Badge>;
  };

  // Format last login time
  const formatLastLogin = (lastLogin) => {
    if (!lastLogin) return "Never";
    
    const date = new Date(lastLogin);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  // Get activity status color based on last login
  const getActivityIndicator = (lastLogin, status) => {
    if (status === 'disabled') return 'bg-gray-500';
    if (!lastLogin) return 'bg-gray-500';
    
    const date = new Date(lastLogin);
    const now = new Date();
    const diffDays = Math.floor((now - date) / 86400000);
    
    if (diffDays < 1) return 'bg-green-500';
    if (diffDays < 7) return 'bg-emerald-500';
    if (diffDays < 30) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 py-6 sm:py-12 px-3 sm:px-6 lg:px-8 grid-texture">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl sm:text-4xl font-bold uppercase tracking-wider mb-4 sm:mb-8 text-amber-500" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
          <Shield className="inline-block mr-2 sm:mr-3 h-6 w-6 sm:h-10 sm:w-10" />
          Settings
        </h1>

        {/* Change Own Password */}
        <Card className="glass-card border-slate-700 mb-4">
          <CardHeader 
            className="cursor-pointer select-none"
            onClick={() => toggleSection('changePassword')}
          >
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl sm:text-2xl font-bold uppercase tracking-wide text-amber-500" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                  <Lock className="inline-block mr-2 h-5 w-5 sm:h-6 sm:w-6" />
                  Change Your Password
                </CardTitle>
                <CardDescription className="text-slate-400 text-sm">
                  Update your account password
                </CardDescription>
              </div>
              {expandedSections.changePassword ? (
                <ChevronUp className="h-5 w-5 text-slate-400" />
              ) : (
                <ChevronDown className="h-5 w-5 text-slate-400" />
              )}
            </div>
          </CardHeader>
          {expandedSections.changePassword && (
            <CardContent>
              {/* Password Requirements */}
              <div className="bg-blue-500/10 border border-blue-500/30 rounded p-4 mb-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-blue-400 mb-1">Password Requirements:</p>
                    <ul className="text-xs text-slate-300 space-y-1">
                      <li>• At least 8 characters long</li>
                      <li>• At least one uppercase letter (A-Z)</li>
                      <li>• At least one lowercase letter (a-z)</li>
                      <li>• At least one number (0-9)</li>
                      <li>• At least one special character (!@#$%^&*)</li>
                      <li>• Cannot reuse your last 10 passwords</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <form onSubmit={handlePasswordChange} className="space-y-4" data-testid="change-password-form">
                <div className="space-y-2">
                  <Label htmlFor="old_password" className="text-slate-300">Current Password</Label>
                  <Input
                    id="old_password"
                    data-testid="old-password-input"
                    type="password"
                    value={passwordForm.old_password}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, old_password: e.target.value }))}
                  required
                  className="bg-slate-900/50 border-slate-700 focus:border-amber-500 text-slate-200 rounded-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new_password" className="text-slate-300">New Password</Label>
                <Input
                  id="new_password"
                  data-testid="new-password-input"
                  type="password"
                  value={passwordForm.new_password}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, new_password: e.target.value }))}
                  required
                  className="bg-slate-900/50 border-slate-700 focus:border-amber-500 text-slate-200 rounded-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm_password" className="text-slate-300">Confirm New Password</Label>
                <Input
                  id="confirm_password"
                  data-testid="confirm-password-input"
                  type="password"
                  value={passwordForm.confirm_password}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, confirm_password: e.target.value }))}
                  required
                  className="bg-slate-900/50 border-slate-700 focus:border-amber-500 text-slate-200 rounded-sm"
                />
              </div>
              <Button
                data-testid="change-password-btn"
                type="submit"
                disabled={loading}
                className="bg-amber-500 hover:bg-amber-600 text-white font-bold uppercase tracking-wide rounded-sm btn-glow"
              >
                {loading ? "Changing..." : "Change Password"}
              </Button>
            </form>
          </CardContent>
          )}
        </Card>

        {/* Seasonal Animation Toggle */}
        <Card className="glass-card border-slate-700 mb-4">
          <CardHeader 
            className="cursor-pointer select-none"
            onClick={() => toggleSection('preferences')}
          >
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl sm:text-2xl font-bold uppercase tracking-wide text-cyan-500" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                  <Snowflake className="inline-block mr-2 h-5 w-5 sm:h-6 sm:w-6" />
                  Visual Preferences
                </CardTitle>
                <CardDescription className="text-slate-400 text-sm">
                  Customize your visual experience
                </CardDescription>
              </div>
              {expandedSections.preferences ? (
                <ChevronUp className="h-5 w-5 text-slate-400" />
              ) : (
                <ChevronDown className="h-5 w-5 text-slate-400" />
              )}
            </div>
          </CardHeader>
          {expandedSections.preferences && (
            <CardContent className="space-y-4">
              {/* Seasonal Animation Toggle */}
              <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded border border-slate-800">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-slate-200">Seasonal Animation</p>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-4 w-4 text-slate-400 cursor-help hover:text-cyan-400 transition-colors" />
                        </TooltipTrigger>
                        <TooltipContent className="bg-slate-800 border-slate-700 text-slate-200 max-w-xs">
                          <p className="text-sm">
                            <strong>Seasonal effects change throughout the year:</strong><br/>
                            ❄️ Winter: Snowflakes + snowman (Dec-Feb)<br/>
                            🌸 Spring: Cherry blossoms + butterflies (Mar-May)<br/>
                            ✨ Summer: Fireflies + shooting stars (Jun-Aug)<br/>
                            🍂 Autumn: Falling leaves + squirrels (Sep-Nov)
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <p className="text-sm text-slate-400">
                    Show falling snowflakes, leaves, or other seasonal effects
                  </p>
                </div>
                <Switch
                  data-testid="seasonal-animation-toggle"
                  checked={seasonalAnimationEnabled}
                  onCheckedChange={handleSeasonalAnimationToggle}
                  className="ml-4"
                />
              </div>

              {/* Holiday Animation Toggle */}
              <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded border border-slate-800">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <PartyPopper className="h-4 w-4 text-amber-400" />
                    <p className="font-semibold text-slate-200">Holiday Animations</p>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-4 w-4 text-slate-400 cursor-help hover:text-amber-400 transition-colors" />
                        </TooltipTrigger>
                        <TooltipContent className="bg-slate-800 border-slate-700 text-slate-200 max-w-sm">
                          <p className="text-sm mb-2">
                            <strong>Special animations for major holidays:</strong>
                          </p>
                          <div className="text-xs space-y-1">
                            <p>🇬🇧 <strong>UK:</strong> New Year, Easter, Bank Holidays, Christmas</p>
                            <p>🇺🇸 <strong>US:</strong> July 4th, Thanksgiving, Memorial Day, Christmas</p>
                            <p>🇨🇳 <strong>China:</strong> Chinese New Year, Dragon Boat, Mid-Autumn</p>
                          </div>
                          <p className="text-xs mt-2 text-slate-400">
                            Displays day before, day of, and day after each holiday. Overrides seasonal effects when active.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <p className="text-sm text-slate-400">
                    Show festive effects on UK, US, and Chinese holidays (3-day display)
                  </p>
                </div>
                <Switch
                  data-testid="holiday-animation-toggle"
                  checked={holidayAnimationEnabled}
                  onCheckedChange={handleHolidayAnimationToggle}
                  className="ml-4"
                />
              </div>
            </CardContent>
          )}
        </Card>

        {/* Admin Only Sections */}
        {currentUser && currentUser.hasAdminAccess && (
          <>
            {/* Application Control - Admin Only */}
            <Card className="glass-card border-slate-700 mb-4">
              <CardHeader 
                className="cursor-pointer select-none"
                onClick={() => toggleSection('applicationControl')}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl sm:text-2xl font-bold uppercase tracking-wide text-orange-500" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                      <FileX className="inline-block mr-2 h-5 w-5 sm:h-6 sm:w-6" />
                      Application Control
                    </CardTitle>
                    <CardDescription className="text-slate-400 text-sm">
                      Enable or disable new moderator applications
                    </CardDescription>
                  </div>
                  {expandedSections.applicationControl ? (
                    <ChevronUp className="h-5 w-5 text-slate-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-slate-400" />
                  )}
                </div>
              </CardHeader>
              {expandedSections.applicationControl && (
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded border border-slate-800">
                      <div className="flex-1">
                        <p className="font-semibold text-slate-200">Accept New Applications</p>
                        <p className="text-sm text-slate-400">
                          When disabled, the application form will be replaced with a &quot;No vacancies&quot; message.
                        </p>
                      </div>
                      <Switch
                        data-testid="applications-enabled-toggle"
                        checked={applicationsEnabled}
                        onCheckedChange={handleToggleApplications}
                        disabled={loadingAppSettings}
                        className="ml-4"
                      />
                    </div>
                    
                    {/* Status indicator */}
                    <div className={`p-4 rounded border ${applicationsEnabled ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${applicationsEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></div>
                        <div>
                          <p className={`font-semibold ${applicationsEnabled ? 'text-emerald-400' : 'text-red-400'}`}>
                            {applicationsEnabled ? 'Applications are OPEN' : 'Applications are CLOSED'}
                          </p>
                          <p className="text-sm text-slate-400">
                            {applicationsEnabled 
                              ? 'New applicants can submit applications via /apply' 
                              : 'Applicants will see a "No vacancies" page'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Reset Password - Admin Only */}
            <Card className="glass-card border-slate-700 mb-4">
              <CardHeader 
                className="cursor-pointer select-none"
                onClick={() => toggleSection('resetPassword')}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl sm:text-2xl font-bold uppercase tracking-wide text-red-500" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                      <Lock className="inline-block mr-2 h-5 w-5 sm:h-6 sm:w-6" />
                      Reset User Password
                    </CardTitle>
                    <CardDescription className="text-slate-400 text-sm">
                      Reset password for any moderator
                    </CardDescription>
                  </div>
                  {expandedSections.resetPassword ? (
                    <ChevronUp className="h-5 w-5 text-slate-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-slate-400" />
                  )}
                </div>
              </CardHeader>
              {expandedSections.resetPassword && (
              <CardContent>
                <form onSubmit={handlePasswordReset} className="space-y-4" data-testid="reset-password-form">
                  <div className="space-y-2">
                    <Label htmlFor="reset_username" className="text-slate-300">Username</Label>
                    <Input
                      id="reset_username"
                      data-testid="reset-username-input"
                      type="text"
                      value={resetForm.username}
                      onChange={(e) => setResetForm(prev => ({ ...prev, username: e.target.value }))}
                      required
                      className="bg-slate-900/50 border-slate-700 focus:border-amber-500 text-slate-200 rounded-sm"
                      placeholder="Enter username"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reset_new_password" className="text-slate-300">New Password</Label>
                    <Input
                      id="reset_new_password"
                      data-testid="reset-new-password-input"
                      type="password"
                      value={resetForm.new_password}
                      onChange={(e) => setResetForm(prev => ({ ...prev, new_password: e.target.value }))}
                      required
                      className="bg-slate-900/50 border-slate-700 focus:border-amber-500 text-slate-200 rounded-sm"
                      placeholder="Enter new password"
                    />
                  </div>
                  <Button
                    data-testid="reset-password-btn"
                    type="submit"
                    disabled={loading}
                    className="bg-red-500 hover:bg-red-600 text-white font-bold uppercase tracking-wide rounded-sm"
                  >
                    {loading ? "Resetting..." : "Reset Password"}
                  </Button>
                </form>
              </CardContent>
              )}
            </Card>

            {/* Change Username - Admin Only */}
            <Card className="glass-card border-slate-700 mb-4">
              <CardHeader 
                className="cursor-pointer select-none"
                onClick={() => toggleSection('changeUsername')}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl sm:text-2xl font-bold uppercase tracking-wide text-amber-500" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                      <UserPlus className="inline-block mr-2 h-5 w-5 sm:h-6 sm:w-6" />
                      Change Moderator Username
                    </CardTitle>
                    <CardDescription className="text-slate-400 text-sm">
                      Change any moderator&apos;s username
                    </CardDescription>
                  </div>
                  {expandedSections.changeUsername ? (
                    <ChevronUp className="h-5 w-5 text-slate-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-slate-400" />
                  )}
                </div>
              </CardHeader>
              {expandedSections.changeUsername && (
                <CardContent>
                  <form onSubmit={handleChangeUsername} className="space-y-4" data-testid="change-username-form">
                    <div className="space-y-2">
                      <Label htmlFor="old_username" className="text-slate-300">Current Username</Label>
                      <Input
                        id="old_username"
                        data-testid="old-username-input"
                        type="text"
                        value={changeUsernameForm.old_username}
                        onChange={(e) => setChangeUsernameForm(prev => ({ ...prev, old_username: e.target.value }))}
                        required
                        className="bg-slate-900/50 border-slate-700 focus:border-amber-500 text-slate-200 rounded-sm"
                        placeholder="Enter current username"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new_username_change" className="text-slate-300">New Username</Label>
                      <Input
                        id="new_username_change"
                        data-testid="new-username-input"
                        type="text"
                        value={changeUsernameForm.new_username}
                        onChange={(e) => setChangeUsernameForm(prev => ({ ...prev, new_username: e.target.value }))}
                        required
                        className="bg-slate-900/50 border-slate-700 focus:border-amber-500 text-slate-200 rounded-sm"
                        placeholder="Enter new username"
                      />
                    </div>
                    <Button
                      data-testid="change-username-btn"
                      type="submit"
                      disabled={loading}
                      className="bg-amber-500 hover:bg-amber-600 text-white font-bold uppercase tracking-wide rounded-sm"
                    >
                      {loading ? "Changing..." : "Change Username"}
                    </Button>
                  </form>
                </CardContent>
              )}
            </Card>

            {/* Add Moderator - Admin Only */}
            <Card className="glass-card border-slate-700 mb-4">
              <CardHeader 
                className="cursor-pointer select-none"
                onClick={() => toggleSection('addModerator')}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl sm:text-2xl font-bold uppercase tracking-wide text-emerald-500" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                      <UserPlus className="inline-block mr-2 h-5 w-5 sm:h-6 sm:w-6" />
                      Add New Moderator
                    </CardTitle>
                    <CardDescription className="text-slate-400 text-sm">
                      Create a new moderator account
                    </CardDescription>
                  </div>
                  {expandedSections.addModerator ? (
                    <ChevronUp className="h-5 w-5 text-slate-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-slate-400" />
                  )}
                </div>
              </CardHeader>
              {expandedSections.addModerator && (
              <CardContent>
                <form onSubmit={handleAddModerator} className="space-y-4" data-testid="add-moderator-form">
                  <div className="space-y-2">
                    <Label htmlFor="add_username" className="text-slate-300">Username</Label>
                    <Input
                      id="add_username"
                      data-testid="add-username-input"
                      type="text"
                      value={addModForm.username}
                      onChange={(e) => setAddModForm(prev => ({ ...prev, username: e.target.value }))}
                      required
                      className="bg-slate-900/50 border-slate-700 focus:border-amber-500 text-slate-200 rounded-sm"
                      placeholder="Enter username"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="add_password" className="text-slate-300">Password</Label>
                    <Input
                      id="add_password"
                      data-testid="add-password-input"
                      type="password"
                      value={addModForm.password}
                      onChange={(e) => setAddModForm(prev => ({ ...prev, password: e.target.value }))}
                      required
                      className="bg-slate-900/50 border-slate-700 focus:border-amber-500 text-slate-200 rounded-sm"
                      placeholder="Enter password"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="add_role" className="text-slate-300">Primary Role</Label>
                    <Select
                      value={addModForm.role}
                      onValueChange={(value) => setAddModForm(prev => ({ ...prev, role: value }))}
                    >
                      <SelectTrigger className="bg-slate-900/50 border-slate-700 focus:border-amber-500 text-slate-200 rounded-sm">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-slate-700">
                        <SelectItem value="admin" className="text-red-400">Admin</SelectItem>
                        <SelectItem value="mmod" className="text-red-500">MMOD</SelectItem>
                        <SelectItem value="moderator" className="text-blue-400">Moderator</SelectItem>
                        <SelectItem value="lmod" className="text-purple-400">LMOD</SelectItem>
                        <SelectItem value="smod" className="text-pink-400">SMOD</SelectItem>
                        <SelectItem value="developer" className="text-yellow-400">Developer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">Leader Roles</Label>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <label className="flex items-center gap-2 text-slate-300 text-sm">
                        <input
                          type="checkbox"
                          checked={addModForm.in_game_leader}
                          onChange={(e) => setAddModForm((prev) => ({ ...prev, in_game_leader: e.target.checked }))}
                          className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-cyan-500"
                        />
                        In-Game Leader
                      </label>
                      <label className="flex items-center gap-2 text-slate-300 text-sm">
                        <input
                          type="checkbox"
                          checked={addModForm.discord_leader}
                          onChange={(e) => setAddModForm((prev) => ({ ...prev, discord_leader: e.target.checked }))}
                          className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-indigo-500 focus:ring-indigo-500"
                        />
                        Discord Leader
                      </label>
                    </div>
                  </div>
                  <Button
                    data-testid="add-moderator-btn"
                    type="submit"
                    disabled={loading}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold uppercase tracking-wide rounded-sm"
                  >
                    {loading ? "Adding..." : "Add Moderator"}
                  </Button>
                </form>
              </CardContent>
              )}
            </Card>
          </>
        )}

        {/* User Management - Available to roles in hierarchy */}
        {currentUser && (['admin', 'developer', 'mmod', 'smod', 'lmod'].includes(currentUser.role) || currentUser.hasAdminAccess) && (
          <>
            {/* Manage Moderators */}
            <Card className="glass-card border-slate-700 mb-4">
              <CardHeader 
                className="cursor-pointer select-none"
                onClick={() => toggleSection('moderatorList')}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl sm:text-2xl font-bold uppercase tracking-wide text-amber-500" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                      <Users className="inline-block mr-2 h-5 w-5 sm:h-6 sm:w-6" />
                      Manage Moderators
                    </CardTitle>
                    <CardDescription className="text-slate-400 text-sm">
                      View, enable/disable, or delete moderator accounts
                    </CardDescription>
                  </div>
                  {expandedSections.moderatorList ? (
                    <ChevronUp className="h-5 w-5 text-slate-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-slate-400" />
                  )}
                </div>
              </CardHeader>
              {expandedSections.moderatorList && (
              <CardContent>
                <div className="space-y-3" data-testid="moderator-list">
                  {moderators.map((mod) => (
                    <div key={mod.username} className="p-3 sm:p-4 bg-slate-900/50 rounded border border-slate-800">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 mb-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <div className={`w-2.5 h-2.5 rounded-full ${getActivityIndicator(mod.last_login, mod.status)}`} title={mod.last_login ? `Last login: ${formatLastLogin(mod.last_login)}` : 'Never logged in'}></div>
                            <p className="font-semibold text-slate-200 text-base sm:text-lg truncate">{mod.username}</p>
                          </div>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-xs sm:text-sm text-slate-500 mt-1">
                            <span className="mono">Joined: {new Date(mod.created_at).toLocaleDateString()}</span>
                            <span className="hidden sm:inline text-slate-600">•</span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Last login: <span className={mod.last_login ? 'text-slate-400' : 'text-slate-600 italic'}>{formatLastLogin(mod.last_login)}</span>
                            </span>
                          </div>
                          <div className="text-sm mt-1">{getRoleBadge(mod.role)}</div>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {(mod.roles || [mod.role]).map((r) => (
                              <Badge key={`${mod.username}-${r}`} variant="outline" className="text-[10px] border-slate-600 text-slate-300">{r.replaceAll("_", " ").toUpperCase()}</Badge>
                            ))}
                          </div>
                          {currentUser?.hasAdminAccess && (
                            <p className="text-xs text-slate-400 mt-1">
                              Email: <span className={mod.email ? "text-slate-300" : "text-slate-600 italic"}>{mod.email || "No email on file"}</span>
                            </p>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          {getStatusBadge(mod.status || "active")}
                          {mod.is_training_manager && (
                            <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/50 text-xs">TRAINING MGR</Badge>
                          )}
                          {mod.is_admin && (
                            <Badge className="bg-red-500/20 text-red-400 border-red-500/50 text-xs">ADMIN ACCESS</Badge>
                          )}
                        </div>
                      </div>
                      
                      {/* Show controls based on hierarchy */}
                      {(() => {
                        const isSelf = mod.username === currentUser.username;
                        const canChangeRole = canModifyRole(currentUser.role, mod.role, isSelf, currentUser.hasAdminAccess);
                        const canChangePerms = canModifyPermissions(currentUser.role, currentUser.hasAdminAccess);
                        const canDeactivate = canDeactivateAccounts(currentUser.role, mod.role, isSelf, currentUser.hasAdminAccess);
                        const assignableRoles = getAssignableRoles(currentUser.role, mod.role, currentUser.hasAdminAccess);
                        const assignablePrimaryRoles = getAssignablePrimaryRoles(assignableRoles);
                        const editState = roleEdits[mod.username] || getDefaultRoleEditState(mod.role, mod.roles);
                        // MMODs can edit emails but only Admins can VIEW emails
                        const canEditEmail = currentUser.hasAdminAccess || currentUser.role === 'mmod';
                        const canViewEmail = currentUser.hasAdminAccess; // Only Admins can see current email
                        
                        // Determine what to show
                        const showRoleDropdown = canChangeRole && assignablePrimaryRoles.length > 0;
                        const showLeaderToggles = showRoleDropdown && (canAssignLeaderRole(assignableRoles, 'in_game_leader') || canAssignLeaderRole(assignableRoles, 'discord_leader'));
                        const showPermissions = canChangePerms && !isSelf;
                        const showDeleteButton = canChangePerms && !isSelf; // Only admin can delete
                        
                        // If nothing to show, return null
                        if (!showRoleDropdown && !showPermissions && !canDeactivate && !canEditEmail) return null;
                        
                        return (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Role Selection */}
                            {showRoleDropdown && (
                              <div className="space-y-2">
                                <Label className="text-slate-400 text-xs uppercase">Role</Label>
                                <Select
                                  value={editState.role}
                                  onValueChange={(value) => updateRoleEdit(mod.username, { role: value })}
                                  disabled={loading}
                                >
                                  <SelectTrigger className="bg-slate-900/50 border-slate-700 text-slate-200 rounded-sm">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent className="bg-slate-900 border-slate-700">
                                    {assignablePrimaryRoles.includes('admin') && (
                                      <SelectItem value="admin" className="text-red-400">Admin</SelectItem>
                                    )}
                                    {assignablePrimaryRoles.includes('developer') && (
                                      <SelectItem value="developer" className="text-yellow-400">Developer</SelectItem>
                                    )}
                                    {assignablePrimaryRoles.includes('mmod') && (
                                      <SelectItem value="mmod" className="text-red-500">MMOD</SelectItem>
                                    )}
                                    {assignablePrimaryRoles.includes('smod') && (
                                      <SelectItem value="smod" className="text-pink-400">SMOD</SelectItem>
                                    )}
                                    {assignablePrimaryRoles.includes('lmod') && (
                                      <SelectItem value="lmod" className="text-purple-400">LMOD</SelectItem>
                                    )}
                                    {assignablePrimaryRoles.includes('moderator') && (
                                      <SelectItem value="moderator" className="text-blue-400">Moderator</SelectItem>
                                    )}
                                  </SelectContent>
                                </Select>

                                {showLeaderToggles && (
                                  <div className="space-y-2 pt-1">
                                    {canAssignLeaderRole(assignableRoles, 'in_game_leader') && (
                                      <label className="flex items-center gap-2 text-sm text-slate-300">
                                        <input
                                          type="checkbox"
                                          checked={editState.in_game_leader}
                                          onChange={(e) => updateRoleEdit(mod.username, { in_game_leader: e.target.checked })}
                                          disabled={loading}
                                          className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-cyan-500"
                                        />
                                        In-Game Leader
                                      </label>
                                    )}
                                    {canAssignLeaderRole(assignableRoles, 'discord_leader') && (
                                      <label className="flex items-center gap-2 text-sm text-slate-300">
                                        <input
                                          type="checkbox"
                                          checked={editState.discord_leader}
                                          onChange={(e) => updateRoleEdit(mod.username, { discord_leader: e.target.checked })}
                                          disabled={loading}
                                          className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-indigo-500 focus:ring-indigo-500"
                                        />
                                        Discord Leader
                                      </label>
                                    )}
                                  </div>
                                )}

                                <Button
                                  type="button"
                                  size="sm"
                                  onClick={() => handleSaveRoles(mod.username)}
                                  disabled={loading}
                                  className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-sm"
                                >
                                  Save Roles
                                </Button>
                              </div>
                            )}

                            {canEditEmail && (
                              <div className="space-y-2">
                                <Label className="text-slate-400 text-xs uppercase">
                                  {canViewEmail ? "Email" : "Update Email"}
                                </Label>
                                <div className="flex flex-col sm:flex-row gap-2">
                                  <Input
                                    type="email"
                                    data-testid={`email-input-${mod.username}`}
                                    value={canViewEmail ? (emailEdits[mod.username] ?? "") : (emailEdits[mod.username] || "")}
                                    onChange={(e) => setEmailEdits(prev => ({ ...prev, [mod.username]: e.target.value }))}
                                    placeholder={canViewEmail ? "Enter email address" : "Enter new email address"}
                                    className="bg-slate-900/50 border-slate-700 focus:border-amber-500 text-slate-200 rounded-sm"
                                  />
                                  <Button
                                    type="button"
                                    data-testid={`save-email-btn-${mod.username}`}
                                    onClick={() => handleUpdateEmail(mod.username)}
                                    disabled={loading}
                                    size="sm"
                                    className="bg-amber-500 hover:bg-amber-600 text-white rounded-sm"
                                  >
                                    Save Email
                                  </Button>
                                </div>
                                {!canViewEmail && (
                                  <p className="text-xs text-slate-500 italic">
                                    You can update emails but cannot view existing ones
                                  </p>
                                )}
                              </div>
                            )}
                            
                            {/* Permissions Toggles - Admin Only */}
                            {showPermissions && (
                              <div className="space-y-3 md:col-span-2">
                                <Label className="text-slate-400 text-xs uppercase">Permissions (Admin Only)</Label>
                                
                                <div className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    data-testid={`training-manager-${mod.username}`}
                                    checked={mod.is_training_manager || false}
                                    onChange={() => handleToggleTrainingManager(mod.username, mod.is_training_manager || false)}
                                    disabled={loading}
                                    className="w-5 h-5 rounded bg-slate-900 border-slate-700 text-blue-500 focus:ring-blue-500"
                                  />
                                  <span className="text-slate-300">Enable Training Manager</span>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    data-testid={`admin-${mod.username}`}
                                    checked={mod.is_admin || false}
                                    onChange={() => handleToggleAdmin(mod.username, mod.is_admin || false)}
                                    disabled={loading}
                                    className="w-5 h-5 rounded bg-slate-900 border-slate-700 text-red-500 focus:ring-red-500"
                                  />
                                  <span className="text-slate-300">Enable Admin</span>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    data-testid={`application-viewer-${mod.username}`}
                                    checked={mod.can_view_applications !== false}
                                    onChange={() => handleToggleApplicationViewer(mod.username, mod.can_view_applications !== false)}
                                    disabled={loading}
                                    className="w-5 h-5 rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-emerald-500"
                                  />
                                  <span className="text-slate-300">Application Viewer</span>
                                </div>
                              </div>
                            )}
                            
                            {/* Action Buttons - Deactivate for Admin/MMOD, Delete for Admin only */}
                            {(canDeactivate || showDeleteButton) && (
                              <div className="md:col-span-2 flex gap-2 flex-wrap">
                                {canDeactivate && (
                                  <Button
                                    data-testid={`toggle-status-${mod.username}`}
                                    onClick={() => handleToggleStatus(mod.username, mod.status || "active")}
                                    disabled={loading}
                                    size="sm"
                                    className={`${(mod.status || "active") === "active" ? "bg-amber-500/20 border-amber-500 text-amber-400 hover:bg-amber-500/30" : "bg-emerald-500/20 border-emerald-500 text-emerald-400 hover:bg-emerald-500/30"} border-2 rounded-sm`}
                                  >
                                    {(mod.status || "active") === "active" ? (
                                      <><UserX className="h-4 w-4 mr-1" /> Disable Account</>
                                    ) : (
                                      <><UserCheck className="h-4 w-4 mr-1" /> Enable Account</>
                                    )}
                                  </Button>
                                )}
                                {showDeleteButton && (
                                  <Button
                                    data-testid={`delete-${mod.username}`}
                                    onClick={() => handleDeleteModerator(mod.username)}
                                    disabled={loading}
                                    size="sm"
                                    className="bg-red-500 hover:bg-red-600 text-white rounded-sm"
                                  >
                                    Delete Permanently
                                  </Button>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  ))}
                </div>
              </CardContent>
              )}
            </Card>
          </>
        )}
        
        {/* Easter Egg Management - Admin Only */}
        {currentUser?.hasAdminAccess && (
          <Card className="bg-slate-800/50 border-slate-700 rounded-sm mt-4">
            <CardHeader 
              className="cursor-pointer select-none"
              onClick={() => toggleSection('easterEggs')}
            >
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-slate-200 text-lg flex items-center gap-2" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                    <span className="text-2xl">🥚</span> Easter Egg Management
                  </CardTitle>
                  <CardDescription className="text-slate-400 text-sm">
                    Manage credentials and content for secret joke pages
                  </CardDescription>
                </div>
                {expandedSections.easterEggs ? (
                  <ChevronUp className="h-5 w-5 text-slate-400" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-slate-400" />
                )}
              </div>
            </CardHeader>
            {expandedSections.easterEggs && (
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {easterEggs.map((egg) => (
                  <button
                    key={egg.page_key}
                    onClick={(e) => { e.stopPropagation(); handleEasterEggSelect(egg); }}
                    className={`p-3 rounded-sm border text-left transition-all ${
                      selectedEasterEgg?.page_key === egg.page_key
                        ? 'bg-amber-500/20 border-amber-500'
                        : 'bg-slate-900/50 border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    <p className="text-slate-200 font-medium capitalize">{egg.page_key}</p>
                    <p className="text-slate-400 text-xs">User: {egg.username}</p>
                    <p className="text-slate-500 text-xs">Pass: {egg.password}</p>
                  </button>
                ))}
              </div>
              
              {selectedEasterEgg && (
                <div className="mt-4 p-4 bg-slate-900/50 rounded-sm border border-slate-700">
                  <h4 className="text-slate-200 font-medium mb-3" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                    Edit: {selectedEasterEgg.title}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-slate-400 text-xs uppercase">Username</Label>
                      <Input
                        value={easterEggForm.username}
                        onChange={(e) => setEasterEggForm({ ...easterEggForm, username: e.target.value })}
                        className="bg-slate-900/50 border-slate-700 text-slate-200 rounded-sm mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-slate-400 text-xs uppercase">Password</Label>
                      <Input
                        value={easterEggForm.password}
                        onChange={(e) => setEasterEggForm({ ...easterEggForm, password: e.target.value })}
                        className="bg-slate-900/50 border-slate-700 text-slate-200 rounded-sm mt-1"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label className="text-slate-400 text-xs uppercase">Title</Label>
                      <Input
                        value={easterEggForm.title}
                        onChange={(e) => setEasterEggForm({ ...easterEggForm, title: e.target.value })}
                        className="bg-slate-900/50 border-slate-700 text-slate-200 rounded-sm mt-1"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label className="text-slate-400 text-xs uppercase">Content (JSON)</Label>
                      <textarea
                        value={JSON.stringify(easterEggForm.content, null, 2)}
                        onChange={(e) => {
                          try {
                            const parsed = JSON.parse(e.target.value);
                            setEasterEggForm({ ...easterEggForm, content: parsed });
                          } catch {
                            // Invalid JSON, keep old value
                          }
                        }}
                        className="w-full h-48 bg-slate-900/50 border border-slate-700 text-slate-200 rounded-sm mt-1 p-2 font-mono text-xs"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button
                      onClick={handleEasterEggUpdate}
                      disabled={loading}
                      className="bg-amber-500 hover:bg-amber-600 text-slate-900 rounded-sm"
                    >
                      Save Changes
                    </Button>
                    <Button
                      onClick={() => setSelectedEasterEgg(null)}
                      variant="outline"
                      className="border-slate-600 text-slate-400 hover:bg-slate-700 rounded-sm"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}
