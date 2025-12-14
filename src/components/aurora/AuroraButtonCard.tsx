import React, { useCallback, useState, useRef } from "react";
import { useEntity, useService, type EntityName } from "@hakit/core";
import { motion, AnimatePresence } from "motion/react";
import { Power, MousePointerClick, Settings, X, Clock, Activity, ToggleLeft, ToggleRight } from "lucide-react";
import { toast } from "sonner";
import { cn } from "../../lib/utils";

interface Props {
    entityId: EntityName;
    className?: string;
    title?: string;
}

/**
 * AuroraButtonCard (Neo-Glass Toggle/Action Tile)
 * 
 * Handles both stateful 'switch'/'input_boolean' and stateless 'button' entities.
 * Features:
 * - Thick Glass Materiality
 * - Haptic Feedback
 * - "Glow from Within" Active State
 * - Integrated Inspector Modal
 */
export function AuroraButtonCard({ entityId, className, title }: Props) {
    let entity: any;
    try {
        entity = useEntity(entityId);
    } catch (e) {
        entity = {
            state: "off",
            attributes: { friendly_name: title || "Button" }
        };
    }
    const domain = entityId.split(".")[0] as "button" | "switch" | "input_boolean";
    const svc = useService(domain as any);

    const [isOpen, setIsOpen] = useState(false); // Inspector Modal
    const isStateless = domain === "button";
    const isOn = !isStateless && entity.state === "on";

    // Haptics
    const vibrate = (pattern: number | number[]) => {
        if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(pattern);
    };

    // Action Handler
    const handleAction = useCallback(async (forceState?: boolean) => {
        vibrate(10);
        try {
            if (isStateless) {
                // Press Button
                await (svc as any).press({ entity_id: entityId });
                toast.success("Pressed", { id: entityId });
                // Visual feedback handled by click animation usually
            } else {
                // Toggle Switch
                if (forceState !== undefined) {
                    if (forceState) await (svc as any).turnOn({ entity_id: entityId });
                    else await (svc as any).turnOff({ entity_id: entityId });
                } else {
                    await (svc as any).toggle({ entity_id: entityId });
                }
            }
        } catch (e: any) {
            toast.error(e?.message ?? "Failed", { id: entityId });
        }
    }, [svc, entityId, isStateless]);

    // Long Press Logic
    const longPressTimer = useRef<NodeJS.Timeout | null>(null);
    const handlePointerDown = () => {
        longPressTimer.current = setTimeout(() => {
            vibrate(50);
            setIsOpen(true);
            longPressTimer.current = null;
        }, 500);
    };
    const handlePointerUp = () => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
            handleAction(); // Short tap = Toggle/Press
        }
    };
    const handlePointerLeave = () => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
    };

    // Dynamic Styles based on State
    // Amber for Switch On, Blue for Button Press (transient)
    const activeColor = "255, 170, 0"; // Amber-500

    return (
        <>
            {/* --- THE INTERACTIVE TILE --- */}
            <motion.div
                onPointerDown={handlePointerDown}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerLeave}
                whileTap={{ scale: 0.95 }}
                className={cn(
                    "relative overflow-hidden rounded-[24px] flex flex-col items-start justify-between p-5 text-left group touch-none select-none outline-none cursor-pointer",
                    "border border-white/5 ring-1 ring-white/10 transition-all duration-500",
                    isOn
                        ? "bg-amber-500/20 shadow-[0_0_30px_rgba(255,170,0,0.2)]" // Active Glow
                        : "bg-zinc-900/40 backdrop-blur-3xl hover:bg-zinc-800/50", // Inactive Glass
                    className
                )}
                style={{
                    aspectRatio: "1/1"
                }}
            >
                {/* Inner Glow Element (simulates internal light diffusion) */}
                <div className={cn(
                    "absolute inset-0 bg-gradient-to-tr from-amber-500/10 to-transparent opacity-0 transition-opacity duration-500",
                    isOn && "opacity-100"
                )} />

                {/* Header: Icon */}
                <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md transition-all duration-500 relative z-10",
                    isOn
                        ? "bg-amber-500 text-white scale-110 shadow-lg shadow-amber-500/30"
                        : "bg-white/10 text-zinc-400 group-hover:text-white group-hover:bg-white/20"
                )}>
                    {isStateless ? (
                        <MousePointerClick className="w-5 h-5" />
                    ) : (
                        <Power className="w-5 h-5" />
                    )}
                </div>

                {/* Footer: Title & State */}
                <div className="relative z-10">
                    <h3 className="text-base font-semibold text-white/90 leading-tight line-clamp-2 group-hover:text-white transition-colors">
                        {title || entity.attributes.friendly_name || entityId}
                    </h3>
                    <div className="flex items-center gap-1 text-xs font-medium text-zinc-500 mt-1">
                        <span className={cn(
                            "uppercase tracking-wider transition-colors duration-300",
                            isOn ? "text-amber-200" : "text-zinc-500"
                        )}>
                            {isStateless ? "Push" : (isOn ? "On" : "Off")}
                        </span>
                    </div>
                </div>
            </motion.div>

            {/* --- THE INSPECTOR (MODAL) --- */}
            <AnimatePresence>
                {isOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/60 backdrop-blur-md"
                            onClick={() => setIsOpen(false)}
                        />

                        {/* Modal Card */}
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="relative w-full max-w-sm bg-[#1c1c1e] rounded-[32px] shadow-2xl border border-white/10 overflow-hidden flex flex-col"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="p-6 pb-0 flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-bold text-white">
                                        {title || entity.attributes.friendly_name || "Switch"}
                                    </h2>
                                    <p className="text-sm text-zinc-400 capitalize">{domain}</p>
                                </div>
                                <button
                                    onClick={() => { vibrate(10); setIsOpen(false); }}
                                    className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:bg-white/20"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Body */}
                            <div className="p-6 space-y-6">
                                {/* Big Toggle Button */}
                                <button
                                    onClick={() => handleAction()}
                                    className={cn(
                                        "w-full h-24 rounded-2xl border flex flex-col items-center justify-center gap-2 group transition-all active:scale-95",
                                        isOn
                                            ? "bg-amber-500/20 border-amber-500/30"
                                            : "bg-white/5 border-white/10 hover:bg-white/10"
                                    )}
                                >
                                    <div className={cn(
                                        "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300",
                                        isOn ? "bg-amber-500 text-white scale-110" : "bg-white/10 text-zinc-400"
                                    )}>
                                        <Power className="w-5 h-5 fill-current" />
                                    </div>
                                    <span className={cn(
                                        "text-sm font-semibold",
                                        isOn ? "text-amber-400" : "text-white"
                                    )}>
                                        {isOn ? "Turn Off" : "Turn On"}
                                    </span>
                                </button>

                                {/* Stats / Info */}
                                {!isStateless && (
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="p-4 rounded-2xl bg-zinc-900 border border-white/5 flex flex-col gap-1">
                                            <Clock className="w-4 h-4 text-zinc-500" />
                                            <span className="text-xs text-zinc-500">Last Changed</span>
                                            <span className="text-sm font-medium text-white">
                                                {entity.last_changed ? new Date(entity.last_changed).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "N/A"}
                                            </span>
                                        </div>
                                        <div className="p-4 rounded-2xl bg-zinc-900 border border-white/5 flex flex-col gap-1">
                                            <Activity className="w-4 h-4 text-zinc-500" />
                                            <span className="text-xs text-zinc-500">Status</span>
                                            <span className="text-sm font-medium text-white capitalize">{entity.state}</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Settings Footer */}
                            <div className="p-4 border-t border-white/5 bg-black/20">
                                <button className="w-full flex items-center justify-center gap-2 text-xs font-medium text-zinc-500 uppercase tracking-widest hover:text-white transition-colors">
                                    <Settings className="w-3 h-3" />
                                    Device Settings
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}
