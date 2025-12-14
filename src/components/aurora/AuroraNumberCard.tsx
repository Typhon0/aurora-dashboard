import React, { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { useEntity, useService, type EntityName } from "@hakit/core";
import { AuroraCard } from "./base/AuroraCard";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";
import { Slider } from "../ui/slider";
import {
  Hash, Thermometer, Droplets, Percent, Gauge,
  Activity, History, Settings, ChevronUp, ChevronDown,
  Minus, Plus, RotateCcw, Save
} from "lucide-react";
import { cn } from "../../lib/utils";
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from "motion/react";
import { toast } from "sonner";
import ReactECharts from "echarts-for-react";

interface AuroraNumberCardProps {
  entityId: EntityName;
  className?: string;
  titleOverride?: string;
}

// --- Haptics ---
const hapticLight = () => {
  if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(10);
};

const hapticSelection = () => {
  if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(15);
};

const hapticSuccess = () => {
  if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate([10, 30, 10]);
};

// --- Icon Mapping ---
const getIconForUnit = (unit?: string, deviceClass?: string) => {
  if (deviceClass === "temperature" || unit?.includes("°")) return Thermometer;
  if (deviceClass === "humidity" || unit === "%") return Percent; // Or Droplets if explicitly humidity
  if (deviceClass === "pressure" || unit?.includes("Pa")) return Gauge;
  if (unit === "W" || unit === "kW") return Activity;
  return Hash;
};

const getColorForUnit = (unit?: string) => {
  if (unit?.includes("°")) return "orange"; // Temp
  if (unit === "%") return "cyan"; // Generic Percent
  if (unit?.includes("W")) return "amber"; // Power
  return "indigo"; // Default
};

// --- Mock History ---
const generateHistory = (baseValue: number, min: number, max: number) => {
  const data = [];
  const now = Date.now();
  for (let i = 0; i < 24; i++) {
    // Random walk
    const val = Math.max(min, Math.min(max, baseValue + (Math.random() - 0.5) * (max - min) * 0.2));
    data.push({
      time: now - (24 - i) * 3600000,
      value: parseFloat(val.toFixed(1)),
    });
  }
  return data;
};

export const AuroraNumberCard: React.FC<AuroraNumberCardProps> = ({
  entityId,
  className,
  titleOverride,
}) => {
  if (!entityId) return null;

  let entity: any;
  try {
    entity = useEntity(entityId);
  } catch (e) {
    entity = {
      state: "50",
      attributes: {
        friendly_name: titleOverride || "Number",
        min: 0,
        max: 100,
        step: 1
      }
    };
  }

  const domain = entityId.split(".")[0];
  // @ts-ignore - Dynamic service selection
  const service = useService(domain === "input_number" ? "input_number" : "number");

  // Entity Attributes
  const min = Number(entity.attributes.min) ?? 0;
  const max = Number(entity.attributes.max) ?? 100;
  const step = Number(entity.attributes.step) ?? 1;
  const unit = entity.attributes.unit_of_measurement || "";
  const deviceClass = entity.attributes.device_class;
  const friendlyName = titleOverride || entity.attributes.friendly_name || "Number";

  // State
  const [open, setOpen] = useState(false);
  const [localValue, setLocalValue] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [activeTab, setActiveTab] = useState<"control" | "history" | "settings">("control");

  // Motion Values for Drag Interaction
  const dragY = useMotionValue(0);
  const startDragValue = useRef(0);
  const startDragY = useRef(0);

  // Derived
  const serverValue = parseFloat(entity.state);
  const currentValue = localValue ?? (isNaN(serverValue) ? min : serverValue);
  const percentage = Math.min(100, Math.max(0, ((currentValue - min) / (max - min)) * 100));

  const Icon = getIconForUnit(unit, deviceClass);
  const colorTheme = getColorForUnit(unit);

  // Debounced Update
  const updateTimeout = useRef<NodeJS.Timeout | null>(null);

  const commitValue = useCallback((val: number) => {
    const clamped = Math.min(max, Math.max(min, Number(val.toFixed(2))));

    if (updateTimeout.current) clearTimeout(updateTimeout.current);
    updateTimeout.current = setTimeout(() => {
      const result = service.setValue({
        target: entityId,
        serviceData: { value: clamped }
      });

      // Only call .catch if result is a Promise
      if (result && typeof result.catch === 'function') {
        result.catch((e) => {
          toast.error("Failed to set value");
          console.error(e);
        });
      }
    }, 300);
  }, [service, entityId, min, max]);

  // --- Tile Drag Logic ---
  const handlePointerDown = (e: React.PointerEvent) => {
    // Prevent dialog opening if we are going to drag
    // We'll use a threshold to distinguish tap vs drag
    startDragY.current = e.clientY;
    startDragValue.current = currentValue;
    setIsDragging(false);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (e.buttons !== 1) return;

    const deltaY = startDragY.current - e.clientY;

    // Threshold for drag detection
    if (!isDragging && Math.abs(deltaY) > 10) {
      setIsDragging(true);
      dragY.set(0);
      if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(10);
    }

    if (isDragging) {
      e.preventDefault();
      // Sensitivity: Full height of screen (approx 1000px) = 100% of range?
      // Let's make it faster: 200px = full range
      const pxRange = 300;
      const valueRange = max - min;
      const deltaValue = (deltaY / pxRange) * valueRange;

      let nextValue = startDragValue.current + deltaValue;

      // Snap to step
      if (step) {
        nextValue = Math.round(nextValue / step) * step;
      }

      nextValue = Math.max(min, Math.min(max, nextValue));

      if (nextValue !== currentValue) {
        setLocalValue(nextValue);
        // Haptic on step change
        if (Math.abs(nextValue - currentValue) >= step) {
          hapticSelection();
        }
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDragging) {
      commitValue(currentValue);
      setIsDragging(false);
      hapticSuccess();
    } else {
      // It was a tap
      setOpen(true);
      hapticLight();
    }
  };

  // Chart Config
  const chartOptions = useMemo(() => ({
    grid: { top: 20, right: 10, bottom: 20, left: 40 },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(24, 24, 27, 0.9)',
      borderColor: '#333',
      textStyle: { color: '#fff' }
    },
    xAxis: {
      type: 'category',
      show: false,
      data: generateHistory(currentValue, min, max).map(d => new Date(d.time).getHours() + 'h')
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } },
      axisLabel: { color: '#71717A' }
    },
    series: [{
      data: generateHistory(currentValue, min, max).map(d => d.value),
      type: 'line',
      smooth: true,
      symbol: 'none',
      lineStyle: { color: colorTheme === 'orange' ? '#F97316' : colorTheme === 'cyan' ? '#06B6D4' : '#6366F1', width: 3 },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [{ offset: 0, color: colorTheme === 'orange' ? 'rgba(249,115,22,0.3)' : 'rgba(6,182,212,0.3)' }, { offset: 1, color: 'transparent' }]
        }
      }
    }]
  }), [currentValue, colorTheme, min, max]);

  return (
    <>
      {/* --- TILE --- */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="relative h-full select-none touch-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        <AuroraCard
          className={cn(
            "relative flex flex-col justify-between p-5 cursor-pointer overflow-hidden group",
            "min-h-[180px] rounded-[24px]",
            "bg-zinc-900/40 backdrop-blur-3xl",
            "ring-1 ring-white/10 ring-inset border border-white/5",
            "shadow-xl shadow-black/20",
            isDragging ? "cursor-ns-resize scale-[1.02]" : "hover:bg-zinc-900/50 active:scale-[0.98]",
            "transition-all duration-200",
            className
          )}
        >
          {/* Liquid Background Fill */}
          <div className="absolute inset-0 z-0 overflow-hidden rounded-[24px]">
            <motion.div
              className={cn(
                "absolute bottom-0 left-0 right-0 transition-colors duration-300",
                `bg-${colorTheme}-500/10`
              )}
              initial={{ height: "0%" }}
              animate={{ height: `${percentage}%` }}
              transition={{ type: "spring", stiffness: 50, damping: 20 }}
            />
            {/* Top Line of Liquid */}
            <motion.div
              className={cn(
                "absolute left-0 right-0 h-[1px] shadow-[0_0_20px_rgba(255,255,255,0.5)]",
                `bg-${colorTheme}-400/50`
              )}
              style={{ bottom: `${percentage}%` }}
              animate={{ bottom: `${percentage}%` }}
              transition={{ type: "spring", stiffness: 50, damping: 20 }}
            />
          </div>

          {/* Header */}
          <div className="flex justify-between items-start relative z-10">
            <motion.div
              className={cn(
                "w-11 h-11 rounded-[14px] flex items-center justify-center relative",
                "ring-1 ring-inset backdrop-blur-xl",
                `bg-${colorTheme}-500/20 ring-${colorTheme}-500/30`
              )}
            >
              <Icon className={cn("w-5 h-5", `text-${colorTheme}-400`)} />
            </motion.div>

            {isDragging && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="px-2 py-1 rounded-full bg-white/10 backdrop-blur border border-white/10 text-[10px] text-white font-medium"
              >
                GLISSER POUR REGLER
              </motion.div>
            )}
          </div>

          {/* Value Display */}
          <div className="relative z-10 mt-auto flex flex-col gap-1">
            <span className="text-xs font-medium text-zinc-500 tracking-wider uppercase">
              {friendlyName}
            </span>
            <div className="flex items-baseline gap-1">
              <motion.span
                className="text-4xl font-bold text-white/90 tracking-tight"
                key={currentValue} // Micro-animation on change
                initial={{ scale: 1.1, color: "white" }}
                animate={{ scale: 1, color: "rgba(255,255,255,0.9)" }}
                transition={{ duration: 0.2 }}
              >
                {currentValue}
              </motion.span>
              <span className="text-lg font-medium text-zinc-500">{unit}</span>
            </div>
          </div>

          {/* Sparkline Hint */}
          <div className="absolute bottom-5 right-5 z-10 text-xs font-mono text-white/20">
            {Math.round(percentage)}%
          </div>
        </AuroraCard>
      </motion.div>

      {/* --- INSPECTOR DIALOG --- */}
      <Dialog open={open} onOpenChange={(v) => {
        if (!v) setLocalValue(null); // Reset optimistic state
        setOpen(v);
      }}>
        <DialogContent className="bg-zinc-900/95 backdrop-blur-3xl ring-1 ring-white/10 ring-inset border border-white/5 shadow-2xl sm:max-w-[420px] sm:rounded-[28px] p-0 overflow-hidden gap-0">
          <DialogHeader className="sr-only">
            <DialogTitle>{friendlyName}</DialogTitle>
            <DialogDescription>Ajuster la valeur</DialogDescription>
          </DialogHeader>

          {/* Header */}
          <div className="relative pt-8 pb-6 px-6 flex flex-col items-center justify-center border-b border-white/5 bg-black/20">
            <div className={cn(
              "w-20 h-20 rounded-full flex items-center justify-center mb-4 relative ring-1 ring-inset backdrop-blur-xl",
              `bg-${colorTheme}-500/10 ring-${colorTheme}-500/20`
            )}>
              <Icon className={cn("w-8 h-8", `text-${colorTheme}-400`)} />
            </div>
            <h2 className="text-lg font-semibold text-white">{friendlyName}</h2>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-3xl font-bold text-white">{currentValue}</span>
              <span className="text-sm text-zinc-500">{unit}</span>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex p-1 mx-6 my-4 bg-zinc-800/50 rounded-xl border border-white/5">
            <button
              onClick={() => setActiveTab("control")}
              className={cn("flex-1 py-2 text-xs font-medium rounded-lg transition-all", activeTab === "control" ? "bg-zinc-700 text-white shadow-sm" : "text-zinc-400 hover:text-zinc-200")}
            >
              Contrôle
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={cn("flex-1 py-2 text-xs font-medium rounded-lg transition-all", activeTab === "history" ? "bg-zinc-700 text-white shadow-sm" : "text-zinc-400 hover:text-zinc-200")}
            >
              Historique
            </button>
            <button
              onClick={() => setActiveTab("settings")}
              className={cn("flex-1 py-2 text-xs font-medium rounded-lg transition-all", activeTab === "settings" ? "bg-zinc-700 text-white shadow-sm" : "text-zinc-400 hover:text-zinc-200")}
            >
              Réglages
            </button>
          </div>

          {/* Content */}
          <div className="px-6 pb-8 min-h-[250px]">
            <AnimatePresence mode="wait">
              {activeTab === "control" && (
                <motion.div
                  key="control"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex flex-col gap-8 py-4"
                >
                  {/* Large Slider */}
                  <div className="relative h-12 w-full flex items-center">
                    <Slider
                      value={[currentValue]}
                      min={min}
                      max={max}
                      step={step}
                      onValueChange={(vals) => {
                        setLocalValue(vals[0]);
                        hapticSelection();
                      }}
                      onValueCommit={(vals) => {
                        commitValue(vals[0]);
                        hapticSuccess();
                      }}
                      className={cn(
                        "cursor-pointer",
                        `[&_.bg-primary]:bg-${colorTheme}-500`,
                        `[&_.border-primary]:border-${colorTheme}-500`
                      )}
                    />
                  </div>

                  {/* Quick Actions */}
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      onClick={() => commitValue(Math.max(min, currentValue - step))}
                      className="h-12 rounded-xl bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-300 border border-white/5 active:scale-95 transition-all"
                    >
                      <Minus className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => commitValue(Math.min(max, currentValue + step))}
                      className="h-12 rounded-xl bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-300 border border-white/5 active:scale-95 transition-all"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => commitValue(min)}
                      className="h-12 rounded-xl bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 border border-white/5 active:scale-95 transition-all text-xs font-medium"
                    >
                      RESET
                    </button>
                  </div>

                  <div className="flex justify-between text-xs text-zinc-500 px-1">
                    <span>Min: {min}</span>
                    <span>Max: {max}</span>
                  </div>
                </motion.div>
              )}

              {activeTab === "history" && (
                <motion.div
                  key="history"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-[220px] w-full"
                >
                  <ReactECharts option={chartOptions} style={{ height: '100%', width: '100%' }} />
                </motion.div>
              )}

              {activeTab === "settings" && (
                <motion.div
                  key="settings"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col gap-4 text-zinc-400"
                >
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                    <span className="text-sm font-medium">Pas (Step)</span>
                    <span className="text-white font-mono">{step}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                    <span className="text-sm font-medium">Unité</span>
                    <span className="text-white font-mono">{unit || "-"}</span>
                  </div>
                  <p className="text-xs text-center mt-4 text-zinc-600">
                    Configuration gérée par Home Assistant.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};