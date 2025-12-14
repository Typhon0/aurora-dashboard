import React, { useState, useRef, useMemo, useEffect } from "react";
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
  Trash2,
  Recycle,
  Leaf,
  Calendar as CalendarIcon,
  Check,
  Bell,
  Settings,
  ChevronRight,
  AlertTriangle
} from "lucide-react";
import { cn } from "../../lib/utils";
import { motion, AnimatePresence, useMotionValue, useTransform, type PanInfo } from "motion/react";
import { Switch } from "../ui/switch";
import { format, addDays, differenceInDays, isSameDay, startOfToday } from "date-fns";

interface AuroraGarbageCollectionCardProps {
  entity?: EntityName; // Optional binding
  className?: string;
  titleOverride?: string;
}

// --- Types ---
type WasteType = "general" | "recycle" | "organic";

interface PickupEvent {
  id: string;
  type: WasteType;
  date: Date;
  completed: boolean;
}

// --- Constants ---
const BIN_COLORS = {
  general: "red",
  recycle: "yellow",
  organic: "green"
};

const BIN_LABELS = {
  general: "General Waste",
  recycle: "Recycling",
  organic: "Organic / Garden"
};

// --- Haptics ---
const hapticLight = () => {
  if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(10);
};
const hapticSuccess = () => {
  if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate([10, 30, 10]);
};
const hapticHeavy = () => {
  if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(40);
};

// --- Mock Data Generator ---
const generateSchedule = (): PickupEvent[] => {
  const today = startOfToday();
  const events: PickupEvent[] = [];

  // Generate 4 weeks of pickups
  for (let i = 0; i < 30; i++) {
    const date = addDays(today, i);
    const dayOfWeek = date.getDay(); // 0=Sun, 1=Mon...

    // Assume pickup is on Tuesday (2)
    if (dayOfWeek === 2) {
        // Weekly: General
        events.push({
            id: `gen-${i}`,
            type: "general",
            date: date,
            completed: false
        });

        // Bi-weekly: Recycle (Even weeks)
        if (Math.floor(i / 7) % 2 === 0) {
             events.push({
                id: `rec-${i}`,
                type: "recycle",
                date: date,
                completed: false
            });
        } else {
            // Alternate: Organic
            events.push({
                id: `org-${i}`,
                type: "organic",
                date: date,
                completed: false
            });
        }
    }
  }
  return events.sort((a, b) => a.date.getTime() - b.date.getTime());
};

// --- Components ---

const BinIcon = ({ type, className }: { type: WasteType, className?: string }) => {
    const Icon = type === "recycle" ? Recycle : type === "organic" ? Leaf : Trash2;
    const color = BIN_COLORS[type];
    
    return (
        <div className={cn(
            "flex items-center justify-center rounded-xl ring-1 ring-inset shadow-lg",
            `bg-${color}-500/20 ring-${color}-500/30 text-${color}-400`,
            className
        )}>
            <Icon className="w-1/2 h-1/2" />
        </div>
    );
};

export const AuroraGarbageCollectionCard: React.FC<AuroraGarbageCollectionCardProps> = ({
  entity,
  className,
  titleOverride,
}) => {
  const [open, setOpen] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  
  // State
  const [schedule, setSchedule] = useState<PickupEvent[]>(generateSchedule());
  const [settings, setSettings] = useState({ reminders: true, time: "20:00" });

  // Interaction State (Swipe to Complete)
  const x = useMotionValue(0);
  const opacity = useTransform(x, [0, 100], [1, 0]);
  const checkOpacity = useTransform(x, [0, 50, 100], [0, 1, 1]);
  const checkScale = useTransform(x, [0, 100], [0.5, 1.2]);
  const bgOpacity = useTransform(x, [0, 100], [0, 1]);
  
  // Derived
  const upcomingPickups = useMemo(() => schedule.filter(e => !e.completed), [schedule]);
  // Next pickup group (all bins on the same next date)
  const nextPickupDate = upcomingPickups[0]?.date;
  const nextBins = upcomingPickups.filter(e => isSameDay(e.date, nextPickupDate));
  
  const daysUntil = nextPickupDate ? differenceInDays(nextPickupDate, startOfToday()) : 99;

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

  const handleDragEnd = (event: any, info: PanInfo) => {
    if (info.offset.x > 100) {
      // Swiped Right -> Mark Complete
      if (nextBins.length > 0) {
          hapticHeavy();
          // Mark all bins for this date as completed
          setSchedule(prev => prev.map(e => 
              nextBins.find(b => b.id === e.id) ? { ...e, completed: true } : e
          ));
      }
    }
  };

  // Helper for dynamic text
  const getDayLabel = (days: number) => {
      if (days === 0) return "Today";
      if (days === 1) return "Tomorrow";
      return `in ${days} days`;
  };

  return (
    <>
      {/* --- TILE --- */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative h-full"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleTouchStart}
        onMouseUp={handleTouchEnd}
        onMouseLeave={handleTouchEnd}
      >
        <AuroraCard
          className={cn(
            "relative flex flex-col p-0 cursor-pointer overflow-hidden group select-none touch-none",
            "min-h-[180px] rounded-[24px]",
            "bg-zinc-900/40 backdrop-blur-3xl",
            "ring-1 ring-white/10 ring-inset border border-white/5",
            "shadow-xl shadow-black/20",
            isPressed ? "scale-[0.98]" : "hover:bg-zinc-900/50 active:scale-[0.98]",
            "transition-all duration-200",
            className
          )}
          onClick={() => {
              if (!isPressed) {
                  setOpen(true);
                  hapticLight();
              }
          }}
        >
            {/* Completion Success Background (Green Flash) */}
            <motion.div 
                style={{ opacity: bgOpacity }}
                className="absolute inset-0 bg-emerald-500/20 z-0" 
            />

            {/* Content Container with Swipe Logic */}
            <motion.div 
                className="flex-1 flex flex-col relative z-10"
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.2}
                onDragEnd={handleDragEnd}
                style={{ x }}
            >
                 {/* Success Checkmark Overlay */}
                 <motion.div 
                    style={{ opacity: checkOpacity, scale: checkScale }}
                    className="absolute inset-0 flex items-center justify-center pointer-events-none"
                 >
                     <div className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/50">
                         <Check className="w-8 h-8 text-white stroke-[3]" />
                     </div>
                 </motion.div>

                 {/* Main Tile Content */}
                 <motion.div style={{ opacity }} className="flex-1 flex flex-col p-5">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Trash2 className="w-4 h-4 text-zinc-400" />
                            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                                Waste Collection
                            </span>
                        </div>
                        {daysUntil <= 1 && (
                            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/20 border border-red-500/20 text-[10px] text-red-400 font-bold animate-pulse">
                                <AlertTriangle className="w-3 h-3" />
                                <span>Pickup {getDayLabel(daysUntil)}</span>
                            </div>
                        )}
                    </div>

                    {/* Bins Display */}
                    {nextBins.length > 0 ? (
                        <div className="flex-1 flex flex-col justify-center gap-4">
                            <div className="flex items-center gap-4">
                                {nextBins.map(bin => (
                                    <div key={bin.id} className="flex flex-col items-center gap-2">
                                        <BinIcon type={bin.type} className="w-14 h-14 text-2xl" />
                                        <span className="text-[10px] font-medium text-zinc-400">{BIN_LABELS[bin.type].split(" ")[0]}</span>
                                    </div>
                                ))}
                            </div>
                            
                            <div className="mt-2">
                                <h3 className="text-3xl font-light text-white">
                                    {format(nextPickupDate!, "EEEE")}
                                </h3>
                                <p className="text-sm text-zinc-400">
                                    {getDayLabel(daysUntil)} • {format(nextPickupDate!, "MMM d")}
                                </p>
                            </div>
                        </div>
                    ) : (
                         <div className="flex-1 flex flex-col items-center justify-center text-zinc-500">
                             <Check className="w-8 h-8 opacity-20 mb-2" />
                             <span>All clear</span>
                         </div>
                    )}
                 </motion.div>

                 {/* Swipe Hint */}
                 <motion.div style={{ opacity }} className="absolute bottom-4 left-0 right-0 flex justify-center pointer-events-none">
                     <div className="flex items-center gap-1 text-[10px] text-zinc-600 font-medium uppercase tracking-wider opacity-50">
                         <ChevronRight className="w-3 h-3" />
                         Swipe to Complete
                     </div>
                 </motion.div>
            </motion.div>
        </AuroraCard>
      </motion.div>

      {/* --- INSPECTOR DIALOG --- */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-zinc-900/95 backdrop-blur-3xl ring-1 ring-white/10 ring-inset border border-white/5 shadow-2xl sm:max-w-[500px] sm:rounded-[32px] p-0 overflow-hidden gap-0 max-h-[90vh] flex flex-col">
           <DialogHeader className="sr-only">
            <DialogTitle>Waste Schedule</DialogTitle>
            <DialogDescription>Manage Pickup Reminders</DialogDescription>
          </DialogHeader>

          {/* Header Area */}
          <div className="p-6 border-b border-white/5 bg-zinc-900/50">
              <div className="flex items-center justify-between">
                  <div>
                      <h2 className="text-xl font-bold text-white">Schedule</h2>
                      <p className="text-xs text-zinc-400">Upcoming pickups</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                      <CalendarIcon className="w-5 h-5 text-zinc-400" />
                  </div>
              </div>
          </div>

          {/* Schedule List */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2">
              {schedule.reduce((acc: any[], curr) => {
                  // Group by date
                  const dateStr = curr.date.toISOString();
                  const existing = acc.find(g => g.dateStr === dateStr);
                  if (existing) {
                      existing.events.push(curr);
                  } else {
                      acc.push({ dateStr, date: curr.date, events: [curr] });
                  }
                  return acc;
              }, []).map((group, i) => {
                  const isNext = i === 0 && !group.events[0].completed;
                  return (
                    <div 
                        key={group.dateStr} 
                        className={cn(
                            "p-4 rounded-2xl border transition-colors",
                            isNext ? "bg-white/5 border-white/10" : "border-transparent opacity-70"
                        )}
                    >
                        <div className="flex items-start justify-between mb-3">
                             <div>
                                 <h4 className={cn("font-medium", isNext ? "text-white" : "text-zinc-400")}>
                                     {format(group.date, "EEEE, MMM d")}
                                 </h4>
                                 {isNext && (
                                     <span className="text-[10px] text-indigo-400 uppercase font-bold tracking-wider">
                                         Next Pickup
                                     </span>
                                 )}
                             </div>
                             {group.events.every((e: any) => e.completed) && (
                                 <div className="flex items-center gap-1 text-emerald-500 text-xs font-medium">
                                     <Check className="w-3 h-3" />
                                     Done
                                 </div>
                             )}
                        </div>
                        
                        <div className="flex gap-2">
                            {group.events.map((e: PickupEvent) => (
                                <div key={e.id} className="flex items-center gap-2 bg-black/20 px-3 py-2 rounded-lg border border-white/5">
                                    <div className={cn("w-2 h-2 rounded-full", `bg-${BIN_COLORS[e.type]}-500`)} />
                                    <span className="text-xs text-zinc-300">{BIN_LABELS[e.type]}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                  );
              })}
          </div>

          {/* Settings Area (Bottom) */}
          <div className="p-4 bg-black/20 border-t border-white/5 space-y-4">
              <div className="flex items-center justify-between">
                   <div className="flex items-center gap-3 text-zinc-300">
                       <Bell className="w-4 h-4 text-orange-400" />
                       <div className="flex flex-col">
                           <span className="text-sm font-medium">Reminders</span>
                           <span className="text-[10px] text-zinc-500">Notify at {settings.time} before pickup</span>
                       </div>
                   </div>
                   <Switch 
                        checked={settings.reminders} 
                        onCheckedChange={(c) => {
                            setSettings(p => ({...p, reminders: c}));
                            hapticLight();
                        }} 
                   />
              </div>
              
              <button className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-xs font-medium text-zinc-400 transition-colors flex items-center justify-center gap-2">
                  <Settings className="w-3.5 h-3.5" />
                  Configure Schedule Pattern
              </button>
          </div>

        </DialogContent>
      </Dialog>
    </>
  );
};
