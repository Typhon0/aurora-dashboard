import React, { useCallback, useState, useRef } from "react";
import { useService, type EntityName } from "@hakit/core";
import { motion, AnimatePresence } from "motion/react";
import { Zap, Play, Layers, Loader2, Check, Settings, X, Clock, Activity } from "lucide-react";
import { toast } from "sonner";
import { cn } from "../../lib/utils";

interface Props {
    domain: "script" | "scene" | "button" | "automation";
    target: EntityName | string;
    service?: string;
    title?: string;
    className?: string;
}

/**
 * AuroraTriggerCard (Neo-Glass Action Tile)
 * 
 * A tactile, high-fidelity button for executing Scripts, Scenes, or Automations.
 * Features:
 * - Thick Glass Materiality
 * - Haptic Feedback
 * - Loading/Success States
 * - Integrated Inspector Modal (Long Press)
 */
export function AuroraTriggerCard({
    domain,
    target,
    service,
    title = "Trigger",
    className,
}: Props) {
    const svc = useService(domain as any);
    const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");
    const [isOpen, setIsOpen] = useState(false); // Inspector Modal

    // Haptics
    const vibrate = (pattern: number | number[]) => {
        if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(pattern);
    };

    const run = useCallback(async () => {
        if (status === "loading") return;

        vibrate(10);
        setStatus("loading");
        try {
            // Execution Logic
            switch (domain) {
                case "script":
                    await (svc as any).turnOn({ entity_id: target });
                    break;
                case "scene":
                    // Scene turning on activates it
                    await (svc as any).turnOn({ entity_id: target });
                    break;
                case "button":
                    await (svc as any).press({ entity_id: target });
                    break;
                case "automation":
                    await (svc as any).trigger({ entity_id: target });
                    break;
                default:
                    if (service) await (svc as any)[service]({ entity_id: target });
                    else await (svc as any).turnOn({ entity_id: target }); // Fallback
            }

            // Success Feedback
            vibrate([10, 50, 10]);
            setStatus("success");
            setTimeout(() => setStatus("idle"), 2000);
        } catch (e: any) {
            console.error("Trigger Failed", e);
            toast.error(e?.message ?? "Failed to trigger", { id: target as string });
            vibrate(100);
            setStatus("idle");
        }
    }, [svc, domain, service, target, status]);

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
            run(); // Tap executes run
        }
    };
    const handlePointerLeave = () => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
    };

    // Determine Icon
    const Icon = domain === "scene" ? Layers :
        domain === "script" ? Play :
            Zap;

    const glowColor = domain === "scene" ? "rgba(200, 100, 255, 0.4)" : // Purple for Scenes
        domain === "script" ? "rgba(100, 255, 200, 0.4)" : // Green/Cyan for Scripts
            "rgba(255, 200, 50, 0.4)"; // Amber for Buttons

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
                    "bg-zinc-900/40 backdrop-blur-3xl",
                    "border border-white/5 ring-1 ring-white/10",
                    "hover:bg-zinc-800/50 transition-colors duration-300",
                    className
                )}
                style={{
                    aspectRatio: "1/1",
                    boxShadow: status === "loading" || status === "success"
                        ? `0 0 30px ${glowColor}, inset 0 0 20px ${glowColor}`
                        : "none"
                }}
            >
                {/* Background Gradient Pulse for Loading */}
                <AnimatePresence>
                    {status === "loading" && (
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent animate-pulse"
                        />
                    )}
                </AnimatePresence>

                {/* Header: Icon */}
                <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md transition-all duration-500",
                    status === "success" ? "bg-emerald-500 text-white scale-110" :
                        status === "loading" ? "bg-white/20 text-white" :
                            "bg-white/10 text-zinc-400 group-hover:text-white group-hover:bg-white/20"
                )}>
                    <AnimatePresence mode="wait">
                        {status === "loading" ? (
                            <motion.div
                                key="loader"
                                initial={{ opacity: 0, rotate: 0 }}
                                animate={{ opacity: 1, rotate: 360 }}
                                exit={{ opacity: 0 }}
                                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                            >
                                <Loader2 className="w-5 h-5" />
                            </motion.div>
                        ) : status === "success" ? (
                            <motion.div
                                key="check"
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.5 }}
                            >
                                <Check className="w-5 h-5" />
                            </motion.div>
                        ) : (
                            <motion.div
                                key="icon"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                            >
                                <Icon className={cn("w-5 h-5", domain === "script" && "ml-0.5 fill-current")} />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Footer: Title & Label */}
                <div className="relative z-10">
                    <h3 className="text-base font-semibold text-white/90 leading-tight line-clamp-2 group-hover:text-white transition-colors">
                        {title}
                    </h3>
                    <div className="flex items-center gap-1 text-xs font-medium text-zinc-500 mt-1">
                        <span className={cn(
                            "uppercase tracking-wider transition-colors duration-300",
                            status === "success" ? "text-emerald-400" :
                                status === "loading" ? "text-white/70" :
                                    "text-zinc-500 group-hover:text-zinc-400"
                        )}>
                            {status === "loading" ? "Running..." :
                                status === "success" ? "Done" :
                                    domain}
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
                                    <h2 className="text-xl font-bold text-white">{title}</h2>
                                    <p className="text-sm text-zinc-400 capitalize">{domain} • {target}</p>
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
                                {/* Big Execute Button */}
                                <button
                                    onClick={() => {
                                        run();
                                        setIsOpen(false);
                                    }}
                                    className="w-full h-24 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 flex flex-col items-center justify-center gap-2 group transition-all active:scale-95"
                                >
                                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <Play className="w-5 h-5 text-white fill-current" />
                                    </div>
                                    <span className="text-sm font-semibold text-white">Execute Now</span>
                                </button>

                                {/* Stats / Info */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-4 rounded-2xl bg-zinc-900 border border-white/5 flex flex-col gap-1">
                                        <Clock className="w-4 h-4 text-zinc-500" />
                                        <span className="text-xs text-zinc-500">Last Run</span>
                                        <span className="text-sm font-medium text-white">Just now</span>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-zinc-900 border border-white/5 flex flex-col gap-1">
                                        <Activity className="w-4 h-4 text-zinc-500" />
                                        <span className="text-xs text-zinc-500">Frequency</span>
                                        <span className="text-sm font-medium text-white">Daily</span>
                                    </div>
                                </div>
                            </div>

                            {/* Settings Footer */}
                            <div className="p-4 border-t border-white/5 bg-black/20">
                                <button className="w-full flex items-center justify-center gap-2 text-xs font-medium text-zinc-500 uppercase tracking-widest hover:text-white transition-colors">
                                    <Settings className="w-3 h-3" />
                                    Trigger Settings
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}
