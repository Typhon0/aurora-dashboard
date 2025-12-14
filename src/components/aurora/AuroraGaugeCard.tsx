import React, { useState, useMemo } from "react";
import { useEntity, type EntityName } from "@hakit/core";
import { AuroraCard } from "./base/AuroraCard";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";
import {
  Gauge,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  Info,
  Settings,
  BarChart3,
  Clock,
  ChevronRight,
  Sliders,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { motion, AnimatePresence } from "motion/react";
import ReactECharts from "echarts-for-react";

interface AuroraGaugeCardProps {
  entityId: EntityName;
  min?: number;
  max?: number;
  unit?: string;
  className?: string;
  titleOverride?: string;
  thresholds?: Array<{
    value: number;
    label: string;
    color: string;
  }>;
  format?: (value: number) => string;
  showSparkline?: boolean;
}

// --- Generate Demo Data ---
const generateGaugeHistory = (
  current: number,
  min: number,
  max: number,
  hours: number = 24,
) => {
  const data = [];
  const now = Date.now();
  const range = max - min;

  for (let i = hours; i >= 0; i--) {
    const time = now - i * 60 * 60 * 1000;
    const variance = (Math.random() - 0.5) * (range * 0.3);
    const cycle =
      Math.sin((i / hours) * Math.PI * 2) * (range * 0.2);
    let value = current + variance + cycle;
    value = Math.max(min, Math.min(max, value));
    data.push({ time, value });
  }

  return data;
};

// --- Chart Options ---
const getGaugeChartOptions = (
  data: any[],
  color: string,
  unit: string,
  min: number,
  max: number,
) => ({
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
    min,
    max,
    axisLine: { show: false },
    axisLabel: {
      color: "rgba(161,161,170,1)",
      fontSize: 11,
      fontWeight: 500,
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
      return `<div style="font-weight: 600;">${time}</div><div style="margin-top: 4px; font-size: 16px;">${p.value[1].toFixed(1)} ${unit}</div>`;
    },
  },
  series: [
    {
      type: "line",
      smooth: 0.4,
      symbol: "circle",
      symbolSize: 6,
      showSymbol: false,
      lineStyle: { color, width: 2.5 },
      itemStyle: {
        color,
        borderColor: "rgba(255,255,255,0.2)",
        borderWidth: 2,
      },
      emphasis: {
        scale: true,
        focus: "series",
        itemStyle: { shadowBlur: 12, shadowColor: color },
      },
      areaStyle: {
        color: {
          type: "linear",
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: color + "40" },
            { offset: 0.5, color: color + "15" },
            { offset: 1, color: color + "00" },
          ],
        },
      },
      data: data.map((d) => [d.time, d.value]),
    },
  ],
});

// --- Main Component ---
export const AuroraGaugeCard: React.FC<
  AuroraGaugeCardProps
> = ({
  entityId,
  min = 0,
  max = 100,
  unit,
  className,
  titleOverride,
  thresholds,
  format,
  showSparkline = true,
}) => {
  let entity: any;
  try {
    entity = useEntity(entityId);
  } catch (e) {
    entity = {
      state: "0",
      attributes: {
        friendly_name: titleOverride || "Gauge",
        unit_of_measurement: unit || "",
      },
    };
  }
  const [open, setOpen] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<
    "24h" | "7d" | "30d"
  >("24h");

  const raw = parseFloat(entity.state);
  const value = Number.isFinite(raw) ? raw : 0;
  const percentage = Math.min(
    100,
    Math.max(0, ((value - min) / (max - min)) * 100),
  );
  const friendly =
    titleOverride || entity.attributes.friendly_name || "Gauge";
  const unitResolved =
    unit ||
    (entity.attributes.unit_of_measurement as string) ||
    "";

  // Auto-detect thresholds if not provided
  const autoThresholds = useMemo(() => {
    if (thresholds) return thresholds;
    const range = max - min;
    return [
      { value: min, label: "Normal", color: "#A1A1AA" }, // zinc-400
      {
        value: min + range * 0.6,
        label: "Modéré",
        color: "#FFD60A",
      },
      {
        value: min + range * 0.85,
        label: "Élevé",
        color: "#FF453A",
      },
    ];
  }, [thresholds, min, max]);

  // Determine current threshold
  const currentThreshold = useMemo(() => {
    for (let i = autoThresholds.length - 1; i >= 0; i--) {
      if (value >= autoThresholds[i].value) {
        return autoThresholds[i];
      }
    }
    return autoThresholds[0];
  }, [value, autoThresholds]);

  // Is active (not in normal state)
  const isActive = currentThreshold.label !== "Normal";

  // Generate data
  const periodHours =
    selectedPeriod === "24h"
      ? 24
      : selectedPeriod === "7d"
        ? 168
        : 720;
  const chartData = useMemo(() => {
    return generateGaugeHistory(value, min, max, periodHours);
  }, [value, min, max, periodHours]);

  // Statistics
  const stats = useMemo(() => {
    if (chartData.length === 0) return null;
    const values = chartData.map((d) => d.value);
    return {
      min: Math.min(...values),
      max: Math.max(...values),
      avg: values.reduce((a, b) => a + b, 0) / values.length,
    };
  }, [chartData]);

  // Trend
  const trend = useMemo(() => {
    if (chartData.length < 4)
      return { direction: "stable", percentage: 0 };
    const current = chartData[chartData.length - 1].value;
    const past = chartData[chartData.length - 4].value;
    const diff = current - past;
    const percentage = (diff / (max - min)) * 100;

    if (Math.abs(percentage) < 3)
      return { direction: "stable", percentage: 0 };
    return {
      direction: diff > 0 ? "up" : "down",
      percentage: Math.abs(percentage),
    };
  }, [chartData, max, min]);

  const TrendIcon =
    trend.direction === "up"
      ? TrendingUp
      : trend.direction === "down"
        ? TrendingDown
        : Minus;

  // Mini sparkline data (last 12 points)
  const sparklineData = useMemo(() => {
    return chartData.slice(-12).map((d) => d.value);
  }, [chartData]);

  return (
    <>
      {/* --- DASHBOARD CARD --- */}
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
          onClick={() => setOpen(true)}
          className={cn(
            "relative flex flex-col justify-between select-none cursor-pointer group overflow-hidden @container",
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
          {/* Active Glow (radial gradient from within) */}
          {isActive && (
            <motion.div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `radial-gradient(circle at 50% 120%, ${currentThreshold.color}15, transparent 60%)`,
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
            />
          )}

          {/* Header */}
          <div className="flex justify-between items-start relative z-10">
            {/* Icon */}
            <motion.div
              className={cn(
                "w-11 h-11 rounded-[14px] flex items-center justify-center",
                "ring-1 ring-inset backdrop-blur-xl",
                isActive
                  ? "bg-white/10 ring-white/15"
                  : "bg-white/5 ring-white/10",
              )}
              style={
                isActive
                  ? {
                      boxShadow: `0 0 20px ${currentThreshold.color}40, inset 0 1px 0 rgba(255,255,255,0.1)`,
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
              <Gauge
                className={cn(
                  "w-5 h-5",
                  isActive ? "" : "text-zinc-400",
                )}
                style={
                  isActive
                    ? { color: currentThreshold.color }
                    : undefined
                }
              />
            </motion.div>

            {/* Trend Badge */}
            <AnimatePresence>
              {trend.direction !== "stable" && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1.5 h-full rounded-[10px]",
                    "bg-zinc-900/60 backdrop-blur-xl",
                    "ring-1 ring-white/10 ring-inset border border-white/5",
                  )}
                >
                  <span className="text-[10px] h-full font-semibold tracking-wide text-zinc-400">
                    {trend.percentage.toFixed(0)}%
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Center: Circular Progress Ring */}
          <div className="flex flex-col items-center justify-center relative z-10 flex-1 @[250px]:flex-none @[250px]:my-1 p-[0px] mt-[8px] mr-[0px] mb-[0px] ml-[0px]">
            <svg
              viewBox="0 0 110 110"
              className="overflow-visible rotate-[135deg] w-[60px] h-[60px] @[250px]:w-[110px] @[250px]:h-[110px] transition-all duration-300"
            >
              {/* Background Track */}
              <circle
                cx="55"
                cy="55"
                r="48"
                fill="none"
                stroke="rgba(255,255,255,0.08)"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 48 * 0.75} ${2 * Math.PI * 48}`}
              />
              {/* Progress Circle */}
              <motion.circle
                cx="55"
                cy="55"
                r="48"
                fill="none"
                stroke={
                  isActive
                    ? currentThreshold.color
                    : "rgba(161,161,170,0.4)"
                }
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 48 * 0.75} ${2 * Math.PI * 48}`}
                initial={{
                  strokeDashoffset: 2 * Math.PI * 48 * 0.75,
                }}
                animate={{
                  strokeDashoffset:
                    2 *
                    Math.PI *
                    48 *
                    0.75 *
                    (1 - percentage / 100),
                }}
                transition={{
                  duration: 1.2,
                  ease: [0.25, 0.1, 0.25, 1],
                }}
                style={
                  isActive
                    ? {
                        filter: `drop-shadow(0 0 6px ${currentThreshold.color}60)`,
                      }
                    : undefined
                }
              />
            </svg>

            {/* Value Display (Overlay) */}
            <div className="absolute flex flex-col items-center top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pt-2">
              <span className="@[250px]:text-2xl @[150px]:text-sm font-medium text-white tracking-tight leading-none transition-all duration-300 text-[12px]">
                {format ? format(value) : value.toFixed(0)}
              </span>
              <span className="text-sm @[250px]:text-xs text-zinc-500 font-medium mt-0.5 text-[10px]">
                {unitResolved}
              </span>
            </div>
          </div>

          {/* Footer */}
          <div className="hidden @[250px]:flex flex-col gap-2 relative z-10">
            {/* Title + Percentage */}
            <div className="flex items-center justify-between">
              <span className="text-xs tracking-wider uppercase text-zinc-500 font-medium">
                {friendly}
              </span>
              <span
                className={cn(
                  "text-xs font-semibold tabular-nums",
                  isActive ? "" : "text-zinc-400",
                )}
                style={
                  isActive
                    ? { color: currentThreshold.color }
                    : undefined
                }
              >
                {percentage.toFixed(0)}%
              </span>
            </div>

            {/* Mini Sparkline - Integrated into background */}
            {showSparkline && sparklineData.length > 0 && (
              <div className="h-7 flex items-end gap-[3px] opacity-60">
                {sparklineData.map((val, i) => {
                  const height =
                    ((val - min) / (max - min)) * 100;
                  return (
                    <motion.div
                      key={i}
                      className="flex-1 rounded-[2px]"
                      style={{
                        backgroundColor: isActive
                          ? `${currentThreshold.color}50`
                          : "rgba(161,161,170,0.3)",
                      }}
                      initial={{ height: 0 }}
                      animate={{ height: `${height}%` }}
                      transition={{
                        delay: i * 0.04,
                        duration: 0.3,
                        ease: [0.25, 0.1, 0.25, 1],
                      }}
                    />
                  );
                })}
              </div>
            )}

            {/* Range Labels */}
            <div className="flex items-center justify-between text-[10px] tracking-wider uppercase font-medium">
              <span className="text-zinc-600">{min}</span>
              <span
                className={cn(
                  "font-semibold",
                  isActive && percentage > 85
                    ? "text-red-400"
                    : isActive && percentage > 60
                      ? "text-yellow-400"
                      : "text-zinc-500",
                )}
              >
                {isActive && percentage > 85
                  ? "Critique"
                  : isActive && percentage > 60
                    ? "Attention"
                    : "Normal"}
              </span>
              <span className="text-zinc-600">{max}</span>
            </div>
          </div>
        </AuroraCard>
      </motion.div>

      {/* --- DETAIL DIALOG --- */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-zinc-900/95 backdrop-blur-3xl ring-1 ring-white/10 ring-inset border border-white/5 shadow-2xl sm:max-w-[480px] sm:rounded-[28px] p-0 overflow-hidden gap-0 max-h-[90vh] overflow-y-auto">
          <DialogHeader className="sr-only">
            <DialogTitle>Gauge Details</DialogTitle>
            <DialogDescription>
              Advanced gauge information and analytics
            </DialogDescription>
          </DialogHeader>

          {/* Header */}
          <motion.div
            className="flex flex-col items-center justify-center pt-8 pb-6 relative"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {/* Active Glow */}
            {isActive && (
              <div
                className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 blur-3xl opacity-20 pointer-events-none"
                style={{
                  backgroundColor: currentThreshold.color,
                }}
              />
            )}

            {/* Icon Container */}
            <motion.div
              className={cn(
                "w-20 h-20 rounded-full flex items-center justify-center mb-4 relative",
                "ring-1 ring-inset backdrop-blur-xl",
                isActive
                  ? "bg-white/10 ring-white/15"
                  : "bg-white/5 ring-white/10",
              )}
              style={
                isActive
                  ? {
                      boxShadow: `0 0 30px ${currentThreshold.color}30, inset 0 1px 0 rgba(255,255,255,0.1)`,
                    }
                  : undefined
              }
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Gauge
                className={cn(
                  "w-10 h-10 relative z-10",
                  isActive ? "" : "text-zinc-400",
                )}
                style={
                  isActive
                    ? { color: currentThreshold.color }
                    : undefined
                }
              />
            </motion.div>

            <DialogTitle className="text-2xl font-medium text-center tracking-tight text-white mb-1">
              {friendly}
            </DialogTitle>
            <DialogDescription className="text-xs tracking-wider uppercase text-zinc-500 font-medium">
              Jauge de mesure
            </DialogDescription>

            {/* Health Badge - Only for active states */}
            {isActive && (
              <motion.div
                className={cn(
                  "mt-4 flex items-center gap-2 px-3 py-1.5 rounded-full",
                  "bg-zinc-900/60 backdrop-blur-xl",
                  "ring-1 ring-white/10 ring-inset border border-white/5",
                )}
                style={{
                  boxShadow: `0 0 20px ${currentThreshold.color}20`,
                }}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
              >
                {percentage > 85 ? (
                  <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                ) : (
                  <Info className="w-3.5 h-3.5 text-yellow-400" />
                )}
                <span
                  className="text-xs font-semibold"
                  style={{ color: currentThreshold.color }}
                >
                  {percentage > 85 ? "Critique" : "Attention"}
                </span>
              </motion.div>
            )}
          </motion.div>

          <div className="px-6 pb-6 space-y-5">
            {/* Large Value Display */}
            <motion.div
              className="flex flex-col items-center justify-center py-8 bg-white/5 backdrop-blur-xl rounded-[20px] ring-1 ring-white/10 ring-inset border border-white/5"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
            >
              <span className="text-6xl font-light text-white tracking-tight leading-none">
                {format ? format(value) : value.toFixed(0)}
              </span>
              <span className="text-zinc-500 text-sm font-medium mt-2 tracking-wide">
                {unitResolved}
              </span>

              {/* Progress Bar */}
              <div className="w-3/4 h-2 bg-white/5 rounded-full mt-6 overflow-hidden relative">
                <motion.div
                  className="absolute inset-y-0 left-0 rounded-full"
                  style={{
                    backgroundColor: isActive
                      ? currentThreshold.color
                      : "rgba(161,161,170,0.5)",
                    boxShadow: isActive
                      ? `0 0 10px ${currentThreshold.color}60`
                      : "none",
                  }}
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{
                    duration: 1,
                    ease: [0.25, 0.1, 0.25, 1],
                  }}
                />
              </div>
            </motion.div>

            {/* Stats Grid */}
            {stats && (
              <motion.div
                className="grid grid-cols-3 gap-3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                {[
                  {
                    label: "Min",
                    value: stats.min,
                    color: "text-cyan-400",
                  },
                  {
                    label: "Moy",
                    value: stats.avg,
                    color: "text-white",
                  },
                  {
                    label: "Max",
                    value: stats.max,
                    color: "text-amber-400",
                  },
                ].map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    className="flex flex-col items-center gap-2 p-4 bg-white/5 backdrop-blur-xl rounded-[16px] ring-1 ring-white/10 ring-inset border border-white/5"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 + i * 0.05 }}
                  >
                    <span
                      className={cn(
                        "text-lg font-medium tabular-nums",
                        stat.color,
                      )}
                    >
                      {format
                        ? format(stat.value)
                        : stat.value.toFixed(0)}
                    </span>
                    <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">
                      {stat.label}
                    </span>
                  </motion.div>
                ))}
              </motion.div>
            )}

            {/* Period Selector */}
            <div className="flex gap-2 p-1.5 bg-zinc-900/60 backdrop-blur-xl rounded-[16px] ring-1 ring-white/10 ring-inset">
              {(["24h", "7d", "30d"] as const).map((period) => (
                <button
                  key={period}
                  onClick={() => setSelectedPeriod(period)}
                  className={cn(
                    "flex-1 py-2 rounded-[12px] text-[11px] font-semibold uppercase tracking-wider transition-all",
                    selectedPeriod === period
                      ? "bg-white text-zinc-900 shadow-sm"
                      : "text-zinc-500 hover:text-zinc-400",
                  )}
                >
                  {period}
                </button>
              ))}
            </div>

            {/* Chart */}
            <motion.div
              className="bg-white/5 backdrop-blur-xl rounded-[20px] p-5 ring-1 ring-white/10 ring-inset border border-white/5"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-zinc-500" />
                  <span className="text-sm font-medium text-white">
                    Historique
                  </span>
                </div>
                <span className="text-xs text-zinc-500 uppercase tracking-wider">
                  {selectedPeriod}
                </span>
              </div>
              <div className="h-[220px]">
                <ReactECharts
                  option={getGaugeChartOptions(
                    chartData,
                    isActive
                      ? currentThreshold.color
                      : "#A1A1AA",
                    unitResolved,
                    min,
                    max,
                  )}
                  style={{ height: "100%", width: "100%" }}
                  theme="dark"
                />
              </div>
            </motion.div>

            {/* Thresholds Info */}
            <motion.div
              className="bg-zinc-900/60 backdrop-blur-xl rounded-[20px] p-4 ring-1 ring-white/10 ring-inset border border-white/5"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 rounded-[10px] bg-white/5 ring-1 ring-white/10 ring-inset">
                  <Sliders className="w-4 h-4 text-zinc-400" />
                </div>
                <span className="text-sm font-medium text-white">
                  Seuils configurés
                </span>
              </div>
              <div className="space-y-2">
                {autoThresholds.map((threshold, i) => (
                  <motion.div
                    key={i}
                    className="flex items-center justify-between p-3 bg-white/5 rounded-[12px] ring-1 ring-white/10 ring-inset"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.45 + i * 0.05 }}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-2.5 h-2.5 rounded-full ring-1 ring-white/10 ring-inset"
                        style={{
                          backgroundColor: threshold.color,
                        }}
                      />
                      <span className="text-sm text-zinc-300">
                        {threshold.label}
                      </span>
                    </div>
                    <span className="text-sm text-zinc-500 font-medium tabular-nums">
                      &gt; {threshold.value} {unitResolved}
                    </span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Device Info */}
            <motion.div
              className="bg-zinc-900/60 backdrop-blur-xl rounded-[20px] overflow-hidden divide-y divide-white/5 ring-1 ring-white/10 ring-inset border border-white/5"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
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
                    second: "2-digit",
                  })}
                </span>
              </div>

              <button className="flex items-center justify-between p-4 w-full hover:bg-white/5 active:bg-white/10 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-[10px] bg-white/5 ring-1 ring-white/10 ring-inset">
                    <Settings className="w-4 h-4 text-zinc-400" />
                  </div>
                  <span className="text-sm font-medium text-white">
                    Paramètres
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-500" />
              </button>
            </motion.div>

            {/* Footer */}
            <div className="text-center pt-2">
              <p className="text-[10px] text-zinc-600 leading-relaxed tracking-wide uppercase">
                Données en temps réel • Historique simulé
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};