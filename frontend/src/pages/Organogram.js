import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Network, Plus, Trash2, Pencil, Upload, Shield, X, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const RANKS = ["CMod", "MMod", "SMod", "LMod", "Mod"];
const RANK_STYLES = {
  CMod: { ring: "ring-rose-500/60", badge: "bg-rose-500/20 text-rose-300 border-rose-500/40", glow: "shadow-rose-500/20" },
  MMod: { ring: "ring-amber-500/60", badge: "bg-amber-500/20 text-amber-300 border-amber-500/40", glow: "shadow-amber-500/20" },
  SMod: { ring: "ring-fuchsia-500/60", badge: "bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/40", glow: "shadow-fuchsia-500/20" },
  LMod: { ring: "ring-violet-500/60", badge: "bg-violet-500/20 text-violet-300 border-violet-500/40", glow: "shadow-violet-500/20" },
  Mod: { ring: "ring-cyan-500/60", badge: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40", glow: "shadow-cyan-500/20" },
};

const emptyForm = {
  username: "",
  rank: "Mod",
  parent_id: "",
  display_name: "",
  profile_picture: "",
};

export default function Organogram() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [canEdit, setCanEdit] = useState(false);
  const [nodes, setNodes] = useState([]);
  const [portalUsers, setPortalUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [showDialog, setShowDialog] = useState(false);
  const [editingNode, setEditingNode] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const containerRef = useRef(null);
  const nodeRefs = useRef({});
  const [lines, setLines] = useState([]);

  // Auth & initial load
  useEffect(() => {
    const token = localStorage.getItem("moderator_token");
    const role = localStorage.getItem("moderator_role");
    const username = localStorage.getItem("moderator_username");
    if (!token) {
      navigate("/moderator/login");
      return;
    }
    setCurrentUser({ token, role, username });
  }, [navigate]);

  const fetchAll = useCallback(async () => {
    const token = localStorage.getItem("moderator_token");
    if (!token) return;
    try {
      const [nodesRes, canEditRes, usersRes] = await Promise.all([
        axios.get(`${API}/organogram/nodes`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/organogram/can-edit`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/organogram/portal-users`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      setNodes(nodesRes.data || []);
      setCanEdit(canEditRes.data?.can_edit || false);
      setPortalUsers(usersRes.data || []);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || "Failed to load organogram");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (currentUser) fetchAll();
  }, [currentUser, fetchAll]);

  // Group nodes by rank
  const tiered = useMemo(() => {
    const grouped = {};
    RANKS.forEach((r) => (grouped[r] = []));
    nodes.forEach((n) => {
      if (grouped[n.rank]) grouped[n.rank].push(n);
    });
    // sort each tier by parent_id then username for stable layout
    RANKS.forEach((r) => {
      grouped[r].sort((a, b) => {
        const pa = a.parent_id || "";
        const pb = b.parent_id || "";
        if (pa !== pb) return pa.localeCompare(pb);
        return a.username.localeCompare(b.username);
      });
    });
    return grouped;
  }, [nodes]);

  // Compute SVG connector lines after layout
  const computeLines = useCallback(() => {
    if (!containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const newLines = [];
    nodes.forEach((node) => {
      if (!node.parent_id) return;
      const childEl = nodeRefs.current[node.id];
      const parentEl = nodeRefs.current[node.parent_id];
      if (!childEl || !parentEl) return;
      const c = childEl.getBoundingClientRect();
      const p = parentEl.getBoundingClientRect();
      const x1 = p.left - containerRect.left + p.width / 2;
      const y1 = p.bottom - containerRect.top;
      const x2 = c.left - containerRect.left + c.width / 2;
      const y2 = c.top - containerRect.top;
      newLines.push({ id: `${node.parent_id}-${node.id}`, x1, y1, x2, y2 });
    });
    setLines(newLines);
  }, [nodes]);

  useEffect(() => {
    // After nodes render, compute lines (next frame)
    const t = setTimeout(computeLines, 50);
    return () => clearTimeout(t);
  }, [tiered, computeLines]);

  useEffect(() => {
    const handler = () => computeLines();
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, [computeLines]);

  // Form handlers
  const openCreateDialog = () => {
    setEditingNode(null);
    setForm(emptyForm);
    setShowDialog(true);
  };

  const openEditDialog = (node) => {
    setEditingNode(node);
    setForm({
      username: node.username,
      rank: node.rank,
      parent_id: node.parent_id || "",
      display_name: node.display_name || "",
      profile_picture: node.profile_picture || "",
    });
    setShowDialog(true);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1.5 * 1024 * 1024) {
      toast.error("Image must be smaller than 1.5 MB");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => setForm((prev) => ({ ...prev, profile_picture: reader.result }));
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username || !form.rank) {
      toast.error("Username and rank are required");
      return;
    }
    setSaving(true);
    const token = localStorage.getItem("moderator_token");
    try {
      if (editingNode) {
        await axios.patch(
          `${API}/organogram/nodes/${editingNode.id}`,
          {
            rank: form.rank,
            parent_id: form.parent_id || "",
            display_name: form.display_name || "",
            profile_picture: form.profile_picture || "",
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success("Node updated");
      } else {
        await axios.post(
          `${API}/organogram/nodes`,
          {
            username: form.username,
            rank: form.rank,
            parent_id: form.parent_id || null,
            display_name: form.display_name || null,
            profile_picture: form.profile_picture || null,
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success("Node added to organogram");
      }
      setShowDialog(false);
      await fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (node) => {
    if (!window.confirm(`Remove ${node.username} from the organogram?`)) return;
    const token = localStorage.getItem("moderator_token");
    try {
      await axios.delete(`${API}/organogram/nodes/${node.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Removed from organogram");
      await fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to delete");
    }
  };

  const validParents = useMemo(() => {
    if (!form.rank) return [];
    const childIdx = RANKS.indexOf(form.rank);
    return nodes.filter((n) => {
      if (editingNode && n.id === editingNode.id) return false;
      return RANKS.indexOf(n.rank) < childIdx;
    });
  }, [nodes, form.rank, editingNode]);

  const availablePortalUsers = useMemo(() => {
    if (editingNode) return portalUsers; // username locked when editing
    return portalUsers.filter((u) => !u.is_assigned);
  }, [portalUsers, editingNode]);

  if (!currentUser) return null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 grid-texture pb-24" data-testid="organogram-page">
      <div className="bg-slate-900/60 border-b border-slate-800 py-3 px-3 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Network className="h-6 w-6 text-amber-500" />
            <h1 className="text-xl sm:text-2xl font-bold uppercase tracking-wider text-amber-500" style={{ fontFamily: "Rajdhani, sans-serif" }}>
              Moderator Organogram
            </h1>
          </div>
          {canEdit && (
            <Button
              onClick={openCreateDialog}
              className="bg-amber-500 hover:bg-amber-600 text-white rounded-sm btn-glow"
              data-testid="organogram-add-node-btn"
            >
              <Plus className="h-4 w-4 mr-2" /> Add Member
            </Button>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6">
        <Card className="glass-card border-slate-700 mb-4">
          <CardHeader>
            <CardTitle className="text-base text-slate-300 flex items-center gap-2">
              <Shield className="h-4 w-4 text-amber-400" />
              Hierarchy: CMod → MMod → SMod → LMod → Mod
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-slate-500">
            {canEdit ? "You can add, edit, and remove organogram members." : "View-only mode. Only Admins or organogram CMods can edit."}
          </CardContent>
        </Card>

        {loading ? (
          <div className="text-center py-16 text-slate-500" data-testid="organogram-loading">Loading organogram…</div>
        ) : nodes.length === 0 ? (
          <div className="text-center py-16 glass-card rounded-md border border-slate-700" data-testid="organogram-empty-state">
            <UserPlus className="h-12 w-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No moderators in the organogram yet.</p>
            {canEdit && (
              <Button onClick={openCreateDialog} className="mt-4 bg-amber-500 hover:bg-amber-600 text-white rounded-sm">
                <Plus className="h-4 w-4 mr-2" /> Add First Member
              </Button>
            )}
          </div>
        ) : (
          <div ref={containerRef} className="relative" data-testid="organogram-chart">
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              style={{ overflow: "visible" }}
              data-testid="organogram-connectors"
            >
              {lines.map((line) => (
                <path
                  key={line.id}
                  d={`M ${line.x1} ${line.y1} C ${line.x1} ${(line.y1 + line.y2) / 2}, ${line.x2} ${(line.y1 + line.y2) / 2}, ${line.x2} ${line.y2}`}
                  stroke="rgba(245, 158, 11, 0.4)"
                  strokeWidth="2"
                  fill="none"
                />
              ))}
            </svg>

            <div className="relative space-y-12">
              {RANKS.map((rank) => {
                const tierNodes = tiered[rank];
                if (tierNodes.length === 0) return null;
                return (
                  <div key={rank} className="relative" data-testid={`organogram-tier-${rank}`}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="h-px flex-1 bg-gradient-to-r from-transparent to-slate-700" />
                      <Badge className={`${RANK_STYLES[rank].badge} uppercase tracking-widest text-xs px-3 py-1`}>
                        {rank}
                      </Badge>
                      <div className="h-px flex-1 bg-gradient-to-l from-transparent to-slate-700" />
                    </div>
                    <div className="flex flex-wrap justify-center gap-4">
                      {tierNodes.map((node) => {
                        const styles = RANK_STYLES[rank];
                        return (
                          <div
                            key={node.id}
                            ref={(el) => (nodeRefs.current[node.id] = el)}
                            className={`group relative w-44 sm:w-52 bg-slate-900/80 backdrop-blur border border-slate-700 rounded-md p-4 hover:border-amber-500/50 transition-all shadow-lg ${styles.glow}`}
                            data-testid={`organogram-node-${node.username}`}
                          >
                            <div className={`mx-auto mb-3 w-20 h-20 rounded-full overflow-hidden ring-2 ${styles.ring} bg-slate-800 flex items-center justify-center`}>
                              {node.profile_picture ? (
                                <img
                                  src={node.profile_picture}
                                  alt={node.username}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span className="text-2xl font-bold text-slate-400" style={{ fontFamily: "Rajdhani, sans-serif" }}>
                                  {(node.display_name || node.username).slice(0, 2).toUpperCase()}
                                </span>
                              )}
                            </div>
                            <div className="text-center">
                              <p className="text-sm font-bold text-slate-100 truncate" title={node.display_name || node.username}>
                                {node.display_name || node.username}
                              </p>
                              {node.display_name && (
                                <p className="text-xs text-slate-500 truncate">@{node.username}</p>
                              )}
                              <Badge className={`${styles.badge} mt-2 text-[10px] uppercase`}>{node.rank}</Badge>
                            </div>
                            {canEdit && (
                              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => openEditDialog(node)}
                                  className="h-6 w-6 p-0 text-slate-400 hover:text-amber-400"
                                  data-testid={`organogram-edit-${node.username}`}
                                >
                                  <Pencil className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDelete(node)}
                                  className="h-6 w-6 p-0 text-slate-400 hover:text-red-400"
                                  data-testid={`organogram-delete-${node.username}`}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-slate-900 border-slate-700 text-slate-200 sm:max-w-lg" data-testid="organogram-dialog">
          <DialogHeader>
            <DialogTitle className="text-amber-400">
              {editingNode ? "Edit Member" : "Add Member to Organogram"}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              {editingNode
                ? "Update rank, parent, display name or profile picture."
                : "Pick a portal user, assign their rank, and optionally set a parent."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="text-slate-300">Portal User</Label>
              <Select
                value={form.username}
                onValueChange={(v) => setForm((prev) => ({ ...prev, username: v }))}
                disabled={!!editingNode}
              >
                <SelectTrigger className="bg-slate-950/60 border-slate-700 text-slate-200 rounded-sm" data-testid="organogram-username-select">
                  <SelectValue placeholder="Select a portal user…" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700 text-slate-200">
                  {availablePortalUsers.length === 0 && (
                    <div className="px-3 py-2 text-xs text-slate-500">No available users.</div>
                  )}
                  {availablePortalUsers.map((u) => (
                    <SelectItem key={u.username} value={u.username}>
                      {u.username} <span className="text-slate-500 text-xs ml-2">({u.role})</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-slate-300">Rank</Label>
              <Select value={form.rank} onValueChange={(v) => setForm((prev) => ({ ...prev, rank: v, parent_id: "" }))}>
                <SelectTrigger className="bg-slate-950/60 border-slate-700 text-slate-200 rounded-sm" data-testid="organogram-rank-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700 text-slate-200">
                  {RANKS.map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-slate-300">Parent (Reports To)</Label>
              <Select
                value={form.parent_id || "none"}
                onValueChange={(v) => setForm((prev) => ({ ...prev, parent_id: v === "none" ? "" : v }))}
                disabled={form.rank === "CMod"}
              >
                <SelectTrigger className="bg-slate-950/60 border-slate-700 text-slate-200 rounded-sm" data-testid="organogram-parent-select">
                  <SelectValue placeholder={form.rank === "CMod" ? "CMod has no parent" : "No parent"} />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700 text-slate-200">
                  <SelectItem value="none">— No parent —</SelectItem>
                  {validParents.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {(p.display_name || p.username)} <span className="text-slate-500 text-xs ml-2">({p.rank})</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-slate-300">Display Name (Optional)</Label>
              <Input
                value={form.display_name}
                onChange={(e) => setForm((prev) => ({ ...prev, display_name: e.target.value }))}
                placeholder="e.g. Alex (Senior Mod)"
                className="bg-slate-950/60 border-slate-700 text-slate-200 rounded-sm"
                data-testid="organogram-display-name-input"
              />
            </div>

            <div>
              <Label className="text-slate-300">Profile Picture</Label>
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-full overflow-hidden bg-slate-800 ring-2 ring-slate-700 flex items-center justify-center shrink-0">
                  {form.profile_picture ? (
                    <img src={form.profile_picture} alt="preview" className="w-full h-full object-cover" />
                  ) : (
                    <UserPlus className="h-6 w-6 text-slate-500" />
                  )}
                </div>
                <div className="flex-1 flex gap-2">
                  <label className="flex-1 cursor-pointer">
                    <div className="flex items-center justify-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-sm text-sm text-slate-300 transition-colors">
                      <Upload className="h-4 w-4" /> Upload
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                      data-testid="organogram-image-upload"
                    />
                  </label>
                  {form.profile_picture && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setForm((prev) => ({ ...prev, profile_picture: "" }))}
                      className="border-slate-700 text-slate-400 hover:bg-slate-800 rounded-sm"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-1">Max 1.5 MB. Stored as base64.</p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowDialog(false)}
                className="border-slate-700 text-slate-300 hover:bg-slate-800 rounded-sm"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="bg-amber-500 hover:bg-amber-600 text-white rounded-sm btn-glow"
                data-testid="organogram-submit-btn"
              >
                {saving ? "Saving…" : editingNode ? "Save Changes" : "Add to Organogram"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
