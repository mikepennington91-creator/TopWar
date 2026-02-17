import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { KeyRound } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function ModeratorResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    new_password: "",
    confirm_password: ""
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!token) {
      toast.error("Reset token is missing or invalid");
      return;
    }

    if (form.new_password !== form.confirm_password) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API}/auth/reset-password-by-email`, {
        token,
        new_password: form.new_password
      });
      toast.success("Password reset successful. Please login.");
      navigate("/moderator/login");
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.detail || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex items-center justify-center px-3 sm:px-4 pt-14 py-6 grid-texture">
      <div className="w-full max-w-md glass-card rounded-lg p-5 sm:p-8">
        <div className="text-center mb-6 sm:mb-8">
          <KeyRound className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-amber-500 mb-3 sm:mb-4" />
          <h1 className="text-2xl sm:text-3xl font-bold uppercase tracking-wider text-amber-500" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
            Reset Password
          </h1>
          <p className="text-slate-400 mt-2 text-sm">Set a new password for your moderator account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="new_password" className="text-slate-300 font-medium">New Password</Label>
            <Input
              id="new_password"
              name="new_password"
              type="password"
              value={form.new_password}
              onChange={handleChange}
              required
              className="bg-slate-900/50 border-slate-700 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-slate-200 rounded-sm"
              placeholder="Enter new password"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm_password" className="text-slate-300 font-medium">Confirm Password</Label>
            <Input
              id="confirm_password"
              name="confirm_password"
              type="password"
              value={form.confirm_password}
              onChange={handleChange}
              required
              className="bg-slate-900/50 border-slate-700 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-slate-200 rounded-sm"
              placeholder="Confirm new password"
            />
          </div>

          <Button
            type="submit"
            disabled={loading || !token || !form.new_password || !form.confirm_password}
            className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold uppercase tracking-wide py-6 text-lg rounded-sm btn-glow"
          >
            {loading ? "Resetting..." : "Reset Password"}
          </Button>

          {!token && (
            <p className="text-xs text-red-400 text-center">Missing reset token. Please use the latest reset link from your email.</p>
          )}
        </form>
      </div>
    </div>
  );
}
