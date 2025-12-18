import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Shield, Megaphone, FileText, Calendar, Settings, LogOut, Plus, Trash2, Eye, EyeOff, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function ModeratorPortal() {
  const navigate = useNavigate();
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
    
    if (!token) {
      navigate('/moderator/login');
      return;
    }
    
    setCurrentUser({ role, username, token });
    fetchAnnouncements();
  }, [navigate]);

  useEffect(() => {
    if (currentUser && (currentUser.role === 'admin' || currentUser.role === 'mmod')) {
      fetchAllAnnouncements();
    }
  }, [currentUser]);

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
    toast.success("Logged out successfully");
    navigate('/');
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

  if (!currentUser) {
    return null;
  }

  const canManageAnnouncements = currentUser.role === 'admin' || currentUser.role === 'mmod';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 grid-texture">
      {/* Header */}
      <div className="bg-slate-900/80 border-b border-slate-800 py-3 sm:py-4 px-3 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 sm:gap-4">
            <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-amber-500" />
            <div className="flex-1 min-w-0">
              <h1 className="text-lg sm:text-xl font-bold text-amber-500" style={{ fontFamily: 'Rajdhani, sans-serif' }}>TOP WAR PORTAL</h1>
              <p className="text-xs sm:text-sm text-slate-400 truncate">Welcome, {currentUser.username}</p>
            </div>
            {getRoleBadge(currentUser.role)}
          </div>
          <Button
            onClick={handleLogout}
            variant="ghost"
            size="sm"
            className="text-slate-400 hover:text-red-400 self-end sm:self-auto"
          >
            <LogOut className="h-4 w-4 mr-1 sm:mr-2" />
            <span className="text-sm">Logout</span>
          </Button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto py-4 sm:py-8 px-3 sm:px-6">
        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-8">
          <Button
            onClick={() => navigate('/moderator/dashboard')}
            className="bg-amber-500 hover:bg-amber-600 text-white font-bold uppercase tracking-wide py-4 sm:py-6 rounded-sm btn-glow text-xs sm:text-sm"
          >
            <FileText className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
            Apps
          </Button>
          <Button
            onClick={() => navigate('/moderator/server-assignments')}
            variant="outline"
            className="border-2 border-emerald-500 text-emerald-500 hover:bg-emerald-500/20 font-bold uppercase tracking-wide py-4 sm:py-6 rounded-sm text-xs sm:text-sm"
          >
            <Calendar className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
            Servers
          </Button>
          <Button
            onClick={() => navigate('/moderator/settings')}
            variant="outline"
            className="border-2 border-slate-600 text-slate-300 hover:bg-slate-800 font-bold uppercase tracking-wide py-4 sm:py-6 rounded-sm text-xs sm:text-sm"
          >
            <Settings className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
            Settings
          </Button>
          <Button
            onClick={() => navigate('/apply')}
            variant="outline"
            className="border-2 border-blue-500 text-blue-400 hover:bg-blue-500/20 font-bold uppercase tracking-wide py-4 sm:py-6 rounded-sm text-xs sm:text-sm"
          >
            <Users className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
            Apply
          </Button>
        </div>

        {/* Announcements Section */}
        <Card className="glass-card border-slate-700 mb-8">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle className="text-xl sm:text-2xl font-bold uppercase tracking-wide text-amber-500" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
              <Megaphone className="inline-block mr-2 h-5 w-5 sm:h-6 sm:w-6" />
              Announcements
            </CardTitle>
            {canManageAnnouncements && (
              <Button
                onClick={() => setShowAnnouncementForm(!showAnnouncementForm)}
                className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-sm text-sm w-full sm:w-auto"
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
