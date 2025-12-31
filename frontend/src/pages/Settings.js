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
import { ArrowLeft, Lock, Users, Shield, UserPlus, UserX, UserCheck, AlertCircle, Snowflake, Clock, PartyPopper, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Switch } from "@/components/ui/switch";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Role hierarchy - higher index = higher rank
const ROLE_HIERARCHY = {
  'moderator': 0,
  'lmod': 1,
  'smod': 2,
  'mmod': 3,
  'developer': 4,
  'admin': 5  // Admin has highest privileges
};

// Get roles that a user can assign based on their role
const getAssignableRoles = (currentUserRole, targetUserRole) => {
  const currentRank = ROLE_HIERARCHY[currentUserRole] || 0;
  const targetRank = ROLE_HIERARCHY[targetUserRole] || 0;
  
  // Admin can assign any role
  if (currentUserRole === 'admin') {
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

// Check if current user can modify target user's role
const canModifyRole = (currentUserRole, targetUserRole, isSelf) => {
  // Admin can change their own role
  if (currentUserRole === 'admin' && isSelf) {
    return true;
  }
  
  // No one else can change their own role
  if (isSelf) {
    return false;
  }
  
  const currentRank = ROLE_HIERARCHY[currentUserRole] || 0;
  const targetRank = ROLE_HIERARCHY[targetUserRole] || 0;
  
  // Admin can modify anyone
  if (currentUserRole === 'admin') {
    return true;
  }
  
  // Can only modify users with lower rank
  return currentRank > targetRank;
};

// Check if current user can modify permissions (checkboxes)
const canModifyPermissions = (currentUserRole) => {
  return currentUserRole === 'admin';
};

// Check if current user can deactivate accounts (Admin and MMOD)
const canDeactivateAccounts = (currentUserRole, targetUserRole, isSelf) => {
  if (isSelf) return false;
  
  // Admin can deactivate anyone
  if (currentUserRole === 'admin') return true;
  
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
    role: "moderator"
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

  useEffect(() => {
    const token = localStorage.getItem('moderator_token');
    const role = localStorage.getItem('moderator_role');
    const username = localStorage.getItem('moderator_username');
    
    if (!token) {
      navigate('/moderator/login');
      return;
    }
    
    setCurrentUser({ role, username });
    
    // All roles with hierarchy access can see moderators list
    if (['admin', 'developer', 'mmod', 'smod', 'lmod'].includes(role)) {
      fetchModerators();
    }
  }, [navigate]);

  const fetchModerators = async () => {
    try {
      const token = localStorage.getItem('moderator_token');
      const response = await axios.get(`${API}/moderators`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setModerators(response.data);
    } catch (error) {
      console.error(error);
      if (error.response?.status === 401) {
        localStorage.clear();
        navigate('/moderator/login');
      }
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
      await axios.post(
        `${API}/auth/register`,
        addModForm,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`Moderator ${addModForm.username} added successfully!`);
      setAddModForm({ username: "", password: "", role: "moderator" });
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

  const handleChangeRole = async (username, newRole) => {
    if (!window.confirm(`Change ${username}'s role to ${newRole.replace('_', ' ')}?`)) {
      return;
    }
    
    setLoading(true);
    try {
      const token = localStorage.getItem('moderator_token');
      await axios.patch(
        `${API}/moderators/${username}/role`,
        { role: newRole },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`Role updated to ${newRole.replace('_', ' ')}!`);
      fetchModerators();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.detail || "Failed to update role");
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
        <Card className="glass-card border-slate-700 mb-8">
          <CardHeader>
            <CardTitle className="text-2xl font-bold uppercase tracking-wide text-amber-500" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
              <Lock className="inline-block mr-2 h-6 w-6" />
              Change Your Password
            </CardTitle>
            <CardDescription className="text-slate-400">
              Update your account password
            </CardDescription>
          </CardHeader>
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
        </Card>

        {/* Seasonal Animation Toggle */}
        <Card className="glass-card border-slate-700 mb-8">
          <CardHeader>
            <CardTitle className="text-2xl font-bold uppercase tracking-wide text-cyan-500" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
              <Snowflake className="inline-block mr-2 h-6 w-6" />
              Visual Preferences
            </CardTitle>
            <CardDescription className="text-slate-400">
              Customize your visual experience
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded border border-slate-800">
              <div className="flex-1">
                <p className="font-semibold text-slate-200">Seasonal Animation</p>
                <p className="text-sm text-slate-400">
                  Show falling snowflakes, leaves, or other seasonal effects on the landing page and portal
                </p>
              </div>
              <Switch
                data-testid="seasonal-animation-toggle"
                checked={seasonalAnimationEnabled}
                onCheckedChange={handleSeasonalAnimationToggle}
                className="ml-4"
              />
            </div>
          </CardContent>
        </Card>

        {/* Admin Only Sections */}
        {currentUser && currentUser.role === 'admin' && (
          <>
            {/* Reset Password - Admin Only */}
            <Card className="glass-card border-slate-700 mb-8">
              <CardHeader>
                <CardTitle className="text-2xl font-bold uppercase tracking-wide text-red-500" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                  <Lock className="inline-block mr-2 h-6 w-6" />
                  Reset User Password
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Reset password for any moderator
                </CardDescription>
              </CardHeader>
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
            </Card>

            {/* Change Username - Admin Only */}
            <Card className="glass-card border-slate-700 mb-8">
              <CardHeader>
                <CardTitle className="text-2xl font-bold uppercase tracking-wide text-amber-500" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                  <UserPlus className="inline-block mr-2 h-6 w-6" />
                  Change Moderator Username
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Change any moderator&apos;s username
                </CardDescription>
              </CardHeader>
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
            </Card>

            {/* Add Moderator - Admin Only */}
            <Card className="glass-card border-slate-700 mb-8">
              <CardHeader>
                <CardTitle className="text-2xl font-bold uppercase tracking-wide text-emerald-500" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                  <UserPlus className="inline-block mr-2 h-6 w-6" />
                  Add New Moderator
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Create a new moderator account
                </CardDescription>
              </CardHeader>
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
                    <Label htmlFor="add_role" className="text-slate-300">Role</Label>
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
            </Card>
          </>
        )}

        {/* User Management - Available to roles in hierarchy */}
        {currentUser && ['admin', 'developer', 'mmod', 'smod', 'lmod'].includes(currentUser.role) && (
          <>
            {/* Manage Moderators */}
            <Card className="glass-card border-slate-700">
              <CardHeader>
                <CardTitle className="text-2xl font-bold uppercase tracking-wide text-amber-500" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                  <Users className="inline-block mr-2 h-6 w-6" />
                  Manage Moderators
                </CardTitle>
                <CardDescription className="text-slate-400">
                  View, enable/disable, or delete moderator accounts
                </CardDescription>
              </CardHeader>
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
                          <p className="text-sm mt-1">{getRoleBadge(mod.role)}</p>
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
                        const canChangeRole = canModifyRole(currentUser.role, mod.role, isSelf);
                        const canChangePerms = canModifyPermissions(currentUser.role);
                        const canDeactivate = canDeactivateAccounts(currentUser.role, mod.role, isSelf);
                        const assignableRoles = getAssignableRoles(currentUser.role, mod.role);
                        
                        // Determine what to show
                        const showRoleDropdown = canChangeRole && assignableRoles.length > 0;
                        const showPermissions = canChangePerms && !isSelf;
                        const showDeleteButton = canChangePerms && !isSelf; // Only admin can delete
                        
                        // If nothing to show, return null
                        if (!showRoleDropdown && !showPermissions && !canDeactivate) return null;
                        
                        return (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Role Selection */}
                            {showRoleDropdown && (
                              <div className="space-y-2">
                                <Label className="text-slate-400 text-xs uppercase">Role</Label>
                                <Select
                                  value={mod.role}
                                  onValueChange={(value) => handleChangeRole(mod.username, value)}
                                  disabled={loading}
                                >
                                  <SelectTrigger className="bg-slate-900/50 border-slate-700 text-slate-200 rounded-sm">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent className="bg-slate-900 border-slate-700">
                                    {assignableRoles.includes('admin') && (
                                      <SelectItem value="admin" className="text-red-400">Admin</SelectItem>
                                    )}
                                    {assignableRoles.includes('developer') && (
                                      <SelectItem value="developer" className="text-yellow-400">Developer</SelectItem>
                                    )}
                                    {assignableRoles.includes('mmod') && (
                                      <SelectItem value="mmod" className="text-red-500">MMOD</SelectItem>
                                    )}
                                    {assignableRoles.includes('smod') && (
                                      <SelectItem value="smod" className="text-pink-400">SMOD</SelectItem>
                                    )}
                                    {assignableRoles.includes('lmod') && (
                                      <SelectItem value="lmod" className="text-purple-400">LMOD</SelectItem>
                                    )}
                                    {assignableRoles.includes('moderator') && (
                                      <SelectItem value="moderator" className="text-blue-400">Moderator</SelectItem>
                                    )}
                                  </SelectContent>
                                </Select>
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
            </Card>
          </>
        )}
      </div>
    </div>
  );
}