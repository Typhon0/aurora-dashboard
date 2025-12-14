import React, { useState, useCallback, useRef, useMemo, useEffect } from "react";
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
  List, Settings, History, Check,
  Zap, Leaf, Home, Car, Moon, Sun, Thermometer, Power, Shield, Radio,
  Tv, Music, Cloud, Disc, PlayCircle, Link
} from "lucide-react";
import { cn } from "../../lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";

interface AuroraSelectCardProps {
  entityId: EntityName;
  className?: string;
  titleOverride?: string;
}

// --- Haptics ---
const hapticLight = () => {
  if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(10);
};

const hapticSelection = () => {
  if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(15);
};

const hapticSuccess = () => {
  if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate([10, 30, 10]);
};

// --- Icon Intelligence ---
const getIconForOption = (option: string, entityName: string) => {
  const lowerOpt = option.toLowerCase();
  const lowerName = entityName.toLowerCase();

  // Media/Source
  if (lowerOpt.includes("hdmi")) return Tv;
  if (lowerOpt.includes("netflix")) return PlayCircle;
  if (lowerOpt.includes("spotify")) return Music;
  if (lowerOpt.includes("airplay")) return Cloud;

  // Radio
  if (lowerName.includes("radio") || lowerOpt.includes("fm")) return Radio;
  if (lowerOpt.includes("rock") || lowerOpt.includes("jazz")) return Disc;

  // State-based icons
  if (lowerOpt.includes("eco")) return Leaf;
  if (lowerOpt.includes("boost") || lowerOpt.includes("high")) return Zap;
  if (lowerOpt.includes("comfort")) return Thermometer;
  if (lowerOpt.includes("home")) return Home;
  if (lowerOpt.includes("away")) return Car;
  if (lowerOpt.includes("night") || lowerOpt.includes("sleep")) return Moon;
  if (lowerOpt.includes("day")) return Sun;
  if (lowerOpt.includes("on")) return Power;
  if (lowerOpt.includes("off")) return Power;
  if (lowerOpt.includes("arm")) return Shield;

  // Entity-based icons
  if (lowerName.includes("mode")) return Settings;
  if (lowerName.includes("source")) return Radio;

  return List;
};

// --- Color Intelligence ---
const getColorForOption = (option: string) => {
  const lower = option.toLowerCase();
  if (lower.includes("eco") || lower.includes("spotify")) return "green";
  if (lower.includes("boost") || lower.includes("high") || lower.includes("netflix")) return "red";
  if (lower.includes("comfort") || lower.includes("jazz")) return "amber";
  if (lower.includes("night") || lower.includes("sleep") || lower.includes("hdmi")) return "indigo";
  if (lower.includes("cool") || lower.includes("airplay")) return "cyan";
  if (lower.includes("heat") || lower.includes("rock")) return "orange";
  return "zinc";
};

// --- Texture Intelligence (Suggestion 3) ---
const getTextureForOption = (option: string) => {
  const lower = option.toLowerCase();
  if (lower.includes("noise") || lower.includes("sleep") || lower.includes("night")) return "noise";
  if (lower.includes("eco") || lower.includes("leaf")) return "leaf";
  if (lower.includes("boost") || lower.includes("high")) return "grid";
  return "none";
};

// --- Mock History ---
const generateHistory = (options: string[]) => {
  const data = [];
  const now = Date.now();
  for (let i = 0; i < 10; i++) {
    data.push({
      time: now - (i * 3600000 * 2),
      value: options[Math.floor(Math.random() * options.length)],
      user: i % 2 === 0 ? "User" : "Automation"
    });
  }
  return data;
};

// --- Wheel Picker Component (Suggestion 1) ---
const WheelPicker = ({
  options,
  value,
  onChange,
  colorTheme
}: {
  options: string[],
  value: string,
  onChange: (val: string) => void,
  colorTheme: string
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Scroll to active item on mount
  useEffect(() => {
    if (scrollRef.current) {
      const index = options.indexOf(value);
      if (index !== -1) {
        const itemHeight = 64; // approx height
        scrollRef.current.scrollTop = index * itemHeight;
      }
    }
  }, []);

  return (
    <div className="relative h-[300px] w-full overflow-hidden">
      {/* Selection Highlight Overlay */}
      <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 h-16 rounded-xl bg-white/10 border-y border-white/20 pointer-events-none z-10 backdrop-blur-[1px]" />

      {/* Gradient Masks */}
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-zinc-900 to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-zinc-900 to-transparent z-10 pointer-events-none" />

      <div
        ref={scrollRef}
        className="h-full overflow-y-auto snap-y snap-mandatory py-[118px] px-4 custom-scrollbar scroll-smooth"
        onScroll={(e) => {
          // Optional: Detect snap and haptic
        }}
      >
        {options.map((opt) => {
          const isActive = opt === value;
          return (
            <div
              key={opt}
              className={cn(
                "h-16 flex items-center justify-center snap-center transition-all duration-300 cursor-pointer",
                isActive ? `text-${colorTheme}-400 scale-110 font-bold` : "text-zinc-500 scale-90"
              )}
              onClick={() => onChange(opt)}
            >
              <span className="text-lg tracking-tight">{opt}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const AuroraSelectCard: React.FC<AuroraSelectCardProps> = ({
  entityId,
  className,
  titleOverride,
}) => {
  let entity: any;
  try {
    entity = useEntity(entityId);
  } catch (e) {
    entity = {
      state: "Option 1",
      attributes: { friendly_name: titleOverride || "Select", options: ["Option 1", "Option 2", "Option 3"] }
    };
  }
  const domain = entityId.split(".")[0];
  // @ts-ignore - Dynamic service selection
  const service = useService(domain === "input_select" ? "input_select" : "select");

  const options: string[] = entity.attributes.options || [];
  const currentState = entity.state as string;
  const friendlyName = titleOverride || entity.attributes.friendly_name || "Select";

  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"control" | "history" | "settings">("control");
  const [isPressed, setIsPressed] = useState(false);
  const [selectedScene, setSelectedScene] = useState<string>("");

  // Animation direction for swipe
  const [direction, setDirection] = useState(0);

  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  const currentIndex = options.indexOf(currentState);
  const Icon = getIconForOption(currentState, friendlyName);
  const colorTheme = getColorForOption(currentState);
  const texture = getTextureForOption(currentState);

  const handleSelect = useCallback(async (option: string) => {
    try {
      hapticSelection();
      await service.selectOption({
        target: entityId,
        serviceData: { option },
      });
      toast.success(`Selected: ${option}`, { id: entityId });
      hapticSuccess();
    } catch (e: any) {
      toast.error("Failed to change option", { id: entityId });
    }
  }, [service, entityId]);

  // --- Swipe Logic ---
  const handlePanEnd = (e: any, info: any) => {
    if (Math.abs(info.offset.x) > 50) {
      const isRight = info.offset.x > 0;
      let nextIndex = isRight ? currentIndex - 1 : currentIndex + 1;

      if (nextIndex < 0) nextIndex = options.length - 1;
      if (nextIndex >= options.length) nextIndex = 0;

      setDirection(isRight ? -1 : 1);
      handleSelect(options[nextIndex]);
    }
    setIsPressed(false);
  };

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
  };

  // Use Wheel picker if lots of options
  const useWheel = options.length > 8;

  return (
    <>
      {/* --- TILE --- */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="relative h-full"
        onPanStart={() => {
          if (longPressTimer.current) clearTimeout(longPressTimer.current);
          setIsPressed(true);
        }}
        onPanEnd={handlePanEnd}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onClick={() => {
          if (!isPressed) {
            setOpen(true);
            hapticLight();
          }
        }}
      >
        <AuroraCard
          className={cn(
            "relative flex flex-col justify-between p-5 cursor-pointer overflow-hidden group select-none touch-pan-y",
            "min-h-[180px] rounded-[24px]",
            "bg-zinc-900/40 backdrop-blur-3xl",
            "ring-1 ring-white/10 ring-inset border border-white/5",
            "shadow-xl shadow-black/20",
            isPressed ? "scale-[1.02]" : "hover:bg-zinc-900/50 active:scale-[0.98]",
            "transition-all duration-200",
            className
          )}
        >
          {/* Suggestion 3: Contextual Textures */}
          {texture === "noise" && (
            <div className="absolute inset-0 opacity-5 mix-blend-overlay pointer-events-none"
              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
            />
          )}
          {texture === "grid" && (
            <div className="absolute inset-0 opacity-5 mix-blend-overlay pointer-events-none"
              style={{ backgroundImage: `radial-gradient(circle, #fff 1px, transparent 1px)`, backgroundSize: '20px 20px' }}
            />
          )}

          {/* Ambient Glow */}
          <motion.div
            className="absolute inset-0 pointer-events-none opacity-20"
            animate={{
              background: `radial-gradient(circle at 50% 120%, ${colorTheme === 'zinc' ? '#71717A' : colorTheme === 'green' ? '#22c55e' : colorTheme === 'red' ? '#ef4444' : colorTheme === 'amber' ? '#f59e0b' : '#6366f1'} 0%, transparent 70%)`
            }}
          />

          {/* Header */}
          <div className="flex justify-between items-start relative z-10">
            <motion.div
              className={cn(
                "w-11 h-11 rounded-[14px] flex items-center justify-center relative",
                "ring-1 ring-inset backdrop-blur-xl",
                `bg-${colorTheme}-500/20 ring-${colorTheme}-500/30`
              )}
              key={currentState}
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <Icon className={cn("w-5 h-5", `text-${colorTheme}-400`)} />
            </motion.div>

            {/* Progress Dots (Max 6 to avoid clutter) */}
            {options.length <= 6 && (
              <div className="flex gap-1 mt-2">
                {options.map((opt) => (
                  <div
                    key={opt}
                    className={cn(
                      "w-1.5 h-1.5 rounded-full transition-all duration-300",
                      opt === currentState ? "bg-white w-3" : "bg-white/20"
                    )}
                  />
                ))}
              </div>
            )}
            {options.length > 6 && (
              <div className="mt-2 text-[10px] font-mono text-white/40">
                {currentIndex + 1}/{options.length}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="relative z-10 mt-auto overflow-hidden">
            <span className="text-xs font-medium text-zinc-500 tracking-wider uppercase block mb-1">
              {friendlyName}
            </span>

            <div className="relative h-10">
              <AnimatePresence initial={false} custom={direction}>
                <motion.div
                  key={currentState}
                  custom={direction}
                  initial={(d: number) => ({ x: d > 0 ? 100 : -100, opacity: 0 })}
                  animate={{ x: 0, opacity: 1 }}
                  exit={(d: number) => ({ x: d > 0 ? -100 : 100, opacity: 0 })}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  className="absolute inset-0 flex items-center"
                >
                  <span className={cn(
                    "text-2xl font-bold tracking-tight truncate w-full",
                    `text-${colorTheme}-400`
                  )}>
                    {currentState}
                  </span>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Hint */}
          <div className="absolute bottom-5 right-5 z-10 text-[10px] font-medium text-zinc-600 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
            Swipe
          </div>
        </AuroraCard>
      </motion.div>

      {/* --- INSPECTOR DIALOG --- */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-zinc-900/95 backdrop-blur-3xl ring-1 ring-white/10 ring-inset border border-white/5 shadow-2xl sm:max-w-[420px] sm:rounded-[28px] p-0 overflow-hidden gap-0 max-h-[85vh] flex flex-col">
          <DialogHeader className="sr-only">
            <DialogTitle>{friendlyName}</DialogTitle>
            <DialogDescription>Select Option</DialogDescription>
          </DialogHeader>

          {/* Header */}
          <div className="relative pt-8 pb-6 px-6 flex flex-col items-center justify-center border-b border-white/5 bg-black/20 shrink-0">
            <div className={cn(
              "w-20 h-20 rounded-full flex items-center justify-center mb-4 relative ring-1 ring-inset backdrop-blur-xl",
              `bg-${colorTheme}-500/10 ring-${colorTheme}-500/20`
            )}>
              <Icon className={cn("w-8 h-8", `text-${colorTheme}-400`)} />
            </div>
            <h2 className="text-lg font-semibold text-white">{friendlyName}</h2>
            <p className="text-sm text-zinc-500">{currentState}</p>
          </div>

          {/* Tabs */}
          <div className="flex p-1 mx-6 my-4 bg-zinc-800/50 rounded-xl border border-white/5 shrink-0">
            <button
              onClick={() => setActiveTab("control")}
              className={cn("flex-1 py-2 text-xs font-medium rounded-lg transition-all", activeTab === "control" ? "bg-zinc-700 text-white shadow-sm" : "text-zinc-400 hover:text-zinc-200")}
            >
              Options
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={cn("flex-1 py-2 text-xs font-medium rounded-lg transition-all", activeTab === "history" ? "bg-zinc-700 text-white shadow-sm" : "text-zinc-400 hover:text-zinc-200")}
            >
              History
            </button>
            <button
              onClick={() => setActiveTab("settings")}
              className={cn("flex-1 py-2 text-xs font-medium rounded-lg transition-all", activeTab === "settings" ? "bg-zinc-700 text-white shadow-sm" : "text-zinc-400 hover:text-zinc-200")}
            >
              Settings
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
            <AnimatePresence mode="wait">
              {activeTab === "control" && (
                <motion.div
                  key="control"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full"
                >
                  {useWheel ? (
                    <WheelPicker
                      options={options}
                      value={currentState}
                      onChange={handleSelect}
                      colorTheme={colorTheme}
                    />
                  ) : (
                    <div className="px-6 pb-8 overflow-y-auto h-full custom-scrollbar space-y-2">
                      {options.map((opt) => {
                        const OptIcon = getIconForOption(opt, friendlyName);
                        const active = opt === currentState;
                        const theme = getColorForOption(opt);

                        return (
                          <motion.button
                            key={opt}
                            onClick={() => handleSelect(opt)}
                            whileTap={{ scale: 0.98 }}
                            className={cn(
                              "relative p-4 rounded-2xl border flex items-center gap-4 transition-all text-left w-full",
                              active
                                ? `bg-${theme}-500/20 border-${theme}-500/50 shadow-[0_0_15px_rgba(0,0,0,0.3)]`
                                : "bg-zinc-800/30 border-white/5 hover:bg-zinc-800/50"
                            )}
                          >
                            <div className={cn(
                              "w-10 h-10 rounded-full flex items-center justify-center",
                              active ? `bg-${theme}-500 text-white` : "bg-white/10 text-zinc-400"
                            )}>
                              <OptIcon className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                              <span className={cn(
                                "block font-semibold",
                                active ? "text-white" : "text-zinc-300"
                              )}>
                                {opt}
                              </span>
                            </div>
                            {active && <Check className="w-5 h-5 text-white" />}
                          </motion.button>
                        );
                      })}
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === "history" && (
                <motion.div
                  key="history"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="px-6 pb-6 overflow-y-auto custom-scrollbar space-y-3"
                >
                  {generateHistory(options).map((evt, i) => {
                    const Icon = getIconForOption(evt.value, friendlyName);
                    return (
                      <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400">
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-zinc-200">{evt.value}</span>
                            <span className="text-[10px] text-zinc-500">{evt.user}</span>
                          </div>
                        </div>
                        <span className="text-xs text-zinc-500">
                          {new Date(evt.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    );
                  })}
                </motion.div>
              )}

              {activeTab === "settings" && (
                <motion.div
                  key="settings"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="px-6 pb-6 flex flex-col gap-6"
                >
                  {/* Suggestion 2: Scene Link */}
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-3">
                    <div className="flex items-center gap-2 text-zinc-300">
                      <Link className="w-4 h-4" />
                      <span className="text-sm font-medium">Link Scene</span>
                    </div>
                    <p className="text-xs text-zinc-500">
                      Trigger a scene automatically when <strong>{currentState}</strong> is selected.
                    </p>

                    <div className="grid grid-cols-1 gap-2">
                      {["No Action", "Good Morning", "Night Mode", "Movie Time", "Focus"].map(scene => (
                        <button
                          key={scene}
                          onClick={() => {
                            setSelectedScene(scene);
                            toast.success(`Linked: ${scene}`);
                          }}
                          className={cn(
                            "flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors",
                            selectedScene === scene ? "bg-zinc-700 text-white" : "bg-zinc-800/50 text-zinc-400 hover:bg-zinc-700/50"
                          )}
                        >
                          {scene}
                          {selectedScene === scene && <Check className="w-3 h-3" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col items-center py-4 text-zinc-500">
                    <Settings className="w-12 h-12 opacity-20 mb-4" />
                    <p className="text-xs text-center">
                      Entity configuration is managed in Home Assistant.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
