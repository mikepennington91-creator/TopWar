import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toPng } from "html-to-image";
import { Network, Plus, Trash2, Pencil, Upload, Shield, X, UserPlus, Gamepad2, MessageCircle, Download, Send, Settings as SettingsIcon, GraduationCap, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import ImageCropDialog from "@/components/ImageCropDialog";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const RANKS = ["CMod", "MMod", "SMod", "LMod", "Mod"];
const RANK_STYLES = {
  CMod: { ring: "ring-emerald-500/60", badge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40", glow: "shadow-emerald-500/20" },
  MMod: { ring: "ring-red-500/60", badge: "bg-red-500/20 text-red-300 border-red-500/40", glow: "shadow-red-500/20" },
  SMod: { ring: "ring-pink-500/60", badge: "bg-pink-500/20 text-pink-300 border-pink-500/40", glow: "shadow-pink-500/20" },
  LMod: { ring: "ring-purple-500/60", badge: "bg-purple-500/20 text-purple-300 border-purple-500/40", glow: "shadow-purple-500/20" },
  Mod: { ring: "ring-blue-500/60", badge: "bg-blue-500/20 text-blue-300 border-blue-500/40", glow: "shadow-blue-500/20" },
};

const CHART_OPTIONS = [
  { value: "in_game", label: "In-Game", icon: Gamepad2, badge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40", color: "emerald" },
  { value: "discord", label: "Discord", icon: MessageCircle, badge: "bg-indigo-500/20 text-indigo-300 border-indigo-500/40", color: "indigo" },
  { value: "training", label: "Training", icon: GraduationCap, badge: "bg-orange-500/20 text-orange-300 border-orange-500/40", color: "orange" },
];

const CHART_MAP = CHART_OPTIONS.reduce((acc, c) => { acc[c.value] = c; return acc; }, {});

// Layout constants for the tree-style chart
const NODE_W_MOBILE = 144;
const NODE_W_DESKTOP = 224;
const H_GAP = 28;             // horizontal slot padding
const TIER_HEIGHT = 232;      // approximate card height
const TIER_GAP = 88;          // vertical space for connectors between tiers
const TIER_HEADER_H = 36;     // space at the top of each tier for the rank badge
const CHART_PADDING = 24;     // inner padding around the canvas

// Distinct line colors so 15 reporting lines are easy to follow.
const PARENT_LINE_COLORS = [
  "#f59e0b", "#10b981", "#3b82f6", "#ec4899",
  "#8b5cf6", "#ef4444", "#14b8a6", "#f97316",
  "#84cc16", "#06b6d4", "#a855f7", "#d946ef",
  "#22d3ee", "#fb7185", "#facc15", "#4ade80",
];

function colorForId(id) {
  if (!id) return "#94a3b8";
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash + id.charCodeAt(i)) | 0;
  }
  return PARENT_LINE_COLORS[Math.abs(hash) % PARENT_LINE_COLORS.length];
}

// Color is determined by the *set* of parents, not individual parent ids.
// → mods with identical reporting lines share a colour; only a new
//   reporting combination produces a new colour.
function colorForParentSet(parentIds) {
  if (!parentIds || parentIds.length === 0) return "#94a3b8";
  return colorForId([...parentIds].sort().join("|"));
}

// Wrap leaf groups (e.g. lots of Mods reporting to one SMod) into a grid.
const WRAP_THRESHOLD = 4;     // more children than this and we wrap into rows
const SUBROW_GAP = 36;        // vertical gap between sub-rows inside the same tier

const emptyForm = {
  username: "",
  chart: "in_game",
  rank: "Mod",
  parent_ids: [],
  display_name: "",
  profile_picture: "",
  bio: "",
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
  const chartRef = useRef(null);
  const scrollRef = useRef(null);
  const nodeRefs = useRef({});
  const [lines, setLines] = useState([]);
  const [dragNodeId, setDragNodeId] = useState(null);
  const [dragOverNodeId, setDragOverNodeId] = useState(null);
  const [dragOverRoot, setDragOverRoot] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [activeChart, setActiveChart] = useState("in_game"); // 'in_game' | 'discord' | 'training'

  // Mobile detection drives card sizing.
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < 640 : false
  );
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  const NODE_W = isMobile ? NODE_W_MOBILE : NODE_W_DESKTOP;
  const SLOT_W = NODE_W + H_GAP;
  const TIER_FULL = TIER_HEIGHT + TIER_GAP;

  // Zoom & pinch
  const [zoom, setZoom] = useState(1);
  const pinchRef = useRef({ initialDist: 0, initialZoom: 1, pinching: false });
  const autoFitDoneRef = useRef(false);
  const zoomIn = () => setZoom((z) => Math.min(2, +(z + 0.1).toFixed(2)));
  const zoomOut = () => setZoom((z) => Math.max(0.4, +(z - 0.1).toFixed(2)));
  const zoomReset = () => setZoom(1);

  // Discord webhook
  const [webhookConfigured, setWebhookConfigured] = useState(false);
  const [showWebhookDialog, setShowWebhookDialog] = useState(false);
  const [webhookConfig, setWebhookConfig] = useState({ masked_url: null, updated_by: null, updated_at: null });
  const [webhookInput, setWebhookInput] = useState("");
  const [webhookSaving, setWebhookSaving] = useState(false);
  const [shareDialog, setShareDialog] = useState(false);
  const [shareMessage, setShareMessage] = useState("");
  const [sharing, setSharing] = useState(false);
  const [cropSource, setCropSource] = useState(null);
  const isAdmin = currentUser?.role === "admin" || localStorage.getItem("moderator_is_admin") === "true";

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
      // Webhook status (editor-only). Ignore failure if not editor.
      if (canEditRes.data?.can_edit) {
        try {
          const statusRes = await axios.get(`${API}/organogram/webhook/status`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setWebhookConfigured(!!statusRes.data?.configured);
        } catch {
          setWebhookConfigured(false);
        }
      }
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

  // Filter by active chart
  const visibleNodes = useMemo(() => {
    return nodes.filter((n) => n.chart === activeChart);
  }, [nodes, activeChart]);

  // Tree layout: children sit directly under their (primary) parent. When a
  // single parent has many leaf children (e.g. 7 Mods under one SMod) we pack
  // them into a grid so they span multiple sub-rows instead of one long line.
  const layout = useMemo(() => {
    const idSet = new Set(visibleNodes.map((n) => n.id));
    const childrenByParent = {};
    const roots = [];
    visibleNodes.forEach((n) => {
      const parents = (Array.isArray(n.parent_ids) ? n.parent_ids : []).filter((p) => idSet.has(p));
      const primary = parents[0];
      if (primary) {
        (childrenByParent[primary] = childrenByParent[primary] || []).push(n);
      } else {
        roots.push(n);
      }
    });
    const sortKey = (n) => (n.display_name || n.username).toLowerCase();
    Object.values(childrenByParent).forEach((arr) => arr.sort((a, b) => sortKey(a).localeCompare(sortKey(b))));
    roots.sort((a, b) =>
      (RANKS.indexOf(a.rank) - RANKS.indexOf(b.rank)) || sortKey(a).localeCompare(sortKey(b))
    );

    const positions = {}; // id -> { col, row, groupCols }
    let cursor = 0;

    const visit = (node) => {
      const kids = childrenByParent[node.id] || [];
      if (kids.length === 0) {
        const col = cursor;
        cursor += 1;
        positions[node.id] = { col, row: 0, groupCols: 1 };
        return col;
      }
      const allLeaves = kids.every((k) => !(childrenByParent[k.id] || []).length);
      if (allLeaves && kids.length > WRAP_THRESHOLD) {
        // Pack leaves into a grid that's wider than tall.
        const cols = Math.max(2, Math.ceil(Math.sqrt(kids.length * 1.6)));
        const startCol = cursor;
        kids.forEach((k, i) => {
          const r = Math.floor(i / cols);
          const c = i % cols;
          positions[k.id] = { col: startCol + c, row: r, groupCols: cols, groupStartCol: startCol };
        });
        cursor += cols;
        const slot = startCol + (cols - 1) / 2;
        positions[node.id] = { col: slot, row: 0, groupCols: cols, groupStartCol: startCol };
        return slot;
      }
      const childCols = kids.map(visit);
      const slot = (Math.min(...childCols) + Math.max(...childCols)) / 2;
      positions[node.id] = { col: slot, row: 0, groupCols: kids.length, groupStartCol: slot };
      return slot;
    };
    roots.forEach((r, i) => {
      visit(r);
      if (i < roots.length - 1) cursor += 0.6;
    });

    // Per-rank max sub-row → variable tier height.
    const tierMaxRow = {};
    RANKS.forEach((r) => (tierMaxRow[r] = 0));
    visibleNodes.forEach((n) => {
      const sub = positions[n.id]?.row || 0;
      if (sub > tierMaxRow[n.rank]) tierMaxRow[n.rank] = sub;
    });

    const tierIndex = {};
    const tierY = {};
    let yCursor = CHART_PADDING;
    let ti = 0;
    RANKS.forEach((r) => {
      if (!visibleNodes.some((n) => n.rank === r)) return;
      tierIndex[r] = ti;
      tierY[r] = yCursor;
      const rowsInTier = (tierMaxRow[r] || 0) + 1;
      const tierH = TIER_HEADER_H + rowsInTier * TIER_HEIGHT + (rowsInTier - 1) * SUBROW_GAP;
      yCursor += tierH + TIER_GAP;
      ti += 1;
    });

    return {
      positions,
      tierIndex,
      tierY,
      tierMaxRow,
      childrenByParent,
      totalSlots: Math.max(cursor, 1),
      tiersUsed: ti,
      canvasH: yCursor + CHART_PADDING - TIER_GAP,
    };
  }, [visibleNodes]);

  const canvasW = Math.max(layout.totalSlots * SLOT_W + CHART_PADDING * 2, 320);
  const canvasH = Math.max(layout.canvasH, 240);

  // Auto-fit on mobile once when chart becomes visible.
  useEffect(() => {
    if (autoFitDoneRef.current) return;
    if (!isMobile || !scrollRef.current || layout.totalSlots <= 1) return;
    const viewportW = scrollRef.current.clientWidth;
    if (viewportW > 0 && canvasW > viewportW) {
      const fit = Math.max(0.5, +(viewportW / canvasW).toFixed(2));
      setZoom(fit);
      autoFitDoneRef.current = true;
    }
  }, [isMobile, canvasW, layout.totalSlots]);

  // Helper: card geometry (centerX, top, bottom) for a node id.
  const nodeGeom = useCallback(
    (nodeId) => {
      const node = visibleNodes.find((n) => n.id === nodeId);
      if (!node) return null;
      const pos = layout.positions[nodeId];
      const tierTop = layout.tierY[node.rank];
      if (!pos || tierTop === undefined) return null;
      const left = CHART_PADDING + pos.col * SLOT_W + H_GAP / 2;
      const top = tierTop + TIER_HEADER_H + pos.row * (TIER_HEIGHT + SUBROW_GAP);
      const centerX = left + NODE_W / 2;
      const bottom = top + TIER_HEIGHT;
      return { left, top, centerX, bottom, row: pos.row };
    },
    [visibleNodes, layout, NODE_W, SLOT_W]
  );

  // Connector paths — one path per parent→child edge. Lines are coloured by
  // the child's *parent set* (so siblings with identical reporting share a
  // colour). For wrapped multi-row groups we route the line via a side rail
  // so it never crosses through a row 0 card.
  const computeLines = useCallback(() => {
    const newLines = [];
    visibleNodes.forEach((node) => {
      const parents = (Array.isArray(node.parent_ids) ? node.parent_ids : []).filter(
        (p) => layout.positions[p] !== undefined
      );
      if (parents.length === 0) return;
      const childGeom = nodeGeom(node.id);
      if (!childGeom) return;
      const color = colorForParentSet(parents);
      parents.forEach((parentId) => {
        const parentGeom = nodeGeom(parentId);
        if (!parentGeom) return;
        const childPos = layout.positions[node.id];
        const childRow = childPos?.row || 0;
        const x1 = parentGeom.centerX;
        const y1 = parentGeom.bottom;
        const x2 = childGeom.centerX;
        const y2 = childGeom.top;

        // manifoldY[0]: in the gap between parent tier and row 0 of child tier
        // (always safe — no cards there).
        const childRow0Top = y2 - childRow * (TIER_HEIGHT + SUBROW_GAP);
        const manifoldY0 = y1 + (childRow0Top - y1) / 2;

        let d;
        if (childRow === 0) {
          d = `M ${x1} ${y1} V ${manifoldY0} H ${x2} V ${y2}`;
        } else {
          // Route via a side rail to the LEFT of the wrapped block.
          const groupStartCol = childPos.groupStartCol ?? childPos.col;
          const railX = CHART_PADDING + groupStartCol * SLOT_W - SUBROW_GAP / 2;
          // manifoldY for THIS row: in the gap between row-1 bottom and row top.
          const prevRowBottom = y2 - SUBROW_GAP;
          const manifoldY = prevRowBottom + SUBROW_GAP / 2;
          d = `M ${x1} ${y1} V ${manifoldY0} H ${railX} V ${manifoldY} H ${x2} V ${y2}`;
        }

        newLines.push({
          id: `${parentId}-${node.id}`,
          d,
          x1, y1, x2, y2,
          color,
        });
      });
    });
    setLines(newLines);
  }, [visibleNodes, layout, nodeGeom, SLOT_W]);

  useEffect(() => {
    computeLines();
  }, [computeLines]);

  // Form handlers
  const openCreateDialog = () => {
    setEditingNode(null);
    setForm({ ...emptyForm, chart: activeChart });
    setShowDialog(true);
  };

  const openEditDialog = (node) => {
    setEditingNode(node);
    const parents = Array.isArray(node.parent_ids)
      ? node.parent_ids
      : (node.parent_id ? [node.parent_id] : []);
    setForm({
      username: node.username,
      chart: node.chart || "in_game",
      rank: node.rank,
      parent_ids: parents,
      display_name: node.display_name || "",
      profile_picture: node.profile_picture || "",
      bio: node.bio || "",
    });
    setShowDialog(true);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      toast.error("Image must be smaller than 8 MB");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => setCropSource(reader.result);
    reader.readAsDataURL(file);
    // Reset the input so re-selecting the same file still triggers onChange
    e.target.value = "";
  };

  const handleCropConfirm = (croppedDataUrl) => {
    setForm((prev) => ({ ...prev, profile_picture: croppedDataUrl }));
    setCropSource(null);
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
            chart: form.chart,
            rank: form.rank,
            parent_ids: form.parent_ids,
            display_name: form.display_name || "",
            profile_picture: form.profile_picture || "",
            bio: form.bio || "",
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success("Node updated");
      } else {
        await axios.post(
          `${API}/organogram/nodes`,
          {
            username: form.username,
            chart: form.chart,
            rank: form.rank,
            parent_ids: form.parent_ids,
            display_name: form.display_name || null,
            profile_picture: form.profile_picture || null,
            bio: form.bio || null,
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
      if (n.chart !== form.chart) return false;
      return RANKS.indexOf(n.rank) < childIdx;
    });
  }, [nodes, form.rank, form.chart, editingNode]);

  const availablePortalUsers = useMemo(() => {
    if (editingNode) return portalUsers; // username locked when editing
    // Hide users already in THIS chart only
    const inChart = new Set(nodes.filter((n) => n.chart === form.chart).map((n) => n.username));
    return portalUsers.filter((u) => !inChart.has(u.username));
  }, [portalUsers, editingNode, nodes, form.chart]);

  // ===== Drag & Drop =====
  const nodesById = useMemo(() => {
    const map = {};
    nodes.forEach((n) => (map[n.id] = n));
    return map;
  }, [nodes]);

  const getParentIds = (n) =>
    Array.isArray(n?.parent_ids) ? n.parent_ids : (n?.parent_id ? [n.parent_id] : []);

  const isDescendant = useCallback(
    (ancestorId, candidateId) => {
      const visited = new Set();
      const stack = [candidateId];
      while (stack.length) {
        const cur = stack.pop();
        if (!cur || visited.has(cur)) continue;
        visited.add(cur);
        const node = nodesById[cur];
        if (!node) continue;
        const parents = getParentIds(node);
        for (const p of parents) {
          if (p === ancestorId) return true;
          if (!visited.has(p)) stack.push(p);
        }
      }
      return false;
    },
    [nodesById]
  );

  const handleDragStart = (e, node) => {
    if (!canEdit) return;
    setDragNodeId(node.id);
    e.dataTransfer.effectAllowed = "move";
    try {
      e.dataTransfer.setData("text/plain", node.id);
    } catch {
      /* some browsers throw on certain drag types */
    }
  };

  const handleDragEnd = () => {
    setDragNodeId(null);
    setDragOverNodeId(null);
    setDragOverRoot(false);
  };

  const isValidDropTarget = (targetNode) => {
    if (!dragNodeId) return false;
    const dragNode = nodesById[dragNodeId];
    if (!dragNode) return false;
    if (targetNode.id === dragNode.id) return false;
    // target must be in the same chart (organogram)
    if (targetNode.chart !== dragNode.chart) return false;
    // target rank must be strictly higher (lower index) than drag rank
    if (RANKS.indexOf(targetNode.rank) >= RANKS.indexOf(dragNode.rank)) return false;
    // target cannot be a descendant of drag node (cycle)
    if (isDescendant(dragNode.id, targetNode.id)) return false;
    return true;
  };

  const handleDragOverNode = (e, targetNode) => {
    if (!canEdit || !dragNodeId) return;
    if (!isValidDropTarget(targetNode)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverNodeId(targetNode.id);
  };

  const handleDragLeaveNode = (targetNode) => {
    if (dragOverNodeId === targetNode.id) setDragOverNodeId(null);
  };

  const persistParents = async (nodeId, newParentIds) => {
    const token = localStorage.getItem("moderator_token");
    try {
      await axios.patch(
        `${API}/organogram/nodes/${nodeId}`,
        { parent_ids: newParentIds },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Reporting line updated");
      await fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to update parent");
    }
  };

  const handleDropOnNode = (e, targetNode) => {
    if (!canEdit || !dragNodeId) return;
    e.preventDefault();
    const draggedId = dragNodeId;
    handleDragEnd();
    if (!isValidDropTarget(targetNode)) return;
    const dragNode = nodesById[draggedId];
    const currentParents = getParentIds(dragNode);
    // Hold Ctrl/Cmd to ADD a parent; otherwise REPLACE with single parent.
    const additive = e.ctrlKey || e.metaKey || e.shiftKey;
    let newParents;
    if (additive) {
      if (currentParents.includes(targetNode.id)) return; // already a parent
      newParents = [...currentParents, targetNode.id];
    } else {
      if (currentParents.length === 1 && currentParents[0] === targetNode.id) return; // unchanged
      newParents = [targetNode.id];
    }
    persistParents(dragNode.id, newParents);
  };

  const handleDragOverRoot = (e) => {
    if (!canEdit || !dragNodeId) return;
    const dragNode = nodesById[dragNodeId];
    if (!dragNode) return;
    if (getParentIds(dragNode).length === 0) return; // already root
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverRoot(true);
  };

  const handleDropOnRoot = (e) => {
    if (!canEdit || !dragNodeId) return;
    e.preventDefault();
    const id = dragNodeId;
    handleDragEnd();
    const dragNode = nodesById[id];
    if (!dragNode || getParentIds(dragNode).length === 0) return;
    persistParents(id, []);
  };

  // ===== Export PNG =====
  const buildChartPng = async () => {
    if (!chartRef.current) return null;
    return await toPng(chartRef.current, {
      cacheBust: true,
      backgroundColor: "#020617",
      pixelRatio: 2,
      width: canvasW,
      height: canvasH,
      style: {
        transform: "none",
        transformOrigin: "top left",
        width: `${canvasW}px`,
        height: `${canvasH}px`,
      },
    });
  };

  const captureWithoutZoom = async (fn) => {
    const prev = zoom;
    setZoom(1);
    // Wait two frames for layout to settle
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    try {
      return await fn();
    } finally {
      setZoom(prev);
    }
  };

  const handleExportPng = async () => {
    if (!chartRef.current) return;
    setExporting(true);
    try {
      const dataUrl = await captureWithoutZoom(() => buildChartPng());
      const link = document.createElement("a");
      link.download = `organogram-${new Date().toISOString().slice(0, 10)}.png`;
      link.href = dataUrl;
      link.click();
      toast.success("Organogram exported");
    } catch (err) {
      console.error(err);
      toast.error("Failed to export image");
    } finally {
      setExporting(false);
    }
  };

  // ===== Discord Webhook =====
  const openWebhookDialog = async () => {
    const token = localStorage.getItem("moderator_token");
    try {
      const res = await axios.get(`${API}/organogram/webhook`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setWebhookConfig(res.data);
      setWebhookInput("");
      setShowWebhookDialog(true);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to load webhook config");
    }
  };

  const handleSaveWebhook = async (e) => {
    e.preventDefault();
    setWebhookSaving(true);
    const token = localStorage.getItem("moderator_token");
    try {
      await axios.put(
        `${API}/organogram/webhook`,
        { webhook_url: webhookInput.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Webhook saved");
      setShowWebhookDialog(false);
      setWebhookConfigured(true);
      setWebhookInput("");
      // Refresh masked config
      const res = await axios.get(`${API}/organogram/webhook`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setWebhookConfig(res.data);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to save webhook");
    } finally {
      setWebhookSaving(false);
    }
  };

  const handleRemoveWebhook = async () => {
    if (!window.confirm("Remove the configured Discord webhook?")) return;
    const token = localStorage.getItem("moderator_token");
    try {
      await axios.delete(`${API}/organogram/webhook`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Webhook removed");
      setWebhookConfigured(false);
      setWebhookConfig({ masked_url: null, updated_by: null, updated_at: null });
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to remove webhook");
    }
  };

  const openShareDialog = () => {
    if (!webhookConfigured) {
      toast.error("Discord webhook is not configured. Ask an admin to set it up.");
      return;
    }
    setShareMessage("");
    setShareDialog(true);
  };

  const handleShareToDiscord = async () => {
    setSharing(true);
    const token = localStorage.getItem("moderator_token");
    try {
      const dataUrl = await captureWithoutZoom(() => buildChartPng());
      if (!dataUrl) throw new Error("Could not capture chart");
      await axios.post(
        `${API}/organogram/share`,
        { image_data_url: dataUrl, message: shareMessage || null },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Posted to Discord");
      setShareDialog(false);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || "Failed to share");
    } finally {
      setSharing(false);
    }
  };

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
            <div className="flex flex-wrap items-center gap-2">
              <Button
                onClick={openShareDialog}
                disabled={nodes.length === 0}
                variant="outline"
                className="border-indigo-500/60 text-indigo-300 hover:bg-indigo-500/10 rounded-sm"
                data-testid="organogram-share-btn"
                title={webhookConfigured ? "Post to Discord" : "Webhook not configured"}
              >
                <Send className="h-4 w-4 mr-2" />
                Share to Discord
              </Button>
              {isAdmin && (
                <Button
                  onClick={openWebhookDialog}
                  variant="outline"
                  size="sm"
                  className="border-slate-700 text-slate-400 hover:bg-slate-800 rounded-sm"
                  title="Configure Discord webhook"
                  data-testid="organogram-webhook-config-btn"
                >
                  <SettingsIcon className="h-4 w-4" />
                </Button>
              )}
              <Button
                onClick={handleExportPng}
                disabled={exporting || nodes.length === 0}
                variant="outline"
                className="border-slate-600 text-slate-300 hover:bg-slate-800 rounded-sm"
                data-testid="organogram-export-btn"
              >
                <Download className="h-4 w-4 mr-2" />
                {exporting ? "Exporting…" : "Export PNG"}
              </Button>
              <Button
                onClick={openCreateDialog}
                className="bg-amber-500 hover:bg-amber-600 text-white rounded-sm btn-glow"
                data-testid="organogram-add-node-btn"
              >
                <Plus className="h-4 w-4 mr-2" /> Add Member
              </Button>
            </div>
          )}
          {!canEdit && nodes.length > 0 && (
            <Button
              onClick={handleExportPng}
              disabled={exporting}
              variant="outline"
              className="border-slate-600 text-slate-300 hover:bg-slate-800 rounded-sm"
              data-testid="organogram-export-btn-readonly"
            >
              <Download className="h-4 w-4 mr-2" />
              {exporting ? "Exporting…" : "Export PNG"}
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
          <CardContent className="text-xs text-slate-500 space-y-3">
            <p>
              {canEdit
                ? "You can add, edit, and remove organogram members. Drag a card onto a higher-rank card to re-parent it. Pinch to zoom on mobile, or use the zoom controls below."
                : "View-only mode. Only Admins or organogram CMods can edit. Pinch to zoom on mobile, or use the zoom controls below."}
            </p>
            <div className="flex flex-wrap gap-2" data-testid="organogram-chart-selector">
              {CHART_OPTIONS.map((c) => ({ key: c.value, label: c.label, className: c.badge })).map((opt) => {
                const active = activeChart === opt.key;
                const count = nodes.filter((n) => n.chart === opt.key).length;
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setActiveChart(opt.key)}
                    className={`px-3 py-1.5 rounded-sm border text-xs uppercase tracking-wider transition-all ${
                      active ? `${opt.className} ring-2 ring-offset-2 ring-offset-slate-900 ring-current` : "bg-slate-900/50 text-slate-400 border-slate-700 hover:border-slate-500"
                    }`}
                    data-testid={`organogram-chart-${opt.key}`}
                  >
                    {opt.label} <span className="opacity-70 ml-1">({count})</span>
                  </button>
                );
              })}
            </div>
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
        ) : visibleNodes.length === 0 ? (
          <div className="text-center py-16 glass-card rounded-md border border-slate-700" data-testid="organogram-filter-empty-state">
            <UserPlus className="h-12 w-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">
              No moderators in the {CHART_MAP[activeChart]?.label} organogram yet.
            </p>
            {canEdit && (
              <Button onClick={openCreateDialog} className="mt-4 bg-amber-500 hover:bg-amber-600 text-white rounded-sm">
                <Plus className="h-4 w-4 mr-2" /> Add Member
              </Button>
            )}
          </div>
        ) : (
          <div ref={containerRef} className="relative -mx-3 sm:mx-0" data-testid="organogram-chart">
            {/* Zoom toolbar */}
            <div className="flex items-center justify-between gap-2 px-3 sm:px-2 mb-2">
              {canEdit && (
                <div
                  onDragOver={handleDragOverRoot}
                  onDragLeave={() => setDragOverRoot(false)}
                  onDrop={handleDropOnRoot}
                  className={`flex-1 max-w-md text-center text-[11px] sm:text-xs uppercase tracking-widest border-2 border-dashed rounded-sm py-2 transition-colors ${
                    dragNodeId
                      ? dragOverRoot
                        ? "border-amber-400 bg-amber-500/10 text-amber-300"
                        : "border-slate-600 text-slate-400"
                      : "border-transparent text-transparent select-none pointer-events-none"
                  }`}
                  data-testid="organogram-root-drop-zone"
                >
                  Drop here to remove parent (make root)
                </div>
              )}
              <div className="ml-auto flex items-center gap-1 bg-slate-900/80 border border-slate-700 rounded-sm p-1" data-testid="organogram-zoom-toolbar">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={zoomOut}
                  disabled={zoom <= 0.4}
                  className="h-7 w-7 p-0 text-slate-300 hover:text-amber-300 hover:bg-amber-500/10"
                  title="Zoom out"
                  data-testid="organogram-zoom-out"
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <button
                  type="button"
                  onClick={zoomReset}
                  className="text-[10px] font-mono text-slate-400 hover:text-amber-300 px-1 min-w-[42px] tabular-nums"
                  title="Reset zoom"
                  data-testid="organogram-zoom-reset"
                >
                  {Math.round(zoom * 100)}%
                </button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={zoomIn}
                  disabled={zoom >= 2}
                  className="h-7 w-7 p-0 text-slate-300 hover:text-amber-300 hover:bg-amber-500/10"
                  title="Zoom in"
                  data-testid="organogram-zoom-in"
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={zoomReset}
                  className="h-7 w-7 p-0 text-slate-400 hover:text-slate-100"
                  title="Reset zoom (100%)"
                  data-testid="organogram-zoom-fit"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            <div
              ref={scrollRef}
              className="relative bg-slate-950 rounded-md overflow-auto touch-pan-x touch-pan-y"
              style={{ maxHeight: "75vh" }}
              onTouchStart={(e) => {
                if (e.touches.length === 2) {
                  const [a, b] = e.touches;
                  pinchRef.current = {
                    initialDist: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY),
                    initialZoom: zoom,
                    pinching: true,
                  };
                }
              }}
              onTouchMove={(e) => {
                if (e.touches.length === 2 && pinchRef.current.pinching) {
                  e.preventDefault();
                  const [a, b] = e.touches;
                  const d = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
                  const ratio = d / (pinchRef.current.initialDist || d);
                  const next = Math.min(2, Math.max(0.4, +(pinchRef.current.initialZoom * ratio).toFixed(2)));
                  setZoom(next);
                }
              }}
              onTouchEnd={() => {
                pinchRef.current.pinching = false;
              }}
            >
              {/* Sized wrapper so the scrollable area knows the zoomed bounds */}
              <div
                style={{
                  width: canvasW * zoom,
                  height: canvasH * zoom,
                  position: "relative",
                }}
              >
                <div
                  ref={chartRef}
                  className="relative"
                  style={{
                    width: canvasW,
                    height: canvasH,
                    transform: `scale(${zoom})`,
                    transformOrigin: "top left",
                    backgroundColor: "#020617",
                  }}
                >
                  {/* Tier dividers */}
                  {RANKS.filter((r) => layout.tierIndex[r] !== undefined).map((rank) => {
                    const top = layout.tierY[rank];
                    return (
                      <div
                        key={`tier-${rank}`}
                        className="absolute left-0 right-0 flex items-center gap-3 px-6 pointer-events-none"
                        style={{ top, height: TIER_HEADER_H }}
                        data-testid={`organogram-tier-${activeChart}-${rank}`}
                      >
                        <div className="h-px flex-1 bg-gradient-to-r from-transparent to-slate-700" />
                        <Badge className={`${RANK_STYLES[rank].badge} uppercase tracking-widest text-xs px-3 py-1`}>
                          {rank}
                        </Badge>
                        <div className="h-px flex-1 bg-gradient-to-l from-transparent to-slate-700" />
                      </div>
                    );
                  })}

                  {/* Connectors — colour per parent SET, side-rail routed for wrapped rows */}
                  <svg
                    width={canvasW}
                    height={canvasH}
                    className="absolute inset-0 pointer-events-none"
                    data-testid="organogram-connectors"
                  >
                    {lines.map((line) => (
                      <g key={line.id}>
                        <path
                          d={line.d}
                          stroke={line.color}
                          strokeWidth="2"
                          strokeOpacity="0.85"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          fill="none"
                        />
                        <circle cx={line.x1} cy={line.y1} r={3} fill={line.color} opacity={0.9} />
                        <circle cx={line.x2} cy={line.y2} r={3} fill={line.color} opacity={0.9} />
                      </g>
                    ))}
                  </svg>

                  {/* Nodes */}
                  {visibleNodes.map((node) => {
                    const pos = layout.positions[node.id];
                    const tierTop = layout.tierY[node.rank];
                    if (!pos || tierTop === undefined) return null;
                    const left = CHART_PADDING + pos.col * SLOT_W + H_GAP / 2;
                    const top = tierTop + TIER_HEADER_H + pos.row * (TIER_HEIGHT + SUBROW_GAP);
                    const styles = RANK_STYLES[node.rank];
                    return (
                      <div
                        key={node.id}
                        ref={(el) => (nodeRefs.current[node.id] = el)}
                        draggable={canEdit}
                        onDragStart={(e) => handleDragStart(e, node)}
                        onDragEnd={handleDragEnd}
                        onDragOver={(e) => handleDragOverNode(e, node)}
                        onDragLeave={() => handleDragLeaveNode(node)}
                        onDrop={(e) => handleDropOnNode(e, node)}
                        style={{
                          position: "absolute",
                          left,
                          top,
                          width: NODE_W,
                          height: TIER_HEIGHT,
                        }}
                        className={`group bg-slate-900/80 backdrop-blur border rounded-md p-3 sm:p-4 transition-all shadow-lg ${styles.glow} ${
                          dragNodeId === node.id
                            ? "opacity-50 border-amber-500"
                            : dragOverNodeId === node.id
                            ? "border-amber-400 ring-2 ring-amber-400/60"
                            : "border-slate-700 hover:border-amber-500/50"
                        } ${canEdit ? "cursor-move" : ""}`}
                        data-testid={`organogram-node-${node.username}`}
                      >
                        <div className={`mx-auto mb-2 w-14 h-14 sm:w-20 sm:h-20 rounded-full overflow-hidden ring-2 ${styles.ring} bg-slate-800 flex items-center justify-center`}>
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
                          <div className="flex items-center justify-center gap-1 mt-1.5 flex-wrap">
                            <Badge className={`${styles.badge} text-[10px] uppercase`}>{node.rank}</Badge>
                          </div>
                          {node.bio && (
                            <p
                              className="mt-2 text-[11px] leading-snug text-slate-400 whitespace-pre-wrap text-left line-clamp-3"
                              data-testid={`organogram-bio-${node.username}`}
                              title={node.bio}
                            >
                              {node.bio}
                            </p>
                          )}
                        </div>
                        {canEdit && (
                          <div className="absolute top-2 right-2 flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => openEditDialog(node)}
                              className="h-7 w-7 p-0 text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 bg-slate-800/80 border border-slate-700 rounded-sm"
                              title="Edit"
                              data-testid={`organogram-edit-${node.username}`}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete(node)}
                              className="h-7 w-7 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10 bg-slate-800/80 border border-slate-700 rounded-sm"
                              title="Delete"
                              data-testid={`organogram-delete-${node.username}`}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <p className="text-[10px] text-slate-500 mt-2 px-3 sm:px-2 sm:hidden">
              Tip: pinch to zoom · drag to pan
            </p>
          </div>
        )}
      </div>

      {/* Image Crop Dialog */}
      <ImageCropDialog
        open={!!cropSource}
        imageSrc={cropSource}
        onCancel={() => setCropSource(null)}
        onConfirm={handleCropConfirm}
      />

      {/* Webhook Config Dialog */}
      <Dialog open={showWebhookDialog} onOpenChange={setShowWebhookDialog}>
        <DialogContent className="bg-slate-900 border-slate-700 text-slate-200 w-[calc(100vw-1.5rem)] max-w-[calc(100vw-1.5rem)] sm:max-w-lg max-h-[90vh] overflow-y-auto p-4 sm:p-6 rounded-md" data-testid="organogram-webhook-dialog">
          <DialogHeader>
            <DialogTitle className="text-amber-400">Discord Webhook</DialogTitle>
            <DialogDescription className="text-slate-400">
              Paste a Discord webhook URL. Create one in Discord: Server Settings → Integrations → Webhooks → New Webhook → Copy URL.
            </DialogDescription>
          </DialogHeader>
          {webhookConfig?.configured && (
            <div className="rounded-sm border border-slate-700 bg-slate-950/60 p-3 text-xs space-y-1">
              <p className="text-slate-300">
                <span className="text-slate-500">Current:</span> <span className="font-mono break-all">{webhookConfig.masked_url}</span>
              </p>
              <p className="text-slate-500">
                Updated by <span className="text-slate-300">{webhookConfig.updated_by}</span>
                {webhookConfig.updated_at && (
                  <> on {new Date(webhookConfig.updated_at).toLocaleString()}</>
                )}
              </p>
            </div>
          )}
          <form onSubmit={handleSaveWebhook} className="space-y-4">
            <div>
              <Label className="text-slate-300">Webhook URL</Label>
              <Input
                type="url"
                value={webhookInput}
                onChange={(e) => setWebhookInput(e.target.value)}
                placeholder="https://discord.com/api/webhooks/…/…"
                className="bg-slate-950/60 border-slate-700 text-slate-200 rounded-sm font-mono text-xs"
                data-testid="organogram-webhook-input"
                required
              />
            </div>
            <div className="flex flex-col-reverse sm:flex-row sm:justify-between items-stretch sm:items-center gap-2 pt-2">
              {webhookConfig?.configured ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleRemoveWebhook}
                  className="border-red-500/40 text-red-400 hover:bg-red-500/10 rounded-sm w-full sm:w-auto"
                  data-testid="organogram-webhook-remove-btn"
                >
                  <Trash2 className="h-4 w-4 mr-2" /> Remove
                </Button>
              ) : <span className="hidden sm:inline" />}
              <div className="flex gap-2 w-full sm:w-auto">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowWebhookDialog(false)}
                  className="flex-1 sm:flex-none border-slate-700 text-slate-300 hover:bg-slate-800 rounded-sm"
                >
                  Close
                </Button>
                <Button
                  type="submit"
                  disabled={webhookSaving || !webhookInput.trim()}
                  className="flex-1 sm:flex-none bg-amber-500 hover:bg-amber-600 text-white rounded-sm btn-glow"
                  data-testid="organogram-webhook-save-btn"
                >
                  {webhookSaving ? "Saving…" : "Save"}
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Share to Discord Dialog */}
      <Dialog open={shareDialog} onOpenChange={setShareDialog}>
        <DialogContent className="bg-slate-900 border-slate-700 text-slate-200 w-[calc(100vw-1.5rem)] max-w-[calc(100vw-1.5rem)] sm:max-w-lg max-h-[90vh] overflow-y-auto p-4 sm:p-6 rounded-md" data-testid="organogram-share-dialog">
          <DialogHeader>
            <DialogTitle className="text-indigo-300 flex items-center gap-2">
              <Send className="h-5 w-5" /> Share to Discord
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Posts a PNG of the current org chart with an embed to your configured Discord channel.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-slate-300">Optional message</Label>
              <Textarea
                value={shareMessage}
                onChange={(e) => setShareMessage(e.target.value)}
                placeholder="e.g. Promotions this week — congrats Sasha and Lex!"
                className="bg-slate-950/60 border-slate-700 text-slate-200 rounded-sm min-h-[80px]"
                maxLength={500}
                data-testid="organogram-share-message-input"
              />
              <p className="text-xs text-slate-500 mt-1">{shareMessage.length}/500</p>
            </div>
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShareDialog(false)}
                className="border-slate-700 text-slate-300 hover:bg-slate-800 rounded-sm w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                onClick={handleShareToDiscord}
                disabled={sharing}
                className="bg-indigo-500 hover:bg-indigo-600 text-white rounded-sm w-full sm:w-auto"
                data-testid="organogram-share-confirm-btn"
              >
                <Send className="h-4 w-4 mr-2" />
                {sharing ? "Posting…" : "Post Now"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>


      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>        <DialogContent className="bg-slate-900 border-slate-700 text-slate-200 sm:max-w-lg max-h-[90vh] overflow-y-auto" data-testid="organogram-dialog">
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
              <Select value={form.rank} onValueChange={(v) => setForm((prev) => {
                const childIdx = RANKS.indexOf(v);
                const validIds = new Set(nodes.filter((n) => n.chart === prev.chart && RANKS.indexOf(n.rank) < childIdx).map((n) => n.id));
                return { ...prev, rank: v, parent_ids: prev.parent_ids.filter((pid) => validIds.has(pid)) };
              })}>
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
              <Label className="text-slate-300">Reports To <span className="text-slate-500 text-xs">(Optional, multiple allowed)</span></Label>
              {form.rank === "CMod" ? (
                <div className="bg-slate-950/60 border border-slate-700 text-slate-500 rounded-sm px-3 py-2 text-sm" data-testid="organogram-parents-cmod-note">
                  CMod sits at the top — no parents.
                </div>
              ) : validParents.length === 0 ? (
                <div className="bg-slate-950/60 border border-slate-700 text-slate-500 rounded-sm px-3 py-2 text-sm">
                  No higher-rank members available yet.
                </div>
              ) : (
                <div className="space-y-2 mt-2 max-h-56 overflow-y-auto pr-1" data-testid="organogram-parents-checkboxes">
                  {validParents.map((p) => {
                    const checked = form.parent_ids.includes(p.id);
                    const rankColor = RANK_STYLES[p.rank]?.badge || "bg-slate-700/30 text-slate-300";
                    return (
                      <label
                        key={p.id}
                        className={`flex items-center gap-3 px-3 py-2 rounded-sm border cursor-pointer transition-colors ${
                          checked
                            ? "bg-amber-500/10 border-amber-500/60 text-amber-200"
                            : "bg-slate-950/60 border-slate-700 hover:border-slate-500 text-slate-300"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            setForm((prev) => {
                              const cur = prev.parent_ids || [];
                              return {
                                ...prev,
                                parent_ids: e.target.checked
                                  ? [...cur, p.id]
                                  : cur.filter((id) => id !== p.id),
                              };
                            });
                          }}
                          className="accent-amber-500 h-4 w-4"
                          data-testid={`organogram-parent-checkbox-${p.username}`}
                        />
                        <span className="flex-1 text-sm truncate">{p.display_name || p.username}</span>
                        <span className={`${rankColor} text-[10px] uppercase px-1.5 py-0.5 rounded-sm border`}>{p.rank}</span>
                      </label>
                    );
                  })}
                </div>
              )}
              {form.parent_ids.length > 1 && (
                <p className="text-xs text-amber-300/80 mt-1">
                  Reports to {form.parent_ids.length} parents — a line will be drawn from each on the chart.
                </p>
              )}
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
              <Label className="text-slate-300">Organogram</Label>
              <div className="grid grid-cols-1 gap-2 mt-2" data-testid="organogram-chart-picker">
                {CHART_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  const checked = form.chart === opt.value;
                  return (
                    <label
                      key={opt.value}
                      className={`flex items-center gap-3 px-3 py-2 rounded-sm border cursor-pointer transition-colors ${
                        checked
                          ? `${opt.badge} border-current`
                          : "bg-slate-950/60 border-slate-700 hover:border-slate-500 text-slate-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name="organogram-chart"
                        checked={checked}
                        onChange={() => {
                          // Switching chart wipes parents (they belong to the old chart)
                          setForm((prev) => ({ ...prev, chart: opt.value, parent_ids: [] }));
                        }}
                        className="accent-amber-500 h-4 w-4"
                        data-testid={`organogram-chart-radio-${opt.value}`}
                      />
                      <Icon className="h-4 w-4" />
                      <span className="text-sm">{opt.label}</span>
                    </label>
                  );
                })}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {editingNode
                  ? "Switch this person to a different organogram. Parents will be cleared."
                  : "Choose which of the three trees this person belongs to."}
              </p>
            </div>

            <div>
              <Label className="text-slate-300">Bio / Notes (Optional)</Label>
              <Textarea
                value={form.bio}
                onChange={(e) => setForm((prev) => ({ ...prev, bio: e.target.value }))}
                placeholder="A few lines about this person — role focus, region, languages, fun facts…"
                className="bg-slate-950/60 border-slate-700 text-slate-200 rounded-sm min-h-[90px]"
                maxLength={400}
                data-testid="organogram-bio-input"
              />
              <p className="text-xs text-slate-500 mt-1">
                {form.bio.length}/400 — appears below the name on the org chart card.
              </p>
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
              <p className="text-xs text-slate-500 mt-1">Max 8 MB. You'll position and crop the photo before saving.</p>
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
