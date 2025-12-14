import React, { useState, useRef, useEffect, useCallback } from "react";
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
    Camera,
    Mic,
    MicOff,
    MoreHorizontal,
    Activity,
    User,
    Zap,
    History,
    RotateCcw,
    Play,
    Pause,
    X
} from "lucide-react";
import { cn } from "../../lib/utils";
import { motion, AnimatePresence, useMotionValue, useTransform, type PanInfo, useAnimation } from "motion/react";
import { Switch } from "../ui/switch";
import { format, subMinutes, subSeconds } from "date-fns";

interface AuroraCameraCardProps {
    entityId: EntityName;
    className?: string;
}

// --- Haptics ---
const hapticLight = () => {
    if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(10);
};
const hapticSuccess = () => {
    if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate([10, 30, 10]);
};
const hapticImpact = () => {
    if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(20);
}

// --- Mock Data ---
interface CameraEvent {
    id: number;
    type: "person" | "motion" | "vehicle";
    label: string;
    time: Date;
    thumbnail: string; // URL or Color class for now
    videoDuration: number; // seconds
}

const RECENT_EVENTS: CameraEvent[] = [
    {
        id: 1,
        type: "person",
        label: "Person Detected",
        time: subMinutes(new Date(), 2),
        thumbnail: "https://images.unsplash.com/photo-1552168324-d612d77725e3?q=80&w=200&auto=format&fit=crop",
        videoDuration: 15
    },
    {
        id: 2,
        type: "motion",
        label: "Motion at Door",
        time: subMinutes(new Date(), 45),
        thumbnail: "https://images.unsplash.com/photo-1566760873808-971b38237618?q=80&w=200&auto=format&fit=crop",
        videoDuration: 30
    },
    {
        id: 3,
        type: "vehicle",
        label: "Vehicle Detected",
        time: subMinutes(new Date(), 120),
        thumbnail: "https://images.unsplash.com/photo-1634224143538-ce68810851f4?q=80&w=200&auto=format&fit=crop",
        videoDuration: 45
    },
];

// --- Subcomponents ---

// Virtual Joystick Component
const VirtualJoystick = ({ onMove }: { onMove: (x: number, y: number) => void }) => {
    const containerRef = useRef<HTMLDivElement>(null);

    // Limit radius
    const MAX_RADIUS = 40;

    return (
        <div className="relative w-32 h-32 rounded-full bg-zinc-900/60 backdrop-blur-md border border-white/10 shadow-2xl flex items-center justify-center touch-none">
            {/* Grid Lines for aesthetic */}
            <div className="absolute inset-0 rounded-full border border-white/5 opacity-50" />
            <div className="absolute w-full h-[1px] bg-white/5" />
            <div className="absolute h-full w-[1px] bg-white/5" />

            {/* The Knob */}
            <motion.div
                className="w-12 h-12 rounded-full bg-white/10 border border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.1)] backdrop-blur-md z-10 cursor-grab active:cursor-grabbing flex items-center justify-center"
                drag
                dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                dragElastic={0.1}
                onDrag={(event, info) => {
                    // Calculate vector from center
                    const x = info.offset.x;
                    const y = info.offset.y;
                    const distance = Math.sqrt(x * x + y * y);

                    // Haptic feedback at edges
                    if (distance > MAX_RADIUS) {
                        hapticLight();
                    }

                    // Normalize output (-1 to 1)
                    onMove(x / MAX_RADIUS, y / MAX_RADIUS);
                }}
                onDragEnd={() => {
                    onMove(0, 0);
                }}
                whileTap={{ scale: 0.9, backgroundColor: "rgba(255,255,255,0.2)" }}
            >
                <div className="w-2 h-2 rounded-full bg-white/50" />
            </motion.div>

            {/* Direction Hints */}
            <span className="absolute top-2 text-[8px] font-bold text-zinc-500">TILT</span>
            <span className="absolute bottom-2 text-[8px] font-bold text-zinc-500">DOWN</span>
            <span className="absolute left-2 text-[8px] font-bold text-zinc-500 -rotate-90">PAN</span>
            <span className="absolute right-2 text-[8px] font-bold text-zinc-500 rotate-90">PAN</span>
        </div>
    );
};

// Interactive Timeline Component
const InteractiveTimeline = ({ isLive, onScrub }: { isLive: boolean, onScrub: (secondsAgo: number) => void }) => {
    const [scrubPosition, setScrubPosition] = useState(0); // 0 to 100%
    const containerRef = useRef<HTMLDivElement>(null);
    const isDragging = useRef(false);

    const handlePointerMove = useCallback((e: PointerEvent | React.PointerEvent) => {
        if (!isDragging.current || !containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
        const percentage = (x / rect.width);

        // Invert: Right (100%) is NOW (0s ago), Left (0%) is Past (-2h)
        const secondsAgo = (1 - percentage) * 7200;

        setScrubPosition(percentage * 100);
        onScrub(secondsAgo);
    }, [onScrub]);

    return (
        <div
            ref={containerRef}
            className="relative h-14 w-full bg-gradient-to-t from-black/80 to-transparent flex items-center px-6 cursor-pointer group select-none touch-none"
            onPointerDown={(e) => {
                isDragging.current = true;
                e.currentTarget.setPointerCapture(e.pointerId);
                handlePointerMove(e);
                hapticLight();
            }}
            onPointerMove={handlePointerMove}
            onPointerUp={(e) => {
                isDragging.current = false;
                e.currentTarget.releasePointerCapture(e.pointerId);
                if (scrubPosition > 95) {
                    onScrub(0);
                    setScrubPosition(100);
                    hapticSuccess();
                }
            }}
        >
            {/* Track */}
            <div className="w-full h-10 relative flex items-center">
                {/* Ticks */}
                <div className="absolute inset-0 flex justify-between items-center px-2">
                    {Array.from({ length: 40 }).map((_, i) => (
                        <div
                            key={i}
                            className={cn(
                                "w-0.5 rounded-full bg-white/10 transition-all duration-300",
                                i % 5 === 0 ? "h-6 bg-white/20" : "h-3",
                                (i / 40) * 100 < scrubPosition ? "bg-blue-500/40" : ""
                            )}
                        />
                    ))}
                </div>

                {/* Events Indicators on Timeline */}
                <div className="absolute left-[80%] w-1 h-4 bg-orange-500 rounded-full shadow-[0_0_10px_rgba(249,115,22,0.5)]" title="Motion" />
                <div className="absolute left-[60%] w-1 h-4 bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]" title="Person" />

                {/* Scrubber Handle */}
                <motion.div
                    className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_15px_white] z-20"
                    style={{ left: `${scrubPosition}%` }}
                    animate={{ left: `${isLive ? 100 : scrubPosition}%` }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                >
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/50 shadow-lg" />
                </motion.div>
            </div>
        </div>
    );
};

export const AuroraCameraCard: React.FC<AuroraCameraCardProps> = ({
    entityId,
    className,
}) => {
    let entity: any;
    try {
        entity = useEntity(entityId);
    } catch (e) {
        entity = {
            state: "idle",
            attributes: { friendly_name: "Camera", entity_picture: "https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=400&auto=format&fit=crop" }
        };
    }
    const image = (entity.attributes as any).entity_picture;
    const friendlyName = entity.attributes.friendly_name || "Camera";

    const [open, setOpen] = useState(false);
    const [isPressed, setIsPressed] = useState(false);
    const longPressTimer = useRef<NodeJS.Timeout | null>(null);

    // Camera State
    const [isMuted, setIsMuted] = useState(true);
    const [historySecondsAgo, setHistorySecondsAgo] = useState(0); // 0 = Live
    const [playingEvent, setPlayingEvent] = useState<CameraEvent | null>(null); // Playing a specific recorded event
    const [playbackProgress, setPlaybackProgress] = useState(0); // 0-100 for event playback
    const [isPlaying, setIsPlaying] = useState(false); // Play/Pause toggle

    const [settings, setSettings] = useState({
        faceDetection: true,
        statusLight: true,
        nightMode: "auto"
    });

    // Zoom Interaction State (Tile)
    const y = useMotionValue(0);
    const scale = useTransform(y, [-150, 0, 150], [2.5, 1, 0.8]);

    // --- Effects ---

    // Simulate video playback progress
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (playingEvent && isPlaying) {
            interval = setInterval(() => {
                setPlaybackProgress(prev => {
                    if (prev >= 100) {
                        setIsPlaying(false);
                        return 100;
                    }
                    return prev + (100 / (playingEvent.videoDuration * 10)); // Update every 100ms
                });
            }, 100);
        }
        return () => clearInterval(interval);
    }, [playingEvent, isPlaying]);

    // --- Handlers ---

    const handleTouchStart = () => {
        setIsPressed(true);
        longPressTimer.current = setTimeout(() => {
            setOpen(true);
            hapticSuccess();
            setIsPressed(false);
        }, 500);
    };

    const handleTouchEnd = () => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
        setIsPressed(false);
    };

    const handleJoystickMove = (x: number, y: number) => {
        // console.log(`PTZ: x:${x.toFixed(2)}, y:${y.toFixed(2)}`);
    };

    const handlePlayEvent = (event: CameraEvent) => {
        setPlayingEvent(event);
        setPlaybackProgress(0);
        setIsPlaying(true);
        setHistorySecondsAgo(0); // Reset scrubber context
        hapticSuccess();
    };

    const closePlayback = () => {
        setPlayingEvent(null);
        setIsPlaying(false);
        setPlaybackProgress(0);
        hapticLight();
    };

    // --- Tile Render ---
    return (
        <>
            <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                className={cn("relative h-full col-span-2 row-span-2", className)}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                onMouseDown={handleTouchStart}
                onMouseUp={handleTouchEnd}
                onMouseLeave={handleTouchEnd}
            >
                <AuroraCard
                    className={cn(
                        "relative flex flex-col p-0 cursor-pointer overflow-hidden group select-none touch-none",
                        "h-full w-full rounded-[24px]",
                        "bg-zinc-900/40 backdrop-blur-3xl",
                        "ring-1 ring-white/10 ring-inset border border-white/5",
                        "shadow-xl shadow-black/20",
                        isPressed ? "scale-[0.98]" : "hover:bg-zinc-900/50 active:scale-[0.98]",
                        "transition-all duration-200"
                    )}
                    onClick={() => {
                        if (!isPressed) {
                            setIsMuted(!isMuted);
                            hapticLight();
                        }
                    }}
                >
                    {/* Background Feed (Image) */}
                    <div className="absolute inset-0 overflow-hidden bg-black">
                        <motion.div
                            className="w-full h-full"
                            style={{ scale }}
                        >
                            {image ? (
                                <img
                                    src={image}
                                    alt={friendlyName}
                                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                                />
                            ) : (
                                <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                                    <Camera className="w-10 h-10 text-zinc-600" />
                                </div>
                            )}
                        </motion.div>

                        {/* Simulated Face Detection Box */}
                        {settings.faceDetection && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: [0, 1, 1, 0], scale: 1 }}
                                transition={{ duration: 4, repeat: Infinity, repeatDelay: 5 }}
                                className="absolute top-[30%] left-[40%] w-16 h-16 border-2 border-yellow-400 rounded-lg shadow-[0_0_15px_rgba(250,204,21,0.5)] flex items-start justify-start"
                            >
                                <div className="bg-yellow-400 text-black text-[8px] font-bold px-1 uppercase tracking-tighter">
                                    Person
                                </div>
                            </motion.div>
                        )}
                    </div>

                    {/* Gradient Overlays */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 pointer-events-none" />

                    {/* Drag Layer for Zoom */}
                    <motion.div
                        className="absolute inset-0 z-20"
                        drag="y"
                        dragConstraints={{ top: 0, bottom: 0 }}
                        dragElastic={0.1}
                        style={{ y }}
                    />

                    {/* HUD Elements */}
                    <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-30 pointer-events-none">
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                <span className="text-xs font-medium text-white tracking-wide">LIVE</span>
                            </div>
                        </div>
                    </div>

                    <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end z-30 pointer-events-none">
                        <div>
                            <h3 className="text-white font-medium text-lg leading-tight">{friendlyName}</h3>
                            <p className="text-zinc-400 text-xs flex items-center gap-1">
                                <Activity className="w-3 h-3" />
                                Motion detected 2m ago
                            </p>
                        </div>

                        <div className="flex items-center gap-2">
                            <div className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md transition-colors",
                                isMuted ? "bg-white/10 text-white/50" : "bg-white text-black"
                            )}>
                                {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                            </div>
                        </div>
                    </div>
                </AuroraCard>
            </motion.div>

            {/* --- INSPECTOR DIALOG --- */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="bg-zinc-900/95 backdrop-blur-3xl ring-1 ring-white/10 ring-inset border border-white/5 shadow-2xl sm:max-w-[900px] sm:rounded-[32px] p-0 overflow-hidden gap-0 max-h-[90vh] flex flex-col md:flex-row">
                    <DialogHeader className="sr-only">
                        <DialogTitle>{friendlyName} Stream</DialogTitle>
                        <DialogDescription>Live feed and history</DialogDescription>
                    </DialogHeader>

                    {/* LEFT: Main Feed & Controls */}
                    <div className="flex-1 flex flex-col bg-black relative group overflow-hidden">
                        {/* Feed Area */}
                        <div className="flex-1 relative overflow-hidden flex items-center justify-center bg-zinc-950">

                            {playingEvent ? (
                                /* --- EVENT PLAYBACK MODE --- */
                                <motion.div
                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                    className="w-full h-full relative"
                                >
                                    <img
                                        src={playingEvent.thumbnail}
                                        alt="Recorded Event"
                                        className="w-full h-full object-cover opacity-90"
                                    />

                                    {/* Playback Overlay */}
                                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                                        <button
                                            onClick={() => setIsPlaying(!isPlaying)}
                                            className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center hover:scale-110 transition-transform"
                                        >
                                            {isPlaying ? <Pause className="w-8 h-8 text-white fill-white" /> : <Play className="w-8 h-8 text-white fill-white" />}
                                        </button>
                                    </div>

                                    {/* Event Header Overlay */}
                                    <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
                                        <div className="bg-black/60 backdrop-blur px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-blue-500" />
                                            <span className="text-xs font-medium text-white">{playingEvent.label}</span>
                                        </div>
                                        <button
                                            onClick={closePlayback}
                                            className="w-8 h-8 rounded-full bg-black/60 backdrop-blur flex items-center justify-center text-white border border-white/10 hover:bg-white/20"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                                        <motion.div
                                            className="h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]"
                                            style={{ width: `${playbackProgress}%` }}
                                        />
                                    </div>
                                </motion.div>
                            ) : (
                                /* --- LIVE / SCRUB MODE --- */
                                <>
                                    {image ? (
                                        <img src={image} alt="Live Feed" className={cn("w-full h-full object-contain transition-all duration-500", historySecondsAgo > 0 && "grayscale-[0.5] opacity-80")} />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-zinc-600">
                                            <Camera className="w-16 h-16 opacity-20" />
                                        </div>
                                    )}

                                    {/* Replay Overlay Info */}
                                    <AnimatePresence>
                                        {historySecondsAgo > 5 && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -20 }}
                                                className="absolute top-6 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 flex items-center gap-3"
                                            >
                                                <RotateCcw className="w-4 h-4 text-orange-400" />
                                                <span className="text-sm font-mono text-white">
                                                    {format(subSeconds(new Date(), historySecondsAgo), "h:mm:ss a")}
                                                </span>
                                                <button
                                                    onClick={() => { setHistorySecondsAgo(0); hapticSuccess(); }}
                                                    className="bg-white text-black text-[10px] font-bold px-2 py-1 rounded-full hover:bg-zinc-200"
                                                >
                                                    GO LIVE
                                                </button>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {/* Virtual Joystick */}
                                    <div className="absolute bottom-24 right-8 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
                                        <VirtualJoystick onMove={handleJoystickMove} />
                                    </div>

                                    {/* Interactive Timeline Scrubber */}
                                    <div className="absolute bottom-0 left-0 right-0 pb-4 pt-12 bg-gradient-to-t from-black via-black/50 to-transparent z-10">
                                        <InteractiveTimeline
                                            isLive={historySecondsAgo < 5}
                                            onScrub={(seconds) => {
                                                setHistorySecondsAgo(seconds);
                                            }}
                                        />
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* RIGHT: Sidebar (History & Settings) */}
                    <div className="w-full md:w-[320px] bg-zinc-950/50 border-t md:border-t-0 md:border-l border-white/5 flex flex-col z-30">
                        <div className="p-4 border-b border-white/5 flex items-center justify-between">
                            <h3 className="text-sm font-medium text-white flex items-center gap-2">
                                <History className="w-4 h-4 text-zinc-400" />
                                Recent Activity
                            </h3>
                            <button className="p-2 rounded-full hover:bg-white/5 transition-colors">
                                <MoreHorizontal className="w-4 h-4 text-zinc-400" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-2 space-y-1">
                            {RECENT_EVENTS.map(event => {
                                const isActive = playingEvent?.id === event.id;
                                return (
                                    <div
                                        key={event.id}
                                        onClick={() => handlePlayEvent(event)}
                                        className={cn(
                                            "group flex items-center gap-3 p-2 rounded-xl transition-all cursor-pointer border",
                                            isActive
                                                ? "bg-white/10 border-white/20 shadow-inner"
                                                : "border-transparent hover:bg-white/5"
                                        )}
                                    >
                                        <div className="relative w-16 h-10 rounded-md overflow-hidden flex-shrink-0 border border-white/10">
                                            <img src={event.thumbnail} className="w-full h-full object-cover" />
                                            {/* Play Icon Overlay on Hover/Active */}
                                            <div className={cn(
                                                "absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity",
                                                isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                                            )}>
                                                <Play className="w-3 h-3 text-white fill-white" />
                                            </div>
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between">
                                                <p className={cn("text-sm font-medium truncate", isActive ? "text-white" : "text-zinc-200")}>
                                                    {event.label}
                                                </p>
                                                <span className="text-[10px] text-zinc-500">{format(event.time, "h:mm a")}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                {event.type === "person" && <User className="w-3 h-3 text-blue-400" />}
                                                {event.type === "motion" && <Activity className="w-3 h-3 text-orange-400" />}
                                                {event.type === "vehicle" && <Zap className="w-3 h-3 text-purple-400" />}
                                                <span className="text-xs text-zinc-500 capitalize">{event.type}</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="p-4 bg-black/20 border-t border-white/5 space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-zinc-300">Face Detection</span>
                                <Switch checked={settings.faceDetection} onCheckedChange={c => setSettings(s => ({ ...s, faceDetection: c }))} />
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
};
