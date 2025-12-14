import React, { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useEntity, useService, type EntityName } from "@hakit/core";
import { AuroraCard } from "./base/AuroraCard";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";
import { Switch } from "../ui/switch";
import {
  CircleDot, Home, Pause, Play, MapPin, Volume2, Wind,
  Battery, BatteryCharging, AlertTriangle, CheckCircle2,
  Settings, Clock, BarChart3, ChevronRight, Info, Zap,
  Droplets, Filter, RotateCw, TrendingUp, Activity, Navigation,
  Square, Pencil, Trash2, History, PlayCircle, FastForward,
  Rewind, Grid3x3, Check, X, Plus, Layers
} from "lucide-react";
import { cn } from "../../lib/utils";
import { motion, AnimatePresence } from "motion/react";
import ReactECharts from "echarts-for-react";
import { toast } from "sonner";

interface AuroraVacuumCardProps {
  entityId: EntityName;
  className?: string;
  titleOverride?: string;
}

// --- Types ---
type Room = {
  id: string;
  name: string;
  bounds: { x: number; y: number; width: number; height: number };
  color: string;
  selected?: boolean;
};

type VirtualWall = {
  id: string;
  points: { x: number; y: number }[];
};

type CleaningSession = {
  id: string;
  date: Date;
  duration: number;
  area: number;
  path: { x: number; y: number; timestamp: number }[];
  rooms: string[];
};

type MapMode = "normal" | "room-select" | "draw-walls" | "history";

// --- Haptic Feedback Helpers ---
const hapticLight = () => {
  if (typeof navigator !== "undefined" && navigator.vibrate) {
    navigator.vibrate(10);
  }
};

const hapticSuccess = () => {
  if (typeof navigator !== "undefined" && navigator.vibrate) {
    navigator.vibrate([10, 30, 10]);
  }
};

const hapticLocate = () => {
  if (typeof navigator !== "undefined" && navigator.vibrate) {
    navigator.vibrate([50, 50, 50]);
  }
};

const hapticError = () => {
  if (typeof navigator !== "undefined" && navigator.vibrate) {
    navigator.vibrate([100, 50, 100]);
  }
};

// --- State Configuration ---
const stateConfig = {
  cleaning: {
    label: "En nettoyage",
    color: "cyan",
    icon: CircleDot,
    gradient: "from-cyan-500/20 to-blue-500/10",
    glow: "#06B6D4",
  },
  docked: {
    label: "Sur base",
    color: "green",
    icon: BatteryCharging,
    gradient: "from-green-500/20 to-emerald-500/10",
    glow: "#10B981",
  },
  returning: {
    label: "Retour base",
    color: "amber",
    icon: Home,
    gradient: "from-amber-500/20 to-yellow-500/10",
    glow: "#F59E0B",
  },
  paused: {
    label: "En pause",
    color: "amber",
    icon: Pause,
    gradient: "from-amber-500/20 to-orange-500/10",
    glow: "#F59E0B",
  },
  idle: {
    label: "Inactif",
    color: "zinc",
    icon: CircleDot,
    gradient: "from-zinc-500/10 to-zinc-600/5",
    glow: "#71717A",
  },
  error: {
    label: "Erreur",
    color: "red",
    icon: AlertTriangle,
    gradient: "from-red-500/20 to-rose-500/10",
    glow: "#EF4444",
  },
};

// --- Mock Data ---
const MOCK_ROOMS: Room[] = [
  { id: "living", name: "Salon", bounds: { x: 10, y: 10, width: 90, height: 70 }, color: "#06B6D4" },
  { id: "kitchen", name: "Cuisine", bounds: { x: 110, y: 10, width: 80, height: 70 }, color: "#8B5CF6" },
  { id: "bedroom1", name: "Chambre 1", bounds: { x: 10, y: 90, width: 80, height: 60 }, color: "#F59E0B" },
  { id: "bedroom2", name: "Chambre 2", bounds: { x: 100, y: 90, width: 90, height: 60 }, color: "#10B981" },
  { id: "bathroom", name: "Salle de bain", bounds: { x: 10, y: 160, width: 50, height: 40 }, color: "#EC4899" },
  { id: "hallway", name: "Couloir", bounds: { x: 70, y: 160, width: 120, height: 30 }, color: "#6366F1" },
];

// --- Generate realistic cleaning path ---
const generateCleaningPath = (rooms: Room[], duration: number): { x: number; y: number; timestamp: number }[] => {
  const path: { x: number; y: number; timestamp: number }[] = [];
  const startTime = Date.now();
  const totalPoints = Math.floor(duration / 2); // One point every 2 seconds

  rooms.forEach((room, roomIndex) => {
    const pointsPerRoom = Math.floor(totalPoints / rooms.length);
    const { x, y, width, height } = room.bounds;

    for (let i = 0; i < pointsPerRoom; i++) {
      // Create a back-and-forth pattern
      const progress = i / pointsPerRoom;
      const row = Math.floor(progress * 5);
      const offsetX = (row % 2 === 0) ? (progress * 5 % 1) * width : (1 - (progress * 5 % 1)) * width;
      const offsetY = (row / 5) * height;

      path.push({
        x: x + offsetX,
        y: y + offsetY,
        timestamp: startTime + (roomIndex * pointsPerRoom + i) * 2000,
      });
    }
  });

  return path;
};

// --- Generate Demo Cleaning History ---
const generateCleaningHistory = (): CleaningSession[] => {
  const sessions: CleaningSession[] = [];
  const now = Date.now();

  for (let i = 0; i < 7; i++) {
    const date = new Date(now - i * 24 * 60 * 60 * 1000);
    const numRooms = Math.floor(Math.random() * 4) + 2;
    const selectedRooms = MOCK_ROOMS.slice(0, numRooms);
    const duration = Math.floor(Math.random() * 60) + 30; // 30-90 min
    const area = selectedRooms.reduce((sum, r) => sum + (r.bounds.width * r.bounds.height) / 20, 0);

    sessions.push({
      id: `session-${i}`,
      date,
      duration,
      area: Math.round(area),
      path: generateCleaningPath(selectedRooms, duration * 60),
      rooms: selectedRooms.map(r => r.id),
    });
  }

  return sessions;
};

// --- Chart Options ---
const getCleaningChartOptions = (sessions: CleaningSession[]) => ({
  backgroundColor: "transparent",
  grid: { top: 40, right: 15, bottom: 50, left: 60 },
  legend: {
    data: ["Durée (min)", "Surface (m²)"],
    textStyle: { color: "#a1a1aa", fontSize: 11, fontWeight: 500 },
    itemWidth: 20,
    itemHeight: 10,
    top: 5,
  },
  xAxis: {
    type: "time",
    axisLine: { lineStyle: { color: "rgba(255,255,255,0.1)" } },
    axisLabel: {
      color: "#a1a1aa",
      fontSize: 11,
      fontWeight: 500,
      formatter: (value: number) => {
        const date = new Date(value);
        return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
      }
    },
    splitLine: { show: false },
  },
  yAxis: [
    {
      type: "value",
      name: "Durée (min)",
      nameTextStyle: { color: "#a1a1aa", fontSize: 11 },
      axisLine: { show: false },
      axisLabel: { color: "#a1a1aa", fontSize: 11, fontWeight: 500 },
      splitLine: { lineStyle: { color: "rgba(255,255,255,0.05)", type: "dashed" } },
    },
    {
      type: "value",
      name: "Surface (m²)",
      nameTextStyle: { color: "#a1a1aa", fontSize: 11 },
      axisLine: { show: false },
      axisLabel: { color: "#a1a1aa", fontSize: 11, fontWeight: 500 },
      splitLine: { show: false },
    }
  ],
  tooltip: {
    trigger: "axis",
    backgroundColor: "rgba(24, 24, 27, 0.95)",
    borderColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
    borderRadius: 16,
    padding: [12, 16],
    textStyle: { color: "#fff", fontSize: 13, fontWeight: 500 },
  },
  series: [
    {
      name: "Durée (min)",
      type: "bar",
      yAxisIndex: 0,
      itemStyle: {
        color: {
          type: "linear",
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: "#06B6D4" },
            { offset: 1, color: "#0891B2" }
          ]
        },
        borderRadius: [8, 8, 0, 0],
      },
      emphasis: {
        itemStyle: { shadowBlur: 12, shadowColor: "#06B6D4" }
      },
      data: sessions.map(s => [s.date.getTime(), s.duration]),
    },
    {
      name: "Surface (m²)",
      type: "line",
      yAxisIndex: 1,
      smooth: 0.3,
      symbol: "circle",
      symbolSize: 8,
      lineStyle: { color: "#8B5CF6", width: 2.5 },
      itemStyle: {
        color: "#8B5CF6",
        borderColor: "rgba(255,255,255,0.2)",
        borderWidth: 2
      },
      emphasis: {
        scale: true,
        focus: "series",
        itemStyle: { shadowBlur: 12, shadowColor: "#8B5CF6" }
      },
      data: sessions.map(s => [s.date.getTime(), s.area]),
    }
  ]
});

// --- Main Component ---
export const AuroraVacuumCard: React.FC<AuroraVacuumCardProps> = ({
  entityId,
  className,
  titleOverride,
}) => {
  let entity: any;
  try {
    entity = useEntity(entityId);
  } catch (e) {
    entity = {
      state: "docked",
      attributes: { friendly_name: titleOverride || "Vacuum", battery_level: 100 }
    };
  }
  const vacuum = useService("vacuum");

  const [open, setOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedFanSpeed, setSelectedFanSpeed] = useState("standard");
  const [autoEmpty, setAutoEmpty] = useState(true);
  const [scheduleEnabled, setScheduleEnabled] = useState(false);

  // Map mode & room selection
  const [mapMode, setMapMode] = useState<MapMode>("normal");
  const [rooms, setRooms] = useState<Room[]>(MOCK_ROOMS);
  const [virtualWalls, setVirtualWalls] = useState<VirtualWall[]>([]);
  const [currentWall, setCurrentWall] = useState<{ x: number; y: number }[]>([]);

  // History replay
  const [cleaningSessions] = useState<CleaningSession[]>(generateCleaningHistory());
  const [selectedSession, setSelectedSession] = useState<CleaningSession | null>(null);
  const [replayProgress, setReplayProgress] = useState(0);
  const [isReplaying, setIsReplaying] = useState(false);
  const [replaySpeed, setReplaySpeed] = useState(1); // 1x, 2x, 4x
  const replayTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Long press detection
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const [isPressed, setIsPressed] = useState(false);

  const state = (entity.state as string) || "idle";
  const battery = (entity.attributes.battery_level as number) ?? 100;
  const fanSpeed = (entity.attributes.fan_speed as string) ?? "standard";
  const fanSpeedList = (entity.attributes.fan_speed_list as string[]) ?? ["silent", "standard", "medium", "turbo"];

  // Mock additional data
  const cleanedArea = Math.floor(Math.random() * 80) + 20;
  const cleaningTime = Math.floor(Math.random() * 90) + 30;

  const config = stateConfig[state as keyof typeof stateConfig] || stateConfig.idle;
  const isActive = state === "cleaning";
  const canStart = state === "idle" || state === "paused" || state === "docked";
  const canPause = state === "cleaning";
  const canResume = state === "paused";

  const friendly = titleOverride || entity.attributes.friendly_name || "Aspirateur";

  // Selected rooms
  const selectedRooms = useMemo(() => rooms.filter(r => r.selected), [rooms]);

  // Long press handlers
  const handleTouchStart = useCallback(() => {
    setIsPressed(true);
    hapticLight();
    longPressTimer.current = setTimeout(() => {
      hapticSuccess();
      setOpen(true);
      setIsPressed(false);
    }, 500);
  }, []);

  const handleTouchEnd = useCallback(() => {
    setIsPressed(false);
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const handleTouchMove = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  // Card tap - Always open dialog (simplified for better UX)
  const handleCardClick = useCallback(() => {
    hapticLight();
    setOpen(true);
  }, []);

  // Service calls
  const handleStart = useCallback(async () => {
    try {
      toast.loading("Démarrage du nettoyage…", { id: entityId });
      await vacuum.start({ target: entityId });
      toast.success("Nettoyage en cours", { id: entityId });
      hapticSuccess();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Échec", { id: entityId });
    }
  }, [vacuum, entityId]);

  const handlePause = useCallback(async () => {
    try {
      toast.loading("Mise en pause…", { id: entityId });
      await vacuum.pause({ target: entityId });
      toast.success("En pause", { id: entityId });
      hapticLight();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Échec", { id: entityId });
    }
  }, [vacuum, entityId]);

  const handleReturnToDock = useCallback(async () => {
    try {
      toast.loading("Retour à la base…", { id: entityId });
      await vacuum.returnToBase({ target: entityId });
      toast.success("Retour en cours", { id: entityId });
      hapticSuccess();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Échec", { id: entityId });
    }
  }, [vacuum, entityId]);

  const handleLocate = useCallback(async () => {
    try {
      await vacuum.locate({ target: entityId });
      toast.success("Signal sonore envoyé", { id: entityId });
      hapticLocate();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Échec", { id: entityId });
    }
  }, [vacuum, entityId]);

  const handleSetFanSpeed = useCallback(async (speed: string) => {
    try {
      await vacuum.setFanSpeed({ target: entityId, fan_speed: speed });
      toast.success(`Puissance: ${speed}`, { id: entityId });
      setSelectedFanSpeed(speed);
      hapticLight();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Échec", { id: entityId });
    }
  }, [vacuum, entityId]);

  // --- ROOM SELECTION ---
  const toggleRoomSelection = useCallback((roomId: string) => {
    setRooms(prev => prev.map(r =>
      r.id === roomId ? { ...r, selected: !r.selected } : r
    ));
    hapticLight();
  }, []);

  const selectAllRooms = useCallback(() => {
    setRooms(prev => prev.map(r => ({ ...r, selected: true })));
    hapticLight();
  }, []);

  const clearRoomSelection = useCallback(() => {
    setRooms(prev => prev.map(r => ({ ...r, selected: false })));
    hapticLight();
  }, []);

  const cleanSelectedRooms = useCallback(async () => {
    if (selectedRooms.length === 0) {
      toast.error("Sélectionnez au moins une pièce");
      hapticError();
      return;
    }

    try {
      const roomNames = selectedRooms.map(r => r.name).join(", ");
      toast.loading(`Nettoyage: ${roomNames}`, { id: entityId });
      // In real scenario: await vacuum.cleanRooms({ target: entityId, rooms: selectedRooms.map(r => r.id) });
      await vacuum.start({ target: entityId });
      toast.success(`En cours: ${roomNames}`, { id: entityId });
      hapticSuccess();
      setMapMode("normal");
      clearRoomSelection();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Échec", { id: entityId });
    }
  }, [selectedRooms, vacuum, entityId, clearRoomSelection]);

  // --- VIRTUAL WALLS ---
  const handleMapClick = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (mapMode !== "draw-walls") return;

    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 200;
    const y = ((e.clientY - rect.top) / rect.height) * 200;

    setCurrentWall(prev => [...prev, { x, y }]);
    hapticLight();
  }, [mapMode]);

  const finishWall = useCallback(() => {
    if (currentWall.length < 2) {
      toast.error("Tracez au moins 2 points");
      hapticError();
      return;
    }

    const newWall: VirtualWall = {
      id: `wall-${Date.now()}`,
      points: currentWall,
    };

    setVirtualWalls(prev => [...prev, newWall]);
    setCurrentWall([]);
    toast.success("Mur virtuel créé");
    hapticSuccess();
  }, [currentWall]);

  const cancelWall = useCallback(() => {
    setCurrentWall([]);
    hapticLight();
  }, []);

  const deleteWall = useCallback((wallId: string) => {
    setVirtualWalls(prev => prev.filter(w => w.id !== wallId));
    toast.success("Mur supprimé");
    hapticLight();
  }, []);

  // --- HISTORY REPLAY ---
  const startReplay = useCallback((session: CleaningSession) => {
    setSelectedSession(session);
    setReplayProgress(0);
    setIsReplaying(true);
    hapticSuccess();
  }, []);

  const stopReplay = useCallback(() => {
    setIsReplaying(false);
    if (replayTimerRef.current) {
      clearInterval(replayTimerRef.current);
      replayTimerRef.current = null;
    }
    hapticLight();
  }, []);

  const resetReplay = useCallback(() => {
    setReplayProgress(0);
    setIsReplaying(false);
    if (replayTimerRef.current) {
      clearInterval(replayTimerRef.current);
      replayTimerRef.current = null;
    }
  }, []);

  // Replay animation loop
  useEffect(() => {
    if (!isReplaying || !selectedSession) return;

    replayTimerRef.current = setInterval(() => {
      setReplayProgress(prev => {
        const next = prev + (0.5 * replaySpeed); // Increment based on speed
        if (next >= 100) {
          setIsReplaying(false);
          hapticSuccess();
          return 100;
        }
        return next;
      });
    }, 50); // Update every 50ms

    return () => {
      if (replayTimerRef.current) {
        clearInterval(replayTimerRef.current);
      }
    };
  }, [isReplaying, selectedSession, replaySpeed]);

  // Current replay position
  const replayPosition = useMemo(() => {
    if (!selectedSession) return null;
    const pathIndex = Math.floor((replayProgress / 100) * selectedSession.path.length);
    return selectedSession.path[pathIndex] || selectedSession.path[0];
  }, [selectedSession, replayProgress]);

  // Stats
  const stats = useMemo(() => {
    const totalCleanings = cleaningSessions.length;
    const totalDuration = cleaningSessions.reduce((sum, s) => sum + s.duration, 0);
    const totalArea = cleaningSessions.reduce((sum, s) => sum + s.area, 0);
    const avgDuration = Math.round(totalDuration / totalCleanings);
    const avgArea = Math.round(totalArea / totalCleanings);

    return {
      totalCleanings,
      totalDuration,
      totalArea,
      avgDuration,
      avgArea,
    };
  }, [cleaningSessions]);

  // Maintenance levels (mock)
  const maintenance = useMemo(() => ({
    mainBrush: Math.floor(Math.random() * 40) + 60,
    sideBrush: Math.floor(Math.random() * 40) + 60,
    filter: Math.floor(Math.random() * 40) + 60,
  }), []);

  // Battery color
  const batteryColor = battery > 50 ? "text-green-400" : battery > 20 ? "text-amber-400" : "text-red-400";

  return (
    <>
      {/* --- DASHBOARD TILE --- */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
        className="relative w-full h-full @container"
      >
        <AuroraCard
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onClick={handleCardClick}
          className={cn(
            "relative flex flex-col justify-between p-5 select-none cursor-pointer group overflow-hidden",
            "rounded-[24px]",
            "bg-zinc-900/40 backdrop-blur-3xl",
            "ring-1 ring-white/10 ring-inset",
            "border border-white/5",
            "shadow-xl shadow-black/20",
            isPressed ? "scale-[1.02]" : "hover:bg-zinc-900/50 active:scale-[0.98]",
            "transition-all duration-300",
            className
          )}
        >
          {isActive && (
            <motion.div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `radial-gradient(circle at 50% 120%, ${config.glow}15, transparent 60%)`
              }}
              animate={{
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          )}

          <div className="flex justify-between items-start relative z-10">
            <motion.div
              className={cn(
                "w-11 h-11 rounded-[14px] flex items-center justify-center relative",
                "ring-1 ring-inset backdrop-blur-xl",
                isActive
                  ? `bg-${config.color}-500/20 ring-${config.color}-500/30`
                  : "bg-white/5 ring-white/10"
              )}
              style={isActive ? {
                backgroundColor: `${config.glow}20`,
                borderColor: `${config.glow}30`,
                boxShadow: `0 0 20px ${config.glow}40, inset 0 1px 0 rgba(255,255,255,0.1)`,
                animation: "spin 3s linear infinite",
              } : undefined}
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              animate={isActive ? { rotate: 360 } : {}}
            >
              <config.icon
                className={cn(
                  "w-5 h-5 relative z-10",
                  isActive ? `text-${config.color}-400` : "text-zinc-400"
                )}
              />
            </motion.div>

            <motion.div
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1.5 rounded-[10px]",
                "bg-white/5 backdrop-blur-xl",
                "ring-1 ring-white/10 ring-inset border border-white/5"
              )}
            >
              {state === "docked" ? (
                <BatteryCharging className="w-3.5 h-3.5 text-green-400" />
              ) : (
                <Battery className={cn("w-3.5 h-3.5", batteryColor)} />
              )}
              <span className={cn("text-xs font-semibold tabular-nums", batteryColor)}>
                {battery}%
              </span>
            </motion.div>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center relative z-10 my-2 min-h-0">
            <div className="relative h-full max-h-[160px] aspect-square min-h-[80px]">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
                <circle
                  cx="40"
                  cy="40"
                  r="36"
                  fill="none"
                  stroke="rgba(255,255,255,0.05)"
                  strokeWidth="4"
                />
                <motion.circle
                  cx="40"
                  cy="40"
                  r="36"
                  fill="none"
                  stroke={battery > 50 ? "#10B981" : battery > 20 ? "#F59E0B" : "#EF4444"}
                  strokeWidth="4"
                  strokeLinecap="round"
                  initial={{ strokeDasharray: "0 226" }}
                  animate={{
                    strokeDasharray: `${(battery / 100) * 226} 226`,
                  }}
                  transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
                  style={{
                    filter: `drop-shadow(0 0 8px ${battery > 50 ? "#10B981" : battery > 20 ? "#F59E0B" : "#EF4444"}60)`
                  }}
                />
              </svg>

              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div
                  animate={isActive ? {
                    rotate: 360,
                    scale: [1, 1.1, 1],
                  } : {}}
                  transition={{
                    rotate: { duration: 2, repeat: Infinity, ease: "linear" },
                    scale: { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
                  }}
                >
                  <CircleDot
                    className={cn(
                      "w-8 h-8",
                      isActive ? `text-${config.color}-400` : "text-zinc-500"
                    )}
                  />
                </motion.div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 relative z-10">
            <span className="text-xs tracking-wider uppercase text-zinc-500 font-medium truncate">
              {friendly}
            </span>

            <div className="flex items-center justify-between">
              <span
                className="text-sm font-semibold"
                style={{ color: config.glow }}
              >
                {config.label}
              </span>
            </div>

            {/* QUICK ACTIONS: Hidden on small cards, Visible on Wide cards (@min-w-[280px]) */}
            <div className="hidden @[280px]:grid grid-cols-2 gap-2 mt-1">
              {(canStart || canResume) && (
                <button
                  onClick={(e) => { e.stopPropagation(); handleStart(); }}
                  className="flex items-center justify-center gap-2 py-2 rounded-lg bg-white/5 hover:bg-white/10 active:scale-95 transition-all ring-1 ring-white/10 text-xs font-medium text-white"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Démarrer</span>
                </button>
              )}
              {canPause && (
                <button
                  onClick={(e) => { e.stopPropagation(); handlePause(); }}
                  className="flex items-center justify-center gap-2 py-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 active:scale-95 transition-all ring-1 ring-amber-500/20 text-xs font-medium text-amber-400"
                >
                  <Pause className="w-3.5 h-3.5" />
                  <span>Pause</span>
                </button>
              )}

              <button
                onClick={(e) => { e.stopPropagation(); handleReturnToDock(); }}
                className="flex items-center justify-center gap-2 py-2 rounded-lg bg-white/5 hover:bg-white/10 active:scale-95 transition-all ring-1 ring-white/10 text-xs font-medium text-white"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Base</span>
              </button>
            </div>

            {/* SMALL CARD: Simple Status Text */}
            <div className="@[280px]:hidden flex items-center justify-between text-[10px] text-zinc-500">
              {(canStart || canPause) && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-1 text-[10px] text-zinc-600"
                >
                  {canStart && (
                    <>
                      <Play className="w-3 h-3" />
                      <span>Démarrer</span>
                    </>
                  )}
                  {canPause && (
                    <>
                      <Pause className="w-3 h-3" />
                      <span>Pause</span>
                    </>
                  )}
                </motion.div>
              )}
            </div>

            {isActive && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="hidden @[280px]:flex items-center justify-between text-[10px] tracking-wider uppercase font-medium text-zinc-600 pt-2 border-t border-white/5"
              >
                <div className="flex items-center gap-1">
                  <Grid3x3 className="w-3 h-3" />
                  <span>{cleanedArea}m²</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{cleaningTime}min</span>
                </div>
              </motion.div>
            )}

            {/* KEEP ORIGINAL STATS FOR SMALL CARDS */}
            {isActive && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="@[280px]:hidden flex items-center justify-between text-[10px] tracking-wider uppercase font-medium text-zinc-600 pt-2 border-t border-white/5"
              >
                <span>{cleanedArea}m²</span>
                <span>•</span>
                <span>{cleaningTime}min</span>
              </motion.div>
            )}
          </div>
        </AuroraCard>
      </motion.div>

      {/* --- INSPECTOR DIALOG --- */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-zinc-900/95 backdrop-blur-3xl ring-1 ring-white/10 ring-inset border border-white/5 shadow-2xl sm:max-w-[540px] sm:rounded-[28px] p-0 overflow-hidden gap-0 max-h-[90vh] overflow-y-auto">
          <DialogHeader className="sr-only">
            <DialogTitle>Vacuum Control</DialogTitle>
            <DialogDescription>Advanced vacuum robot control</DialogDescription>
          </DialogHeader>

          {/* Header */}
          <motion.div
            className="flex flex-col items-center justify-center pt-8 pb-6 relative"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {isActive && (
              <div
                className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 blur-3xl opacity-20 pointer-events-none"
                style={{ backgroundColor: config.glow }}
              />
            )}

            <motion.div
              className={cn(
                "w-20 h-20 rounded-full flex items-center justify-center mb-4 relative",
                "ring-1 ring-inset backdrop-blur-xl"
              )}
              style={isActive ? {
                backgroundColor: `${config.glow}20`,
                borderColor: `${config.glow}30`,
                boxShadow: `0 0 30px ${config.glow}30, inset 0 1px 0 rgba(255,255,255,0.1)`
              } : {
                backgroundColor: "rgba(255,255,255,0.05)",
                borderColor: "rgba(255,255,255,0.1)"
              }}
              whileHover={{ scale: 1.05 }}
              animate={isActive ? { rotate: [0, 360] } : {}}
              transition={{
                rotate: { duration: 3, repeat: Infinity, ease: "linear" },
                type: "spring",
                stiffness: 300
              }}
            >
              <CircleDot
                className={cn(
                  "w-10 h-10 relative z-10",
                  isActive ? `text-${config.color}-400` : "text-zinc-400"
                )}
              />
            </motion.div>

            <DialogTitle className="text-2xl font-medium text-center tracking-tight text-white mb-1">
              {friendly}
            </DialogTitle>
            <DialogDescription
              className="text-sm font-semibold"
              style={{ color: config.glow }}
            >
              {config.label}
            </DialogDescription>

            <div className="flex items-center gap-2 mt-3 px-4 py-2 rounded-[12px] bg-white/5 backdrop-blur-xl ring-1 ring-white/10 ring-inset">
              {state === "docked" ? (
                <BatteryCharging className={cn("w-4 h-4", batteryColor)} />
              ) : (
                <Battery className={cn("w-4 h-4", batteryColor)} />
              )}
              <span className={cn("text-sm font-semibold tabular-nums", batteryColor)}>
                {battery}%
              </span>
              {state === "docked" && (
                <span className="text-xs text-zinc-500">• En charge</span>
              )}
            </div>

            <div className="absolute top-6 right-6">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className={cn(
                  "p-2.5 rounded-[12px] backdrop-blur-xl transition-all",
                  "ring-1 ring-inset",
                  showSettings
                    ? "bg-cyan-500/20 ring-cyan-500/30"
                    : "bg-white/5 ring-white/10 hover:bg-white/10"
                )}
              >
                <Settings className={cn("w-4 h-4", showSettings ? "text-cyan-400" : "text-zinc-400")} />
              </button>
            </div>
          </motion.div>

          <AnimatePresence mode="wait">
            {!showSettings ? (
              <motion.div
                key="controls"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="px-6 pb-6 space-y-5"
              >
                {/* Mode Selector */}
                <motion.div
                  className="grid grid-cols-4 gap-2"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {[
                    { mode: "normal" as MapMode, icon: MapPin, label: "Standard" },
                    { mode: "room-select" as MapMode, icon: Grid3x3, label: "Pièces" },
                    { mode: "draw-walls" as MapMode, icon: Pencil, label: "Murs" },
                    { mode: "history" as MapMode, icon: History, label: "Historique" },
                  ].map((tab) => (
                    <button
                      key={tab.mode}
                      onClick={() => {
                        setMapMode(tab.mode);
                        if (tab.mode !== "room-select") clearRoomSelection();
                        if (tab.mode !== "draw-walls") {
                          setCurrentWall([]);
                        }
                        if (tab.mode !== "history") {
                          resetReplay();
                          setSelectedSession(null);
                        }
                        hapticLight();
                      }}
                      className={cn(
                        "flex flex-col items-center gap-1.5 p-3 rounded-[14px] backdrop-blur-xl transition-all",
                        "ring-1 ring-inset",
                        mapMode === tab.mode
                          ? "bg-cyan-500/20 ring-cyan-500/30"
                          : "bg-white/5 ring-white/10 hover:bg-white/10"
                      )}
                    >
                      <tab.icon className={cn("w-4 h-4", mapMode === tab.mode ? "text-cyan-400" : "text-zinc-400")} />
                      <span className={cn(
                        "text-[9px] font-medium uppercase tracking-wider",
                        mapMode === tab.mode ? "text-cyan-400" : "text-zinc-500"
                      )}>
                        {tab.label}
                      </span>
                    </button>
                  ))}
                </motion.div>

                {/* Map Preview */}
                <motion.div
                  className="bg-white/5 backdrop-blur-xl rounded-[20px] p-4 ring-1 ring-white/10 ring-inset border border-white/5 aspect-square relative overflow-hidden"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  {/* Grid background */}
                  <div className="absolute inset-0 opacity-20" style={{
                    backgroundImage: "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
                    backgroundSize: "20px 20px"
                  }} />

                  {/* Interactive SVG Map */}
                  <svg
                    className="absolute inset-4 cursor-crosshair"
                    viewBox="0 0 200 200"
                    onClick={handleMapClick}
                  >
                    {/* Rooms */}
                    {rooms.map((room) => (
                      <g key={room.id}>
                        <rect
                          x={room.bounds.x}
                          y={room.bounds.y}
                          width={room.bounds.width}
                          height={room.bounds.height}
                          fill={room.selected ? room.color + "40" : "rgba(255,255,255,0.05)"}
                          stroke={room.selected ? room.color : "rgba(255,255,255,0.2)"}
                          strokeWidth="2"
                          strokeDasharray={mapMode === "room-select" ? "0" : "5,5"}
                          className={mapMode === "room-select" ? "cursor-pointer hover:opacity-80 transition-opacity" : ""}
                          onClick={(e) => {
                            if (mapMode === "room-select") {
                              e.stopPropagation();
                              toggleRoomSelection(room.id);
                            }
                          }}
                        />
                        {mapMode === "room-select" && (
                          <text
                            x={room.bounds.x + room.bounds.width / 2}
                            y={room.bounds.y + room.bounds.height / 2}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            fill={room.selected ? room.color : "rgba(255,255,255,0.4)"}
                            fontSize="8"
                            fontWeight="600"
                            className="pointer-events-none select-none"
                          >
                            {room.name}
                          </text>
                        )}
                        {room.selected && mapMode === "room-select" && (
                          <circle
                            cx={room.bounds.x + room.bounds.width - 8}
                            cy={room.bounds.y + 8}
                            r="5"
                            fill={room.color}
                            className="pointer-events-none"
                          />
                        )}
                      </g>
                    ))}

                    {/* Virtual Walls */}
                    {virtualWalls.map((wall) => (
                      <g key={wall.id}>
                        <polyline
                          points={wall.points.map(p => `${p.x},${p.y}`).join(" ")}
                          fill="none"
                          stroke="#EF4444"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        {wall.points.map((point, i) => (
                          <circle
                            key={i}
                            cx={point.x}
                            cy={point.y}
                            r="4"
                            fill="#EF4444"
                          />
                        ))}
                        {mapMode === "draw-walls" && (
                          <circle
                            cx={wall.points[0].x}
                            cy={wall.points[0].y}
                            r="8"
                            fill="transparent"
                            stroke="#EF4444"
                            strokeWidth="2"
                            className="cursor-pointer hover:fill-red-500/20"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteWall(wall.id);
                            }}
                          />
                        )}
                      </g>
                    ))}

                    {/* Current wall being drawn */}
                    {currentWall.length > 0 && (
                      <g>
                        <polyline
                          points={currentWall.map(p => `${p.x},${p.y}`).join(" ")}
                          fill="none"
                          stroke="#F59E0B"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeDasharray="5,5"
                        />
                        {currentWall.map((point, i) => (
                          <circle
                            key={i}
                            cx={point.x}
                            cy={point.y}
                            r="4"
                            fill="#F59E0B"
                          />
                        ))}
                      </g>
                    )}

                    {/* History replay path */}
                    {mapMode === "history" && selectedSession && (
                      <g>
                        {/* Full path (faded) */}
                        <path
                          d={`M ${selectedSession.path.map(p => `${p.x},${p.y}`).join(" L ")}`}
                          fill="none"
                          stroke="#8B5CF6"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          opacity="0.3"
                        />

                        {/* Animated progress path */}
                        <motion.path
                          d={`M ${selectedSession.path.slice(0, Math.floor((replayProgress / 100) * selectedSession.path.length)).map(p => `${p.x},${p.y}`).join(" L ")}`}
                          fill="none"
                          stroke="#8B5CF6"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                        />
                      </g>
                    )}

                    {/* Cleaning path (if active) */}
                    {isActive && mapMode === "normal" && (
                      <motion.path
                        d="M 30,30 Q 90,50 150,30 T 170,90 Q 150,140 100,150 T 50,170"
                        fill="none"
                        stroke={config.glow}
                        strokeWidth="2"
                        strokeLinecap="round"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 0.6 }}
                        transition={{ duration: 2, ease: "easeInOut" }}
                      />
                    )}

                    {/* Vacuum position */}
                    {mapMode !== "history" && (
                      <motion.circle
                        cx={isActive ? "150" : "100"}
                        cy={isActive ? "150" : "100"}
                        r="6"
                        fill={config.glow}
                        animate={isActive ? {
                          cx: ["30", "150", "100", "150"],
                          cy: ["30", "30", "100", "150"],
                        } : {}}
                        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                      />
                    )}

                    {/* Replay position */}
                    {mapMode === "history" && replayPosition && (
                      <motion.g>
                        <circle
                          cx={replayPosition.x}
                          cy={replayPosition.y}
                          r="8"
                          fill="#8B5CF6"
                          opacity="0.3"
                        />
                        <circle
                          cx={replayPosition.x}
                          cy={replayPosition.y}
                          r="5"
                          fill="#8B5CF6"
                        />
                      </motion.g>
                    )}

                    {/* Dock location */}
                    <rect x="90" y="5" width="20" height="10" fill="#10B981" opacity="0.6" rx="2" />
                  </svg>

                  {/* Map mode label */}
                  <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-[10px] bg-zinc-900/80 backdrop-blur-xl ring-1 ring-white/10 ring-inset">
                    {mapMode === "normal" && <MapPin className="w-3 h-3 text-cyan-400" />}
                    {mapMode === "room-select" && <Grid3x3 className="w-3 h-3 text-purple-400" />}
                    {mapMode === "draw-walls" && <Pencil className="w-3 h-3 text-amber-400" />}
                    {mapMode === "history" && <History className="w-3 h-3 text-indigo-400" />}
                    <span className="text-xs font-medium text-white">
                      {mapMode === "normal" && "Vue standard"}
                      {mapMode === "room-select" && `${selectedRooms.length} sélectionnée(s)`}
                      {mapMode === "draw-walls" && currentWall.length > 0 ? `${currentWall.length} points` : "Cliquez pour dessiner"}
                      {mapMode === "history" && selectedSession ? `${Math.round(replayProgress)}%` : "Sélectionnez une session"}
                    </span>
                  </div>

                  {/* Cleaned area (if active) */}
                  {isActive && mapMode === "normal" && (
                    <motion.div
                      className="absolute bottom-4 right-4 px-3 py-1.5 rounded-[10px] bg-zinc-900/80 backdrop-blur-xl ring-1 ring-white/10 ring-inset"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                    >
                      <span className="text-xs font-semibold text-cyan-400">{cleanedArea}m²</span>
                    </motion.div>
                  )}
                </motion.div>

                {/* Mode-specific controls */}
                <AnimatePresence mode="wait">
                  {mapMode === "room-select" && (
                    <motion.div
                      key="room-controls"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-3"
                    >
                      {/* Room list */}
                      <div className="bg-white/5 backdrop-blur-xl rounded-[16px] p-3 ring-1 ring-white/10 ring-inset border border-white/5 max-h-[120px] overflow-y-auto">
                        <div className="space-y-2">
                          {rooms.map((room) => (
                            <button
                              key={room.id}
                              onClick={() => toggleRoomSelection(room.id)}
                              className={cn(
                                "flex items-center justify-between w-full p-2 rounded-[10px] transition-all",
                                room.selected ? "bg-white/10" : "bg-transparent hover:bg-white/5"
                              )}
                            >
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: room.color }}
                                />
                                <span className="text-sm font-medium text-white">{room.name}</span>
                              </div>
                              {room.selected && <Check className="w-4 h-4 text-cyan-400" />}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Quick actions */}
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          onClick={selectAllRooms}
                          className="flex items-center justify-center gap-1.5 p-2.5 rounded-[12px] bg-white/5 ring-1 ring-white/10 ring-inset hover:bg-white/10 active:scale-[0.96] transition-all"
                        >
                          <Layers className="w-3.5 h-3.5 text-cyan-400" />
                          <span className="text-xs font-medium text-white">Tout</span>
                        </button>
                        <button
                          onClick={clearRoomSelection}
                          className="flex items-center justify-center gap-1.5 p-2.5 rounded-[12px] bg-white/5 ring-1 ring-white/10 ring-inset hover:bg-white/10 active:scale-[0.96] transition-all"
                        >
                          <X className="w-3.5 h-3.5 text-zinc-400" />
                          <span className="text-xs font-medium text-white">Effacer</span>
                        </button>
                        <button
                          onClick={cleanSelectedRooms}
                          disabled={selectedRooms.length === 0}
                          className={cn(
                            "flex items-center justify-center gap-1.5 p-2.5 rounded-[12px] transition-all",
                            "bg-cyan-500/20 ring-1 ring-cyan-500/30 ring-inset",
                            "hover:bg-cyan-500/30 active:scale-[0.96]",
                            "disabled:opacity-50 disabled:cursor-not-allowed"
                          )}
                        >
                          <Play className="w-3.5 h-3.5 text-cyan-400" />
                          <span className="text-xs font-medium text-cyan-400">Lancer</span>
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {mapMode === "draw-walls" && (
                    <motion.div
                      key="wall-controls"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-3"
                    >
                      <div className="bg-gradient-to-br from-amber-500/10 to-red-500/5 backdrop-blur-xl rounded-[16px] p-4 ring-1 ring-amber-500/20 ring-inset border border-amber-500/10">
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-[10px] bg-amber-500/20 ring-1 ring-amber-500/30 ring-inset">
                            <Pencil className="w-4 h-4 text-amber-400" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-white mb-1">Mode dessin</p>
                            <p className="text-xs text-zinc-400 leading-relaxed">
                              Cliquez sur la carte pour placer des points. Un mur virtuel empêche l'aspirateur de passer.
                            </p>
                          </div>
                        </div>
                      </div>

                      {currentWall.length > 0 && (
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={cancelWall}
                            className="flex items-center justify-center gap-2 p-3 rounded-[12px] bg-white/5 ring-1 ring-white/10 ring-inset hover:bg-white/10 active:scale-[0.96] transition-all"
                          >
                            <X className="w-4 h-4 text-zinc-400" />
                            <span className="text-sm font-medium text-white">Annuler</span>
                          </button>
                          <button
                            onClick={finishWall}
                            className="flex items-center justify-center gap-2 p-3 rounded-[12px] bg-amber-500/20 ring-1 ring-amber-500/30 ring-inset hover:bg-amber-500/30 active:scale-[0.96] transition-all"
                          >
                            <Check className="w-4 h-4 text-amber-400" />
                            <span className="text-sm font-medium text-amber-400">Terminer</span>
                          </button>
                        </div>
                      )}

                      {virtualWalls.length > 0 && (
                        <div className="bg-white/5 backdrop-blur-xl rounded-[16px] p-3 ring-1 ring-white/10 ring-inset border border-white/5">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium text-white">{virtualWalls.length} mur(s) virtuel(s)</span>
                          </div>
                          <p className="text-[10px] text-zinc-500">
                            Cliquez sur un point rouge pour supprimer un mur
                          </p>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {mapMode === "history" && (
                    <motion.div
                      key="history-controls"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-3"
                    >
                      {/* Session selector */}
                      {!selectedSession && (
                        <div className="bg-white/5 backdrop-blur-xl rounded-[16px] p-3 ring-1 ring-white/10 ring-inset border border-white/5 max-h-[160px] overflow-y-auto">
                          <div className="space-y-2">
                            {cleaningSessions.map((session) => (
                              <button
                                key={session.id}
                                onClick={() => startReplay(session)}
                                className="flex items-center justify-between w-full p-3 rounded-[10px] bg-transparent hover:bg-white/10 active:scale-[0.98] transition-all"
                              >
                                <div className="flex flex-col items-start gap-1">
                                  <span className="text-sm font-medium text-white">
                                    {session.date.toLocaleDateString("fr-FR", {
                                      weekday: "short",
                                      day: "numeric",
                                      month: "short"
                                    })}
                                  </span>
                                  <div className="flex items-center gap-2 text-xs text-zinc-500">
                                    <span>{session.duration}min</span>
                                    <span>•</span>
                                    <span>{session.area}m²</span>
                                    <span>•</span>
                                    <span>{session.rooms.length} pièce(s)</span>
                                  </div>
                                </div>
                                <PlayCircle className="w-5 h-5 text-indigo-400" />
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Playback controls */}
                      {selectedSession && (
                        <div className="space-y-3">
                          {/* Progress bar */}
                          <div className="bg-white/5 backdrop-blur-xl rounded-[16px] p-4 ring-1 ring-white/10 ring-inset border border-white/5">
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-sm font-medium text-white">
                                {selectedSession.date.toLocaleDateString("fr-FR", {
                                  day: "numeric",
                                  month: "short",
                                  hour: "2-digit",
                                  minute: "2-digit"
                                })}
                              </span>
                              <span className="text-sm font-semibold text-indigo-400 tabular-nums">
                                {Math.round(replayProgress)}%
                              </span>
                            </div>

                            {/* Progress bar */}
                            <div className="h-2 bg-white/5 rounded-full overflow-hidden relative mb-3">
                              <motion.div
                                className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
                                style={{
                                  width: `${replayProgress}%`,
                                  boxShadow: "0 0 12px #8B5CF660"
                                }}
                              />
                            </div>

                            {/* Stats */}
                            <div className="flex items-center justify-between text-xs text-zinc-500">
                              <span>{selectedSession.duration}min</span>
                              <span>{selectedSession.area}m²</span>
                              <span>{selectedSession.rooms.length} pièces</span>
                            </div>
                          </div>

                          {/* Control buttons */}
                          <div className="grid grid-cols-4 gap-2">
                            <button
                              onClick={() => {
                                setReplayProgress(Math.max(0, replayProgress - 10));
                                hapticLight();
                              }}
                              className="flex flex-col items-center gap-1 p-3 rounded-[12px] bg-white/5 ring-1 ring-white/10 ring-inset hover:bg-white/10 active:scale-[0.96] transition-all"
                            >
                              <Rewind className="w-4 h-4 text-zinc-400" />
                            </button>

                            <button
                              onClick={isReplaying ? stopReplay : () => setIsReplaying(true)}
                              className="flex flex-col items-center gap-1 p-3 rounded-[12px] bg-indigo-500/20 ring-1 ring-indigo-500/30 ring-inset hover:bg-indigo-500/30 active:scale-[0.96] transition-all"
                            >
                              {isReplaying ? (
                                <Pause className="w-4 h-4 text-indigo-400" />
                              ) : (
                                <Play className="w-4 h-4 text-indigo-400" />
                              )}
                            </button>

                            <button
                              onClick={() => {
                                setReplayProgress(Math.min(100, replayProgress + 10));
                                hapticLight();
                              }}
                              className="flex flex-col items-center gap-1 p-3 rounded-[12px] bg-white/5 ring-1 ring-white/10 ring-inset hover:bg-white/10 active:scale-[0.96] transition-all"
                            >
                              <FastForward className="w-4 h-4 text-zinc-400" />
                            </button>

                            <button
                              onClick={() => {
                                setReplaySpeed(prev => prev === 1 ? 2 : prev === 2 ? 4 : 1);
                                hapticLight();
                              }}
                              className="flex flex-col items-center gap-1 p-3 rounded-[12px] bg-white/5 ring-1 ring-white/10 ring-inset hover:bg-white/10 active:scale-[0.96] transition-all"
                            >
                              <span className="text-xs font-semibold text-white">{replaySpeed}x</span>
                            </button>
                          </div>

                          <button
                            onClick={() => {
                              setSelectedSession(null);
                              resetReplay();
                            }}
                            className="flex items-center justify-center gap-2 w-full p-3 rounded-[12px] bg-white/5 ring-1 ring-white/10 ring-inset hover:bg-white/10 active:scale-[0.96] transition-all"
                          >
                            <X className="w-4 h-4 text-zinc-400" />
                            <span className="text-sm font-medium text-white">Fermer</span>
                          </button>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {mapMode === "normal" && (
                    <motion.div
                      key="normal-controls"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-3"
                    >
                      {/* Quick Actions */}
                      <div className="grid grid-cols-4 gap-3">
                        <button
                          onClick={canStart ? handleStart : canPause ? handlePause : handleStart}
                          disabled={state === "returning" || state === "error"}
                          className={cn(
                            "flex flex-col items-center gap-2 p-4 rounded-[16px] backdrop-blur-xl transition-all",
                            "ring-1 ring-inset",
                            canStart || canPause
                              ? "bg-cyan-500/20 ring-cyan-500/30 hover:bg-cyan-500/30"
                              : "bg-white/5 ring-white/10 hover:bg-white/10",
                            "active:scale-[0.96] disabled:opacity-50 disabled:cursor-not-allowed"
                          )}
                          style={canStart || canPause ? {
                            boxShadow: "0 0 20px #06B6D420"
                          } : undefined}
                        >
                          {canPause ? (
                            <Pause className="w-5 h-5 text-cyan-400" />
                          ) : (
                            <Play className="w-5 h-5 text-cyan-400" />
                          )}
                          <span className="text-[10px] font-medium text-white uppercase tracking-wider">
                            {canPause ? "Pause" : "Start"}
                          </span>
                        </button>

                        <button
                          onClick={handleReturnToDock}
                          disabled={state === "docked" || state === "returning"}
                          className={cn(
                            "flex flex-col items-center gap-2 p-4 rounded-[16px] backdrop-blur-xl transition-all",
                            "bg-white/5 ring-1 ring-white/10 ring-inset",
                            "hover:bg-white/10 active:scale-[0.96]",
                            "disabled:opacity-50 disabled:cursor-not-allowed"
                          )}
                        >
                          <Home className="w-5 h-5 text-green-400" />
                          <span className="text-[10px] font-medium text-white uppercase tracking-wider">
                            Base
                          </span>
                        </button>

                        <button
                          onClick={handleLocate}
                          className={cn(
                            "flex flex-col items-center gap-2 p-4 rounded-[16px] backdrop-blur-xl transition-all",
                            "bg-white/5 ring-1 ring-white/10 ring-inset",
                            "hover:bg-white/10 active:scale-[0.96]"
                          )}
                        >
                          <Volume2 className="w-5 h-5 text-amber-400" />
                          <span className="text-[10px] font-medium text-white uppercase tracking-wider">
                            Locate
                          </span>
                        </button>

                        <button
                          className={cn(
                            "flex flex-col items-center gap-2 p-4 rounded-[16px] backdrop-blur-xl transition-all",
                            "bg-white/5 ring-1 ring-white/10 ring-inset",
                            "hover:bg-white/10 active:scale-[0.96]"
                          )}
                        >
                          <Navigation className="w-5 h-5 text-indigo-400" />
                          <span className="text-[10px] font-medium text-white uppercase tracking-wider">
                            Spot
                          </span>
                        </button>
                      </div>

                      {/* Fan Speed Control */}
                      <div className="bg-white/5 backdrop-blur-xl rounded-[20px] p-5 ring-1 ring-white/10 ring-inset border border-white/5">
                        <div className="flex items-center gap-2 mb-4">
                          <Wind className="w-4 h-4 text-zinc-400" />
                          <span className="text-sm font-medium text-white">Puissance d'aspiration</span>
                        </div>

                        <div className="grid grid-cols-4 gap-2">
                          {fanSpeedList.map((speed) => {
                            const speedLabels: Record<string, string> = {
                              silent: "Silence",
                              standard: "Normal",
                              medium: "Moyen",
                              turbo: "Turbo",
                              max: "Max",
                            };
                            const isSelected = fanSpeed === speed;

                            return (
                              <button
                                key={speed}
                                onClick={() => handleSetFanSpeed(speed)}
                                className={cn(
                                  "flex flex-col items-center gap-1.5 p-3 rounded-[12px] backdrop-blur-xl transition-all",
                                  "ring-1 ring-inset",
                                  isSelected
                                    ? "bg-cyan-500/20 ring-cyan-500/30"
                                    : "bg-white/5 ring-white/10 hover:bg-white/10",
                                  "active:scale-[0.96]"
                                )}
                              >
                                <Wind className={cn("w-4 h-4", isSelected ? "text-cyan-400" : "text-zinc-400")} />
                                <span className={cn(
                                  "text-[10px] font-medium uppercase tracking-wider",
                                  isSelected ? "text-cyan-400" : "text-zinc-500"
                                )}>
                                  {speedLabels[speed] || speed}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Stats Grid */}
                <motion.div
                  className="grid grid-cols-3 gap-3"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  {[
                    { label: "Sessions", value: stats.totalCleanings, unit: "", color: "text-white" },
                    { label: "Durée moy", value: stats.avgDuration, unit: "min", color: "text-cyan-400" },
                    { label: "Surface moy", value: stats.avgArea, unit: "m²", color: "text-purple-400" },
                  ].map((stat, i) => (
                    <motion.div
                      key={stat.label}
                      className="flex flex-col items-center gap-2 p-4 bg-white/5 backdrop-blur-xl rounded-[16px] ring-1 ring-white/10 ring-inset border border-white/5"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.45 + i * 0.05 }}
                    >
                      <span className={cn("text-base font-medium tabular-nums", stat.color)}>
                        {stat.value}{stat.unit}
                      </span>
                      <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">
                        {stat.label}
                      </span>
                    </motion.div>
                  ))}
                </motion.div>

                {/* Chart */}
                <motion.div
                  className="bg-white/5 backdrop-blur-xl rounded-[20px] p-5 ring-1 ring-white/10 ring-inset border border-white/5"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-zinc-500" />
                      <span className="text-sm font-medium text-white">Historique 7 jours</span>
                    </div>
                  </div>
                  <div className="h-[220px]">
                    <ReactECharts
                      option={getCleaningChartOptions(cleaningSessions)}
                      style={{ height: '100%', width: '100%' }}
                      theme="dark"
                    />
                  </div>
                </motion.div>

                {/* Maintenance Status */}
                <motion.div
                  className="bg-gradient-to-br from-indigo-500/10 to-purple-500/5 backdrop-blur-xl rounded-[20px] p-5 ring-1 ring-indigo-500/20 ring-inset border border-indigo-500/10"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <div className="flex items-center gap-2 mb-4">
                    <div className="p-2 rounded-[10px] bg-indigo-500/20 ring-1 ring-indigo-500/30 ring-inset">
                      <RotateCw className="w-4 h-4 text-indigo-400" />
                    </div>
                    <span className="text-sm font-medium text-white">État des consommables</span>
                  </div>

                  <div className="space-y-3">
                    {[
                      { label: "Brosse principale", value: maintenance.mainBrush, icon: Activity },
                      { label: "Brosse latérale", value: maintenance.sideBrush, icon: Wind },
                      { label: "Filtre", value: maintenance.filter, icon: Filter },
                    ].map((item) => (
                      <div key={item.label} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <item.icon className="w-3.5 h-3.5 text-zinc-400" />
                            <span className="text-xs font-medium text-white">{item.label}</span>
                          </div>
                          <span className={cn(
                            "text-xs font-semibold tabular-nums",
                            item.value > 50 ? "text-green-400" : item.value > 20 ? "text-amber-400" : "text-red-400"
                          )}>
                            {item.value}%
                          </span>
                        </div>
                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full rounded-full"
                            style={{
                              background: item.value > 50
                                ? "linear-gradient(to right, #10B981, #34D399)"
                                : item.value > 20
                                  ? "linear-gradient(to right, #F59E0B, #FBBF24)"
                                  : "linear-gradient(to right, #EF4444, #F87171)"
                            }}
                            initial={{ width: 0 }}
                            animate={{ width: `${item.value}%` }}
                            transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>

                {/* Device Info */}
                <motion.div
                  className="bg-zinc-900/60 backdrop-blur-xl rounded-[20px] overflow-hidden divide-y divide-white/5 ring-1 ring-white/10 ring-inset border border-white/5"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                >
                  <div className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-[10px] bg-white/5 ring-1 ring-white/10 ring-inset">
                        <Clock className="w-4 h-4 text-zinc-400" />
                      </div>
                      <span className="text-sm font-medium text-white">Dernière mise à jour</span>
                    </div>
                    <span className="text-zinc-500 text-sm tabular-nums">
                      {new Date(entity.last_updated).toLocaleTimeString("fr-FR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </motion.div>
              </motion.div>
            ) : (
              // --- SETTINGS PANEL ---
              <motion.div
                key="settings"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className="px-6 pb-6 space-y-5"
              >
                <div className="text-center mb-4">
                  <h3 className="text-lg font-medium text-white mb-1">Paramètres</h3>
                  <p className="text-xs text-zinc-500">Configuration de l'aspirateur</p>
                </div>

                {/* Auto Empty */}
                <div className="bg-white/5 backdrop-blur-xl rounded-[20px] p-4 ring-1 ring-white/10 ring-inset border border-white/5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-[10px] bg-white/5 ring-1 ring-white/10 ring-inset">
                        <Droplets className="w-4 h-4 text-cyan-400" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-white">Vidage automatique</div>
                        <div className="text-xs text-zinc-500">Station de vidage</div>
                      </div>
                    </div>
                    <Switch
                      checked={autoEmpty}
                      onCheckedChange={(checked) => {
                        setAutoEmpty(checked);
                        hapticLight();
                      }}
                    />
                  </div>
                </div>

                {/* Schedule */}
                <div className="bg-white/5 backdrop-blur-xl rounded-[20px] p-4 ring-1 ring-white/10 ring-inset border border-white/5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-[10px] bg-white/5 ring-1 ring-white/10 ring-inset">
                        <Clock className="w-4 h-4 text-amber-400" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-white">Programmation</div>
                        <div className="text-xs text-zinc-500">Nettoyage automatique</div>
                      </div>
                    </div>
                    <Switch
                      checked={scheduleEnabled}
                      onCheckedChange={(checked) => {
                        setScheduleEnabled(checked);
                        hapticLight();
                      }}
                    />
                  </div>
                </div>

                {/* Info Cards */}
                <div className="space-y-3">
                  {[
                    { label: "Entity ID", value: entityId, icon: Info },
                    { label: "État", value: config.label, icon: CircleDot },
                    { label: "Puissance", value: fanSpeed, icon: Wind },
                    { label: "Type", value: "Robot aspirateur", icon: Home },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center justify-between p-4 bg-white/5 backdrop-blur-xl rounded-[16px] ring-1 ring-white/10 ring-inset"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-[10px] bg-white/5 ring-1 ring-white/10 ring-inset">
                          <item.icon className="w-4 h-4 text-zinc-400" />
                        </div>
                        <span className="text-sm text-zinc-300">{item.label}</span>
                      </div>
                      <span className="text-sm font-medium text-white truncate max-w-[160px]">
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Advanced Button */}
                <button className="flex items-center justify-between p-4 w-full bg-white/5 backdrop-blur-xl rounded-[16px] ring-1 ring-white/10 ring-inset hover:bg-white/10 active:scale-[0.98] transition-all">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-[10px] bg-white/5 ring-1 ring-white/10 ring-inset">
                      <Settings className="w-4 h-4 text-zinc-400" />
                    </div>
                    <span className="text-sm font-medium text-white">Configuration avancée</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-500" />
                </button>

                {/* Maintenance Button */}
                <button className="flex items-center justify-between p-4 w-full bg-gradient-to-br from-indigo-500/10 to-purple-500/5 backdrop-blur-xl rounded-[16px] ring-1 ring-indigo-500/20 ring-inset hover:from-indigo-500/15 active:scale-[0.98] transition-all">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-[10px] bg-indigo-500/20 ring-1 ring-indigo-500/30 ring-inset">
                      <RotateCw className="w-4 h-4 text-indigo-400" />
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-medium text-white">Maintenance</div>
                      <div className="text-xs text-zinc-500">Consommables et entretien</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-500" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>

      {/* CSS for spinning animation - Removed as we use Framer Motion or Tailwind */}
    </>
  );
};
