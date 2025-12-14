import React, { useState, useRef, useMemo } from "react";
import { useEntity, type EntityName } from "@hakit/core";
import { AuroraCard } from "./base/AuroraCard";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";
import { Calendar } from "../ui/calendar";
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Video,
  MoreHorizontal,
  ChevronRight,
  ChevronLeft,
  Settings,
  Bell,
  Filter
} from "lucide-react";
import { cn } from "../../lib/utils";
import { motion, AnimatePresence, useMotionValue, useTransform, type PanInfo } from "motion/react";
import { Switch } from "../ui/switch";
import { format, addHours, isSameDay, startOfToday, addDays } from "date-fns";

interface AuroraCalendarCardProps {
  entity?: EntityName; // Optional binding to a calendar entity
  className?: string;
  titleOverride?: string;
}

// --- Types ---
interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  location?: string;
  type: "work" | "personal" | "family";
  color: string;
}

// --- Haptics ---
const hapticLight = () => {
  if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(10);
};
const hapticSuccess = () => {
  if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate([10, 30, 10]);
};
const hapticTick = () => {
  if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(5);
};

// --- Mock Data ---
const generateMockEvents = (): CalendarEvent[] => {
  const today = startOfToday();
  const tomorrow = addDays(today, 1);

  return [
    {
      id: "1",
      title: "Design Sync: Aurora OS",
      start: addHours(today, 9),
      end: addHours(today, 10),
      type: "work",
      color: "indigo",
      location: "Conference Room A"
    },
    {
      id: "2",
      title: "Lunch with Sarah",
      start: addHours(today, 12.5),
      end: addHours(today, 13.5),
      type: "personal",
      color: "emerald",
      location: "Downtown Bistro"
    },
    {
      id: "3",
      title: "Product Review",
      start: addHours(today, 14),
      end: addHours(today, 15.5),
      type: "work",
      color: "indigo",
      location: "Zoom"
    },
    {
      id: "4",
      title: "Kids Soccer Practice",
      start: addHours(today, 17),
      end: addHours(today, 18.5),
      type: "family",
      color: "orange",
      location: "City Park"
    },
    {
      id: "5",
      title: "Deep Work",
      start: addHours(tomorrow, 9),
      end: addHours(tomorrow, 11),
      type: "work",
      color: "indigo"
    },
    {
      id: "6",
      title: "Dentist Appointment",
      start: addHours(tomorrow, 15),
      end: addHours(tomorrow, 16),
      type: "personal",
      color: "emerald"
    }
  ];
};

// --- Components ---

const EventRow = ({ event, compact = false }: { event: CalendarEvent, compact?: boolean }) => {
  const duration = (event.end.getTime() - event.start.getTime()) / (1000 * 60 * 60);

  return (
    <div className={cn(
      "flex gap-4 group relative",
      compact ? "py-2" : "py-3"
    )}>
      {/* Timeline Line */}
      <div className="flex flex-col items-center w-12 shrink-0 pt-1">
        <span className={cn("text-xs font-semibold", compact ? "text-zinc-400" : "text-white")}>
          {format(event.start, "h:mm")}
        </span>
        <span className="text-[10px] text-zinc-500 uppercase">{format(event.start, "a")}</span>
        {!compact && <div className="w-0.5 flex-1 bg-white/5 mt-2 group-last:hidden" />}
      </div>

      {/* Card */}
      <div className={cn(
        "flex-1 rounded-xl border transition-all duration-200 relative overflow-hidden",
        `bg-${event.color}-500/10 border-${event.color}-500/20 hover:bg-${event.color}-500/20`,
        compact ? "p-2" : "p-3"
      )}>
        {/* Color Bar */}
        <div className={cn("absolute left-0 top-0 bottom-0 w-1", `bg-${event.color}-500`)} />

        <div className="ml-2">
          <h4 className={cn("font-medium text-white truncate", compact ? "text-xs" : "text-sm")}>
            {event.title}
          </h4>
          <div className="flex items-center gap-3 mt-1">
            <span className={cn("text-[10px] opacity-80 flex items-center gap-1", `text-${event.color}-200`)}>
              <Clock className="w-3 h-3" />
              {duration}h
            </span>
            {event.location && !compact && (
              <span className="text-[10px] text-zinc-400 flex items-center gap-1 truncate">
                {event.location.includes("Zoom") ? <Video className="w-3 h-3" /> : <MapPin className="w-3 h-3" />}
                {event.location}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export const AuroraCalendarCard: React.FC<AuroraCalendarCardProps> = ({
  entity,
  className,
  titleOverride,
}) => {
  const [open, setOpen] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  // Mock Data State
  const [events] = useState<CalendarEvent[]>(generateMockEvents());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [calendars, setCalendars] = useState({ work: true, personal: true, family: true });

  // Tile Interaction State (Drag to peek next event)
  const [eventIndex, setEventIndex] = useState(0);
  const y = useMotionValue(0);
  const opacity = useTransform(y, [-50, 0, 50], [0, 1, 0]);
  const scale = useTransform(y, [-50, 0, 50], [0.9, 1, 0.9]);

  const todayEvents = useMemo(() => events.filter(e => isSameDay(e.start, new Date())), [events]);
  const currentEvent = todayEvents[eventIndex] || todayEvents[0];

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
    if (info.offset.y < -30) {
      // Drag Up -> Next Event
      if (eventIndex < todayEvents.length - 1) {
        setEventIndex(i => i + 1);
        hapticTick();
      }
    } else if (info.offset.y > 30) {
      // Drag Down -> Prev Event
      if (eventIndex > 0) {
        setEventIndex(i => i - 1);
        hapticTick();
      }
    }
  };

  // Inspector Events
  const selectedEvents = useMemo(() => {
    if (!selectedDate) return [];
    return events.filter(e => isSameDay(e.start, selectedDate));
  }, [selectedDate, events]);

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
          {/* Dynamic Background Gradient based on event color */}
          {currentEvent && (
            <div className={cn(
              "absolute inset-0 opacity-20 transition-colors duration-500",
              `bg-gradient-to-br from-${currentEvent.color}-500/30 via-transparent to-transparent`
            )} />
          )}

          {/* Header (Date) */}
          <div className="px-5 pt-5 flex justify-between items-start z-10">
            <div className="flex flex-col">
              <span className="text-red-500 font-bold text-xs uppercase tracking-wider">
                {format(new Date(), "EEEE")}
              </span>
              <span className="text-4xl font-thin text-white tracking-tight -ml-0.5">
                {format(new Date(), "d")}
              </span>
            </div>
            <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
              <CalendarIcon className="w-4 h-4 text-white/70" />
            </div>
          </div>

          {/* Draggable Event Area */}
          <motion.div
            className="flex-1 px-5 pb-5 flex flex-col justify-end relative z-20"
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            style={{ y }}
          >
            <motion.div style={{ opacity, scale }} className="flex flex-col gap-1">
              {currentEvent ? (
                <>
                  <div className="flex items-center gap-2 mb-1">
                    <div className={cn("w-1.5 h-1.5 rounded-full", `bg-${currentEvent.color}-500`)} />
                    <span className="text-[10px] text-zinc-400 uppercase font-medium">
                      {eventIndex === 0 ? "Up Next" : "Later Today"}
                    </span>
                  </div>
                  <h3 className="text-lg font-medium text-white leading-snug line-clamp-2">
                    {currentEvent.title}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-zinc-400 mt-1">
                    <span>{format(currentEvent.start, "h:mm a")}</span>
                    <span>•</span>
                    <span className="truncate max-w-[120px]">{currentEvent.location || "No Location"}</span>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-20 text-zinc-500">
                  <span className="text-sm">No more events</span>
                  <span className="text-[10px]">Enjoy your day</span>
                </div>
              )}
            </motion.div>

            {/* Pagination Dots */}
            {todayEvents.length > 1 && (
              <div className="absolute right-0 top-1/2 -translate-y-1/2 flex flex-col gap-1">
                {todayEvents.map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      "w-1 rounded-full transition-all duration-300",
                      i === eventIndex ? "h-3 bg-white" : "h-1 bg-white/20"
                    )}
                  />
                ))}
              </div>
            )}
          </motion.div>

        </AuroraCard>
      </motion.div>

      {/* --- INSPECTOR DIALOG --- */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-zinc-900/95 backdrop-blur-3xl ring-1 ring-white/10 ring-inset border border-white/5 shadow-2xl sm:max-w-[800px] sm:rounded-[32px] p-0 overflow-hidden gap-0 max-h-[90vh] flex flex-col md:flex-row">
          <DialogHeader className="sr-only">
            <DialogTitle>Calendar</DialogTitle>
            <DialogDescription>Schedule and Events</DialogDescription>
          </DialogHeader>

          {/* LEFT: Month View & Settings */}
          <div className="w-full md:w-[320px] bg-zinc-950/50 border-b md:border-b-0 md:border-r border-white/5 flex flex-col">
            <div className="p-4 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-sm font-medium text-white">
                {selectedDate ? format(selectedDate, "MMMM yyyy") : "Calendar"}
              </h3>
              <button className="p-2 rounded-full hover:bg-white/5 transition-colors">
                <Settings className="w-4 h-4 text-zinc-400" />
              </button>
            </div>

            <div className="p-2 flex justify-center">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => { setSelectedDate(date); hapticLight(); }}
                className="rounded-md border-0 text-white"
                classNames={{
                  day_selected: "bg-indigo-600 text-white hover:bg-indigo-600 hover:text-white focus:bg-indigo-600 focus:text-white",
                  day_today: "bg-zinc-800 text-zinc-100",
                  head_cell: "text-zinc-500 font-normal text-[0.8rem]",
                  cell: "text-center text-sm p-0 relative [&:has([aria-selected])]:bg-zinc-800/50 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                }}
              />
            </div>

            {/* Filters */}
            <div className="p-4 space-y-4 flex-1">
              <div className="flex items-center gap-2 text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">
                <Filter className="w-3 h-3" />
                Filters
              </div>
              {Object.entries(calendars).map(([key, active]) => (
                <div key={key} className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-2">
                    <div className={cn("w-2 h-2 rounded-full",
                      key === "work" ? "bg-indigo-500" :
                        key === "personal" ? "bg-emerald-500" : "bg-orange-500"
                    )} />
                    <span className="text-sm text-zinc-300 capitalize">{key}</span>
                  </div>
                  <Switch
                    checked={active}
                    onCheckedChange={(c) => {
                      setCalendars(prev => ({ ...prev, [key]: c }));
                      hapticLight();
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT: Agenda View */}
          <div className="flex-1 flex flex-col min-h-[400px] bg-zinc-900/30 relative">
            {/* Header */}
            <div className="h-16 border-b border-white/5 flex items-center justify-between px-6 shrink-0">
              <div>
                <h2 className="text-xl font-bold text-white">
                  {selectedDate && isSameDay(selectedDate, new Date()) ? "Today" : selectedDate ? format(selectedDate, "EEEE, MMM d") : "Events"}
                </h2>
                <p className="text-xs text-zinc-400">
                  {selectedEvents.length} events scheduled
                </p>
              </div>
              <button className="w-8 h-8 rounded-full bg-indigo-500 text-white flex items-center justify-center hover:bg-indigo-400 transition-colors shadow-lg shadow-indigo-500/20">
                <span className="text-lg leading-none mb-0.5">+</span>
              </button>
            </div>

            {/* Scrollable List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
              <AnimatePresence mode="wait">
                {selectedEvents.length > 0 ? (
                  <motion.div
                    key={selectedDate?.toISOString()}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-1"
                  >
                    {/* Current Time Line Indicator (Only if Today) */}
                    {selectedDate && isSameDay(selectedDate, new Date()) && (
                      <div className="absolute left-0 right-0 h-[1px] bg-red-500/50 z-10 pointer-events-none flex items-center" style={{ top: '30%' }}>
                        <div className="w-2 h-2 rounded-full bg-red-500 ml-[58px]" />
                        <span className="text-[9px] text-red-500 ml-2 font-medium bg-zinc-900/80 px-1 rounded">Current Time</span>
                      </div>
                    )}

                    {selectedEvents.map(event => (
                      <EventRow key={event.id} event={event} />
                    ))}
                  </motion.div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-zinc-500 space-y-4">
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                      <CalendarIcon className="w-8 h-8 opacity-20" />
                    </div>
                    <p>No events scheduled</p>
                  </div>
                )}
              </AnimatePresence>
            </div>

            {/* Gradient Fade at Bottom */}
            <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-zinc-900/80 to-transparent pointer-events-none" />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
