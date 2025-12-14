import React, {
  useState,
  useMemo,
  useCallback,
  useRef,
} from "react";
import {
  useEntity,
  useService,
  type EntityName,
} from "@hakit/core";
import { AuroraCard } from "./base/AuroraCard";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";
import { Slider } from "../ui/slider";
import { Switch } from "../ui/switch";
import {
  Blinds,
  ChevronUp,
  ChevronDown,
  Square,
  Pause,
  Settings,
  Clock,
  Sun,
  Moon,
  Zap,
  TrendingDown,
  BarChart3,
  ChevronRight,
  Info,
  Home,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { motion, AnimatePresence } from "motion/react";
import ReactECharts from "echarts-for-react";
import { toast } from "sonner";

interface AuroraCoverCardProps {
  entityId: EntityName;
  className?: string;
  titleOverride?: string;
}

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

const hapticStep = () => {
  if (typeof navigator !== "undefined" && navigator.vibrate) {
    navigator.vibrate(5);
  }
};

// --- Generate Demo Position History ---
const generateCoverHistory = (
  currentPosition: number,
  hours: number = 24,
) => {
  const data = [];
  const now = Date.now();

  for (let i = hours; i >= 0; i--) {
    const time = now - i * 60 * 60 * 1000;
    const hour = new Date(time).getHours();

    // Simulate realistic behavior: open during day, closed at night
    let position = currentPosition;
    if (i > 2) {
      if (hour >= 7 && hour <= 19) {
        position = 70 + Math.random() * 30;
      } else {
        position = Math.random() * 30;
      }
    }

    data.push({ time, position: Math.round(position) });
  }

  return data;
};

// --- Chart Options ---
const getCoverChartOptions = (data: any[]) => ({
  backgroundColor: "transparent",
  grid: { top: 30, right: 15, bottom: 50, left: 60 },
  xAxis: {
    type: "time",
    axisLine: { lineStyle: { color: "rgba(255,255,255,0.1)" } },
    axisLabel: {
      color: "rgba(161,161,170,1)",
      fontSize: 11,
      fontWeight: 500,
      formatter: (value: number) => {
        const date = new Date(value);
        return date.getHours() + "h";
      },
    },
    splitLine: { show: false },
  },
  yAxis: {
    type: "value",
    min: 0,
    max: 100,
    axisLine: { show: false },
    axisLabel: {
      color: "rgba(161,161,170,1)",
      fontSize: 11,
      fontWeight: 500,
      formatter: (value: number) => value + "%",
    },
    splitLine: {
      lineStyle: {
        color: "rgba(255,255,255,0.05)",
        type: "dashed",
      },
    },
  },
  tooltip: {
    trigger: "axis",
    backgroundColor: "rgba(24, 24, 27, 0.95)",
    borderColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
    borderRadius: 16,
    padding: [12, 16],
    textStyle: { color: "#fff", fontSize: 13, fontWeight: 500 },
    formatter: (params: any) => {
      const p = params[0];
      const date = new Date(p.value[0]);
      const time = date.toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
      });
      return `<div style="font-weight: 600;">${time}</div><div style="margin-top: 4px; font-size: 16px;">${p.value[1]}% ouvert</div>`;
    },
  },
  series: [
    {
      type: "line",
      smooth: 0.3,
      symbol: "circle",
      symbolSize: 6,
      showSymbol: false,
      step: "end",
      lineStyle: { color: "#06B6D4", width: 2.5 },
      itemStyle: {
        color: "#06B6D4",
        borderColor: "rgba(255,255,255,0.2)",
        borderWidth: 2,
      },
      emphasis: {
        scale: true,
        focus: "series",
        itemStyle: { shadowBlur: 12, shadowColor: "#06B6D4" },
      },
      areaStyle: {
        color: {
          type: "linear",
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: "#06B6D440" },
            { offset: 0.5, color: "#06B6D415" },
            { offset: 1, color: "#06B6D400" },
          ],
        },
      },
      data: data.map((d) => [d.time, d.position]),
    },
  ],
});

// --- Main Component ---
export const AuroraCoverCard: React.FC<
  AuroraCoverCardProps
> = ({ entityId, className, titleOverride }) => {
  let entity: any;
  try {
    entity = useEntity(entityId);
  } catch (e) {
    entity = {
      state: "closed",
      attributes: {
        friendly_name: titleOverride || "Cover",
        current_position: 0,
        device_class: "blind",
      },
    };
  }
  const cover = useService("cover");
  const [open, setOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [targetPosition, setTargetPosition] = useState<
    number[]
  >([50]);
  const [autoMode, setAutoMode] = useState(false);

  // Long press detection
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const [isPressed, setIsPressed] = useState(false);

  const position =
    (entity.attributes.current_position as number) ?? 0;
  const friendly =
    titleOverride || entity.attributes.friendly_name || "Store";
  const state = entity.state as string;
  const isMoving = state === "opening" || state === "closing";
  const isOpen = position > 50;

  // Long press handlers for card
  const handleTouchStart = useCallback(() => {
    setIsPressed(true);
    hapticLight();
    longPressTimer.current = setTimeout(() => {
      hapticSuccess();
      setOpen(true);
    }, 500); // 500ms for long press
  }, []);

  const handleTouchEnd = useCallback(() => {
    setIsPressed(false);
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const handleCardClick = useCallback(() => {
    // Simple tap opens details
    hapticLight();
    setOpen(true);
  }, []);

  // Service calls
  const handleOpen = useCallback(async () => {
    try {
      toast.loading("Ouverture…", { id: entityId });
      await cover.openCover({ target: entityId });
      toast.success("En cours d'ouverture", { id: entityId });
      hapticSuccess();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Échec", {
        id: entityId,
      });
    }
  }, [cover, entityId]);

  const handleClose = useCallback(async () => {
    try {
      toast.loading("Fermeture…", { id: entityId });
      await cover.closeCover({ target: entityId });
      toast.success("En cours de fermeture", { id: entityId });
      hapticSuccess();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Échec", {
        id: entityId,
      });
    }
  }, [cover, entityId]);

  const handleStop = useCallback(async () => {
    try {
      await cover.stopCover({ target: entityId });
      toast.success("Arrêté", { id: entityId });
      hapticLight();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Échec", {
        id: entityId,
      });
    }
  }, [cover, entityId]);

  const handleSetPosition = useCallback(
    async (pos: number) => {
      try {
        toast.loading(`Positionnement à ${pos}%…`, {
          id: entityId,
        });
        await cover.setCoverPosition({
          target: entityId,
          position: pos,
        });
        toast.success(`Position: ${pos}%`, { id: entityId });
        hapticLight();
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : "Échec", {
          id: entityId,
        });
      }
    },
    [cover, entityId],
  );

  // Generate history data
  const chartData = useMemo(() => {
    return generateCoverHistory(position, 24);
  }, [position]);

  // Calculate stats
  const stats = useMemo(() => {
    if (chartData.length === 0) return null;
    const positions = chartData.map((d) => d.position);
    const avgPosition =
      positions.reduce((a, b) => a + b, 0) / positions.length;

    // Count position changes
    let changes = 0;
    for (let i = 1; i < positions.length; i++) {
      if (Math.abs(positions[i] - positions[i - 1]) > 10)
        changes++;
    }

    return {
      avgPosition: Math.round(avgPosition),
      changes,
      openHours: positions.filter((p) => p > 50).length,
      closedHours: positions.filter((p) => p <= 50).length,
    };
  }, [chartData]);

  // Energy savings estimate (based on position)
  const energySavings = useMemo(() => {
    const closedPercentage = (100 - position) / 100;
    return Math.round(closedPercentage * 15); // Up to 15% savings when fully closed
  }, [position]);

  return (
    <>
      {/* --- DASHBOARD TILE --- */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{
          duration: 0.4,
          ease: [0.25, 0.1, 0.25, 1],
        }}
        className="relative w-full h-full"
      >
        <AuroraCard
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onClick={handleCardClick}
          className={cn(
            "relative flex flex-col justify-between p-5 select-none cursor-pointer group overflow-hidden",
            "rounded-[24px]",
            // Neo-Glass Material
            "bg-zinc-900/40 backdrop-blur-3xl",
            "ring-1 ring-white/10 ring-inset",
            "border border-white/5",
            "shadow-xl shadow-black/20",
            // Hover
            "hover:bg-zinc-900/50 active:scale-[0.98]",
            "transition-all duration-300",
            className,
          )}
        >
          {/* Active Glow when moving */}
          {isMoving && (
            <motion.div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `radial-gradient(circle at 50% 120%, #06B6D415, transparent 60%)`,
              }}
              animate={{
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          )}

          {/* Header */}
          <div className="flex justify-between items-start relative z-10">
            {/* Icon */}
            <motion.div
              className={cn(
                "w-11 h-11 rounded-[14px] flex items-center justify-center",
                "ring-1 ring-inset backdrop-blur-xl",
                isMoving
                  ? "bg-cyan-500/20 ring-cyan-500/30"
                  : "bg-white/5 ring-white/10",
              )}
              style={
                isMoving
                  ? {
                    boxShadow: `0 0 20px #06B6D440, inset 0 1px 0 rgba(255,255,255,0.1)`,
                  }
                  : undefined
              }
              whileHover={{ scale: 1.05 }}
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 20,
              }}
            >
              <Blinds
                className={cn(
                  "w-5 h-5",
                  isMoving ? "text-cyan-400" : "text-zinc-400",
                )}
              />
            </motion.div>

            {/* Status Badge */}
            <AnimatePresence>
              {isMoving && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1.5 rounded-[10px]",
                    "bg-cyan-500/20 backdrop-blur-xl",
                    "ring-1 ring-cyan-500/30 ring-inset border border-cyan-500/20",
                  )}
                >
                  <Pause className="w-3 h-3 text-cyan-400" />
                  <span className="text-[10px] font-semibold tracking-wide text-cyan-400">
                    {state === "opening"
                      ? "Ouverture"
                      : "Fermeture"}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Center: Position fVisualization */}
          <div className="flex flex-col items-center justify-center relative z-10 my-2">
            {/* Visual Blind Representation */}
            <div className="w-24 h-24 relative">
              {/* Frame */}
              <div className="absolute inset-0 rounded-[8px] ring-1 ring-white/10 ring-inset bg-white/5" />

              {/* Blind/Slats (animated based on position) */}
              <div className="absolute inset-1 overflow-hidden rounded-[6px]">
                <motion.div
                  className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-cyan-500/30 to-cyan-400/20 backdrop-blur-sm"
                  initial={{ height: `${position}%` }}
                  animate={{ height: `${position}%` }}
                  transition={{
                    duration: 0.6,
                    ease: [0.25, 0.1, 0.25, 1],
                  }}
                  style={{
                    boxShadow:
                      "inset 0 1px 0 rgba(255,255,255,0.1)",
                  }}
                >
                  {/* Slats effect */}
                  {[...Array(8)].map((_, i) => (
                    <div
                      key={i}
                      className="h-[2px] bg-white/10 mb-2"
                      style={{
                        transform: `translateY(${i * 10}px)`,
                      }}
                    />
                  ))}
                </motion.div>
              </div>
            </div>

            {/* Position Display */}
            <div className="absolute flex flex-col items-center">
              <span className="text-2xl font-medium text-white tracking-tight leading-none">
                {position}
              </span>
              <span className="text-xs text-zinc-500 font-medium">
                %
              </span>
            </div>
          </div>

          {/* Footer */}
          <div className="flex flex-col gap-2 relative z-10">
            {/* Title + Status */}
            <div className="flex items-center justify-between">
              <span className="text-xs tracking-wider uppercase text-zinc-500 font-medium">
                {friendly}
              </span>
              <span
                className={cn(
                  "text-xs font-semibold",
                  isOpen ? "text-cyan-400" : "text-zinc-400",
                )}
              >
                {isOpen ? "Ouvert" : "Fermé"}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden relative">
              <motion.div
                className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-cyan-500 to-cyan-400"
                style={{
                  boxShadow: "0 0 8px #06B6D460",
                }}
                initial={{ width: 0 }}
                animate={{ width: `${position}%` }}
                transition={{
                  duration: 0.6,
                  ease: [0.25, 0.1, 0.25, 1],
                }}
              />
            </div>

            {/* Quick Actions (mini) */}
            <div className="flex items-center justify-between text-[10px] tracking-wider uppercase font-medium">
              <span className="text-zinc-600">Fermé</span>
              {energySavings > 0 && (
                <div className="flex items-center gap-1 text-green-500">
                  <TrendingDown className="w-3 h-3" />
                  <span>{energySavings}% énergie</span>
                </div>
              )}
              <span className="text-zinc-600">Ouvert</span>
            </div>
          </div>
        </AuroraCard>
      </motion.div>

      {/* --- INSPECTOR DIALOG --- */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-zinc-900/95 backdrop-blur-3xl ring-1 ring-white/10 ring-inset border border-white/5 shadow-2xl sm:max-w-[520px] sm:rounded-[28px] p-0 overflow-hidden gap-0 max-h-[90vh] overflow-y-auto">
          <DialogHeader className="sr-only">
            <DialogTitle>Cover Control</DialogTitle>
            <DialogDescription>
              Advanced blind and cover control
            </DialogDescription>
          </DialogHeader>

          {/* Header */}
          <motion.div
            className="flex flex-col items-center justify-center pt-8 pb-6 relative"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {/* Glow */}
            {isMoving && (
              <div
                className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 blur-3xl opacity-20 pointer-events-none"
                style={{ backgroundColor: "#06B6D4" }}
              />
            )}

            {/* Icon Container */}
            <motion.div
              className={cn(
                "w-20 h-20 rounded-full flex items-center justify-center mb-4 relative",
                "ring-1 ring-inset backdrop-blur-xl",
                isMoving
                  ? "bg-cyan-500/20 ring-cyan-500/30"
                  : "bg-white/5 ring-white/10",
              )}
              style={
                isMoving
                  ? {
                    boxShadow: `0 0 30px #06B6D430, inset 0 1px 0 rgba(255,255,255,0.1)`,
                  }
                  : undefined
              }
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Blinds
                className={cn(
                  "w-10 h-10 relative z-10",
                  isMoving ? "text-cyan-400" : "text-zinc-400",
                )}
              />
            </motion.div>

            <DialogTitle className="text-2xl font-medium text-center tracking-tight text-white mb-1">
              {friendly}
            </DialogTitle>
            <DialogDescription className="text-xs tracking-wider uppercase text-zinc-500 font-medium">
              Contrôle de store
            </DialogDescription>

            {/* Settings Toggle */}
            <div className="absolute top-6 right-6">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className={cn(
                  "p-2.5 rounded-[12px] backdrop-blur-xl transition-all",
                  "ring-1 ring-inset",
                  showSettings
                    ? "bg-cyan-500/20 ring-cyan-500/30"
                    : "bg-white/5 ring-white/10 hover:bg-white/10",
                )}
              >
                <Settings
                  className={cn(
                    "w-4 h-4",
                    showSettings
                      ? "text-cyan-400"
                      : "text-zinc-400",
                  )}
                />
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
                {/* Large Position Control */}
                <motion.div
                  className="bg-white/5 backdrop-blur-xl rounded-[20px] p-6 ring-1 ring-white/10 ring-inset border border-white/5"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-sm font-medium text-white">
                      Position
                    </span>
                    <span className="text-3xl font-light text-white tabular-nums">
                      {position}%
                    </span>
                  </div>

                  {/* Slider */}
                  <div className="space-y-4">
                    <Slider
                      value={targetPosition}
                      onValueChange={setTargetPosition}
                      max={100}
                      step={5}
                      className="cursor-pointer"
                    />
                    <button
                      onClick={() =>
                        handleSetPosition(targetPosition[0])
                      }
                      className={cn(
                        "w-full py-3 rounded-[14px] backdrop-blur-xl transition-all",
                        "bg-cyan-500/20 ring-1 ring-cyan-500/30 ring-inset",
                        "text-cyan-400 font-semibold text-sm",
                        "hover:bg-cyan-500/30 active:scale-[0.98]",
                      )}
                      style={{
                        boxShadow: "0 0 20px #06B6D420",
                      }}
                    >
                      Définir à {targetPosition[0]}%
                    </button>
                  </div>
                </motion.div>

                {/* Control Buttons */}
                <motion.div
                  className="grid grid-cols-3 gap-3"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <button
                    onClick={handleOpen}
                    className={cn(
                      "flex flex-col items-center gap-2 p-4 rounded-[16px] backdrop-blur-xl transition-all",
                      "bg-white/5 ring-1 ring-white/10 ring-inset",
                      "hover:bg-white/10 active:scale-[0.96]",
                    )}
                  >
                    <ChevronUp className="w-5 h-5 text-cyan-400" />
                    <span className="text-xs font-medium text-white">
                      Ouvrir
                    </span>
                  </button>

                  <button
                    onClick={handleStop}
                    className={cn(
                      "flex flex-col items-center gap-2 p-4 rounded-[16px] backdrop-blur-xl transition-all",
                      "bg-white/5 ring-1 ring-white/10 ring-inset",
                      "hover:bg-white/10 active:scale-[0.96]",
                    )}
                  >
                    <Square className="w-5 h-5 text-amber-400" />
                    <span className="text-xs font-medium text-white">
                      Stop
                    </span>
                  </button>

                  <button
                    onClick={handleClose}
                    className={cn(
                      "flex flex-col items-center gap-2 p-4 rounded-[16px] backdrop-blur-xl transition-all",
                      "bg-white/5 ring-1 ring-white/10 ring-inset",
                      "hover:bg-white/10 active:scale-[0.96]",
                    )}
                  >
                    <ChevronDown className="w-5 h-5 text-indigo-400" />
                    <span className="text-xs font-medium text-white">
                      Fermer
                    </span>
                  </button>
                </motion.div>

                {/* Quick Presets */}
                <motion.div
                  className="bg-zinc-900/60 backdrop-blur-xl rounded-[20px] p-4 ring-1 ring-white/10 ring-inset border border-white/5"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Home className="w-4 h-4 text-zinc-400" />
                    <span className="text-sm font-medium text-white">
                      Positions favorites
                    </span>
                  </div>
                  <div className="flex gap-2">
                    {[
                      { label: "Matin", value: 75, icon: Sun },
                      { label: "Jour", value: 100, icon: Sun },
                      { label: "Soir", value: 50, icon: Moon },
                      { label: "Nuit", value: 0, icon: Moon },
                    ].map((preset) => (
                      <button
                        key={preset.label}
                        onClick={() =>
                          handleSetPosition(preset.value)
                        }
                        className={cn(
                          "flex-1 flex flex-col items-center gap-1.5 p-3 rounded-[12px] backdrop-blur-xl transition-all",
                          "bg-white/5 ring-1 ring-white/10 ring-inset",
                          "hover:bg-white/10 active:scale-[0.96]",
                        )}
                      >
                        <preset.icon className="w-4 h-4 text-zinc-400" />
                        <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider">
                          {preset.label}
                        </span>
                        <span className="text-xs font-semibold text-white tabular-nums">
                          {preset.value}%
                        </span>
                      </button>
                    ))}
                  </div>
                </motion.div>

                {/* Stats Grid */}
                {stats && (
                  <motion.div
                    className="grid grid-cols-3 gap-3"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    {[
                      {
                        label: "Moy 24h",
                        value: `${stats.avgPosition}%`,
                        color: "text-white",
                      },
                      {
                        label: "Ouvert",
                        value: `${stats.openHours}h`,
                        color: "text-cyan-400",
                      },
                      {
                        label: "Fermé",
                        value: `${stats.closedHours}h`,
                        color: "text-indigo-400",
                      },
                    ].map((stat, i) => (
                      <motion.div
                        key={stat.label}
                        className="flex flex-col items-center gap-2 p-4 bg-white/5 backdrop-blur-xl rounded-[16px] ring-1 ring-white/10 ring-inset border border-white/5"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.45 + i * 0.05 }}
                      >
                        <span
                          className={cn(
                            "text-base font-medium tabular-nums",
                            stat.color,
                          )}
                        >
                          {stat.value}
                        </span>
                        <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">
                          {stat.label}
                        </span>
                      </motion.div>
                    ))}
                  </motion.div>
                )}

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
                      <span className="text-sm font-medium text-white">
                        Historique 24h
                      </span>
                    </div>
                  </div>
                  <div className="h-[200px]">
                    <ReactECharts
                      option={getCoverChartOptions(chartData)}
                      style={{ height: "100%", width: "100%" }}
                      theme="dark"
                    />
                  </div>
                </motion.div>

                {/* Energy Savings */}
                {energySavings > 0 && (
                  <motion.div
                    className="bg-gradient-to-br from-green-500/10 to-emerald-500/5 backdrop-blur-xl rounded-[20px] p-4 ring-1 ring-green-500/20 ring-inset border border-green-500/10"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-[12px] bg-green-500/20 ring-1 ring-green-500/30 ring-inset">
                        <Zap className="w-5 h-5 text-green-400" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-semibold text-green-400">
                            {energySavings}%
                          </span>
                          <span className="text-sm text-zinc-400">
                            économie d'énergie
                          </span>
                        </div>
                        <p className="text-xs text-zinc-500 mt-1">
                          Isolation thermique optimale
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

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
                      <span className="text-sm font-medium text-white">
                        Dernière mise à jour
                      </span>
                    </div>
                    <span className="text-zinc-500 text-sm tabular-nums">
                      {new Date(
                        entity.last_updated,
                      ).toLocaleTimeString("fr-FR", {
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
                  <h3 className="text-lg font-medium text-white mb-1">
                    Paramètres
                  </h3>
                  <p className="text-xs text-zinc-500">
                    Configuration avancée
                  </p>
                </div>

                {/* Auto Mode */}
                <div className="bg-white/5 backdrop-blur-xl rounded-[20px] p-4 ring-1 ring-white/10 ring-inset border border-white/5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-[10px] bg-white/5 ring-1 ring-white/10 ring-inset">
                        <Sun className="w-4 h-4 text-amber-400" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-white">
                          Mode automatique
                        </div>
                        <div className="text-xs text-zinc-500">
                          Selon luminosité
                        </div>
                      </div>
                    </div>
                    <Switch
                      checked={autoMode}
                      onCheckedChange={setAutoMode}
                    />
                  </div>
                </div>

                {/* Info Cards */}
                <div className="space-y-3">
                  {[
                    {
                      label: "Type d'appareil",
                      value: "Store motorisé",
                      icon: Info,
                    },
                    {
                      label: "Changements 24h",
                      value: `${stats?.changes || 0} fois`,
                      icon: BarChart3,
                    },
                    {
                      label: "État",
                      value: state,
                      icon: Blinds,
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center justify-between p-4 bg-white/5 backdrop-blur-xl rounded-[16px] ring-1 ring-white/10 ring-inset"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-[10px] bg-white/5 ring-1 ring-white/10 ring-inset">
                          <item.icon className="w-4 h-4 text-zinc-400" />
                        </div>
                        <span className="text-sm text-zinc-300">
                          {item.label}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-white">
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
                    <span className="text-sm font-medium text-white">
                      Configuration avancée
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-500" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>
    </>
  );
};

// Legacy export alias for backward compatibility
export const AuroraCover = AuroraCoverCard;