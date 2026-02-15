import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Shield, ArrowLeft, AlertTriangle, Mail } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function ModeratorLogin() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [credentials, setCredentials] = useState({
    username: "",
    password: ""
  });
  const [emailPromptOpen, setEmailPromptOpen] = useState(false);
  const [emailPromptValue, setEmailPromptValue] = useState("");
  const [emailPromptLoading, setEmailPromptLoading] = useState(false);
  const [needsEmailAfterPasswordChange, setNeedsEmailAfterPasswordChange] = useState(false);
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [showResetPasswordDialog, setShowResetPasswordDialog] = useState(false);
  const [passwordResetEmail, setPasswordResetEmail] = useState("");
  const [passwordResetLoading, setPasswordResetLoading] = useState(false);
  const [lastLoginError, setLastLoginError] = useState("");
  const [passwordChangeForm, setPasswordChangeForm] = useState({
    old_password: "",
    new_password: "",
    confirm_password: ""
  });

  const isLockedAccountError = lastLoginError.toLowerCase().includes("locked");

  const openPasswordResetDialog = () => {
    setPasswordResetUsername(credentials.username.trim());
    setShowResetPasswordDialog(true);
  };

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
    setLastLoginError("");
    
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
      console.log('Login response:', response.data);
      console.log('needs_email value:', response.data.needs_email);
      
      localStorage.setItem('moderator_token', response.data.access_token);
      localStorage.setItem('moderator_role', response.data.role);
      localStorage.setItem('moderator_roles', JSON.stringify(response.data.roles || [response.data.role]));
      localStorage.setItem('moderator_username', response.data.username);
      localStorage.setItem('moderator_is_admin', response.data.is_admin ? 'true' : 'false');
      localStorage.setItem('moderator_is_training_manager', response.data.is_training_manager ? 'true' : 'false');
      localStorage.setItem('moderator_is_in_game_leader', response.data.is_in_game_leader ? 'true' : 'false');
      localStorage.setItem('moderator_is_discord_leader', response.data.is_discord_leader ? 'true' : 'false');
      
      // Check if password change is required
      if (response.data.must_change_password) {
        setMustChangePassword(true);
        setNeedsEmailAfterPasswordChange(Boolean(response.data.needs_email));
        setPasswordChangeForm(prev => ({ ...prev, old_password: credentials.password }));
        toast.warning("You must change your password before continuing");
        setLoading(false);
        return;
      }

      if (response.data.needs_email) {
        console.log('Opening email prompt dialog');
        setEmailPromptOpen(true);
        setLoading(false);
        return;
      }

      toast.success("Login successful!");
      navigate('/moderator/portal');
    } catch (error) {
      console.error(error);
      const errorDetail = error.response?.data?.detail || "Invalid credentials";
      setLastLoginError(errorDetail);
      toast.error(errorDetail);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailPromptSubmit = async (e) => {
    e.preventDefault();
    setEmailPromptLoading(true);
    try {
      const token = localStorage.getItem('moderator_token');
      await axios.post(
        `${API}/auth/set-email`,
        { email: emailPromptValue },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Email saved successfully!");
      setEmailPromptOpen(false);
      navigate('/moderator/portal');
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.detail || "Failed to save email");
    } finally {
      setEmailPromptLoading(false);
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
      if (needsEmailAfterPasswordChange) {
        setEmailPromptOpen(true);
        setNeedsEmailAfterPasswordChange(false);
        return;
      }
      navigate('/moderator/portal');
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.detail || "Failed to change password");
    } finally {
      setLoading(false);
    }
  };


  const handleRequestPasswordReset = async (e) => {
    e.preventDefault();

    if (!passwordResetUsername.trim() || !passwordResetEmail.trim()) {
      toast.error("Please enter username and email");
    if (!passwordResetEmail.trim()) {
      toast.error("Please enter your email");
      return;
    }

    setPasswordResetLoading(true);
    try {
      await axios.post(`${API}/auth/request-password-reset`, { email: passwordResetEmail.trim() });
      toast.success("If that email exists, a reset link has been sent.");
      setShowResetPasswordDialog(false);
      setPasswordResetEmail("");
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.detail || "Failed to request password reset");
    } finally {
      setPasswordResetLoading(false);
    }
  };


  const passwordResetDialog = (
    <Dialog open={showResetPasswordDialog} onOpenChange={setShowResetPasswordDialog}>
      <DialogContent className="bg-slate-900 border-slate-700 text-slate-200 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-amber-400 flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Reset Password by Email
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Enter your account email to request a password reset link.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleRequestPasswordReset} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password-reset-email" className="text-slate-300 font-medium">
              Email Address
            </Label>
            <Input
              id="password-reset-email"
              type="email"
              value={passwordResetEmail}
              onChange={(e) => setPasswordResetEmail(e.target.value)}
              required
              className="bg-slate-950/60 border-slate-700 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-slate-200 rounded-sm"
              placeholder="Enter your email address"
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowResetPasswordDialog(false)}
              className="border-slate-600 text-slate-200 hover:bg-slate-800"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={passwordResetLoading || !passwordResetEmail.trim()}
              className="bg-amber-500 hover:bg-amber-600 text-white"
            >
              {passwordResetLoading ? "Sending..." : "Send Reset Link"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );

  const emailPromptDialog = (
    <Dialog open={emailPromptOpen} onOpenChange={() => {}}>
      <DialogContent 
        className="bg-slate-900 border-slate-700 text-slate-200 sm:max-w-md [&>button]:hidden" 
        data-testid="email-confirmation-dialog"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-amber-400 flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Required
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Please enter a valid email address to continue. This is required for account security and password recovery.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleEmailPromptSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email-prompt" className="text-slate-300 font-medium">
              Email Address
            </Label>
            <Input
              id="email-prompt"
              name="email-prompt"
              type="email"
              data-testid="email-prompt-input"
              value={emailPromptValue}
              onChange={(e) => setEmailPromptValue(e.target.value)}
              required
              className="bg-slate-950/60 border-slate-700 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-slate-200 rounded-sm"
              placeholder="Enter your email address"
            />
          </div>
          <Button
            type="submit"
            data-testid="email-prompt-submit-btn"
            disabled={emailPromptLoading || !emailPromptValue.trim()}
            className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold uppercase tracking-wide py-5 text-base rounded-sm btn-glow"
          >
            {emailPromptLoading ? "Saving..." : "Confirm Email"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );

  // Forced password change form
  if (mustChangePassword) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-200 flex items-center justify-center px-3 sm:px-4 py-6 grid-texture">
        <div className="w-full max-w-md">
          <div className="glass-card rounded-lg p-5 sm:p-8">
            {emailPromptDialog}
            <div className="text-center mb-6 sm:mb-8">
              <AlertTriangle className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-amber-500 mb-3 sm:mb-4" />
              <h1 className="text-2xl sm:text-3xl font-bold uppercase tracking-wider text-amber-500" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                Password Change Required
              </h1>
              <p className="text-slate-400 mt-2 text-sm">You must change your password before continuing</p>
            </div>

            {!emailPromptOpen && (
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
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex items-center justify-center px-3 sm:px-4 pt-14 py-6 grid-texture">
      <div className="w-full max-w-md">
        {emailPromptDialog}
        {passwordResetDialog}
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

            {lastLoginError.toLowerCase().includes("locked") && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowResetPasswordDialog(true)}
                className="w-full border-amber-500/50 text-amber-400 hover:bg-amber-500/10"
              >
                Account locked? Reset password via email
              </Button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
