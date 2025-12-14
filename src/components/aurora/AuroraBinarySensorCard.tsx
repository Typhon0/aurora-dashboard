import React, {
  useState,
  useMemo,
  useCallback,
  useRef,
  useEffect,
} from "react";
import { useEntity, type EntityName } from "@hakit/core";
import { AuroraCard } from "./base/AuroraCard";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";
import { Switch } from "../ui/switch";
import { Slider } from "../ui/slider";
import {
  DoorOpen,
  DoorClosed,
  Home,
  Flame,
  Droplets,
  Lock,
  LockOpen,
  Settings,
  Clock,
  Bell,
  Activity,
  Zap,
  Eye,
  History,
  Thermometer,
  ShieldAlert,
  Battery,
  ChevronRight,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

// --- Types & Interfaces ---

interface AuroraBinarySensorCardProps {
  entityId: EntityName;
  className?: string;
  titleOverride?: string;
  activeStates?: string[];
}

type SensorType = {
  type: string;
  icon: any;
  activeIcon: any;
  color: string; // Tailwind text color class
  hex: string; // Hex for charts/glows
  label: string;
  activeLabel: string;
};

// --- Haptic Helpers ---
const haptic = {
  light: () => typeof navigator !== "undefined" && navigator.vibrate?.(10),
  medium: () => typeof navigator !== "undefined" && navigator.vibrate?.(20),
  success: () =>
    typeof navigator !== "undefined" && navigator.vibrate?.([10, 30, 10]),
};

// --- Sensor Logic ---
const detectSensorType = (
  deviceClass?: string,
  state?: string,
): SensorType => {
  const dc = deviceClass?.toLowerCase() || "";

  if (dc.includes("door") || dc.includes("garage")) {
    return {
      type: "door",
      icon: DoorClosed,
      activeIcon: DoorOpen,
      color: "text-cyan-400",
      hex: "#22d3ee",
      label: "Closed",
      activeLabel: "Open",
    };
  }
  if (dc.includes("window")) {
    return {
      type: "window",
      icon: Home,
      activeIcon: Home,
      color: "text-blue-400",
      hex: "#60a5fa",
      label: "Secure",
      activeLabel: "Open",
    };
  }
  if (dc.includes("motion") || dc.includes("occupancy") || dc.includes("presence")) {
    return {
      type: "motion",
      icon: Eye,
      activeIcon: Activity,
      color: "text-amber-400",
      hex: "#fbbf24",
      label: "Clear",
      activeLabel: "Motion",
    };
  }
  if (dc.includes("smoke") || dc.includes("gas") || dc.includes("heat")) {
    return {
      type: "danger",
      icon: ShieldAlert,
      activeIcon: Flame,
      color: "text-red-500",
      hex: "#ef4444",
      label: "Safe",
      activeLabel: "DANGER",
    };
  }
  if (dc.includes("moisture") || dc.includes("water")) {
    return {
      type: "water",
      icon: Droplets,
      activeIcon: Droplets,
      color: "text-blue-500",
      hex: "#3b82f6",
      label: "Dry",
      activeLabel: "Leak Detected",
    };
  }
  if (dc.includes("lock")) {
    return {
      type: "lock",
      icon: Lock,
      activeIcon: LockOpen,
      color: "text-emerald-400",
      hex: "#34d399",
      label: "Locked",
      activeLabel: "Unlocked",
    };
  }

  // Default
  return {
    type: "generic",
    icon: Activity,
    activeIcon: Zap,
    color: "text-zinc-400",
    hex: "#a1a1aa",
    label: "Inactive",
    activeLabel: "Active",
  };
};

// --- Mock History Generator ---
const generateHistory = (isActive: boolean) => {
  const data = [];
  const now = new Date();
  for (let i = 24; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 60 * 60 * 1000);
    // Simulate some randomness but keep it somewhat consistent
    let value = 0;
    if (i % 8 === 0) value = 1; // Periodic activity
    if (isActive && i === 0) value = 1; // Current state

    data.push({
      time: time.getHours() + ":00",
      value: value,
      rawTime: time,
    });
  }
  return data;
};

// --- Main Component ---
export const AuroraBinarySensorCard: React.FC<AuroraBinarySensorCardProps> = ({
  entityId,
  className,
  titleOverride,
  activeStates = ["on", "open", "unlocked", "detected", "unsafe"],
}) => {
  // 1. Data Hooks
  let entity: any;
  try {
    entity = useEntity(entityId);
  } catch (e) {
    // Mock for preview if no HA connection
    entity = {
      state: "off",
      attributes: {
        friendly_name: titleOverride || "Living Room Motion",
        device_class: "motion",
        last_changed: new Date().toISOString(),
        battery_level: 85,
      },
    };
  }

  // 2. State & Config
  const [isOpen, setIsOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const isActive = activeStates.includes(entity.state);
  const lastChanged = new Date(entity.attributes.last_changed || Date.now());
  const friendlyName = titleOverride || entity.attributes.friendly_name || entityId;
  const config = detectSensorType(entity.attributes.device_class, entity.state);

  // 3. Derived Visuals
  const historyData = useMemo(() => generateHistory(isActive), [isActive]);

  // Calculate "Time Since"
  const [timeSince, setTimeSince] = useState<string>("");
  useEffect(() => {
    const updateTime = () => {
      const diff = Math.floor((Date.now() - lastChanged.getTime()) / 1000);
      if (diff < 60) setTimeSince(`${diff}s`);
      else if (diff < 3600) setTimeSince(`${Math.floor(diff / 60)}m`);
      else if (diff < 86400) setTimeSince(`${Math.floor(diff / 3600)}h`);
      else setTimeSince(`${Math.floor(diff / 86400)}d`);
    };
    updateTime();
    const interval = setInterval(updateTime, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [lastChanged]);

  // 4. Interaction Handlers
  const handleOpen = () => {
    haptic.light();
    setIsOpen(true);
  };

  const Icon = isActive ? config.activeIcon : config.icon;

  return (
    <>
      <AuroraCard
        onClick={handleOpen}
        className={cn(
          "relative w-full h-full overflow-hidden cursor-pointer select-none group @container",
          // Glass Base
          "bg-zinc-900/40 backdrop-blur-2xl",
          "ring-1 ring-white/10 ring-inset",
          "border border-white/5",
          // Hover Effects
          "hover:bg-zinc-900/60 transition-all duration-300",
          "active:scale-[0.98]",
          className
        )}
      >
        {/* --- Background: Temporal Barcode Visualization --- */}
        {/* This creates a subtle visual history on the card background */}
        <div className="absolute inset-0 z-0 flex items-end opacity-20 mask-image-b-gradient">
          <div className="w-full h-1/2 flex items-end gap-[2px] px-4 pb-4">
            {historyData.map((point, i) => (
              <div
                key={i}
                className={cn(
                  "flex-1 rounded-t-sm transition-all duration-500",
                  point.value === 1 ? "bg-current opacity-100 h-full" : "bg-white/10 h-[10%]"
                )}
                style={{ color: point.value === 1 ? config.hex : undefined }}
              />
            ))}
          </div>
        </div>

        {/* --- Active Glow State --- */}
        {isActive && (
          <div
            className="absolute inset-0 z-0 opacity-20 pointer-events-none"
            style={{
              background: `radial-gradient(circle at top left, ${config.hex}, transparent 70%)`
            }}
          />
        )}

        {/* --- Content Layout --- */}
        <div className="relative z-10 flex flex-col justify-between h-full p-2.5 @[200px]:p-4">

          {/* Header: Icon + Time */}
          <div className="flex justify-between items-start">
            <motion.div
              initial={false}
              animate={{
                backgroundColor: isActive ? `${config.hex}33` : "rgba(255,255,255,0.05)",
                color: isActive ? config.hex : "rgba(161, 161, 170, 1)" // zinc-400
              }}
              className={cn(
                "p-2 rounded-xl backdrop-blur-md ring-1 ring-inset ring-white/10",
                "transition-colors duration-300"
              )}
            >
              <Icon className="w-5 h-5 @[200px]:w-6 @[200px]:h-6" />
            </motion.div>

            {/* Time Badge */}
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-black/20 backdrop-blur-sm border border-white/5">
              <Clock className="w-3 h-3 text-zinc-500" />
              <span className="text-xs font-medium text-zinc-300 tabular-nums">
                {timeSince}
              </span>
            </div>
          </div>

          {/* Spacer for potential middle content in larger sizes */}
          <div className="flex-1" />

          {/* Footer: Name + Status */}
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-medium text-zinc-400 truncate tracking-wide">
              {friendlyName}
            </span>
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "text-base @[200px]:text-lg font-semibold tracking-tight transition-colors duration-300",
                  isActive ? config.color : "text-zinc-100"
                )}
              >
                {isActive ? config.activeLabel : config.label}
              </span>

              {/* Animated Dot for active state */}
              {isActive && (
                <motion.div
                  layoutId={`pulse-${entityId}`}
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: config.hex }}
                  animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              )}
            </div>
          </div>
        </div>
      </AuroraCard>

      {/* --- DETAILED INSPECTOR DIALOG --- */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className={cn(
          "bg-zinc-950/90 backdrop-blur-3xl border-white/10 p-0 overflow-hidden",
          "sm:max-w-[450px] sm:rounded-[32px] shadow-2xl shadow-black"
        )}>
          {/* Header Section with Ambient Glow */}
          <div className="relative p-6 pb-8 overflow-hidden">
            {/* Ambient Background */}
            <div
              className="absolute inset-0 opacity-20 pointer-events-none"
              style={{
                background: `radial-gradient(circle at 50% 0%, ${config.hex}, transparent 70%)`
              }}
            />

            <div className="relative z-10 flex flex-col items-center text-center">
              <motion.div
                layoutId={`icon-${entityId}`}
                className="w-20 h-20 rounded-[24px] flex items-center justify-center bg-white/5 ring-1 ring-white/10 backdrop-blur-xl mb-6 shadow-2xl"
                style={{
                  boxShadow: isActive ? `0 0 40px -10px ${config.hex}66` : undefined
                }}
              >
                <Icon
                  className={cn("w-10 h-10", isActive ? config.color : "text-zinc-400")}
                  strokeWidth={1.5}
                />
              </motion.div>

              <DialogTitle className="text-2xl font-semibold text-white tracking-tight mb-2">
                {friendlyName}
              </DialogTitle>

              <div className={cn(
                "px-4 py-1.5 rounded-full text-sm font-semibold ring-1 ring-inset tracking-wide",
                isActive
                  ? `bg-${config.hex}/10 ring-${config.hex}/30 ${config.color}`
                  : "bg-zinc-800/50 ring-white/10 text-zinc-400"
              )} style={{
                backgroundColor: isActive ? `${config.hex}22` : undefined,
                borderColor: isActive ? `${config.hex}44` : undefined,
              }}>
                {isActive ? config.activeLabel : config.label} • {timeSince}
              </div>
            </div>

            {/* Settings Toggle */}
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>

          <div className="px-6 pb-8 space-y-6">
            <AnimatePresence mode="wait">
              {showSettings ? (
                /* --- SETTINGS VIEW --- */
                <motion.div
                  key="settings"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-zinc-500 uppercase tracking-wider">Configuration</h3>

                    <div className="flex items-center justify-between p-4 rounded-2xl bg-zinc-900/50 border border-white/5">
                      <div className="flex items-center gap-3">
                        <Bell className="w-5 h-5 text-zinc-400" />
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-zinc-200">Push Notifications</span>
                          <span className="text-xs text-zinc-500">Alert when status changes</span>
                        </div>
                      </div>
                      <Switch />
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-2xl bg-zinc-900/50 border border-white/5">
                      <div className="flex items-center gap-3">
                        <History className="w-5 h-5 text-zinc-400" />
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-zinc-200">Log History</span>
                          <span className="text-xs text-zinc-500">Keep 30 days of activity</span>
                        </div>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-zinc-500 uppercase tracking-wider">Calibration</h3>
                    <div className="p-4 rounded-2xl bg-zinc-900/50 border border-white/5 space-y-4">
                      <div className="flex justify-between">
                        <span className="text-sm text-zinc-300">Sensitivity</span>
                        <span className="text-sm font-medium text-white">High</span>
                      </div>
                      <Slider defaultValue={[75]} max={100} step={1} />
                    </div>
                  </div>

                  <button
                    onClick={() => setShowSettings(false)}
                    className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 text-sm font-medium transition-colors"
                  >
                    Done
                  </button>
                </motion.div>
              ) : (
                /* --- DETAILS VIEW --- */
                <motion.div
                  key="details"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-6"
                >
                  {/* Battery/Signal Metadata Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-2xl bg-zinc-900/50 border border-white/5 flex items-center gap-3">
                      <div className="p-2 rounded-full bg-green-500/10 text-green-400">
                        <Battery className="w-4 h-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs text-zinc-500">Battery</span>
                        <span className="text-sm font-medium text-white">{entity.attributes.battery_level || 100}%</span>
                      </div>
                    </div>
                    <div className="p-3 rounded-2xl bg-zinc-900/50 border border-white/5 flex items-center gap-3">
                      <div className="p-2 rounded-full bg-blue-500/10 text-blue-400">
                        <Activity className="w-4 h-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs text-zinc-500">Signal</span>
                        <span className="text-sm font-medium text-white">Excellent</span>
                      </div>
                    </div>
                  </div>

                  {/* 24h History Chart */}
                  <div className="p-4 rounded-3xl bg-zinc-900/50 border border-white/5 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-zinc-300">24h Activity</span>
                      <span className="text-xs text-zinc-500 uppercase tracking-wider">Today</span>
                    </div>

                    <div className="h-[120px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={historyData}>
                          <defs>
                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={config.hex} stopOpacity={0.3} />
                              <stop offset="95%" stopColor={config.hex} stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <XAxis
                            dataKey="time"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 10, fill: '#52525b' }}
                            interval={6}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#18181b',
                              border: '1px solid #27272a',
                              borderRadius: '12px',
                              fontSize: '12px'
                            }}
                            cursor={{ stroke: '#ffffff20' }}
                          />
                          <Area
                            type="step"
                            dataKey="value"
                            stroke={config.hex}
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#colorValue)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Insights / Stats */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-medium text-zinc-500 uppercase tracking-wider ml-1">Insights</h4>
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-start gap-3">
                      <Zap className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm text-zinc-200 leading-snug">
                          {config.type === 'motion'
                            ? "Motion detected primarily between 18:00 and 22:00."
                            : "Sensor state has remained stable for the last 12 hours."
                          }
                        </p>
                      </div>
                    </div>
                  </div>

                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
