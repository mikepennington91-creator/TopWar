import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Shield, BarChart3, Plus, Trash2, X, Archive, ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function Polls() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [polls, setPolls] = useState([]);
  const [archivedPolls, setArchivedPolls] = useState([]);
  const [showPollForm, setShowPollForm] = useState(false);
  const [showArchivedPolls, setShowArchivedPolls] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newPoll, setNewPoll] = useState({ 
    question: "", 
    options: ["", ""], 
    show_voters: false 
  });

  useEffect(() => {
    const token = localStorage.getItem('moderator_token');
    const role = localStorage.getItem('moderator_role');
    const username = localStorage.getItem('moderator_username');
    
    if (!token) {
      navigate('/moderator/login');
      return;
    }
    
    setCurrentUser({ role, username, token });
    fetchPolls();
    markAllPollsViewed();
  }, [navigate]);

  const fetchPolls = async () => {
    try {
      const token = localStorage.getItem('moderator_token');
      const response = await axios.get(`${API}/polls`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPolls(response.data);
      // Check for expired polls
      await axios.post(`${API}/polls/check-expired`);
    } catch (error) {
      console.error("Failed to fetch polls:", error);
    }
  };

  const fetchArchivedPolls = async () => {
    try {
      const token = localStorage.getItem('moderator_token');
      const response = await axios.get(`${API}/polls/archived`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setArchivedPolls(response.data);
    } catch (error) {
      console.error("Failed to fetch archived polls:", error);
    }
  };

  const markAllPollsViewed = async () => {
    try {
      const token = localStorage.getItem('moderator_token');
      const response = await axios.get(`${API}/polls`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Mark each poll as viewed
      for (const poll of response.data) {
        await axios.post(`${API}/polls/${poll.id}/mark-viewed`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
    } catch (error) {
      console.error("Failed to mark polls as viewed:", error);
    }
  };

  const handleCreatePoll = async (e) => {
    e.preventDefault();
    const validOptions = newPoll.options.filter(opt => opt.trim() !== "");
    
    if (!newPoll.question.trim()) {
      toast.error("Please enter a poll question");
      return;
    }
    if (validOptions.length < 2) {
      toast.error("Poll must have at least 2 options");
      return;
    }
    if (validOptions.length > 6) {
      toast.error("Poll cannot have more than 6 options");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('moderator_token');
      await axios.post(`${API}/polls`, {
        question: newPoll.question,
        options: validOptions,
        show_voters: newPoll.show_voters
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Poll created successfully!");
      setNewPoll({ question: "", options: ["", ""], show_voters: false });
      setShowPollForm(false);
      fetchPolls();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to create poll");
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (pollId, optionIndex) => {
    try {
      const token = localStorage.getItem('moderator_token');
      await axios.post(`${API}/polls/${pollId}/vote?option_index=${optionIndex}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Vote recorded!");
      fetchPolls();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to vote");
    }
  };

  const handleDeletePoll = async (pollId) => {
    if (!window.confirm("Are you sure you want to delete this poll?")) return;

    try {
      const token = localStorage.getItem('moderator_token');
      await axios.delete(`${API}/polls/${pollId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Poll deleted");
      fetchPolls();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to delete poll");
    }
  };

  const addPollOption = () => {
    if (newPoll.options.length < 6) {
      setNewPoll(prev => ({ ...prev, options: [...prev.options, ""] }));
    }
  };

  const removePollOption = (index) => {
    if (newPoll.options.length > 2) {
      setNewPoll(prev => ({
        ...prev,
        options: prev.options.filter((_, i) => i !== index)
      }));
    }
  };

  const updatePollOption = (index, value) => {
    setNewPoll(prev => ({
      ...prev,
      options: prev.options.map((opt, i) => i === index ? value : opt)
    }));
  };

  const hasUserVoted = (poll) => {
    if (!currentUser) return false;
    return poll.options.some(opt => opt.votes?.includes(currentUser.username));
  };

  const getTotalVotes = (poll) => {
    return poll.options.reduce((sum, opt) => sum + (opt.votes?.length || 0), 0);
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

  const canCreatePolls = ['smod', 'mmod', 'developer', 'admin'].includes(currentUser.role);
  const canDeletePolls = currentUser.role === 'admin';

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
            onClick={() => navigate('/moderator/portal')}
            variant="ghost"
            size="sm"
            className="text-slate-400 hover:text-amber-400 self-end sm:self-auto"
          >
            <ArrowLeft className="h-4 w-4 mr-1 sm:mr-2" />
            <span className="text-sm">Back to Portal</span>
          </Button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto py-4 sm:py-8 px-3 sm:px-6">
        {/* Polls Section */}
        <Card className="glass-card border-slate-700">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle className="text-xl sm:text-2xl font-bold uppercase tracking-wide text-cyan-400 flex items-center gap-2" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
              <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6" />
              Polls
            </CardTitle>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Button
                onClick={() => { setShowArchivedPolls(!showArchivedPolls); fetchArchivedPolls(); }}
                variant="outline"
                className="border-slate-600 text-slate-300 hover:bg-slate-800 rounded-sm text-sm w-full sm:w-auto"
              >
                <Archive className="h-4 w-4 mr-2" />
                {showArchivedPolls ? "Hide Archive" : "View Archive"}
              </Button>
              {canCreatePolls && (
                <Button
                  onClick={() => setShowPollForm(!showPollForm)}
                  className="bg-cyan-500 hover:bg-cyan-600 text-white rounded-sm text-sm w-full sm:w-auto"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Poll
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {/* Create Poll Form */}
            {showPollForm && canCreatePolls && (
              <form onSubmit={handleCreatePoll} className="mb-6 p-4 bg-slate-900/50 rounded border border-slate-700">
                <div className="space-y-4">
                  <div>
                    <Label className="text-slate-300">Poll Question</Label>
                    <Input
                      value={newPoll.question}
                      onChange={(e) => setNewPoll(prev => ({ ...prev, question: e.target.value }))}
                      placeholder="What would you like to ask?"
                      className="bg-slate-900/50 border-slate-700 text-slate-200 rounded-sm"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-slate-300 mb-2 block">Options (2-6)</Label>
                    <div className="space-y-2">
                      {newPoll.options.map((option, index) => (
                        <div key={index} className="flex gap-2 items-center">
                          <div className="w-6 h-6 rounded-full border-2 border-slate-600 flex items-center justify-center text-xs text-slate-400">
                            {index + 1}
                          </div>
                          <Input
                            value={option}
                            onChange={(e) => updatePollOption(index, e.target.value)}
                            placeholder={`Option ${index + 1}`}
                            className="bg-slate-900/50 border-slate-700 text-slate-200 rounded-sm flex-1"
                          />
                          {newPoll.options.length > 2 && (
                            <Button
                              type="button"
                              onClick={() => removePollOption(index)}
                              size="sm"
                              variant="ghost"
                              className="text-red-400 hover:text-red-300 hover:bg-red-500/10 p-1"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                    {newPoll.options.length < 6 && (
                      <Button
                        type="button"
                        onClick={addPollOption}
                        variant="ghost"
                        className="text-cyan-400 hover:text-cyan-300 mt-2 text-sm"
                      >
                        <Plus className="h-4 w-4 mr-1" /> Add Option
                      </Button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="show_voters"
                      checked={newPoll.show_voters}
                      onChange={(e) => setNewPoll(prev => ({ ...prev, show_voters: e.target.checked }))}
                      className="w-4 h-4 rounded border-slate-600 bg-slate-900"
                    />
                    <Label htmlFor="show_voters" className="text-slate-300 cursor-pointer">
                      Show who voted for each option
                    </Label>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button type="submit" disabled={loading} className="bg-cyan-500 hover:bg-cyan-600 text-white rounded-sm">
                      {loading ? "Creating..." : "Create Poll"}
                    </Button>
                    <Button type="button" onClick={() => setShowPollForm(false)} variant="outline" className="border-slate-600 text-slate-300 rounded-sm">
                      Cancel
                    </Button>
                  </div>
                </div>
              </form>
            )}

            {/* Active Polls */}
            {polls.length === 0 ? (
              <p className="text-slate-500 text-center py-8">No active polls</p>
            ) : (
              <div className="space-y-4">
                {polls.map((poll) => {
                  const userVoted = hasUserVoted(poll);
                  const totalVotes = getTotalVotes(poll);
                  const expiresAt = new Date(poll.expires_at);
                  const daysLeft = Math.ceil((expiresAt - new Date()) / (1000 * 60 * 60 * 24));

                  return (
                    <div key={poll.id} className="p-4 bg-slate-900/50 rounded border border-slate-700">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-cyan-400">{poll.question}</h3>
                          <p className="text-xs text-slate-500">
                            Created by {poll.created_by} • {daysLeft > 0 ? `${daysLeft} days left` : 'Expires soon'} • {totalVotes} vote{totalVotes !== 1 ? 's' : ''}
                          </p>
                        </div>
                        {canDeletePolls && (
                          <Button
                            onClick={() => handleDeletePoll(poll.id)}
                            size="sm"
                            className="bg-red-500/20 text-red-400 hover:bg-red-500/30"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>

                      <div className="space-y-2">
                        {poll.options.map((option, index) => {
                          const voteCount = option.votes?.length || 0;
                          const percentage = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
                          const isSelected = option.votes?.includes(currentUser.username);

                          return (
                            <div key={index} className="relative">
                              {userVoted ? (
                                // Show results
                                <div className={`p-3 rounded border ${isSelected ? 'border-cyan-500 bg-cyan-500/10' : 'border-slate-700 bg-slate-800/50'}`}>
                                  <div className="flex justify-between items-center relative z-10">
                                    <span className={`${isSelected ? 'text-cyan-400 font-semibold' : 'text-slate-300'}`}>
                                      {option.text}
                                      {isSelected && <span className="ml-2 text-xs">(Your vote)</span>}
                                    </span>
                                    <span className="text-slate-400 text-sm">{percentage}% ({voteCount})</span>
                                  </div>
                                  <div className="mt-2 h-2 bg-slate-700 rounded overflow-hidden">
                                    <div 
                                      className={`h-full ${isSelected ? 'bg-cyan-500' : 'bg-slate-500'} transition-all duration-500`}
                                      style={{ width: `${percentage}%` }}
                                    />
                                  </div>
                                  {poll.show_voters && option.votes?.length > 0 && (
                                    <p className="text-xs text-slate-500 mt-1">
                                      Voters: {option.votes.join(', ')}
                                    </p>
                                  )}
                                </div>
                              ) : (
                                // Show voting button
                                <button
                                  onClick={() => handleVote(poll.id, index)}
                                  className="w-full p-3 rounded border border-slate-700 bg-slate-800/50 hover:border-cyan-500 hover:bg-cyan-500/10 transition-all text-left text-slate-300 flex items-center gap-3"
                                >
                                  <div className="w-5 h-5 rounded-full border-2 border-slate-500" />
                                  {option.text}
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Archived Polls */}
            {showArchivedPolls && (
              <div className="mt-6">
                <h4 className="text-lg font-semibold text-slate-400 mb-3 flex items-center gap-2">
                  <Archive className="h-5 w-5" />
                  Archived Polls
                </h4>
                {archivedPolls.length === 0 ? (
                  <p className="text-slate-500 text-center py-4">No archived polls</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-700">
                          <th className="text-left py-2 px-3 text-slate-400">Question</th>
                          <th className="text-left py-2 px-3 text-slate-400">Outcome</th>
                          <th className="text-left py-2 px-3 text-slate-400 hidden sm:table-cell">Created By</th>
                          <th className="text-left py-2 px-3 text-slate-400 hidden sm:table-cell">Closed</th>
                        </tr>
                      </thead>
                      <tbody>
                        {archivedPolls.map((poll) => (
                          <tr key={poll.id} className="border-b border-slate-800">
                            <td className="py-2 px-3 text-slate-300">{poll.question}</td>
                            <td className="py-2 px-3 text-cyan-400">{poll.outcome}</td>
                            <td className="py-2 px-3 text-slate-500 hidden sm:table-cell">{poll.created_by}</td>
                            <td className="py-2 px-3 text-slate-500 hidden sm:table-cell">
                              {new Date(poll.closed_at).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
