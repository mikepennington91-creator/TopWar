import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Users, Clock, RefreshCw } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Role colors for badges
const getRoleColor = (role) => {
  const colors = {
    'admin': 'bg-red-500/20 text-red-400 border-red-500/30',
    'developer': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    'mmod': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    'smod': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    'lmod': 'bg-green-500/20 text-green-400 border-green-500/30',
    'moderator': 'bg-slate-500/20 text-slate-400 border-slate-500/30'
  };
  return colors[role?.toLowerCase()] || colors['moderator'];
};

// Format role display name
const formatRole = (role) => {
  const roleNames = {
    'admin': 'ADMIN',
    'developer': 'DEV',
    'mmod': 'MMOD',
    'smod': 'SMOD',
    'lmod': 'LMOD',
    'moderator': 'MOD'
  };
  return roleNames[role?.toLowerCase()] || role?.toUpperCase();
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
  if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  
  // For older dates, show the actual date
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Get status color based on last login
const getActivityStatus = (lastLogin, status) => {
  if (status === 'disabled') return { color: 'bg-gray-500', label: 'Disabled' };
  if (!lastLogin) return { color: 'bg-gray-500', label: 'Never logged in' };
  
  const date = new Date(lastLogin);
  const now = new Date();
  const diffDays = Math.floor((now - date) / 86400000);
  
  if (diffDays < 1) return { color: 'bg-green-500', label: 'Active today' };
  if (diffDays < 7) return { color: 'bg-emerald-500', label: 'Active this week' };
  if (diffDays < 30) return { color: 'bg-yellow-500', label: 'Active this month' };
  return { color: 'bg-red-500', label: 'Inactive' };
};

export default function ModeratorActivity() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [moderators, setModerators] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [sortBy, setSortBy] = useState('last_login'); // 'last_login', 'username', 'role'
  const [sortOrder, setSortOrder] = useState('desc');

  useEffect(() => {
    const token = localStorage.getItem('moderator_token');
    const role = localStorage.getItem('moderator_role');
    const username = localStorage.getItem('moderator_username');
    
    if (!token) {
      navigate('/moderator/login');
      return;
    }
    
    setCurrentUser({ role, username });
    fetchModerators();
  }, [navigate]);

  const fetchModerators = async () => {
    setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  // Sort moderators
  const sortedModerators = [...moderators].sort((a, b) => {
    let comparison = 0;
    
    if (sortBy === 'last_login') {
      const aDate = a.last_login ? new Date(a.last_login) : new Date(0);
      const bDate = b.last_login ? new Date(b.last_login) : new Date(0);
      comparison = bDate - aDate;
    } else if (sortBy === 'username') {
      comparison = a.username.localeCompare(b.username);
    } else if (sortBy === 'role') {
      const roleOrder = { 'admin': 5, 'developer': 4, 'mmod': 3, 'smod': 2, 'lmod': 1, 'moderator': 0 };
      comparison = (roleOrder[b.role] || 0) - (roleOrder[a.role] || 0);
    }
    
    return sortOrder === 'asc' ? -comparison : comparison;
  });

  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 px-3 sm:px-4 py-4 sm:py-6 grid-texture">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => navigate('/moderator/portal')}
              variant="ghost"
              size="sm"
              className="text-amber-500 hover:text-amber-400 hover:bg-slate-900"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Portal
            </Button>
          </div>
          <Button
            onClick={fetchModerators}
            variant="outline"
            size="sm"
            className="border-slate-700 text-slate-300 hover:bg-slate-800"
            disabled={loading}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Main Card */}
        <Card className="glass-card border-slate-800">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Users className="h-6 w-6 text-amber-500" />
              <div>
                <CardTitle className="text-xl text-amber-500" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                  Moderator Activity
                </CardTitle>
                <CardDescription className="text-slate-400">
                  View when moderators last logged in
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="h-8 w-8 text-amber-500 animate-spin" />
              </div>
            ) : (
              <>
                {/* Sort Controls */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="text-slate-400 text-sm self-center">Sort by:</span>
                  <Button
                    variant={sortBy === 'last_login' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => toggleSort('last_login')}
                    className={sortBy === 'last_login' ? 'bg-amber-500 hover:bg-amber-600' : 'border-slate-700 text-slate-300 hover:bg-slate-800'}
                  >
                    Last Login {sortBy === 'last_login' && (sortOrder === 'desc' ? '↓' : '↑')}
                  </Button>
                  <Button
                    variant={sortBy === 'username' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => toggleSort('username')}
                    className={sortBy === 'username' ? 'bg-amber-500 hover:bg-amber-600' : 'border-slate-700 text-slate-300 hover:bg-slate-800'}
                  >
                    Username {sortBy === 'username' && (sortOrder === 'desc' ? '↓' : '↑')}
                  </Button>
                  <Button
                    variant={sortBy === 'role' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => toggleSort('role')}
                    className={sortBy === 'role' ? 'bg-amber-500 hover:bg-amber-600' : 'border-slate-700 text-slate-300 hover:bg-slate-800'}
                  >
                    Role {sortBy === 'role' && (sortOrder === 'desc' ? '↓' : '↑')}
                  </Button>
                </div>

                {/* Moderators Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-700">
                        <th className="text-left py-3 px-4 text-slate-400 font-medium">Status</th>
                        <th className="text-left py-3 px-4 text-slate-400 font-medium">Username</th>
                        <th className="text-left py-3 px-4 text-slate-400 font-medium">Role</th>
                        <th className="text-left py-3 px-4 text-slate-400 font-medium">Last Login</th>
                        <th className="text-left py-3 px-4 text-slate-400 font-medium hidden sm:table-cell">Account Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedModerators.map((mod) => {
                        const activityStatus = getActivityStatus(mod.last_login, mod.status);
                        return (
                          <tr key={mod.username} className="border-b border-slate-800 hover:bg-slate-900/50">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <div className={`w-3 h-3 rounded-full ${activityStatus.color}`} title={activityStatus.label}></div>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`font-medium ${mod.username === currentUser?.username ? 'text-amber-400' : 'text-slate-200'}`}>
                                {mod.username}
                                {mod.username === currentUser?.username && (
                                  <span className="text-xs text-slate-500 ml-2">(you)</span>
                                )}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <Badge variant="outline" className={`${getRoleColor(mod.role)} text-xs`}>
                                {formatRole(mod.role)}
                              </Badge>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-slate-500" />
                                <span className={mod.last_login ? 'text-slate-300' : 'text-slate-500 italic'}>
                                  {formatLastLogin(mod.last_login)}
                                </span>
                              </div>
                            </td>
                            <td className="py-3 px-4 hidden sm:table-cell">
                              <Badge 
                                variant="outline" 
                                className={mod.status === 'active' 
                                  ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                                  : 'bg-red-500/20 text-red-400 border-red-500/30'
                                }
                              >
                                {mod.status === 'active' ? 'Active' : 'Disabled'}
                              </Badge>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Summary */}
                <div className="mt-6 pt-4 border-t border-slate-700">
                  <div className="flex flex-wrap gap-4 text-sm text-slate-400">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      <span>Active today</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                      <span>Active this week</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      <span>Active this month</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <span>Inactive (30+ days)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-gray-500"></div>
                      <span>Never / Disabled</span>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-slate-900/50 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-amber-500">{moderators.length}</div>
                    <div className="text-xs text-slate-400">Total Moderators</div>
                  </div>
                  <div className="bg-slate-900/50 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-green-500">
                      {moderators.filter(m => {
                        if (!m.last_login || m.status === 'disabled') return false;
                        const diffDays = Math.floor((new Date() - new Date(m.last_login)) / 86400000);
                        return diffDays < 7;
                      }).length}
                    </div>
                    <div className="text-xs text-slate-400">Active This Week</div>
                  </div>
                  <div className="bg-slate-900/50 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-yellow-500">
                      {moderators.filter(m => !m.last_login && m.status === 'active').length}
                    </div>
                    <div className="text-xs text-slate-400">Never Logged In</div>
                  </div>
                  <div className="bg-slate-900/50 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-red-500">
                      {moderators.filter(m => m.status === 'disabled').length}
                    </div>
                    <div className="text-xs text-slate-400">Disabled</div>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
