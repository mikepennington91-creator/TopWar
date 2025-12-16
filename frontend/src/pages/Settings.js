import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, Lock, Users, Shield } from "lucide-react";

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

  useEffect(() => {
    const token = localStorage.getItem('moderator_token');
    const role = localStorage.getItem('moderator_role');
    const username = localStorage.getItem('moderator_username');
    
    if (!token) {
      navigate('/moderator/login');
      return;
    }
    
    setCurrentUser({ role, username });
    
    if (role === 'admin' || role === 'senior_moderator') {
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

  const getRoleBadge = (role) => {
    const colors = {
      admin: "text-red-400",
      senior_moderator: "text-amber-400",
      moderator: "text-emerald-400"
    };
    return <span className={`uppercase font-semibold ${colors[role] || 'text-slate-400'}`}>{role.replace('_', ' ')}</span>;
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

        {/* Admin/Senior Moderator: User Management */}
        {currentUser && (currentUser.role === 'admin' || currentUser.role === 'senior_moderator') && (
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

            {/* Moderator List */}
            <Card className="glass-card border-slate-700">
              <CardHeader>
                <CardTitle className="text-2xl font-bold uppercase tracking-wide text-emerald-500" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                  <Users className="inline-block mr-2 h-6 w-6" />
                  Moderator List
                </CardTitle>
                <CardDescription className="text-slate-400">
                  All registered moderators
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3" data-testid="moderator-list">
                  {moderators.map((mod) => (
                    <div key={mod.username} className="flex items-center justify-between p-4 bg-slate-900/50 rounded border border-slate-800">
                      <div>
                        <p className="font-semibold text-slate-200">{mod.username}</p>
                        <p className="text-sm text-slate-500 mono">
                          Joined: {new Date(mod.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        {getRoleBadge(mod.role)}
                      </div>
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