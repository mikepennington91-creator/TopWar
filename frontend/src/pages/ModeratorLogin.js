import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Shield, ArrowLeft } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function ModeratorLogin() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [credentials, setCredentials] = useState({
    username: "",
    password: ""
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(`${API}/auth/login`, credentials);
      localStorage.setItem('moderator_token', response.data.access_token);
      localStorage.setItem('moderator_role', response.data.role);
      localStorage.setItem('moderator_username', response.data.username);
      toast.success("Login successful!");
      navigate('/moderator/portal');
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.detail || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex items-center justify-center px-3 sm:px-4 py-6 grid-texture">
      <div className="w-full max-w-md">
        <Button
          data-testid="back-to-home-btn"
          onClick={() => navigate('/')}
          variant="ghost"
          size="sm"
          className="mb-4 sm:mb-8 text-amber-500 hover:text-amber-400 hover:bg-slate-900 text-sm"
        >
          <ArrowLeft className="mr-1 sm:mr-2 h-4 w-4" />
          Back to Home
        </Button>

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
          </form>
        </div>
      </div>
    </div>
  );
}