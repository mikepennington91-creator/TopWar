import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Shield, Users, CheckCircle, Megaphone, FileText, Calendar, Settings, LogOut, Plus, Trash2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function Landing() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [allAnnouncements, setAllAnnouncements] = useState([]);
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState({ title: "", message: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('moderator_token');
    const role = localStorage.getItem('moderator_role');
    const username = localStorage.getItem('moderator_username');
    
    if (token) {
      setIsLoggedIn(true);
      setCurrentUser({ role, username, token });
    }
    
    fetchAnnouncements();
  }, []);

  useEffect(() => {
    if (isLoggedIn && currentUser && (currentUser.role === 'admin' || currentUser.role === 'mmod')) {
      fetchAllAnnouncements();
    }
  }, [isLoggedIn, currentUser]);

  const fetchAnnouncements = async () => {
    try {
      const response = await axios.get(`${API}/announcements`);
      setAnnouncements(response.data);
    } catch (error) {
      console.error("Failed to fetch announcements:", error);
    }
  };

  const fetchAllAnnouncements = async () => {
    try {
      const token = localStorage.getItem('moderator_token');
      const response = await axios.get(`${API}/announcements/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAllAnnouncements(response.data);
    } catch (error) {
      console.error("Failed to fetch all announcements:", error);
    }
  };

  const handleCreateAnnouncement = async (e) => {
    e.preventDefault();
    if (!newAnnouncement.title || !newAnnouncement.message) {
      toast.error("Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('moderator_token');
      await axios.post(`${API}/announcements`, newAnnouncement, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Announcement created successfully!");
      setNewAnnouncement({ title: "", message: "" });
      setShowAnnouncementForm(false);
      fetchAnnouncements();
      fetchAllAnnouncements();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to create announcement");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAnnouncement = async (id) => {
    if (!window.confirm("Are you sure you want to delete this announcement?")) return;

    try {
      const token = localStorage.getItem('moderator_token');
      await axios.delete(`${API}/announcements/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Announcement deleted");
      fetchAnnouncements();
      fetchAllAnnouncements();
    } catch (error) {
      toast.error("Failed to delete announcement");
    }
  };

  const handleToggleAnnouncement = async (id) => {
    try {
      const token = localStorage.getItem('moderator_token');
      await axios.patch(`${API}/announcements/${id}/toggle`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Announcement visibility toggled");
      fetchAnnouncements();
      fetchAllAnnouncements();
    } catch (error) {
      toast.error("Failed to toggle announcement");
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    setIsLoggedIn(false);
    setCurrentUser(null);
    toast.success("Logged out successfully");
  };

  const getRoleBadge = (role) => {
    const config = {
      admin: { color: "bg-red-500/20 text-red-400 border-red-500/50", label: "ADMIN" },
      mmod: { color: "bg-red-500/20 text-red-500 border-red-500/50", label: "MMOD" },
      moderator: { color: "bg-blue-500/20 text-blue-400 border-blue-500/50", label: "MODERATOR" },
      lmod: { color: "bg-purple-500/20 text-purple-400 border-purple-500/50", label: "LMOD" },
      smod: { color: "bg-pink-500/20 text-pink-400 border-pink-500/50", label: "SMOD" },
      developer: { color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/50", label: "DEVELOPER" }
    };
    const roleConfig = config[role] || { color: "bg-slate-500/20 text-slate-400 border-slate-500/50", label: role };
    return <Badge className={`${roleConfig.color} uppercase font-semibold`}>{roleConfig.label}</Badge>;
  };

  // Logged-in Moderator Portal View
  if (isLoggedIn && currentUser) {
    const canManageAnnouncements = currentUser.role === 'admin' || currentUser.role === 'mmod';

    return (
      <div className="min-h-screen bg-slate-950 text-slate-200 grid-texture">
        {/* Header */}
        <div className="bg-slate-900/80 border-b border-slate-800 py-4 px-6">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Shield className="w-8 h-8 text-amber-500" />
              <div>
                <h1 className="text-xl font-bold text-amber-500" style={{ fontFamily: 'Rajdhani, sans-serif' }}>TOP WAR PORTAL</h1>
                <p className="text-sm text-slate-400">Welcome, {currentUser.username}</p>
              </div>
              {getRoleBadge(currentUser.role)}
            </div>
            <Button
              onClick={handleLogout}
              variant="ghost"
              className="text-slate-400 hover:text-red-400"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        <div className="max-w-6xl mx-auto py-8 px-6">
          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Button
              onClick={() => navigate('/moderator/dashboard')}
              className="bg-amber-500 hover:bg-amber-600 text-white font-bold uppercase tracking-wide py-6 rounded-sm btn-glow"
            >
              <FileText className="h-5 w-5 mr-2" />
              Applications
            </Button>
            <Button
              onClick={() => navigate('/moderator/server-assignments')}
              variant="outline"
              className="border-2 border-emerald-500 text-emerald-500 hover:bg-emerald-500/20 font-bold uppercase tracking-wide py-6 rounded-sm"
            >
              <Calendar className="h-5 w-5 mr-2" />
              Server Assignments
            </Button>
            <Button
              onClick={() => navigate('/moderator/settings')}
              variant="outline"
              className="border-2 border-slate-600 text-slate-300 hover:bg-slate-800 font-bold uppercase tracking-wide py-6 rounded-sm"
            >
              <Settings className="h-5 w-5 mr-2" />
              Settings
            </Button>
            <Button
              onClick={() => navigate('/apply')}
              variant="outline"
              className="border-2 border-blue-500 text-blue-400 hover:bg-blue-500/20 font-bold uppercase tracking-wide py-6 rounded-sm"
            >
              <Users className="h-5 w-5 mr-2" />
              View Application Form
            </Button>
          </div>

          {/* Announcements Section */}
          <Card className="glass-card border-slate-700 mb-8">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-2xl font-bold uppercase tracking-wide text-amber-500" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                <Megaphone className="inline-block mr-2 h-6 w-6" />
                Announcements
              </CardTitle>
              {canManageAnnouncements && (
                <Button
                  onClick={() => setShowAnnouncementForm(!showAnnouncementForm)}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-sm"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Announcement
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {/* Create Announcement Form */}
              {showAnnouncementForm && canManageAnnouncements && (
                <form onSubmit={handleCreateAnnouncement} className="mb-6 p-4 bg-slate-900/50 rounded border border-slate-700">
                  <div className="space-y-4">
                    <div>
                      <Label className="text-slate-300">Title</Label>
                      <Input
                        value={newAnnouncement.title}
                        onChange={(e) => setNewAnnouncement(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Announcement title..."
                        className="bg-slate-900/50 border-slate-700 text-slate-200 rounded-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-slate-300">Message</Label>
                      <Textarea
                        value={newAnnouncement.message}
                        onChange={(e) => setNewAnnouncement(prev => ({ ...prev, message: e.target.value }))}
                        placeholder="Announcement message..."
                        className="bg-slate-900/50 border-slate-700 text-slate-200 rounded-sm min-h-[100px]"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit" disabled={loading} className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-sm">
                        {loading ? "Creating..." : "Create Announcement"}
                      </Button>
                      <Button type="button" onClick={() => setShowAnnouncementForm(false)} variant="outline" className="border-slate-600 text-slate-300 rounded-sm">
                        Cancel
                      </Button>
                    </div>
                  </div>
                </form>
              )}

              {/* Announcements List for Admins/MMODs */}
              {canManageAnnouncements ? (
                <div className="space-y-4">
                  {allAnnouncements.length === 0 ? (
                    <p className="text-slate-500 text-center py-8">No announcements yet</p>
                  ) : (
                    allAnnouncements.map((announcement) => (
                      <div key={announcement.id} className={`p-4 rounded border ${announcement.is_active ? 'bg-slate-900/50 border-slate-700' : 'bg-slate-900/30 border-slate-800 opacity-60'}`}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="text-lg font-semibold text-amber-500">{announcement.title}</h3>
                              {!announcement.is_active && <Badge className="bg-slate-700 text-slate-400">Hidden</Badge>}
                            </div>
                            <p className="text-slate-300 whitespace-pre-wrap">{announcement.message}</p>
                            <p className="text-xs text-slate-500 mt-2">
                              Posted by {announcement.created_by} on {new Date(announcement.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex gap-2 ml-4">
                            <Button
                              onClick={() => handleToggleAnnouncement(announcement.id)}
                              size="sm"
                              variant="outline"
                              className="border-slate-600 text-slate-300 hover:bg-slate-800"
                            >
                              {announcement.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                            <Button
                              onClick={() => handleDeleteAnnouncement(announcement.id)}
                              size="sm"
                              className="bg-red-500/20 text-red-400 hover:bg-red-500/30"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                // Regular moderators see only active announcements
                <div className="space-y-4">
                  {announcements.length === 0 ? (
                    <p className="text-slate-500 text-center py-8">No announcements</p>
                  ) : (
                    announcements.map((announcement) => (
                      <div key={announcement.id} className="p-4 bg-slate-900/50 rounded border border-slate-700">
                        <h3 className="text-lg font-semibold text-amber-500 mb-2">{announcement.title}</h3>
                        <p className="text-slate-300 whitespace-pre-wrap">{announcement.message}</p>
                        <p className="text-xs text-slate-500 mt-2">
                          Posted by {announcement.created_by} on {new Date(announcement.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Public Landing Page (not logged in)
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 grid-texture">
      {/* Hero Section */}
      <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image with Overlay */}
        <div 
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1704229266209-47d8d6ad0c46?crop=entropy&cs=srgb&fm=jpg&q=85')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.15,
            filter: 'grayscale(100%)'
          }}
        />
        
        {/* Content */}
        <div className="relative z-10 max-w-4xl mx-auto px-8 text-center">
          <div className="mb-8">
            <Shield className="w-20 h-20 mx-auto text-amber-500 mb-6" />
            <h1 className="text-5xl md:text-7xl font-bold uppercase tracking-wider mb-4 text-amber-500" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
              TOP WAR
            </h1>
            <h2 className="text-3xl md:text-5xl font-semibold uppercase tracking-wider mb-6" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
              Moderator Recruitment
            </h2>
          </div>

          <p className="text-lg md:text-xl text-slate-300 mb-12 leading-relaxed max-w-2xl mx-auto">
            Join our elite moderation team. Help maintain order, enforce community guidelines, and shape the future of Top War's player experience.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Button
              data-testid="apply-now-btn"
              onClick={() => navigate('/apply')}
              className="bg-amber-500 hover:bg-amber-600 text-white font-bold uppercase tracking-wide px-8 py-6 text-lg rounded-sm btn-glow"
            >
              Apply Now
            </Button>
            <Button
              data-testid="moderator-login-btn"
              onClick={() => navigate('/moderator/login')}
              variant="outline"
              className="border-2 border-emerald-500 text-emerald-500 hover:bg-emerald-500/20 font-bold uppercase tracking-wide px-8 py-6 text-lg rounded-sm"
            >
              Moderator Login
            </Button>
          </div>
        </div>
      </div>

      {/* Mission Brief Section */}
      <div className="py-24 px-8 bg-slate-900/50">
        <div className="max-w-6xl mx-auto">
          <h3 className="text-4xl font-bold uppercase tracking-wider text-center mb-16 text-amber-500" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
            Mission Brief
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="glass-card p-8 rounded-lg hover:border-amber-500/50 transition-all duration-300">
              <Shield className="w-12 h-12 text-amber-500 mb-4" />
              <h4 className="text-2xl font-semibold uppercase tracking-wide mb-3" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                Enforce Guidelines
              </h4>
              <p className="text-slate-400 leading-relaxed">
                Maintain community standards and ensure all players follow the rules. Your authority shapes the battlefield.
              </p>
            </div>

            <div className="glass-card p-8 rounded-lg hover:border-emerald-500/50 transition-all duration-300">
              <Users className="w-12 h-12 text-emerald-500 mb-4" />
              <h4 className="text-2xl font-semibold uppercase tracking-wide mb-3" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                Support Players
              </h4>
              <p className="text-slate-400 leading-relaxed">
                Guide new recruits, answer questions, and create a welcoming environment for the Top War community.
              </p>
            </div>

            <div className="glass-card p-8 rounded-lg hover:border-amber-500/50 transition-all duration-300">
              <CheckCircle className="w-12 h-12 text-amber-500 mb-4" />
              <h4 className="text-2xl font-semibold uppercase tracking-wide mb-3" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                Resolve Conflicts
              </h4>
              <p className="text-slate-400 leading-relaxed">
                Handle disputes professionally, mediate conflicts, and maintain peace across all servers and channels.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
