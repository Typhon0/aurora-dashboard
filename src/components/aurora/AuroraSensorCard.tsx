import React, { useMemo, useState, useRef, useEffect } from "react";
import { useEntity, type EntityName } from "@hakit/core";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogHeader,
  DialogDescription,
} from "../ui/dialog";
import { 
  Thermometer, Droplets, Zap, Wind, 
  Activity, Battery, TrendingUp, TrendingDown,
  Clock, Settings, ChevronLeft, MoreVertical,
  Maximize2, History
} from "lucide-react";
import { cn } from "../../lib/utils";
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from "motion/react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

// --- Types & Interfaces ---

interface AuroraSensorProps {
  entityId: EntityName;
  className?: string;
}

type SensorType = "temp" | "humidity" | "power" | "battery" | "aqi" | "generic";

interface SensorTheme {
  type: SensorType;
  icon: React.ElementType;
  color: string;        // Primary accent
  gradient: string;     // Background gradient class
  unit: string;
  precision: number;
  min: number;          // For progress rings/bars
  max: number;
}

// --- 1. Intelligence Engine (Infer Functionality) ---

const inferSensorType = (entity: any): SensorTheme => {
    const dc = entity.attributes.device_class;
    const unit = entity.attributes.unit_of_measurement?.toLowerCase() || "";
    const id = entity.entity_id;
    
    // Temperature
    if (dc === "temperature" || unit.includes("c") || unit.includes("f")) {
        return {
            type: "temp",
            icon: Thermometer,
            color: "#ff9f0a", // Apple Amber
            gradient: "from-orange-500/20 to-orange-500/5",
            unit: "°",
            precision: 1,
            min: 0, max: 40
        };
    }
    
    // Humidity
    if (dc === "humidity" || unit.includes("%")) {
        return {
            type: "humidity",
            icon: Droplets,
            color: "#32ade6", // Apple Cyan
            gradient: "from-blue-500/20 to-blue-500/5",
            unit: "%",
            precision: 0,
            min: 0, max: 100
        };
    }

    // Power
    if (dc === "power" || unit.includes("w") || unit.includes("kw")) {
        return {
            type: "power",
            icon: Zap,
            color: "#ffd60a", // Bright Yellow
            gradient: "from-yellow-500/20 to-yellow-500/5",
            unit: "W",
            precision: 0,
            min: 0, max: 3000
        };
    }

    // Battery
    if (dc === "battery") {
        return {
            type: "battery",
            icon: Battery,
            color: "#30d158", // Apple Green
            gradient: "from-green-500/20 to-green-500/5",
            unit: "%",
            precision: 0,
            min: 0, max: 100
        };
    }

    // Air Quality
    if (dc === "aqi" || dc === "carbon_dioxide" || id.includes("aqi")) {
        return {
            type: "aqi",
            icon: Wind,
            color: "#32d74b", // Green (changes to red logic handled in component)
            gradient: "from-emerald-500/20 to-emerald-500/5",
            unit: "AQI",
            precision: 0,
            min: 0, max: 500
        };
    }

    // Generic Fallback
    return {
        type: "generic",
        icon: Activity,
        color: "#aeaeb2", // Grey
        gradient: "from-zinc-500/20 to-zinc-500/5",
        unit: unit,
        precision: 1,
        min: 0, max: 100
    };
};

// --- 2. History Generator (Mock) ---

const generateHistory = (baseValue: number, type: SensorType, period: "24h" | "7d") => {
    const points = period === "24h" ? 24 : 7;
    const data = [];
    const now = new Date();
    
    let volatility = 0.1; // 10% default
    if (type === "temp") volatility = 0.05;
    if (type === "power") volatility = 0.4;
    if (type === "battery") volatility = 0.01; // Batteries are stable-ish

    for (let i = points - 1; i >= 0; i--) {
        const time = new Date(now.getTime() - i * (period === "24h" ? 3600000 : 86400000));
        // Create some noise + trend
        const trend = Math.sin(i / 3) * (baseValue * volatility); 
        const noise = (Math.random() - 0.5) * (baseValue * (volatility / 2));
        
        let val = baseValue + trend + noise;
        if (type === "battery") val = Math.min(100, Math.max(0, val)); // Clamp battery
        
        data.push({
            time: period === "24h" 
                ? time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : time.toLocaleDateString([], { weekday: 'short' }),
            value: Math.max(0, val)
        });
    }
    return data;
};

// --- 3. Micro-Interactions ---

const hapticFeedback = (type: "light" | "medium" | "heavy" | "success") => {
    if (typeof navigator === "undefined" || !navigator.vibrate) return;
    switch (type) {
        case "light": navigator.vibrate(10); break;
        case "medium": navigator.vibrate(20); break;
        case "heavy": navigator.vibrate(40); break;
        case "success": navigator.vibrate([10, 30, 10]); break;
    }
};

// --- 4. Main Component ---

export function AuroraSensorCard({ entityId, className }: AuroraSensorProps) {
    const entity = useEntity(entityId);
    const [isOpen, setIsOpen] = useState(false);
    const [detailView, setDetailView] = useState<"graph" | "settings">("graph");
    const [timeRange, setTimeRange] = useState<"24h" | "7d">("24h");
    
    // State & Config
    const config = useMemo(() => inferSensorType(entity), [entity.entity_id]);
    const rawValue = parseFloat(entity.state);
    const isUnavailable = Number.isNaN(rawValue);
    const value = isUnavailable ? 0 : rawValue;
    
    // Dynamic Colors for AQI/Battery
    const activeColor = useMemo(() => {
        if (config.type === "aqi") return value > 100 ? "#ff453a" : config.color;
        if (config.type === "battery") return value < 20 ? "#ff453a" : config.color;
        return config.color;
    }, [config, value]);

    // Mock History Data
    const historyData = useMemo(() => 
        generateHistory(value, config.type, timeRange), 
    [value, config.type, timeRange]);

    // Stats
    const stats = useMemo(() => {
        const vals = historyData.map(d => d.value);
        return {
            min: Math.min(...vals),
            max: Math.max(...vals),
            avg: vals.reduce((a, b) => a + b, 0) / vals.length
        };
    }, [historyData]);

    // Formatted Value
    const displayValue = isUnavailable ? "--" : value.toFixed(config.precision);
    
    // Motion
    
    return (
        <>
            <motion.div
                layoutId={`card-${entityId}`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => { hapticFeedback("light"); setIsOpen(true); }}
                onContextMenu={(e) => { e.preventDefault(); hapticFeedback("medium"); setIsOpen(true); }}
                className={cn(
                    "relative h-full w-full flex flex-col justify-between p-6 select-none cursor-pointer overflow-hidden",
                    "rounded-[32px]", // Super-ellipse
                    "bg-zinc-900/40 backdrop-blur-3xl", // Thick Glass
                    "border border-white/5 ring-1 ring-white/10 ring-inset", // Neo-Borders
                    "group transition-all duration-500",
                    className
                )}
            >
                {/* Inner Glow (Active State) */}
                <div 
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                    style={{
                        background: `radial-gradient(circle at 50% 120%, ${activeColor}22 0%, transparent 60%)`
                    }}
                />

                {/* Sparkline Background (Tile) */}
                <div 
                    className="absolute inset-x-0 bottom-0 h-1/2 opacity-20 pointer-events-none"
                    style={{
                        maskImage: "linear-gradient(to top, black 0%, transparent 100%)",
                        WebkitMaskImage: "linear-gradient(to top, black 0%, transparent 100%)"
                    }}
                >
                     <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={historyData}>
                            <defs>
                                <linearGradient id={`grad-${entityId}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor={activeColor} stopOpacity={0.5}/>
                                    <stop offset="100%" stopColor={activeColor} stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <Area 
                                type="monotone" 
                                dataKey="value" 
                                stroke="none" 
                                fill={`url(#grad-${entityId})`} 
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* Header */}
                <div className="relative z-10 flex justify-between items-start">
                    <div className="flex items-center gap-3">
                        <div 
                            className="w-10 h-10 rounded-full flex items-center justify-center bg-white/5 border border-white/10 shadow-inner backdrop-blur-md"
                            style={{ color: activeColor }}
                        >
                            <config.icon className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-medium text-white/90 leading-none mb-1">
                                {entity.attributes.friendly_name || "Sensor"}
                            </span>
                            <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">
                                {entity.attributes.area_id || "Home"}
                            </span>
                        </div>
                    </div>
                    
                    {/* Status Dot */}
                    <div className={cn(
                        "w-2 h-2 rounded-full shadow-[0_0_8px_currentColor]",
                        isUnavailable ? "bg-red-500 text-red-500" : "bg-emerald-500 text-emerald-500"
                    )} />
                </div>

                {/* Main Value */}
                <div className="relative z-10 mt-auto">
                    <div className="flex items-end gap-1.5 translate-y-1 group-hover:translate-y-0 transition-transform duration-300">
                        <span className="text-5xl font-light tracking-tighter text-white drop-shadow-lg">
                            {displayValue}
                        </span>
                        <span className="text-lg font-medium text-zinc-400 mb-1.5">
                            {config.unit}
                        </span>
                    </div>
                    {/* Trend Indicator (Mock) */}
                    <div className="flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-xs font-medium text-zinc-400">
                        <TrendingUp className="w-3 h-3 text-emerald-400" />
                        <span>+2% last hour</span>
                    </div>
                </div>
            </motion.div>


            {/* --- INSPECTOR MODAL --- */}
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="max-w-[420px] p-0 bg-[#161618]/90 backdrop-blur-3xl border border-white/10 rounded-[40px] shadow-2xl overflow-hidden">
                    <DialogHeader className="sr-only">
                        <DialogTitle>{entity.attributes.friendly_name || "Sensor Details"}</DialogTitle>
                        <DialogDescription>Detailed historical data and configuration for this sensor.</DialogDescription>
                    </DialogHeader>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative flex flex-col h-full text-zinc-100"
                    >
                        {/* Modal Header */}
                        <div className="pt-8 px-8 pb-4 flex items-center justify-between z-20">
                            <div className="flex flex-col">
                                <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                                    {displayValue}
                                    <span className="text-xl text-zinc-500 font-medium">{config.unit}</span>
                                </h2>
                                <span className="text-zinc-400 font-medium">{entity.attributes.friendly_name}</span>
                            </div>
                            <button 
                                onClick={() => { hapticFeedback("light"); setDetailView(v => v === "graph" ? "settings" : "graph"); }}
                                className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                            >
                                {detailView === "graph" ? <Settings className="w-5 h-5" /> : <History className="w-5 h-5" />}
                            </button>
                        </div>

                        {/* Content Switcher */}
                        <AnimatePresence mode="wait">
                            {detailView === "graph" ? (
                                <motion.div 
                                    key="graph"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    className="flex-1 flex flex-col"
                                >
                                    {/* Main Chart */}
                                    <div className="h-[240px] w-full mt-2 relative group">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={historyData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                                                <defs>
                                                    <linearGradient id="inspectorGradient" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="0%" stopColor={activeColor} stopOpacity={0.4}/>
                                                        <stop offset="100%" stopColor={activeColor} stopOpacity={0}/>
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                                <Tooltip 
                                                    contentStyle={{ 
                                                        backgroundColor: "rgba(20,20,22,0.8)", 
                                                        borderColor: "rgba(255,255,255,0.1)", 
                                                        borderRadius: "12px",
                                                        boxShadow: "0 4px 20px rgba(0,0,0,0.5)"
                                                    }}
                                                    itemStyle={{ color: activeColor }}
                                                    cursor={{ stroke: "rgba(255,255,255,0.2)", strokeWidth: 1 }}
                                                />
                                                <Area 
                                                    type="monotone" 
                                                    dataKey="value" 
                                                    stroke={activeColor} 
                                                    strokeWidth={3}
                                                    fill="url(#inspectorGradient)" 
                                                    animationDuration={1500}
                                                />
                                            </AreaChart>
                                        </ResponsiveContainer>

                                        {/* Time Range Selector (Overlay) */}
                                        <div className="absolute top-4 right-8 flex bg-black/30 backdrop-blur-md rounded-lg p-1 border border-white/5">
                                            {(["24h", "7d"] as const).map(t => (
                                                <button
                                                    key={t}
                                                    onClick={() => { hapticFeedback("light"); setTimeRange(t); }}
                                                    className={cn(
                                                        "px-3 py-1 text-xs font-bold rounded-md transition-all",
                                                        timeRange === t ? "bg-white/20 text-white" : "text-zinc-500 hover:text-zinc-300"
                                                    )}
                                                >
                                                    {t}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Stats Grid */}
                                    <div className="grid grid-cols-3 gap-4 p-8 pt-4">
                                        <div className="bg-white/5 rounded-2xl p-4 border border-white/5 flex flex-col items-center">
                                            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Min</span>
                                            <span className="text-xl font-light">{stats.min.toFixed(1)}</span>
                                        </div>
                                        <div className="bg-white/5 rounded-2xl p-4 border border-white/5 flex flex-col items-center">
                                            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Avg</span>
                                            <span className="text-xl font-light text-white">{stats.avg.toFixed(1)}</span>
                                        </div>
                                        <div className="bg-white/5 rounded-2xl p-4 border border-white/5 flex flex-col items-center">
                                            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Max</span>
                                            <span className="text-xl font-light">{stats.max.toFixed(1)}</span>
                                        </div>
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div 
                                    key="settings"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    className="flex-1 p-8 pt-0 overflow-y-auto"
                                >
                                    <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Configuration</h3>
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-zinc-300">Custom Name</label>
                                            <input 
                                                type="text" 
                                                placeholder={entity.attributes.friendly_name}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-white/20"
                                            />
                                        </div>
                                        
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-zinc-300">Icon</label>
                                            <div className="flex gap-3 overflow-x-auto pb-2">
                                                {[Thermometer, Droplets, Zap, Wind, Activity, Battery].map((Icon, i) => (
                                                    <button key={i} className="w-12 h-12 flex-shrink-0 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors">
                                                        <Icon className="w-5 h-5 text-zinc-400" />
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="pt-4 border-t border-white/5">
                                            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Alert Thresholds</h3>
                                            <div className="bg-white/5 rounded-2xl p-4 space-y-6">
                                                <div className="space-y-2">
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-zinc-400">Low Warning</span>
                                                        <span className="font-mono text-blue-400">
                                                            {config.min} {config.unit}
                                                        </span>
                                                    </div>
                                                    <input type="range" className="w-full accent-blue-500 bg-white/10 h-1 rounded-full appearance-none" />
                                                </div>
                                                <div className="space-y-2">
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-zinc-400">High Warning</span>
                                                        <span className="font-mono text-red-400">
                                                            {config.max} {config.unit}
                                                        </span>
                                                    </div>
                                                    <input type="range" className="w-full accent-red-500 bg-white/10 h-1 rounded-full appearance-none" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </DialogContent>
            </Dialog>
        </>
    );
}

export { AuroraSensorCard as AuroraSensor };
