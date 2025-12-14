import React, { useCallback, useMemo, useRef, useState, useEffect } from "react";
import { useEntity, useService, type EntityName } from "@hakit/core";
import {
    Power, Fan, AirVent, Wind, RotateCw, Thermometer, Droplets,
    Settings, Activity, History, ChevronRight
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "../../lib/utils";
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogDescription,
} from "../ui/dialog";
import { Switch } from "../ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import ReactECharts from "echarts-for-react";
import { motion, AnimatePresence } from "motion/react";

// --- Types ---
type FanVariant = "default" | "ceiling" | "vent" | "purifier";

interface Props {
    entityId: EntityName;
    className?: string;
    variant?: FanVariant;
    icon?: React.ComponentType<{ className?: string }>;
}

// --- Charts Configuration ---
const getChartOptions = (datasets: { name: string, data: any[], color: string }[]) => ({
    backgroundColor: 'transparent',
    grid: { top: 20, right: 10, bottom: 20, left: 10, containLabel: false },
    tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(28, 28, 30, 0.9)',
        borderColor: 'rgba(255,255,255,0.1)',
        textStyle: { color: '#fff', fontSize: 12 },
        padding: [10, 14],
        borderRadius: 12
    },
    xAxis: {
        type: 'category',
        data: datasets[0]?.data.map(d => d.time) || [],
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { show: false }
    },
    yAxis: { show: false, min: 'dataMin' },
    series: datasets.map(ds => ({
        name: ds.name,
        data: ds.data.map(d => d.value),
        type: 'line',
        smooth: true,
        showSymbol: false,
        lineStyle: { width: 3, color: ds.color },
        areaStyle: {
            color: {
                type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
                colorStops: [{ offset: 0, color: ds.color + '40' }, { offset: 1, color: ds.color + '00' }]
            }
        }
    }))
});

export function AuroraFanCard({ entityId, className, variant, icon: CustomIcon }: Props) {
    const entity = useEntity(entityId);
    const fan = useService("fan");
    const sliderRef = useRef<HTMLDivElement>(null);

    // --- 1. Intelligence & Variant Detection ---
    const detectedVariant = useMemo((): FanVariant => {
        if (variant) return variant;
        const id = entityId.toLowerCase();
        const att = entity.attributes || {};

        if (id.includes("ceiling")) return "ceiling";
        if (id.includes("purifier") || id.includes("dyson") || att.aqi !== undefined) return "purifier";
        if (id.includes("hood") || id.includes("extractor") || id.includes("vent")) return "vent";
        return "default";
    }, [variant, entityId, entity.attributes]);

    // --- 2. Config & Styles ---
    const config = useMemo(() => {
        if (CustomIcon) return { icon: CustomIcon, color: "#3B82F6", gradient: "from-blue-500/20 to-transparent" };

        switch (detectedVariant) {
            case "ceiling": return { icon: Fan, color: "#F59E0B", gradient: "from-amber-500/20 to-transparent" };
            case "vent": return { icon: AirVent, color: "#9CA3AF", gradient: "from-zinc-500/20 to-transparent" };
            case "purifier": return { icon: Wind, color: "#10B981", gradient: "from-emerald-500/20 to-transparent" };
            default: return { icon: Fan, color: "#0EA5E9", gradient: "from-sky-500/20 to-transparent" };
        }
    }, [detectedVariant, CustomIcon]);

    const Icon = config.icon;
    const isOn = entity.state === "on";
    const percentage = (entity.attributes.percentage as number | undefined) ?? 0;

    // --- 3. Interaction State ---
    const [isDragging, setIsDragging] = useState(false);
    const [localPerc, setLocalPerc] = useState(percentage);
    const [showDetails, setShowDetails] = useState(false);

    // Sync state
    useEffect(() => { if (!isDragging) setLocalPerc(isOn ? percentage : 0); }, [percentage, isOn, isDragging]);

    // Haptics
    const vibrate = (pattern: number | number[]) => {
        if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(pattern);
    };

    // --- 4. Logic ---
    const updateSpeed = useCallback(async (val: number) => {
        try {
            if (val <= 0) await fan.turnOff({ target: entityId });
            else {
                if (!isOn) await fan.turnOn({ target: entityId });
                await fan.setPercentage({ target: entityId, serviceData: { percentage: val } });
            }
        } catch (e) { toast.error("Failed to set speed"); }
    }, [fan, entityId, isOn]);

    const toggle = useCallback(async (e?: React.MouseEvent) => {
        e?.stopPropagation();
        vibrate(10);
        try { await fan.toggle({ target: entityId }); } catch { toast.error("Failed to toggle"); }
    }, [fan, entityId]);

    // --- 5. Slider Implementation ---
    // Store params in ref to avoid re-binding listeners
    const dragParamsRef = useRef({ detectedVariant, localPerc, updateSpeed, isDragging });
    useEffect(() => {
        dragParamsRef.current = { detectedVariant, localPerc, updateSpeed, isDragging };
    }, [detectedVariant, localPerc, updateSpeed, isDragging]);

    const handleMove = useCallback((clientY: number) => {
        if (!sliderRef.current) return;
        const { detectedVariant } = dragParamsRef.current;

        const rect = sliderRef.current.getBoundingClientRect();
        const pct = Math.max(0, Math.min(100, ((rect.bottom - clientY) / rect.height) * 100));

        // Snapping
        let stepped = pct;
        if (detectedVariant === "ceiling" || detectedVariant === "vent") {
            stepped = pct < 15 ? 0 : pct < 50 ? 33 : pct < 85 ? 66 : 100;
        } else {
            stepped = Math.round(pct / 5) * 5;
        }

        setLocalPerc(prev => {
            if (prev !== stepped) {
                if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(5);
            }
            return stepped;
        });
    }, []);

    const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
        setIsDragging(true);
        // Trigger one move immediately
        handleMove('touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY);
    };

    useEffect(() => {
        if (!isDragging) return;

        const move = (e: MouseEvent | TouchEvent) => {
            handleMove('touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY);
        };

        const end = () => {
            setIsDragging(false);
            const { localPerc, updateSpeed } = dragParamsRef.current;
            updateSpeed(localPerc);
            if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(20);
        };

        window.addEventListener('mousemove', move);
        window.addEventListener('touchmove', move, { passive: false });
        window.addEventListener('mouseup', end);
        window.addEventListener('touchend', end);

        return () => {
            window.removeEventListener('mousemove', move);
            window.removeEventListener('touchmove', move);
            window.removeEventListener('mouseup', end);
            window.removeEventListener('touchend', end);
        };
    }, [isDragging, handleMove]);

    // --- 6. Mock Data for Inspector ---
    const chartData = useMemo(() => Array.from({ length: 24 }, (_, i) => ({
        time: `${i}h`, value: 20 + Math.random() * 30 + (i > 18 ? 20 : 0)
    })), []);

    return (
        <>
            {/* --- INTERACTIVE TILE --- */}
            <motion.div
                ref={sliderRef}
                onMouseDown={handleStart}
                onTouchStart={handleStart}
                whileTap={{ scale: 0.96 }}
                className={cn(
                    "relative flex flex-col justify-between p-4 select-none cursor-grab active:cursor-grabbing overflow-hidden touch-none",
                    "rounded-[24px] bg-zinc-900/40 backdrop-blur-3xl",
                    "border border-white/5 ring-1 ring-white/10",
                    "shadow-xl shadow-black/20 hover:bg-zinc-900/50",
                    "group transition-all duration-300",
                    "h-full",
                    className
                )}
            >
                {/* Fluid Level Indicator (Background) */}
                <div
                    className="absolute bottom-0 left-0 right-0 transition-all duration-300 ease-out bg-white/5 backdrop-blur-sm"
                    style={{
                        height: `${localPerc}%`,
                        opacity: localPerc > 0 ? 1 : 0,
                        borderTop: '1px solid rgba(255,255,255,0.1)'
                    }}
                />

                {/* Active Glow */}
                <div className={cn(
                    "absolute inset-0 opacity-0 transition-opacity duration-700 pointer-events-none bg-gradient-to-br blur-2xl",
                    config.gradient,
                    isOn && "opacity-100"
                )} />

                {/* Snapping Guides (Visible on Drag) */}
                <div className={cn("absolute right-4 top-0 bottom-0 w-1 transition-opacity duration-300 flex flex-col justify-between py-6 pointer-events-none", isDragging ? "opacity-100" : "opacity-0")}>
                    {[100, 66, 33, 0].map(v => (
                        <div key={v} className="w-1.5 h-1.5 rounded-full bg-white/40 shadow-sm" />
                    ))}
                </div>

                {/* Header */}
                <div className="flex justify-between items-start relative z-10 pointer-events-none">
                    <div
                        className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md border border-white/10 shadow-lg transition-all duration-500 pointer-events-auto",
                            isOn ? "bg-white text-black scale-110" : "bg-white/5 text-zinc-400"
                        )}
                        onClick={(e) => { e.stopPropagation(); vibrate(10); setShowDetails(true); }}
                    >
                        <Icon
                            className={cn(
                                "w-5 h-5 transition-transform duration-1000",
                                (isOn && localPerc > 0) && "animate-[spin_3s_linear_infinite]"
                            )}
                            style={{ animationDuration: localPerc > 0 ? `${3000 / Math.max(10, localPerc)}ms` : '0ms' }}
                        />
                        {/* Badge for Purifiers */}
                        {detectedVariant === "purifier" && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-zinc-900" />
                        )}
                    </div>

                    <button
                        className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center transition-colors pointer-events-auto",
                            isOn ? "bg-white/20 text-white" : "bg-white/5 text-zinc-500 hover:bg-white/10"
                        )}
                        onClick={toggle}
                        onMouseDown={e => e.stopPropagation()}
                        onTouchStart={e => e.stopPropagation()}
                    >
                        <Power className="w-4 h-4" />
                    </button>
                </div>

                {/* Footer */}
                <div className="relative z-10 pointer-events-none">
                    <div className="text-3xl font-light text-white tracking-tight">
                        {isOn ? `${Math.round(localPerc)}%` : "Off"}
                    </div>
                    <div className="text-sm font-medium text-zinc-400 truncate">
                        {entity.attributes.friendly_name || "Fan"}
                    </div>
                </div>
            </motion.div>

            {/* --- INSPECTOR --- */}
            <Dialog open={showDetails} onOpenChange={setShowDetails}>
                <DialogContent className="bg-[#1c1c1e]/95 backdrop-blur-3xl border-white/10 shadow-2xl sm:rounded-[32px] p-0 overflow-hidden max-w-[400px]">
                    {/* Header */}
                    <div className="relative pt-8 pb-6 px-6 flex flex-col items-center text-center bg-gradient-to-b from-white/5 to-transparent">
                        <div className="w-20 h-20 rounded-full flex items-center justify-center bg-white/10 backdrop-blur-xl shadow-2xl mb-4 ring-1 ring-white/20">
                            <Icon className={cn("w-10 h-10 text-white", isOn && "animate-spin")} style={{ animationDuration: '3s', color: config.color }} />
                        </div>
                        <DialogTitle className="text-2xl font-semibold text-white tracking-tight">
                            {entity.attributes.friendly_name}
                        </DialogTitle>
                        <DialogDescription className="text-zinc-400 font-medium text-sm mt-1 capitalize">
                            {detectedVariant} • {entity.attributes.area_id || "Maison"}
                        </DialogDescription>
                    </div>

                    <Tabs defaultValue="controls" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 bg-white/5 rounded-none p-0 h-12 border-b border-white/5">
                            <TabsTrigger value="controls" className="rounded-none data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-white text-zinc-500 data-[state=active]:text-white">Contrôles</TabsTrigger>
                            <TabsTrigger value="history" className="rounded-none data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-white text-zinc-500 data-[state=active]:text-white">Historique</TabsTrigger>
                        </TabsList>

                        <TabsContent value="controls" className="p-6 space-y-6 mt-0">
                            {/* Quick Stats */}
                            <div className="grid grid-cols-3 gap-3">
                                {[
                                    { label: "Temp", val: "22°", icon: Thermometer, color: "text-orange-400" },
                                    { label: "Hum", val: "45%", icon: Droplets, color: "text-blue-400" },
                                    { label: "Air", val: "Bon", icon: Activity, color: "text-green-400" },
                                ].map(s => (
                                    <div key={s.label} className="flex flex-col items-center p-3 rounded-2xl bg-white/5 border border-white/5">
                                        <s.icon className={cn("w-4 h-4 mb-1", s.color)} />
                                        <span className="text-sm font-bold text-white">{s.val}</span>
                                        <span className="text-[10px] text-zinc-500 uppercase tracking-wider">{s.label}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Controls List */}
                            <div className="space-y-1">
                                <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-full bg-blue-500/20 text-blue-400"><RotateCw className="w-4 h-4" /></div>
                                        <span className="text-white font-medium">Oscillation</span>
                                    </div>
                                    <Switch checked={entity.attributes.oscillating} onCheckedChange={() => fan.oscillate({ target: entityId, serviceData: { oscillating: !entity.attributes.oscillating } })} />
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="history" className="p-6 mt-0">
                            <div className="h-[200px] w-full bg-white/5 rounded-2xl p-4 border border-white/5">
                                <div className="flex items-center gap-2 mb-2 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                                    <History className="w-3 h-3" /> Activité (24h)
                                </div>
                                <ReactECharts option={getChartOptions([{ name: "Vitesse", color: config.color, data: chartData }])} style={{ height: '100%', width: '100%' }} theme="dark" />
                            </div>
                        </TabsContent>
                    </Tabs>

                    {/* Settings Footer */}
                    <div className="p-4 border-t border-white/5 bg-black/20">
                        <button className="w-full flex items-center justify-center gap-2 text-xs font-bold text-zinc-500 uppercase tracking-widest hover:text-white transition-colors">
                            <Settings className="w-3 h-3" /> Paramètres
                        </button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
