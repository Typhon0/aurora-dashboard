import React, {
  useCallback,
  useState,
  useRef,
  useEffect,
  useMemo,
} from "react";
import {
  useEntity,
  useService,
  type EntityName,
} from "@hakit/core";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";
import {
  Lightbulb, Sun, Palette, Thermometer, Power,
  Settings, Clock, ChevronLeft, Zap,
  TrendingUp, Activity
} from "lucide-react";
import { toast } from "sonner";
import Wheel from "@uiw/react-color-wheel";
import { hsvaToRgba, rgbaToHsva } from "@uiw/color-convert";
import { cn } from "../../lib/utils";
import { motion, AnimatePresence, useMotionValue, useTransform } from "motion/react";

interface Props {
  entityId: EntityName;
  className?: string;
  titleOverride?: string;
}

type ControlMode = "brightness" | "color" | "temperature";

// --- Haptics ---
const hapticFeedback = (pattern: number | number[]) => {
  if (typeof navigator !== "undefined" && navigator.vibrate) {
    navigator.vibrate(pattern);
  }
};

export const AuroraLightCard: React.FC<Props> = ({
  entityId,
  className,
  titleOverride,
}) => {
  const entity = useEntity(entityId);
  const light = useService("light");

  // State
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<"inspector" | "settings">("inspector");
  const [controlMode, setControlMode] = useState<ControlMode>("brightness");

  // Direct Control State
  const [isDragging, setIsDragging] = useState(false);
  const dragStartY = useRef<number>(0);
  const dragStartBrightness = useRef<number>(0);
  const lastHapticValue = useRef<number>(0);

  // Entity Data
  const isOn = entity.state === "on";
  const brightness = isOn && entity.attributes.brightness
    ? Math.round((entity.attributes.brightness / 255) * 100)
    : 0;

  const friendly = titleOverride || entity.attributes.friendly_name || "Light";

  // Capabilities
  const hasRGB =
    entity.attributes.supported_color_modes?.includes("rgb") ||
    entity.attributes.supported_color_modes?.includes("hs") ||
    entity.attributes.supported_color_modes?.includes("xy");
  const hasColorTemp =
    entity.attributes.supported_color_modes?.includes("color_temp");

  // Colors
  const rgbColor = entity.attributes.rgb_color as [number, number, number] | undefined;

  const setTemperature = useCallback(
    async (value: number) => {
      try {
        await light.turnOn({
          target: entityId,
          serviceData: { color_temp: value },
        });

        // Haptics
        if (Math.abs(value - lastHapticValue.current) >= 20) {
          hapticFeedback(5);
          lastHapticValue.current = value;
        }
      } catch (e) {
        toast.error("Failed to set temperature");
      }
    },
    [light, entityId]
  );

  // Mireds range (default to standard range if missing)
  const minMireds = entity.attributes.min_mireds || 153; // ~6500K (Cool)
  const maxMireds = entity.attributes.max_mireds || 500; // ~2000K (Warm)
  const currentMireds = entity.attributes.color_temp || Math.round((minMireds + maxMireds) / 2);

  // Helper to approximate color from mireds for UI glow
  const getTempColor = (mireds: number) => {
    // Simple linear interpolation between Cool Blue and Warm Orange
    // 153 (Cool) -> rgb(200, 220, 255)
    // 500 (Warm) -> rgb(255, 180, 100)
    const pct = Math.min(1, Math.max(0, (mireds - 153) / (500 - 153)));

    const r = Math.round(200 + (255 - 200) * pct);
    const g = Math.round(220 + (180 - 220) * pct);
    const b = Math.round(255 + (100 - 255) * pct);

    return `rgb(${r}, ${g}, ${b})`;
  };

  // Current Color for UI
  const currentColor = useMemo(() => {
    if (rgbColor) return `rgb(${rgbColor.join(",")})`;
    if (entity.attributes.color_temp) {
      return getTempColor(entity.attributes.color_temp);
    }
    return "#FFD60A"; // Default Amber
  }, [rgbColor, entity.attributes.color_temp]);

  // HSVA for Wheel
  const [hsva, setHsva] = useState({ h: 0, s: 0, v: 100, a: 1 });
  useEffect(() => {
    if (rgbColor) {
      setHsva(rgbaToHsva({ r: rgbColor[0], g: rgbColor[1], b: rgbColor[2], a: 1 }));
    }
  }, [rgbColor]);

  // --- ACTIONS ---

  const toggle = useCallback(async (e?: React.MouseEvent | React.TouchEvent) => {
    e?.stopPropagation();
    hapticFeedback(10);
    try {
      await light.toggle({ target: entityId });
    } catch (e: unknown) {
      toast.error("Failed to toggle light");
    }
  }, [light, entityId]);

  const setBrightnessLevel = useCallback(
    async (value: number) => {
      const clamped = Math.min(100, Math.max(0, value));
      const brightness255 = Math.round((clamped / 100) * 255);

      // Optimistic update visual feedback could happen here if we had local state for it
      // But we rely on entity updates for now or the drag visual

      try {
        if (clamped === 0) {
          await light.turnOff({ target: entityId });
        } else {
          await light.turnOn({
            target: entityId,
            serviceData: { brightness: brightness255 },
          });
        }

        if (Math.abs(clamped - lastHapticValue.current) >= 10) {
          hapticFeedback(5);
          lastHapticValue.current = clamped;
        }
      } catch (e) {
        console.error(e);
      }
    },
    [light, entityId]
  );

  const setColor = useCallback(async (newHsva: typeof hsva) => {
    try {
      const rgba = hsvaToRgba(newHsva);
      await light.turnOn({
        target: entityId,
        serviceData: { rgb_color: [rgba.r, rgba.g, rgba.b] },
      });
      setHsva(newHsva);
    } catch (e) {
      toast.error("Failed to set color");
    }
  }, [light, entityId]);

  // --- GESTURES (Complex Interaction Resolver) ---
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const isLongPress = useRef(false);
  const dragThresholdMet = useRef(false);

  const handlePointerDown = (e: React.PointerEvent) => {
    isLongPress.current = false;
    dragThresholdMet.current = false;

    longPressTimer.current = setTimeout(() => {
      if (!dragThresholdMet.current) {
        isLongPress.current = true;
        hapticFeedback(50);
        setIsOpen(true);
      }
    }, 500); // 500ms for long press
  };

  const handlePointerUp = (e: React.MouseEvent | React.TouchEvent | React.PointerEvent) => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    if (isLongPress.current) return;
    if (dragThresholdMet.current) return;

    // It was a tap
    hapticFeedback(10);
    toggle();
  };

  const handleDragStart = (info: any) => {
    if (!isOn) return;
    dragThresholdMet.current = true;
    if (longPressTimer.current) clearTimeout(longPressTimer.current);

    setIsDragging(true);
    dragStartY.current = info.point.y;
    dragStartBrightness.current = brightness;
    lastHapticValue.current = brightness;
    hapticFeedback(10);
  };

  const handleDrag = (info: any) => {
    if (!isDragging || !isOn) return;
    const deltaY = dragStartY.current - info.point.y;
    const deltaPercent = (deltaY / 200) * 100;
    const newBrightness = Math.min(100, Math.max(1, dragStartBrightness.current + deltaPercent));
    setBrightnessLevel(newBrightness);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    // Only success haptic if we actually dragged
    if (dragThresholdMet.current) {
      hapticFeedback([10, 30]);
    }
  };

  // --- RENDER ---

  return (
    <>
      {/* TILE */}
      <motion.div
        whileTap={{ scale: 0.96 }}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPanStart={(e, info) => handleDragStart(info)}
        onPan={(e, info) => handleDrag(info)}
        onPanEnd={handleDragEnd}
        onContextMenu={(e) => {
          e.preventDefault();
          // Fallback for desktop right-click
          if (!isLongPress.current) {
            hapticFeedback(50);
            setIsOpen(true);
          }
        }}
        className={cn(
          "relative flex flex-col justify-between p-4 overflow-hidden select-none cursor-pointer touch-none",
          "rounded-[24px] bg-zinc-900/40 backdrop-blur-3xl",
          "border border-white/5 ring-1 ring-white/10 ring-inset",
          "shadow-xl shadow-black/20 group h-full",
          className
        )}
      >
        {/* Active Gradient Background (Fill effect for brightness) */}
        <div className="absolute inset-0 pointer-events-none z-0">
          {/* Base dark fill */}
          <div className="absolute inset-0 bg-black/20" />

          {/* Brightness Fill (Vertical) */}
          {isOn && (
            <motion.div
              className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white/10 to-white/5"
              initial={{ height: "0%" }}
              animate={{ height: `${brightness}%` }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
          )}

          {/* Ambient Glow */}
          {isOn && (
            <div
              className="absolute inset-0 opacity-40 transition-opacity duration-500"
              style={{
                background: `radial-gradient(circle at 50% 100%, ${currentColor}40, transparent 70%)`
              }}
            />
          )}
        </div>

        {/* Header */}
        <div className="relative z-10 flex justify-between items-start">
          <div className={cn(
            "w-10 h-10 rounded-2xl flex items-center justify-center backdrop-blur-xl border transition-all duration-300",
            isOn
              ? "bg-white/20 border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.2)]"
              : "bg-white/5 border-white/10"
          )}>
            <Lightbulb
              className={cn("w-5 h-5 transition-colors duration-300", isOn ? "text-white" : "text-zinc-500")}
              fill={isOn ? "currentColor" : "none"}
            />
          </div>
          {/* Drag Indicator / Brightness Value */}
          {isOn && (
            <div className="flex flex-col items-end">
              <span className="text-xl font-light text-white tracking-tight tabular-nums">
                {Math.round(brightness)}%
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="relative z-10 mt-auto">
          <div className="text-sm font-medium text-white/90 truncate">
            {friendly}
          </div>
          <div className="text-xs text-zinc-400 font-medium flex items-center gap-1">
            {isOn ? (
              <span className="text-emerald-400 flex items-center gap-1">
                On <span className="w-1 h-1 rounded-full bg-emerald-400" />
              </span>
            ) : "Off"}
          </div>
        </div>

        {/* Drag Hint Overlay */}
        {isOn && !isDragging && (
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
            <div className="w-1 h-8 rounded-full bg-white/20 backdrop-blur-md" />
          </div>
        )}

      </motion.div>

      {/* INSPECTOR DIALOG */}
      <Dialog open={isOpen} onOpenChange={(o) => { setIsOpen(o); if (!o) setTimeout(() => setView("inspector"), 300); }}>
        <DialogContent className="bg-[#1c1c1e]/80 backdrop-blur-[50px] border-white/10 shadow-2xl sm:max-w-[400px] sm:rounded-[36px] p-0 overflow-hidden text-zinc-100">
          <AnimatePresence mode="wait">
            {/* INSPECTOR VIEW */}
            {view === "inspector" && (
              <motion.div
                key="inspector"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col h-full"
              >
                {/* Header */}
                <div className="pt-8 px-6 pb-2 text-center relative">
                  <div className="absolute top-4 right-4">
                    <button
                      onClick={() => { hapticFeedback(10); setView("settings"); }}
                      className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                    >
                      <Settings className="w-5 h-5" />
                    </button>
                  </div>

                  <div
                    className="mx-auto w-24 h-24 rounded-full flex items-center justify-center bg-white/5 border border-white/10 shadow-2xl mb-6 relative overflow-hidden transition-all duration-500"
                    style={{
                      boxShadow: isOn ? `0 0 60px ${currentColor}40` : 'none',
                      background: isOn ? `radial-gradient(circle, ${currentColor}20 0%, transparent 70%)` : 'rgba(255,255,255,0.05)'
                    }}
                  >
                    <Lightbulb
                      className={cn("w-10 h-10 relative z-10 transition-colors duration-300", isOn ? "text-white" : "text-zinc-600")}
                      fill={isOn ? currentColor : "none"}
                      style={{ color: isOn ? currentColor : undefined }}
                    />
                  </div>

                  <DialogTitle className="text-2xl font-semibold tracking-tight mb-1">
                    {friendly}
                  </DialogTitle>
                  <DialogDescription className="text-zinc-500 font-medium">
                    {isOn ? `${Math.round(brightness)}% Brightness` : "Off"}
                  </DialogDescription>
                </div>

                {/* Controls */}
                <div className="px-6 pb-8 mt-6 space-y-8">
                  {/* Power Toggle Big Button */}
                  <button
                    onClick={() => toggle()}
                    className={cn(
                      "w-full py-4 rounded-2xl font-semibold text-lg transition-all active:scale-95 flex items-center justify-center gap-2",
                      isOn
                        ? "bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                        : "bg-white/10 text-white hover:bg-white/15"
                    )}
                  >
                    <Power className="w-5 h-5" />
                    {isOn ? "Turn Off" : "Turn On"}
                  </button>

                  {/* Sliders Container */}
                  {isOn && (
                    <div className="space-y-6">
                      {/* Brightness */}
                      <div className="space-y-3">
                        <div className="flex justify-between text-xs font-medium text-zinc-500 uppercase tracking-wider">
                          <span>Brightness</span>
                          <span>{Math.round(brightness)}%</span>
                        </div>
                        <div className="relative h-12 rounded-full bg-white/5 overflow-hidden">
                          <div
                            className="absolute inset-y-0 left-0 bg-white/20"
                            style={{ width: `${brightness}%` }}
                          />
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={brightness}
                            onChange={(e) => setBrightnessLevel(Number(e.target.value))}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          />
                          <div className="absolute inset-0 pointer-events-none flex items-center px-4">
                            <Sun className="w-5 h-5 text-white/50" />
                          </div>
                        </div>
                      </div>

                      {/* Color / Temp */}
                      {(hasRGB || hasColorTemp) && (
                        <div className="space-y-3">
                          <div className="flex justify-between text-xs font-medium text-zinc-500 uppercase tracking-wider">
                            <span>{hasRGB ? "Color" : "Temperature"}</span>
                            {!hasRGB && hasColorTemp && (
                              <span>{Math.round(1000000 / currentMireds)}K</span>
                            )}
                          </div>

                          {hasRGB ? (
                            <div className="flex justify-center p-4 bg-white/5 rounded-3xl">
                              <Wheel
                                color={hsva}
                                onChange={(color) => setColor(color.hsva)}
                                width={200}
                                height={200}
                              />
                            </div>
                          ) : (
                            /* Temperature Slider */
                            <div className="relative h-12 rounded-full overflow-hidden ring-1 ring-white/10"
                              style={{
                                background: "linear-gradient(to right, #b4dbfd 0%, #ffeebb 50%, #ffaa55 100%)"
                              }}>
                              {/* Thumb Indicator */}
                              <div
                                className="absolute top-1 bottom-1 w-2 bg-white rounded-full shadow-[0_0_10px_rgba(0,0,0,0.5)] pointer-events-none transition-all duration-75"
                                style={{
                                  left: `${((currentMireds - minMireds) / (maxMireds - minMireds)) * 100}%`,
                                  transform: 'translateX(-50%)'
                                }}
                              />

                              <input
                                type="range"
                                min={minMireds}
                                max={maxMireds}
                                value={currentMireds}
                                onChange={(e) => setTemperature(Number(e.target.value))}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                              />

                              <div className="absolute inset-0 pointer-events-none flex justify-between items-center px-4 opacity-50 mix-blend-overlay">
                                <span className="text-[10px] font-bold text-blue-900">COOL</span>
                                <span className="text-[10px] font-bold text-orange-900">WARM</span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* SETTINGS VIEW */}
            {view === "settings" && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col h-full bg-zinc-950/50"
              >
                <div className="pt-6 px-6 pb-4 flex items-center gap-3 border-b border-white/5">
                  <button
                    onClick={() => { hapticFeedback(10); setView("inspector"); }}
                    className="p-2 -ml-2 rounded-full hover:bg-white/5 text-zinc-400 hover:text-white"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <h2 className="text-lg font-semibold">Settings</h2>
                </div>

                <div className="p-6 space-y-6 overflow-y-auto">
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">General</label>
                    <div className="bg-white/5 rounded-2xl overflow-hidden border border-white/5 divide-y divide-white/5">
                      <div className="p-4 flex justify-between items-center">
                        <span className="text-sm font-medium">Name</span>
                        <span className="text-sm text-zinc-400">{friendly}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Behavior</label>
                    <div className="bg-white/5 rounded-2xl overflow-hidden border border-white/5 divide-y divide-white/5">
                      <div className="p-4 flex justify-between items-center">
                        <span className="text-sm font-medium">Adaptive Lighting</span>
                        <div className="w-10 h-6 rounded-full bg-zinc-700 p-1 flex justify-start">
                          <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
                        </div>
                      </div>
                      <div className="p-4 flex justify-between items-center">
                        <span className="text-sm font-medium">Default Brightness</span>
                        <span className="text-sm text-zinc-400">80%</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex gap-3 items-start">
                    <Activity className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-blue-100">Energy Monitoring</p>
                      <p className="text-xs text-blue-200/60 leading-relaxed">
                        This device consumed 0.4kWh today.
                      </p>
                    </div>
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
