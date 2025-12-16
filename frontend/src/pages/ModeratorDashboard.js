import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Search, LogOut, CheckCircle, XCircle, Eye } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function ModeratorDashboard() {
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [filteredApplications, setFilteredApplications] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedApp, setSelectedApp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('moderator_token');
    if (!token) {
      navigate('/moderator/login');
      return;
    }
    fetchApplications();
  }, [navigate]);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredApplications(applications);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = applications.filter(app => 
        app.name.toLowerCase().includes(query) ||
        app.discord_handle.toLowerCase().includes(query) ||
        app.ingame_name.toLowerCase().includes(query) ||
        app.server.toLowerCase().includes(query)
      );
      setFilteredApplications(filtered);
    }
  }, [searchQuery, applications]);

  const fetchApplications = async () => {
    try {
      const token = localStorage.getItem('moderator_token');
      const response = await axios.get(`${API}/applications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setApplications(response.data);
      setFilteredApplications(response.data);
    } catch (error) {
      console.error(error);
      if (error.response?.status === 401) {
        toast.error("Session expired. Please login again.");
        localStorage.removeItem('moderator_token');
        navigate('/moderator/login');
      } else {
        toast.error("Failed to fetch applications");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (applicationId, status) => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem('moderator_token');
      await axios.patch(
        `${API}/applications/${applicationId}`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`Application ${status} successfully!`);
      setSelectedApp(null);
      fetchApplications();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.detail || `Failed to ${status} application`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('moderator_token');
    toast.success("Logged out successfully");
    navigate('/');
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "pending":
        return <Badge data-testid={`badge-pending`} variant="outline" className="uppercase border-slate-600 text-slate-400 font-semibold">Pending</Badge>;
      case "approved":
        return <Badge data-testid={`badge-approved`} className="uppercase bg-emerald-500/20 text-emerald-400 border-emerald-500/50 font-semibold">Approved</Badge>;
      case "rejected":
        return <Badge data-testid={`badge-rejected`} className="uppercase bg-red-500/20 text-red-400 border-red-500/50 font-semibold">Rejected</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-200 flex items-center justify-center">
        <p className="text-xl">Loading applications...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 grid-texture">
      {/* Header */}
      <div className="bg-slate-900/50 border-b border-slate-800 sticky top-0 z-10 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl md:text-3xl font-bold uppercase tracking-wider text-amber-500" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
              Moderator Command Center
            </h1>
            <Button
              data-testid="logout-btn"
              onClick={handleLogout}
              variant="outline"
              className="border-red-500 text-red-500 hover:bg-red-500/20 uppercase tracking-wide rounded-sm"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 h-5 w-5" />
            <Input
              data-testid="search-input"
              type="text"
              placeholder="Search by name, Discord, in-game name, or server..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-slate-900/50 border-slate-700 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-slate-200 rounded-sm py-6"
            />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="glass-card p-6 rounded-lg">
            <p className="text-slate-400 text-sm uppercase tracking-wide" style={{ fontFamily: 'Rajdhani, sans-serif' }}>Total Applications</p>
            <p className="text-4xl font-bold text-amber-500 mt-2" style={{ fontFamily: 'Rajdhani, sans-serif' }}>{applications.length}</p>
          </div>
          <div className="glass-card p-6 rounded-lg">
            <p className="text-slate-400 text-sm uppercase tracking-wide" style={{ fontFamily: 'Rajdhani, sans-serif' }}>Pending Review</p>
            <p className="text-4xl font-bold text-slate-200 mt-2" style={{ fontFamily: 'Rajdhani, sans-serif' }}>{applications.filter(a => a.status === 'pending').length}</p>
          </div>
          <div className="glass-card p-6 rounded-lg">
            <p className="text-slate-400 text-sm uppercase tracking-wide" style={{ fontFamily: 'Rajdhani, sans-serif' }}>Approved</p>
            <p className="text-4xl font-bold text-emerald-500 mt-2" style={{ fontFamily: 'Rajdhani, sans-serif' }}>{applications.filter(a => a.status === 'approved').length}</p>
          </div>
        </div>

        {/* Applications Table */}
        <div className="glass-card rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full" data-testid="applications-table">
              <thead className="bg-slate-900/70">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider" style={{ fontFamily: 'Rajdhani, sans-serif' }}>Applicant</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider" style={{ fontFamily: 'Rajdhani, sans-serif' }}>Position</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider" style={{ fontFamily: 'Rajdhani, sans-serif' }}>Server</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider" style={{ fontFamily: 'Rajdhani, sans-serif' }}>Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider" style={{ fontFamily: 'Rajdhani, sans-serif' }}>Submitted</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider" style={{ fontFamily: 'Rajdhani, sans-serif' }}>Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredApplications.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-slate-400">
                      No applications found.
                    </td>
                  </tr>
                ) : (
                  filteredApplications.map((app) => (
                    <tr key={app.id} data-testid={`application-row-${app.id}`} className="hover:bg-slate-900/30 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-semibold text-slate-200">{app.name}</p>
                          <p className="text-sm text-slate-500 mono">{app.discord_handle}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-300">{app.position}</td>
                      <td className="px-6 py-4 text-slate-300 mono">{app.server}</td>
                      <td className="px-6 py-4">{getStatusBadge(app.status)}</td>
                      <td className="px-6 py-4 text-slate-400 text-sm">
                        {new Date(app.submitted_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <Button
                          data-testid={`view-btn-${app.id}`}
                          onClick={() => setSelectedApp(app)}
                          size="sm"
                          className="bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-sm"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Application Detail Dialog */}
      <Dialog open={!!selectedApp} onOpenChange={() => setSelectedApp(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-slate-900 border-slate-700 text-slate-200" data-testid="application-detail-dialog">
          {selectedApp && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold uppercase tracking-wider text-amber-500" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                  Application Details
                </DialogTitle>
                <DialogDescription className="text-slate-400">
                  Review and take action on this application
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-slate-500 text-sm uppercase font-semibold" style={{ fontFamily: 'Rajdhani, sans-serif' }}>Name</p>
                    <p className="text-slate-200" data-testid="detail-name">{selectedApp.name}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-sm uppercase font-semibold" style={{ fontFamily: 'Rajdhani, sans-serif' }}>Position</p>
                    <p className="text-slate-200" data-testid="detail-position">{selectedApp.position}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-sm uppercase font-semibold" style={{ fontFamily: 'Rajdhani, sans-serif' }}>Discord Handle</p>
                    <p className="text-slate-200 mono" data-testid="detail-discord">{selectedApp.discord_handle}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-sm uppercase font-semibold" style={{ fontFamily: 'Rajdhani, sans-serif' }}>In-Game Name</p>
                    <p className="text-slate-200" data-testid="detail-ingame">{selectedApp.ingame_name}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-sm uppercase font-semibold" style={{ fontFamily: 'Rajdhani, sans-serif' }}>Age</p>
                    <p className="text-slate-200">{selectedApp.age}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-sm uppercase font-semibold" style={{ fontFamily: 'Rajdhani, sans-serif' }}>Country</p>
                    <p className="text-slate-200">{selectedApp.country}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-sm uppercase font-semibold" style={{ fontFamily: 'Rajdhani, sans-serif' }}>Server</p>
                    <p className="text-slate-200 mono">{selectedApp.server}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-sm uppercase font-semibold" style={{ fontFamily: 'Rajdhani, sans-serif' }}>Status</p>
                    {getStatusBadge(selectedApp.status)}
                  </div>
                </div>

                <div className="border-t border-slate-700 pt-4">
                  <h3 className="text-lg font-semibold uppercase tracking-wide text-amber-500 mb-4" style={{ fontFamily: 'Rajdhani, sans-serif' }}>Detailed Responses</h3>
                  
                  <div className="space-y-4">
                    {[
                      { label: "Activity Times", value: selectedApp.activity_times },
                      { label: "Native Language", value: selectedApp.native_language },
                      { label: "Other Languages", value: selectedApp.other_languages },
                      { label: "Previous Experience", value: selectedApp.previous_experience },
                      { label: "Basic Qualities of a Mod", value: selectedApp.basic_qualities },
                      { label: "Favourite Event", value: selectedApp.favourite_event },
                      { label: "Free Ways to Gain Gems", value: selectedApp.free_gems },
                      { label: "Heroes That Can Be Mutated", value: selectedApp.heroes_mutated },
                      { label: "Discord Tools Comfort Level", value: selectedApp.discord_tools_comfort },
                      { label: "Guidelines Rating", value: selectedApp.guidelines_rating },
                      { label: "High-Profile Violation Handling", value: selectedApp.high_profile_violation },
                      { label: "Complex Game Mechanic", value: selectedApp.complex_mechanic },
                      { label: "Unknown Question Response", value: selectedApp.unknown_question },
                      { label: "Hero Development Advice", value: selectedApp.hero_development },
                      { label: "Racist R4 Scenario", value: selectedApp.racist_r4 },
                      { label: "Moderator Swearing Scenario", value: selectedApp.moderator_swearing }
                    ].map((item, index) => (
                      <div key={index} className="bg-slate-800/50 p-4 rounded">
                        <p className="text-slate-400 text-sm font-semibold mb-1">{item.label}</p>
                        <p className="text-slate-200">{item.value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {selectedApp.status === 'pending' && (
                  <div className="border-t border-slate-700 pt-4 flex gap-4">
                    <Button
                      data-testid="approve-btn"
                      onClick={() => handleStatusUpdate(selectedApp.id, 'approved')}
                      disabled={actionLoading}
                      className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold uppercase tracking-wide py-3 rounded-sm"
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Approve
                    </Button>
                    <Button
                      data-testid="reject-btn"
                      onClick={() => handleStatusUpdate(selectedApp.id, 'rejected')}
                      disabled={actionLoading}
                      className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold uppercase tracking-wide py-3 rounded-sm"
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Reject
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}