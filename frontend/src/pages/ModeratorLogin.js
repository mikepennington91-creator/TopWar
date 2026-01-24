import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Shield, ArrowLeft, AlertTriangle } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function ModeratorLogin() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [credentials, setCredentials] = useState({
    username: "",
    email: "",
    password: ""
  });
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [passwordChangeForm, setPasswordChangeForm] = useState({
    old_password: "",
    new_password: "",
    confirm_password: ""
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordChangeInput = (e) => {
    const { name, value } = e.target;
    setPasswordChangeForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Check for easter egg credentials first
    try {
      const easterEggResponse = await axios.post(`${API}/easter-eggs/verify`, null, {
        params: { username: credentials.username, password: credentials.password }
      });
      
      if (easterEggResponse.data.valid) {
        const pageKey = easterEggResponse.data.page_key;
        const content = easterEggResponse.data.content;
        // Store content in sessionStorage for the easter egg pages to use
        sessionStorage.setItem('easter_egg_content', JSON.stringify(content));
        
        // Navigate to the appropriate page based on page_key
        const pageRoutes = {
          'troll': '/troll-detected',
          'valentine': '/secret-valentine',
          'mediocre': '/secret-proposal',
          'developer': '/dev-secrets',
          'garuda': '/garuda-tribute',
          'sian': '/sian-appreciation'
        };
        
        if (pageRoutes[pageKey]) {
          setLoading(false);
          navigate(pageRoutes[pageKey]);
          return;
        }
      }
    } catch (error) {
      // If easter egg check fails, continue with normal login
      console.log("Easter egg check failed, continuing with normal login");
    }

    try {
      const response = await axios.post(`${API}/auth/login`, credentials);
      localStorage.setItem('moderator_token', response.data.access_token);
      localStorage.setItem('moderator_role', response.data.role);
      localStorage.setItem('moderator_username', response.data.username);
      localStorage.setItem('moderator_is_admin', response.data.is_admin ? 'true' : 'false');
      localStorage.setItem('moderator_is_training_manager', response.data.is_training_manager ? 'true' : 'false');
      
      // Check if password change is required
      if (response.data.must_change_password) {
        setMustChangePassword(true);
        setPasswordChangeForm(prev => ({ ...prev, old_password: credentials.password }));
        toast.warning("You must change your password before continuing");
        setLoading(false);
        return;
      }
      
      toast.success("Login successful!");
      navigate('/moderator/portal');
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.detail || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (passwordChangeForm.new_password !== passwordChangeForm.confirm_password) {
      toast.error("New passwords do not match");
      return;
    }
    
    if (passwordChangeForm.new_password === passwordChangeForm.old_password) {
      toast.error("New password must be different from your current password");
      return;
    }
    
    setLoading(true);
    try {
      const token = localStorage.getItem('moderator_token');
      await axios.patch(
        `${API}/auth/change-password`,
        {
          old_password: passwordChangeForm.old_password,
          new_password: passwordChangeForm.new_password
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Password changed successfully!");
      navigate('/moderator/portal');
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.detail || "Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  // Forced password change form
  if (mustChangePassword) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-200 flex items-center justify-center px-3 sm:px-4 py-6 grid-texture">
        <div className="w-full max-w-md">
          <div className="glass-card rounded-lg p-5 sm:p-8">
            <div className="text-center mb-6 sm:mb-8">
              <AlertTriangle className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-amber-500 mb-3 sm:mb-4" />
              <h1 className="text-2xl sm:text-3xl font-bold uppercase tracking-wider text-amber-500" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                Password Change Required
              </h1>
              <p className="text-slate-400 mt-2 text-sm">You must change your password before continuing</p>
            </div>

            <form onSubmit={handlePasswordChange} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="new_password" className="text-slate-300 font-medium">
                  New Password
                </Label>
                <Input
                  id="new_password"
                  name="new_password"
                  type="password"
                  value={passwordChangeForm.new_password}
                  onChange={handlePasswordChangeInput}
                  required
                  className="bg-slate-900/50 border-slate-700 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-slate-200 rounded-sm"
                  placeholder="Enter new password"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm_password" className="text-slate-300 font-medium">
                  Confirm New Password
                </Label>
                <Input
                  id="confirm_password"
                  name="confirm_password"
                  type="password"
                  value={passwordChangeForm.confirm_password}
                  onChange={handlePasswordChangeInput}
                  required
                  className="bg-slate-900/50 border-slate-700 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-slate-200 rounded-sm"
                  placeholder="Confirm new password"
                />
              </div>

              <div className="bg-slate-800/50 border border-slate-700 rounded-md p-3 text-sm text-slate-400">
                <p className="font-medium text-slate-300 mb-2">Password requirements:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Minimum 8 characters</li>
                  <li>At least one uppercase letter</li>
                  <li>At least one lowercase letter</li>
                  <li>At least one number</li>
                  <li>At least one special character</li>
                </ul>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold uppercase tracking-wide py-6 text-lg rounded-sm btn-glow"
              >
                {loading ? "Changing Password..." : "Change Password"}
              </Button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex items-center justify-center px-3 sm:px-4 pt-14 py-6 grid-texture">
      <div className="w-full max-w-md">

        <div className="glass-card rounded-lg p-5 sm:p-8">
          <div className="text-center mb-6 sm:mb-8">
            <Shield className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-amber-500 mb-3 sm:mb-4" />
            <h1 className="text-2xl sm:text-3xl font-bold uppercase tracking-wider text-amber-500" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
              Moderator Access
            </h1>
            <p className="text-slate-400 mt-2 text-sm">Authorized personnel only</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6" data-testid="login-form">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-slate-300 font-medium">
                Username
              </Label>
              <Input
                id="username"
                name="username"
                data-testid="username-input"
                type="text"
                value={credentials.username}
                onChange={handleChange}
                required
                className="bg-slate-900/50 border-slate-700 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-slate-200 rounded-sm"
                placeholder="Enter your username"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-300 font-medium">
                Email Address
              </Label>
              <Input
                id="email"
                name="email"
                data-testid="email-input"
                type="email"
                value={credentials.email}
                onChange={handleChange}
                required
                className="bg-slate-900/50 border-slate-700 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-slate-200 rounded-sm"
                placeholder="Enter your email address"
              />
              <p className="text-xs text-slate-500">
                If you don&apos;t have an email on file yet, enter one now to confirm your account.
                We only use this for password resets.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-300 font-medium">
                Password
              </Label>
              <Input
                id="password"
                name="password"
                data-testid="password-input"
                type="password"
                value={credentials.password}
                onChange={handleChange}
                required
                className="bg-slate-900/50 border-slate-700 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-slate-200 rounded-sm"
                placeholder="Enter your password"
              />
            </div>

            <Button
              data-testid="login-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold uppercase tracking-wide py-6 text-lg rounded-sm btn-glow"
            >
              {loading ? "Authenticating..." : "Login"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
