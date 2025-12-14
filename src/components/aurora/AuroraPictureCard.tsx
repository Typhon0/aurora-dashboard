import React, { useState, useRef, useEffect, useMemo } from "react";
import { useEntity, type EntityName, useService } from "@hakit/core";
import { motion, AnimatePresence, useSpring, useMotionValue, useTransform, type PanInfo } from "motion/react";
import {
    Lightbulb,
    Blinds,
    Thermometer,
    Power,
    MoreVertical,
    Sun,
    Moon,
    ChevronUp,
    ChevronDown,
    Wind,
    Palette,
    Maximize2,
    X,
    Settings,
    Play,
    Pause,
    Video
} from "lucide-react";
import { cn } from "../../lib/utils";

interface Props {
    entityId: EntityName;
    title?: string;
    className?: string;
    /** Optional background image override */
    backgroundImage?: string;
}

/**
 * AuroraPictureCard (Neo-Glass Universal Tile)
 * 
 * A high-fidelity "HomeKit 2026" styled component that adapts to the entity type.
 * Features:
 * - Thick Glass Materiality (Blur + Inner Glow)
 * - Haptic Feedback
 * - Direct Gesture Control (Slide on card to adjust)
 * - Integrated Inspector Modal
 * - Hover-only Controls for a cleaner "Picture" look
 */
export function AuroraPictureCard({ entityId, title, className, backgroundImage }: Props) {
    // Haptics
    const vibrate = (pattern: number | number[]) => {
        if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(pattern);
    };

    // 1. ENTITY DATA & SERVICES
    // Gracefully handle missing entity for dev/demo purposes
    let entity: any;
    try {
        entity = useEntity(entityId);
    } catch (e) {
        // Fallback Mock if Hakit is not connected
        entity = {
            entity_id: entityId,
            state: "on",
            attributes: { friendly_name: title || "Device", brightness: 128, current_position: 50, temperature: 21 }
        };
    }

    const api = useService();

    // Determine Domain & Type
    const domain = entityId.split(".")[0];
    const isLight = domain === "light";
    const isCover = domain === "cover";
    const isClimate = domain === "climate";
    const isSwitch = domain === "switch";
    const isMedia = domain === "media_player";
    const isCamera = domain === "camera";

    // State
    const [isOpen, setIsOpen] = useState(false); // Inspector Modal
    const isActive = entity.state !== "off" && entity.state !== "unavailable" && entity.state !== "closed" && entity.state !== "paused" && entity.state !== "idle";
    const isPlaying = entity.state === "playing";

    // Internal Optimistic State
    const [value, setValue] = useState<number>(
        isLight ? (entity.attributes.brightness || 0) / 2.55 :
            isCover ? (entity.attributes.current_position || 0) :
                0
    );

    // Update state when entity changes (unless dragging)
    const isDragging = useRef(false);
    useEffect(() => {
        if (!isDragging.current) {
            if (isLight) setValue((entity.attributes.brightness || 0) / 2.55);
            if (isCover) setValue(entity.attributes.current_position || 0);
        }
    }, [entity, isLight, isCover]);

    // Long Press Logic
    const longPressTimer = useRef<NodeJS.Timeout | null>(null);

    const handlePointerDown = () => {
        longPressTimer.current = setTimeout(() => {
            vibrate(50);
            setIsOpen(true);
            longPressTimer.current = null;
        }, 500); // 500ms for long press
    };

    const handlePointerUp = () => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
            // Tap interaction handled by specific buttons now, or general modal open
            // But for Light/Cover gestures, we might want to keep tap-to-toggle if no button is clicked?
            // The user requested "No on/off button... pause/play on hover".
            // We'll handle interactions via the hover overlay mainly.
        }
    };

    const handlePointerCancel = () => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
    }


    // 2. GESTURE LOGIC (Vertical Slide)
    // Only enabled if not clicking the hover buttons
    const y = useMotionValue(0);
    const handleDrag = (_: any, info: PanInfo) => {
        if (Math.abs(info.offset.y) > 5 && longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
        isDragging.current = true;
        const sensitivity = 0.5;
        const delta = -info.delta.y * sensitivity;
        setValue(v => {
            const next = Math.min(100, Math.max(0, v + delta));
            if (Math.floor(next) % 5 === 0 && Math.floor(v) % 5 !== 0) vibrate(5);
            return next;
        });
    };

    const handleDragEnd = () => {
        isDragging.current = false;
        vibrate(10);
        if (isLight) api.light.turn_on({ entity_id: entityId, brightness: value * 2.55 });
        if (isCover) api.cover.set_cover_position({ entity_id: entityId, position: value });
    };

    // 3. VISUAL STYLES
    const glowColor = useMemo(() => {
        if (!isActive) return "rgba(255,255,255,0)";
        if (isLight) return "rgba(255, 200, 100, 0.4)";
        if (isClimate) return "rgba(100, 200, 255, 0.4)";
        if (isCover) return "rgba(150, 100, 255, 0.4)";
        if (isMedia) return "rgba(100, 255, 150, 0.4)";
        return "rgba(255,255,255,0.2)";
    }, [isActive, isLight, isClimate, isCover, isMedia]);

    const bgImage = backgroundImage || (entity.attributes as any)?.entity_picture;

    return (
        <>
            {/* --- THE INTERACTIVE TILE --- */}
            <motion.div
                className={cn(
                    "relative overflow-hidden rounded-[24px] cursor-pointer touch-none select-none group",
                    "bg-zinc-900/40 backdrop-blur-3xl",
                    "border border-white/5 ring-1 ring-white/10",
                    className
                )}
                style={{
                    aspectRatio: "1/1",
                    boxShadow: isActive ? `0 0 30px ${glowColor}, inset 0 0 20px ${glowColor}` : "none"
                }}
                whileTap={{ scale: 0.98 }}
                onPointerDown={handlePointerDown}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerCancel}
                drag={isLight || isCover ? "y" : false}
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={0.1}
                onDrag={handleDrag}
                onDragEnd={handleDragEnd}
            >
                {/* Background Image (Dominant Feature) */}
                {bgImage ? (
                    <div className="absolute inset-0 z-0">
                        <img src={bgImage} alt="" className="w-full h-full object-cover transition-all duration-500 group-hover:scale-105" />
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors duration-300" />
                    </div>
                ) : (
                    <div className="absolute inset-0 z-0 flex items-center justify-center bg-white/5 text-white/20">
                        {isCamera ? <Video className="w-12 h-12" /> : <Play className="w-12 h-12" />}
                    </div>
                )}

                {/* Content Container - Minimalist (Hidden by default or very subtle) */}
                <div className="relative z-10 h-full flex flex-col justify-end p-5 pointer-events-none transition-opacity duration-300">
                    <div className="translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                        <h3 className="text-sm font-medium text-white/90 leading-tight line-clamp-1 drop-shadow-md">
                            {title || entity.attributes.friendly_name}
                        </h3>
                        {/* State Subtext - Only on Hover or if Active */}
                        <div className="h-0 overflow-hidden group-hover:h-auto group-hover:mt-1 transition-all opacity-0 group-hover:opacity-100">
                            <span className="text-xs font-medium text-white/70 capitalize">
                                {entity.state} • {Math.round(value)}%
                            </span>
                        </div>
                    </div>
                </div>

                {/* HOVER OVERLAY: Play/Pause/Action Button */}
                <div className="absolute inset-0 z-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                    <motion.button
                        initial={{ scale: 0.8 }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => {
                            e.stopPropagation(); // Prevent card tap/drag
                            vibrate(10);
                            if (isMedia) api.media_player.media_play_pause({ entity_id: entityId });
                            else if (isCamera) setIsOpen(true); // Cameras open inspector
                            else if (isLight || isSwitch) api[domain].toggle({ entity_id: entityId });
                            else if (isCover) api.cover.toggle({ entity_id: entityId });
                        }}
                        className="pointer-events-auto w-14 h-14 rounded-full bg-white/20 backdrop-blur-xl border border-white/30 flex items-center justify-center text-white shadow-xl hover:bg-white/30 transition-colors"
                    >
                        {isMedia ? (
                            isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-1" />
                        ) : isCamera ? (
                            <Maximize2 className="w-6 h-6" />
                        ) : isActive ? (
                            <Power className="w-6 h-6 text-white" />
                        ) : (
                            <Power className="w-6 h-6 text-white/50" />
                        )}
                    </motion.button>
                </div>

                {/* Visual Feedback for Drag (Fill Bar) - Subtle at bottom */}
                {(isLight || isCover) && (
                    <motion.div
                        className="absolute bottom-0 left-0 right-0 bg-white/20 z-0 pointer-events-none"
                        style={{ height: `${value}%` }}
                        transition={{ type: "spring", bounce: 0 }}
                    />
                )}
            </motion.div>

            {/* --- THE INSPECTOR (MODAL) --- */}
            <AnimatePresence>
                {isOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/60 backdrop-blur-md"
                            onClick={() => setIsOpen(false)}
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="relative w-full max-w-sm bg-[#1c1c1e] rounded-[32px] shadow-2xl border border-white/10 overflow-hidden flex flex-col"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="p-6 pb-0 flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-bold text-white">{title || entity.attributes.friendly_name}</h2>
                                    <p className="text-sm text-zinc-400 capitalize">{domain} • {entity.state}</p>
                                </div>
                                <button
                                    onClick={() => { vibrate(10); setIsOpen(false); }}
                                    className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:bg-white/20"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-6 space-y-8">
                                {(isLight || isCover) && (
                                    <div className="space-y-3">
                                        <div className="flex justify-between text-sm font-medium text-zinc-400">
                                            <span>{isLight ? "Brightness" : "Position"}</span>
                                            <span>{Math.round(value)}%</span>
                                        </div>
                                        <div className="h-48 rounded-2xl bg-zinc-900 relative overflow-hidden touch-none border border-white/5">
                                            <motion.div
                                                className={cn("absolute bottom-0 left-0 right-0 rounded-b-2xl", isLight ? "bg-amber-400/80" : "bg-indigo-400/80")}
                                                style={{ height: `${value}%` }}
                                            />
                                            <motion.div
                                                className="absolute inset-0 cursor-ns-resize"
                                                drag="y"
                                                dragConstraints={{ top: 0, bottom: 0 }}
                                                dragElastic={0}
                                                onDrag={(_, info) => {
                                                    const sliderHeight = 192;
                                                    const deltaPercent = -(info.delta.y / sliderHeight) * 100;
                                                    setValue(v => Math.min(100, Math.max(0, v + deltaPercent)));
                                                }}
                                                onDragEnd={() => {
                                                    if (isLight) api.light.turn_on({ entity_id: entityId, brightness: value * 2.55 });
                                                    if (isCover) api.cover.set_cover_position({ entity_id: entityId, position: value });
                                                }}
                                            />
                                            <div className="absolute bottom-4 left-0 right-0 flex justify-center pointer-events-none">
                                                {isLight ? <Sun className="w-6 h-6 text-white/50" /> : <Blinds className="w-6 h-6 text-white/50" />}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <button
                                    onClick={() => {
                                        vibrate(20);
                                        if (isLight) api.light.toggle({ entity_id: entityId });
                                        else if (isCover) api.cover.toggle({ entity_id: entityId });
                                        else api[domain].toggle({ entity_id: entityId });
                                    }}
                                    className={cn(
                                        "w-full py-4 rounded-2xl font-semibold text-lg transition-all flex items-center justify-center gap-3",
                                        isActive ? "bg-white text-black shadow-xl" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                                    )}
                                >
                                    <Power className="w-5 h-5" />
                                    {isActive ? "Turn Off" : "Turn On"}
                                </button>

                                {isLight && (
                                    <div className="grid grid-cols-4 gap-2">
                                        {[{ color: "#ffaa00" }, { color: "#ffddaa" }, { color: "#ffffff" }, { color: "#aaddff" }].map((preset, i) => (
                                            <button
                                                key={i}
                                                className="aspect-square rounded-xl border border-white/10 flex items-center justify-center hover:scale-105 transition-transform"
                                                style={{ background: preset.color }}
                                                onClick={() => vibrate(5)}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}
