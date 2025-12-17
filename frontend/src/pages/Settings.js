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
import { ArrowLeft, Lock, Users, Shield, UserPlus, UserX, UserCheck, AlertCircle } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

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

  useEffect(() => {
    const token = localStorage.getItem('moderator_token');
    const role = localStorage.getItem('moderator_role');
    const username = localStorage.getItem('moderator_username');
    
    if (!token) {
      navigate('/moderator/login');
      return;
    }
    
    setCurrentUser({ role, username });
    
    if (role === 'admin' || role === 'mmod') {
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

  const getStatusBadge = (status, locked_at) => {
    if (locked_at) {
      return <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/50">LOCKED</Badge>;
    }
    if (status === "active") {
      return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/50">ACTIVE</Badge>;
    }
    return <Badge className="bg-red-500/20 text-red-400 border-red-500/50">DISABLED</Badge>;
  };

  const handleUnlockAccount = async (username) => {
    if (!window.confirm(`Unlock account for ${username}?`)) {
      return;
    }
    
    setLoading(true);
    try {
      const token = localStorage.getItem('moderator_token');
      await axios.patch(
        `${API}/moderators/${username}/unlock`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`Account unlocked for ${username}!`);
      fetchModerators();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.detail || "Failed to unlock account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 py-12 px-4 sm:px-6 lg:px-8 grid-texture">
      <div className="max-w-4xl mx-auto">
        <Button
          data-testid="back-to-dashboard-btn"
          onClick={() => navigate('/moderator/dashboard')}
          variant="ghost"
          className="mb-8 text-amber-500 hover:text-amber-400 hover:bg-slate-900"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <h1 className="text-4xl font-bold uppercase tracking-wider mb-8 text-amber-500" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
          <Shield className="inline-block mr-3 h-10 w-10" />
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

        {/* Admin/MMOD: User Management */}
        {currentUser && (currentUser.role === 'admin' || currentUser.role === 'mmod') && (
          <>
            {/* Reset Password */}
            <Card className="glass-card border-slate-700 mb-8">
              <CardHeader>
                <CardTitle className="text-2xl font-bold uppercase tracking-wide text-red-500" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                  <Lock className="inline-block mr-2 h-6 w-6" />
                  Reset User Password (Admin Only)
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

            {/* Change Username */}
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

            {/* Add Moderator */}
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
                    <div key={mod.username} className="p-4 bg-slate-900/50 rounded border border-slate-800">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex-1">
                          <p className="font-semibold text-slate-200 text-lg">{mod.username}</p>
                          <p className="text-sm text-slate-500 mono">
                            Joined: {new Date(mod.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          {getStatusBadge(mod.status || "active", mod.locked_at)}
                          {mod.is_training_manager && (
                            <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/50">TRAINING MGR</Badge>
                          )}
                          {mod.is_admin && (
                            <Badge className="bg-red-500/20 text-red-400 border-red-500/50">ADMIN ACCESS</Badge>
                          )}
                        </div>
                      </div>
                      
                      {mod.username !== currentUser.username && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Role Selection */}
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
                                <SelectItem value="admin" className="text-red-400">Admin</SelectItem>
                                <SelectItem value="mmod" className="text-red-500">MMOD</SelectItem>
                                <SelectItem value="moderator" className="text-blue-400">Moderator</SelectItem>
                                <SelectItem value="lmod" className="text-purple-400">LMOD</SelectItem>
                                <SelectItem value="smod" className="text-pink-400">SMOD</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          {/* Permissions Toggles */}
                          <div className="space-y-3 md:col-span-2">
                            <Label className="text-slate-400 text-xs uppercase">Permissions</Label>
                            
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
                          
                          {/* Action Buttons */}
                          <div className="md:col-span-2 flex gap-2 flex-wrap">
                            {mod.locked_at && (
                              <Button
                                data-testid={`unlock-${mod.username}`}
                                onClick={() => handleUnlockAccount(mod.username)}
                                disabled={loading}
                                size="sm"
                                className="bg-orange-500 hover:bg-orange-600 text-white rounded-sm"
                              >
                                <UserCheck className="h-4 w-4 mr-1" /> Unlock Account
                              </Button>
                            )}
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
                            <Button
                              data-testid={`delete-${mod.username}`}
                              onClick={() => handleDeleteModerator(mod.username)}
                              disabled={loading}
                              size="sm"
                              className="bg-red-500 hover:bg-red-600 text-white rounded-sm"
                            >
                              Delete Permanently
                            </Button>
                          </div>
                        </div>
                      )}
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