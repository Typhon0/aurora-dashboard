import React, { useCallback, useState, useRef, useEffect } from "react";
import { useEntity, useService, type EntityName } from "@hakit/core";
import { AuroraCard } from "./base/AuroraCard";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "../ui/dialog";
import {
    Thermometer, Power, Flame, Snowflake, Fan, Droplets, RefreshCw,
    Wind, Gauge, Leaf, Zap, Moon, Sun, Settings, ChevronRight
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "../../lib/utils";

export type ClimateVariant = "simple" | "control";

interface AuroraClimateProps {
    entityId: EntityName;
    className?: string;
    stepOverride?: number;
    variant?: ClimateVariant;
}

// --- Haptics Helper ---
const triggerHaptic = () => {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate(5);
    }
};

// --- Config & Helpers ---
const getModeConfig = (mode?: string) => {
    switch (mode) {
        case "heat": return { icon: Flame, color: "text-orange-400", bg: "bg-orange-400", label: "Heat", gradient: "url(#heatGradient)" };
        case "cool": return { icon: Snowflake, color: "text-blue-400", bg: "bg-blue-400", label: "Cool", gradient: "url(#coolGradient)" };
        case "heat_cool": return { icon: RefreshCw, color: "text-green-400", bg: "bg-green-400", label: "Auto", gradient: "url(#autoGradient)" };
        case "fan_only": return { icon: Fan, color: "text-cyan-400", bg: "bg-cyan-400", label: "Fan", gradient: "url(#fanGradient)" };
        case "dry": return { icon: Droplets, color: "text-purple-400", bg: "bg-purple-400", label: "Dry", gradient: "url(#dryGradient)" };
        case "auto": return { icon: RefreshCw, color: "text-green-400", bg: "bg-green-400", label: "Auto", gradient: "url(#autoGradient)" };
        default: return { icon: Power, color: "text-white/40", bg: "bg-white/10", label: "Off", gradient: "none" };
    }
};

// --- Circular Thermostat (Advanced) ---
interface CircularThermostatProps {
    value: number;
    highValue?: number; // For range mode
    min?: number;
    max?: number;
    step?: number;
    onChange: (val: number, type?: 'low' | 'high') => void;
    mode?: string;
    isDragging?: (dragging: boolean) => void;
    size?: number;
}

const CircularThermostat = ({
    value,
    highValue,
    min = 10,
    max = 30,
    step = 0.5,
    onChange,
    mode,
    isDragging: setExternalDragging,
    size = 280
}: CircularThermostatProps) => {
    const svgRef = useRef<SVGSVGElement>(null);
    const [dragging, setDragging] = useState<'low' | 'high' | null>(null);

    // Refs for event handlers to avoid re-binding
    const paramsRef = useRef({ value, highValue, min, max, step, dragging, onChange });
    useEffect(() => {
        paramsRef.current = { value, highValue, min, max, step, dragging, onChange };
    }, [value, highValue, min, max, step, dragging, onChange]);

    const lastHapticValue = useRef<number>(value);

    // Geometry
    const strokeWidth = size * 0.1;
    const center = size / 2;
    const radius = (size - strokeWidth) / 2;
    const startAngle = 135;
    const endAngle = 405;

    // Helpers
    const valueToAngle = (val: number) => {
        const clamped = Math.max(min, Math.min(max, val));
        const pct = (clamped - min) / (max - min);
        return startAngle + pct * (endAngle - startAngle);
    };

    const angleToValue = (angle: number) => {
        let normalized = angle - startAngle;
        if (normalized < 0) normalized += 360;
        const totalSpan = endAngle - startAngle;
        const pct = Math.max(0, Math.min(1, normalized / totalSpan));
        let raw = min + pct * (max - min);
        // Snap to step
        const snapped = Math.round(raw / step) * step;
        return Math.max(min, Math.min(max, snapped));
    };

    const polarToCartesian = (angleInDegrees: number) => {
        const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
        return {
            x: center + (radius * Math.cos(angleInRadians)),
            y: center + (radius * Math.sin(angleInRadians))
        };
    };

    const describeArc = (start: number, end: number) => {
        const startPt = polarToCartesian(end);
        const endPt = polarToCartesian(start);
        const largeArcFlag = end - start <= 180 ? "0" : "1";
        return [
            "M", startPt.x, startPt.y,
            "A", radius, radius, 0, largeArcFlag, 0, endPt.x, endPt.y
        ].join(" ");
    };

    // Input Handling
    const handleInput = useCallback((clientX: number, clientY: number, isStart = false) => {
        if (!svgRef.current) return;
        const { value, highValue, min, max, step, dragging, onChange } = paramsRef.current;

        const rect = svgRef.current.getBoundingClientRect();
        const x = clientX - rect.left - center;
        const y = clientY - rect.top - center;

        // Calculate angle
        let angle = Math.atan2(y, x) * 180 / Math.PI;
        angle = angle + 90;
        if (angle < 0) angle += 360;

        // Gap logic
        let relative = angle - 135;
        if (relative < 0) relative += 360;

        const span = endAngle - startAngle;

        // If we are in the bottom gap, snap or ignore
        if (relative > span) {
            const distToStart = 360 - relative;
            const distToEnd = relative - span;
            if (distToStart > 30 && distToEnd > 30) return;
            if (distToStart < distToEnd) relative = 0;
            else relative = span;
        }

        const newValue = angleToValue(135 + relative);

        // Determine which handle to move if Range Mode
        let activeHandle: 'low' | 'high' = dragging || 'low';

        if (isStart) {
            if (highValue !== undefined) {
                const distLow = Math.abs(newValue - value);
                const distHigh = Math.abs(newValue - highValue);
                activeHandle = distLow < distHigh ? 'low' : 'high';
            } else {
                activeHandle = 'low';
            }
            setDragging(activeHandle);
        }

        // Apply constraints
        if (activeHandle === 'low') {
            if (highValue !== undefined && newValue >= highValue) return; // Prevent crossover
            onChange(newValue, 'low');
        } else {
            if (newValue <= value) return; // Prevent crossover
            onChange(newValue, 'high');
        }

        // Haptics check
        if (Math.abs(newValue - lastHapticValue.current) >= step) {
            triggerHaptic();
            lastHapticValue.current = newValue;
        }
    }, [center, endAngle, min, max, step, startAngle]); // Deps that don't change often

    // Event Listeners
    useEffect(() => {
        if (!dragging) {
            if (setExternalDragging) setExternalDragging(false);
            return;
        }
        if (setExternalDragging) setExternalDragging(true);

        const onMove = (e: MouseEvent) => handleInput(e.clientX, e.clientY);
        const onTouch = (e: TouchEvent) => handleInput(e.touches[0].clientX, e.touches[0].clientY);
        const onEnd = () => setDragging(null);

        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onEnd);
        window.addEventListener('touchmove', onTouch, { passive: false });
        window.addEventListener('touchend', onEnd);
        return () => {
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onEnd);
            window.removeEventListener('touchmove', onTouch);
            window.removeEventListener('touchend', onEnd);
        };
    }, [dragging, handleInput, setExternalDragging]);

    // Rendering Vars
    const isRange = highValue !== undefined;
    const lowAngle = valueToAngle(value);
    const highAngle = isRange ? valueToAngle(highValue!) : lowAngle;

    const activeArcStart = isRange ? lowAngle : startAngle;
    const activeArcEnd = highAngle;

    const config = getModeConfig(mode);

    const Handle = ({ angle, type }: { angle: number, type: 'low' | 'high' }) => {
        const pos = polarToCartesian(angle);
        return (
            <g
                transform={`translate(${pos.x}, ${pos.y})`}
                className="cursor-grab active:cursor-grabbing"
            >
                {/* Hit Area */}
                <circle r={strokeWidth} fill="transparent" />
                {/* Visuals */}
                <circle r={strokeWidth * 0.8} fill="white" fillOpacity="0.1" className="animate-pulse" />
                <circle
                    r={strokeWidth * 0.5}
                    fill="white"
                    stroke="rgba(0,0,0,0.1)"
                    strokeWidth={1}
                    className="shadow-[0_2px_8px_rgba(0,0,0,0.2)]"
                />
            </g>
        )
    };

    return (
        <div className="relative flex items-center justify-center touch-none select-none" style={{ width: size, height: size }}>
            <svg
                ref={svgRef}
                width={size}
                height={size}
                className="overflow-visible cursor-pointer"
                onMouseDown={(e) => { e.stopPropagation(); handleInput(e.clientX, e.clientY, true); }}
                onTouchStart={(e) => { e.stopPropagation(); handleInput(e.touches[0].clientX, e.touches[0].clientY, true); }}
            >
                <defs>
                    <linearGradient id="heatGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#fbbf24" />
                        <stop offset="100%" stopColor="#ef4444" />
                    </linearGradient>
                    <linearGradient id="coolGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#60a5fa" />
                        <stop offset="100%" stopColor="#3b82f6" />
                    </linearGradient>
                    <linearGradient id="autoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#3b82f6" />
                        <stop offset="100%" stopColor="#ef4444" />
                    </linearGradient>
                    <linearGradient id="dryGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#c084fc" />
                        <stop offset="100%" stopColor="#a855f7" />
                    </linearGradient>
                    <linearGradient id="fanGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#22d3ee" />
                        <stop offset="100%" stopColor="#06b6d4" />
                    </linearGradient>
                </defs>

                {/* Background Track */}
                <path
                    d={describeArc(startAngle, endAngle)}
                    fill="none"
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                />

                {/* Active Arc */}
                <path
                    d={describeArc(activeArcStart, activeArcEnd)}
                    fill="none"
                    stroke="rgba(255,255,255,0.6)"
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    className="transition-all duration-75 ease-out"
                    style={{
                        filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.3))',
                        backdropFilter: 'blur(10px)'
                    }}
                />

                {/* Handles */}
                <Handle angle={lowAngle} type="low" />
                {isRange && <Handle angle={highAngle} type="high" />}
            </svg>

            {/* Center Display */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                {isRange ? (
                    <div className="flex items-center gap-1">
                        <span className="font-light text-white/80 tracking-tighter" style={{ fontSize: size * 0.12 }}>{Math.round(value)}</span>
                        <span className="text-white/20">-</span>
                        <span className="font-light text-white/80 tracking-tighter" style={{ fontSize: size * 0.12 }}>{Math.round(highValue!)}</span>
                    </div>
                ) : (
                    <span className="font-light tracking-tighter text-white" style={{ fontSize: size * 0.25 }}>
                        {Math.round(value)}°
                    </span>
                )}
                <span className="text-white/40 font-medium uppercase tracking-widest mt-1" style={{ fontSize: size * 0.05 }}>
                    {mode === 'heat_cool' ? 'Auto' : config.label}
                </span>
            </div>
        </div>
    );
};

// --- Main Card Component ---

export function AuroraClimateCard({ entityId, className, stepOverride, variant = "simple" }: AuroraClimateProps) {
    const entity = useEntity(entityId);
    const climate = useService("climate");
    const [open, setOpen] = useState(false);

    // Attributes
    const attrs = entity.attributes;
    const hvacMode = entity.state;
    const minTemp = attrs.min_temp as number || 7;
    const maxTemp = attrs.max_temp as number || 35;
    const step = stepOverride || (attrs.target_temp_step as number) || 0.5;
    const currentTemp = attrs.current_temperature as number | undefined;

    // Target Temp Logic
    const targetTemp = attrs.temperature as number;
    const targetLow = attrs.target_temp_low as number;
    const targetHigh = attrs.target_temp_high as number;

    // Feature Detection
    const supportedModes = (attrs.hvac_modes as string[]) || ['off', 'heat'];
    const fanModes = (attrs.fan_modes as string[]) || [];

    const isRangeMode = hvacMode === 'heat_cool' || (hvacMode === 'auto' && targetLow !== undefined);
    const isActive = hvacMode !== 'off';

    // Handlers
    const handleTempChange = useCallback(async (val: number, type: 'low' | 'high' = 'low') => {
        if (isRangeMode) {
            const newLow = type === 'low' ? val : targetLow;
            const newHigh = type === 'high' ? val : targetHigh;
            if (newLow && newHigh) {
                await climate.setTemperature({
                    target: entityId,
                    serviceData: { target_temp_low: newLow, target_temp_high: newHigh }
                });
            }
        } else {
            await climate.setTemperature({
                target: entityId,
                serviceData: { temperature: val }
            });
        }
    }, [climate, entityId, isRangeMode, targetLow, targetHigh]);

    const handleModeChange = async (mode: string) => {
        triggerHaptic();
        try {
            await climate.setHvacMode({ target: entityId, serviceData: { hvac_mode: mode } });
        } catch (e) { toast.error("Command failed"); }
    };

    const handleFanChange = async () => {
        triggerHaptic();
        if (!fanModes.length) return;
        const current = attrs.fan_mode as string;
        const idx = fanModes.indexOf(current);
        const next = fanModes[(idx + 1) % fanModes.length];
        try {
            await climate.setFanMode({ target: entityId, serviceData: { fan_mode: next } });
            toast.info(`Fan: ${next}`);
        } catch (e) { toast.error("Failed to set fan"); }
    };

    const config = getModeConfig(hvacMode);
    const Icon = config.icon;

    const renderCardContent = () => {
        // 1. Simple Variant (1x1) - Just the Dial (Scaled Down)
        if (variant === "simple") {
            return (
                <AuroraCard
                    onClick={() => setOpen(true)}
                    className={cn(
                        "flex flex-col justify-between p-0 relative overflow-hidden cursor-pointer h-full",
                        "rounded-[24px] bg-zinc-900/40 backdrop-blur-3xl",
                        "ring-1 ring-white/10 ring-inset border border-white/5",
                        "shadow-xl shadow-black/20 hover:bg-zinc-900/50",
                        "@container",
                        className
                    )}
                >
                    {/* Glow */}
                    {isActive && (
                        <div className={cn("absolute inset-0 opacity-20 blur-[60px] pointer-events-none", config.bg)} />
                    )}

                    {/* Dial - Centered and responsive */}
                    <div className="relative z-10 flex-1 flex items-center justify-center p-4">
                        <div className="w-full h-full max-w-[140px] max-h-[140px] @[200px]:max-w-[120px] @[200px]:max-h-[120px]">
                            <CircularThermostat
                                value={isRangeMode ? targetLow : (targetTemp || minTemp)}
                                highValue={isRangeMode ? targetHigh : undefined}
                                min={minTemp}
                                max={maxTemp}
                                step={step}
                                onChange={handleTempChange}
                                mode={hvacMode}
                                size={120}
                            />
                        </div>
                    </div>

                    {/* Status Icon Overlay (Top Right) */}
                    <div className="absolute top-3 right-3 p-1.5 rounded-full bg-white/10 backdrop-blur-md ring-1 ring-white/10">
                        <Icon className={cn("w-3 h-3 text-white", isActive && "animate-pulse")} />
                    </div>
                </AuroraCard>
            );
        }

        // 2. Control Variant (2x1) - Dial + Side Controls
        if (variant === "control") {
            return (
                <AuroraCard className={cn("flex flex-row items-center p-4 gap-4 relative overflow-hidden h-full @container", className)}>
                    {/* Left: Dial */}
                    <div className="relative shrink-0 w-[120px] h-[120px]">
                        {isActive && (
                            <div className={cn("absolute inset-0 opacity-20 blur-[40px] pointer-events-none", config.bg)} />
                        )}
                        <CircularThermostat
                            value={isRangeMode ? targetLow : (targetTemp || minTemp)}
                            highValue={isRangeMode ? targetHigh : undefined}
                            min={minTemp}
                            max={maxTemp}
                            step={step}
                            onChange={handleTempChange}
                            mode={hvacMode}
                            size={120}
                        />
                    </div>

                    {/* Right: Controls */}
                    <div className="flex-1 flex flex-col justify-center gap-3 z-10 min-w-0">
                        {/* Status Text */}
                        <div className="flex flex-col">
                            <span className="text-lg font-semibold text-white truncate">{entity.attributes.friendly_name}</span>
                            <div className="flex items-center gap-2 text-xs text-white/60">
                                <span className="capitalize">{hvacMode}</span>
                                {currentTemp && <span>• Currently {currentTemp}°</span>}
                            </div>
                        </div>

                        {/* Mode Toggles */}
                        <div className="flex gap-2 flex-wrap">
                            {supportedModes.slice(0, 3).map(m => { // Limit to 3 for space
                                const isActiveMode = hvacMode === m;
                                const mConfig = getModeConfig(m);
                                const MIcon = mConfig.icon;
                                return (
                                    <button
                                        key={m}
                                        onClick={() => handleModeChange(m)}
                                        className={cn(
                                            "p-2 rounded-lg transition-colors flex items-center justify-center",
                                            isActiveMode ? "bg-white text-black shadow-md" : "bg-white/10 text-white hover:bg-white/20"
                                        )}
                                    >
                                        <MIcon className="w-4 h-4" />
                                    </button>
                                )
                            })}
                        </div>

                        {/* Fan Toggle */}
                        {fanModes.length > 0 && (
                            <button
                                onClick={handleFanChange}
                                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-xs text-white font-medium w-fit"
                            >
                                <Fan className={cn("w-3 h-3", attrs.fan_mode !== 'auto' && "animate-spin-slow")} />
                                {attrs.fan_mode || 'Fan'}
                            </button>
                        )}
                    </div>
                </AuroraCard>
            );
        }
        return null;
    };

    return (
        <>
            {renderCardContent()}

            {/* Full Inspector Dialog */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="bg-zinc-900/95 backdrop-blur-3xl border-white/10 shadow-2xl sm:max-w-[480px] sm:rounded-[28px] p-0 overflow-hidden">
                    <DialogHeader className="sr-only">
                        <DialogTitle>Climate Control</DialogTitle>
                    </DialogHeader>

                    {/* Header */}
                    <div className="relative pt-8 pb-6 px-6 flex flex-col items-center justify-center bg-gradient-to-b from-white/5 to-transparent">
                        <div className={cn("w-20 h-20 rounded-full flex items-center justify-center mb-4 ring-1 ring-white/20 shadow-xl", config.bg)}>
                            <Icon className="w-10 h-10 text-white" />
                        </div>
                        <div className="text-2xl font-semibold text-white tracking-tight">{entity.attributes.friendly_name}</div>
                        <div className="text-zinc-400 text-sm mt-1 capitalize flex items-center gap-2">
                            {currentTemp && <span className="flex items-center gap-1"><Thermometer className="w-3 h-3" /> {currentTemp}° Inside</span>}
                        </div>
                    </div>

                    {/* Main Control */}
                    <div className="flex flex-col items-center justify-center py-6">
                        <CircularThermostat
                            value={isRangeMode ? targetLow : (targetTemp || minTemp)}
                            highValue={isRangeMode ? targetHigh : undefined}
                            min={minTemp}
                            max={maxTemp}
                            step={step}
                            onChange={handleTempChange}
                            mode={hvacMode}
                            size={280}
                        />
                    </div>

                    {/* Mode Grid */}
                    <div className="grid grid-cols-4 gap-2 px-6 pb-8">
                        {supportedModes.map(m => {
                            const isActiveMode = hvacMode === m;
                            const mConfig = getModeConfig(m);
                            const MIcon = mConfig.icon;
                            return (
                                <button
                                    key={m}
                                    onClick={() => handleModeChange(m)}
                                    className={cn(
                                        "flex flex-col items-center gap-2 p-3 rounded-2xl transition-all",
                                        isActiveMode ? "bg-white text-black shadow-lg scale-105" : "bg-white/5 text-zinc-400 hover:bg-white/10"
                                    )}
                                >
                                    <MIcon className="w-6 h-6" />
                                    <span className="text-[10px] font-bold uppercase tracking-wider">{mConfig.label}</span>
                                </button>
                            )
                        })}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}