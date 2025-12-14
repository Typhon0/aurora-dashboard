import React, {
    useState,
    useEffect,
    useMemo,
    useCallback,
    useRef,
} from "react";
import { useEntity, type EntityName } from "@hakit/core";
import { AuroraCard } from "./base/AuroraCard";
import {
    Dialog,
    DialogContent,
    DialogTitle,
} from "../ui/dialog";
import { Switch } from "../ui/switch";
import { Button } from "../ui/button";
import {
    Play,
    Pause,
    Square,
    Plus,
    Timer,
    Settings,
    Bell,
    Volume2,
    ChefHat,
    Coffee,
    Egg,
    Zap,
    History,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";

// --- Types & Interfaces ---

interface AuroraTimerCardProps {
    entityId: EntityName;
    className?: string;
    titleOverride?: string;
}

// --- Haptic Helpers ---
const haptic = {
    tick: () => typeof navigator !== "undefined" && navigator.vibrate?.(5),
    click: () => typeof navigator !== "undefined" && navigator.vibrate?.(10),
    success: () =>
        typeof navigator !== "undefined" && navigator.vibrate?.([10, 30, 10]),
};

// --- Time Formatting Utilities ---
const formatDuration = (ms: number) => {
    if (ms < 0) ms = 0;
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds
            .toString()
            .padStart(2, "0")}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

const formatLabel = (ms: number) => {
    const totalMinutes = Math.floor(ms / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes} min`;
};

// --- Presets ---
const PRESETS = [
    { id: "egg", label: "Soft Egg", duration: 360000, icon: Egg },
    { id: "pasta", label: "Pasta", duration: 600000, icon: ChefHat },
    { id: "tea", label: "Tea", duration: 180000, icon: Coffee },
    { id: "nap", label: "Power Nap", duration: 1200000, icon: Zap },
];

// --- Main Component ---
export const AuroraTimerCard: React.FC<AuroraTimerCardProps> = ({
    entityId,
    className,
    titleOverride,
}) => {
    // 1. Entity Connection
    let entity: any;
    let service: any;

    try {
        entity = useEntity(entityId);
        service = {
            start: (duration: string) => console.log("Start", duration),
            pause: () => console.log("Pause"),
            cancel: () => console.log("Cancel"),
            finish: () => console.log("Finish"),
        };
    } catch (e) {
        // Mock Data for Preview
        entity = {
            state: "idle", // idle, active, paused
            attributes: {
                friendly_name: titleOverride || "Kitchen Timer",
                duration: "00:10:00",
                remaining: "00:05:30",
                finishes_at: null,
            },
        };
        service = {
            start: () => { },
            pause: () => { },
            cancel: () => { },
        };
    }

    // 2. State
    const [isOpen, setIsOpen] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [localRemaining, setLocalRemaining] = useState<number>(0);
    const [totalDuration, setTotalDuration] = useState<number>(600000); // Default 10m
    const [setupDuration, setSetupDuration] = useState<number>(0); // User Set Duration
    const [isDragging, setIsDragging] = useState(false);

    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const dialRef = useRef<HTMLDivElement>(null);

    // 3. Sync Logic
    const updateTimer = useCallback(() => {
        if (entity.state === "active" && entity.attributes.finishes_at) {
            const end = new Date(entity.attributes.finishes_at).getTime();
            const now = Date.now();
            const left = Math.max(0, end - now);
            setLocalRemaining(left);
        } else if (entity.state === "paused" && entity.attributes.remaining) {
            const parts = entity.attributes.remaining.split(":");
            if (parts.length === 3) {
                const ms = ((parseInt(parts[0]) * 3600) + (parseInt(parts[1]) * 60) + parseFloat(parts[2])) * 1000;
                setLocalRemaining(ms);
            }
        } else {
            setLocalRemaining(0);
        }
    }, [entity.state, entity.attributes.finishes_at, entity.attributes.remaining]);

    useEffect(() => {
        updateTimer();
        if (entity.state === "active") {
            timerRef.current = setInterval(updateTimer, 1000);
        }
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [entity.state, updateTimer]);

    // 4. Dial Interaction Logic
    const handleDialInteraction = useCallback((e: React.PointerEvent | PointerEvent) => {
        if (!dialRef.current) return;

        const rect = dialRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        // Calculate angle (-PI to PI)
        // -PI/2 (top) is -90deg.
        const x = e.clientX - centerX;
        const y = e.clientY - centerY;

        // Atan2 returns angle from X axis (right). 
        // We want 0 at Top (-90deg).
        // So let's rotate coordinates or adjust angle.
        // Angle from top:
        let angle = Math.atan2(y, x) * (180 / Math.PI);
        angle = angle + 90; // Rotate so top is 0
        if (angle < 0) angle += 360; // Normalize to 0-360

        // Map 0-360 degrees to 0-60 minutes
        // Snap to nearest 15 seconds (15000ms)
        // 360 deg = 3600000ms (60m)
        // ms = (angle / 360) * 60 * 60 * 1000

        let ms = (angle / 360) * 3600000;

        // Round to nearest 30 seconds for easier setting
        ms = Math.round(ms / 30000) * 30000;
        if (ms === 0) ms = 60000; // Min 1 min if they touch top

        setSetupDuration(ms);
    }, []);

    const onPointerDown = (e: React.PointerEvent) => {
        if (entity.state !== "idle") return;
        setIsDragging(true);
        (e.target as Element).setPointerCapture(e.pointerId);
        handleDialInteraction(e);
        haptic.tick();
    };

    const onPointerMove = (e: React.PointerEvent) => {
        if (!isDragging) return;
        handleDialInteraction(e);
    };

    const onPointerUp = (e: React.PointerEvent) => {
        setIsDragging(false);
        (e.target as Element).releasePointerCapture(e.pointerId);
        haptic.click();
    };

    // 5. Derived Values
    const progress = useMemo(() => {
        if (entity.state === "idle") {
            // Show setup progress (0-60m mapped to 0-100%)
            return Math.min(100, (setupDuration / 3600000) * 100);
        }
        if (totalDuration === 0) return 0;
        return Math.min(100, Math.max(0, (localRemaining / totalDuration) * 100));
    }, [localRemaining, totalDuration, setupDuration, entity.state]);

    const handleStart = (durationMs: number) => {
        haptic.click();
        setTotalDuration(durationMs);
        setLocalRemaining(durationMs);
        toast.success(`Timer set for ${formatLabel(durationMs)}`);
        // Mock start
    };

    const activeRing = "#f59e0b";

    return (
        <>
            <AuroraCard
                onClick={() => {
                    haptic.click();
                    setIsOpen(true);
                }}
                className={cn(
                    "relative w-full h-full overflow-hidden cursor-pointer select-none group @container",
                    "bg-zinc-900/40 backdrop-blur-3xl",
                    "ring-1 ring-white/10 ring-inset",
                    "border border-white/5",
                    "hover:bg-zinc-900/60 transition-all duration-300",
                    "active:scale-[0.98]",
                    className
                )}
            >
                {/* --- Dashboard Card Content (Simplified) --- */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-[85%] h-[85%] rounded-full border border-white/5 opacity-50" />
                    {entity.state !== "idle" && (
                        <svg className="w-[85%] h-[85%] -rotate-90 drop-shadow-2xl">
                            <circle
                                cx="50%"
                                cy="50%"
                                r="48%"
                                fill="none"
                                stroke={activeRing}
                                strokeWidth="2"
                                strokeDasharray="100 100"
                                pathLength={100}
                                strokeDashoffset={100 - progress}
                                strokeLinecap="round"
                                style={{ filter: `drop-shadow(0 0 6px ${activeRing})` }}
                            />
                        </svg>
                    )}
                </div>

                <div className="relative z-10 flex flex-col items-center justify-center h-full w-full p-4">
                    <div className="absolute top-4 left-4 hidden @[200px]:flex items-center gap-2">
                        <div className={cn(
                            "p-1.5 rounded-lg bg-white/5 ring-1 ring-white/10 backdrop-blur-md",
                            entity.state === "active" ? "text-amber-400 bg-amber-500/10 ring-amber-500/20" : "text-zinc-400"
                        )}>
                            <Timer className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                            {entity.attributes.friendly_name}
                        </span>
                    </div>

                    <div className="flex flex-col items-center justify-center z-20">
                        <span className={cn(
                            "font-mono font-medium tracking-tighter tabular-nums transition-all duration-300",
                            "text-3xl @[200px]:text-5xl",
                            entity.state === "active" ? "text-white drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]" : "text-zinc-500"
                        )}>
                            {entity.state === "idle" ? "00:00" : formatDuration(localRemaining)}
                        </span>
                        <span className={cn(
                            "text-[10px] @[200px]:text-xs font-medium tracking-widest uppercase mt-1",
                            entity.state === "active" ? "text-amber-400" : "text-zinc-600"
                        )}>
                            {entity.state === "idle" ? "READY" : entity.state}
                        </span>
                    </div>
                </div>
            </AuroraCard>

            {/* --- DETAILED DIALOG --- */}
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className={cn(
                    "bg-black/80 backdrop-blur-3xl border-white/10 p-0 overflow-hidden",
                    "sm:max-w-[480px] sm:rounded-[32px] shadow-2xl shadow-black",
                    "flex flex-col max-h-[85vh]"
                )}>
                    <div className="relative flex items-center justify-between p-6 border-b border-white/5 z-20">
                        <DialogTitle className="text-xl font-semibold text-white tracking-tight flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-500">
                                <Timer className="w-5 h-5" />
                            </div>
                            {entity.attributes.friendly_name}
                        </DialogTitle>
                        <Button variant="ghost" size="icon" className="rounded-full text-zinc-400 hover:text-white" onClick={() => setShowSettings(!showSettings)}>
                            <Settings className="w-5 h-5" />
                        </Button>
                    </div>

                    <AnimatePresence mode="wait">
                        {showSettings ? (
                            <motion.div
                                key="settings"
                                initial={{ opacity: 0, x: 50 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -50 }}
                                className="flex-1 p-6 space-y-6 overflow-y-auto"
                            >
                                {/* Settings Content... (Same as before) */}
                                <div className="space-y-4">
                                    <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Alerts</h3>
                                    <div className="flex items-center justify-between p-4 rounded-2xl bg-zinc-900/50 border border-white/5">
                                        <div className="flex items-center gap-3">
                                            <Bell className="w-5 h-5 text-zinc-400" />
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium text-white">Notifications</span>
                                                <span className="text-xs text-zinc-500">Send push on completion</span>
                                            </div>
                                        </div>
                                        <Switch defaultChecked />
                                    </div>
                                </div>
                                <Button className="w-full bg-white text-black hover:bg-zinc-200" onClick={() => setShowSettings(false)}>Done</Button>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="main"
                                initial={{ opacity: 0, x: -50 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 50 }}
                                className="flex-1 flex flex-col relative overflow-y-auto"
                            >
                                <div className="flex-1 flex flex-col items-center justify-center relative p-6 min-h-[400px]">
                                    {/* INTERACTIVE DIAL */}
                                    <div
                                        ref={dialRef}
                                        className={cn(
                                            "relative w-56 h-56 flex items-center justify-center select-none touch-none",
                                            entity.state === "idle" && "cursor-grab active:cursor-grabbing"
                                        )}
                                        onPointerDown={onPointerDown}
                                        onPointerMove={onPointerMove}
                                        onPointerUp={onPointerUp}
                                        onPointerLeave={onPointerUp}
                                    >
                                        {/* Track */}
                                        <div className="absolute inset-0 rounded-full border-[6px] border-zinc-800" />

                                        {/* Active Arc (SVG) */}
                                        <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none">
                                            <circle
                                                cx="50%"
                                                cy="50%"
                                                r="calc(50% - 3px)"
                                                fill="none"
                                                stroke={activeRing}
                                                strokeWidth="6"
                                                strokeLinecap="round"
                                                strokeDasharray="100 100"
                                                pathLength={100}
                                                strokeDashoffset={entity.state === 'idle' ? 100 - progress : 100 - progress}
                                                className={cn(
                                                    "transition-all ease-linear",
                                                    entity.state !== 'idle' && "duration-1000",
                                                    (entity.state === 'idle' && setupDuration === 0) ? "opacity-0" : "opacity-100"
                                                )}
                                                style={{ filter: `drop-shadow(0 0 15px ${activeRing})` }}
                                            />
                                        </svg>

                                        {/* Knob (Only in Idle/Setup Mode) */}
                                        {entity.state === 'idle' && setupDuration > 0 && (
                                            <div
                                                className="absolute w-full h-full pointer-events-none"
                                                style={{
                                                    transform: `rotate(${(setupDuration / 3600000) * 360}deg)`
                                                }}
                                            >
                                                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-[2px] w-4 h-4 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)] ring-2 ring-zinc-900" />
                                            </div>
                                        )}

                                        {/* Digital Time */}
                                        <div className="flex flex-col items-center z-10 pointer-events-none">
                                            <span className={cn(
                                                "text-6xl font-mono font-medium tracking-tighter tabular-nums",
                                                (entity.state === "active" || setupDuration > 0) ? "text-white" : "text-zinc-500"
                                            )}>
                                                {entity.state === "idle"
                                                    ? (setupDuration > 0 ? formatDuration(setupDuration) : "00:00")
                                                    : formatDuration(localRemaining)
                                                }
                                            </span>
                                            <span className="text-sm font-medium text-zinc-500 uppercase tracking-widest mt-2">
                                                {entity.state === "idle" ? (setupDuration > 0 ? "SET" : "TOUCH TO SET") : entity.state}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Controls */}
                                    <div className="mt-8 flex items-center gap-6">
                                        {entity.state === "idle" ? (
                                            <Button
                                                size="lg"
                                                className="h-16 w-16 rounded-full bg-white text-black hover:bg-zinc-200 shadow-[0_0_30px_rgba(255,255,255,0.1)]"
                                                onClick={() => handleStart(setupDuration || 600000)}
                                            >
                                                <Play className="w-8 h-8 fill-current ml-1" />
                                            </Button>
                                        ) : (
                                            <>
                                                <Button
                                                    variant="outline"
                                                    size="lg"
                                                    className="h-14 w-14 rounded-full border-zinc-700 bg-transparent text-zinc-400 hover:text-white hover:border-zinc-500"
                                                    onClick={() => service.cancel()}
                                                >
                                                    <Square className="w-5 h-5 fill-current" />
                                                </Button>

                                                <Button
                                                    size="lg"
                                                    className={cn(
                                                        "h-20 w-20 rounded-full shadow-2xl transition-all",
                                                        entity.state === "active"
                                                            ? "bg-amber-500 hover:bg-amber-400 text-black shadow-amber-900/40"
                                                            : "bg-green-500 hover:bg-green-400 text-black"
                                                    )}
                                                    onClick={() => entity.state === "active" ? service.pause() : service.start()}
                                                >
                                                    {entity.state === "active" ? (
                                                        <Pause className="w-8 h-8 fill-current" />
                                                    ) : (
                                                        <Play className="w-8 h-8 fill-current ml-1" />
                                                    )}
                                                </Button>

                                                <Button
                                                    variant="outline"
                                                    size="lg"
                                                    className="h-14 w-14 rounded-full border-zinc-700 bg-transparent text-zinc-400 hover:text-white hover:border-zinc-500"
                                                    onClick={() => handleStart(localRemaining + 60000)} // +1m
                                                >
                                                    <Plus className="w-6 h-6" />
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Presets */}
                                <div className="bg-zinc-900/50 border-t border-white/5 p-6 backdrop-blur-xl">
                                    <div className="flex items-center justify-between mb-4">
                                        <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Quick Presets</h4>
                                        <History className="w-4 h-4 text-zinc-600" />
                                    </div>

                                    <div className="grid grid-cols-4 gap-3">
                                        {PRESETS.map((preset) => (
                                            <button
                                                key={preset.id}
                                                onClick={() => handleStart(preset.duration)}
                                                className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-white/5 hover:bg-white/10 active:bg-white/20 transition-all border border-white/5 group"
                                            >
                                                <div className="p-2 rounded-full bg-zinc-800 text-zinc-400 group-hover:text-white group-hover:bg-zinc-700 transition-colors">
                                                    <preset.icon className="w-5 h-5" />
                                                </div>
                                                <span className="text-xs font-medium text-zinc-300">{formatLabel(preset.duration)}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </DialogContent>
            </Dialog>
        </>
    );
};
