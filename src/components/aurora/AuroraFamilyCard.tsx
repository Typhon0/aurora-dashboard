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
  Navigation, Battery, Home, Briefcase, GraduationCap, Car,
  History, Bell, ChevronRight, MapPin, Settings, Shield,
  User, Radio
} from "lucide-react";
import { cn } from "../../lib/utils";
import { motion, AnimatePresence } from "motion/react";
import Map, { Marker, NavigationControl } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Slider } from "../ui/slider";
import { Switch } from "../ui/switch";

interface AuroraFamilyCardProps {
  people: EntityName[];
  className?: string;
  titleOverride?: string;
}

// --- Constants ---
const MAPTILER_KEY = "7FrRS56cIO5LYlmejoz9"; 
const MAP_STYLE = `https://api.maptiler.com/maps/streets-v2-dark/style.json?key=${MAPTILER_KEY}`;
const HOME_COORDS = { lat: 48.8566, lng: 2.3522 }; // Paris

// --- Haptics ---
const hapticLight = () => {
  if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(10);
};

const hapticSuccess = () => {
  if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate([10, 30, 10]);
};

const hapticSlide = () => {
  if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(5);
};

// --- Helper: Deterministic Mock Location ---
const getMockLocation = (id: string, index: number, offsetMultiplier = 1) => {
    const seed = id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    // Time-based movement for "Live" feel
    const time = Date.now() / 10000;
    const offsetLat = (Math.sin(seed + time) * 0.015 * offsetMultiplier); 
    const offsetLng = (Math.cos(seed + time) * 0.015 * offsetMultiplier);
    
    return {
        lat: HOME_COORDS.lat + offsetLat,
        lng: HOME_COORDS.lng + offsetLng
    };
};

// --- Helper: Person Avatar (Tile) ---
const PersonAvatarTile = ({ id, index, total }: { id: EntityName, index: number, total: number }) => {
  const entity = useEntity(id);
  const state = entity.state;
  const isHome = state === "home";
  const name = entity.attributes.friendly_name || id;
  const initials = name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();
  
  // Color logic
  const colorClass = isHome ? "bg-emerald-500" : "bg-zinc-600";
  const ringClass = isHome ? "ring-emerald-500/50" : "ring-white/10";
  const textClass = isHome ? "text-white" : "text-white/50";
  
  return (
    <div className="flex flex-col items-center gap-2 relative group">
       <div className={cn(
           "relative flex items-center justify-center rounded-full transition-all duration-300 ring-2 ring-offset-2 ring-offset-black/10",
           "w-12 h-12 md:w-14 md:h-14",
           ringClass,
           isHome ? "shadow-[0_0_15px_rgba(16,185,129,0.3)]" : "opacity-70 grayscale"
       )}>
           {entity.attributes.entity_picture ? (
               <img src={entity.attributes.entity_picture} alt={name} className="w-full h-full rounded-full object-cover" />
           ) : (
               <div className={cn("w-full h-full rounded-full flex items-center justify-center text-sm font-bold backdrop-blur-md", isHome ? "bg-emerald-500/20 text-emerald-100" : "bg-zinc-800 text-zinc-400")}>
                   {initials}
               </div>
           )}
           
           {/* Status Dot */}
           <div className={cn(
               "absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-zinc-900 z-10 transition-transform duration-300 group-hover:scale-125",
               colorClass
           )} />
       </div>
       <span className={cn("text-[10px] font-medium tracking-wide truncate max-w-[60px] text-center transition-colors", textClass)}>
           {name.split(" ")[0]}
       </span>
    </div>
  );
};

// --- Helper: Person Row (Inspector) ---
const PersonRowInspector = ({ id, onFocus }: { id: EntityName, onFocus: () => void }) => {
    const entity = useEntity(id);
    const state = entity.state;
    const isHome = state === "home";
    const name = entity.attributes.friendly_name || id;
    const initials = name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();
    
    let LocationIcon = Home;
    let locationText = "Home";
    let color = "emerald";

    if (!isHome) {
        if (state === "work") { LocationIcon = Briefcase; locationText = "Work"; color = "indigo"; }
        else if (state === "school") { LocationIcon = GraduationCap; locationText = "School"; color = "orange"; }
        else { LocationIcon = Car; locationText = "Away"; color = "zinc"; }
    }

    const battery = 20 + (name.length * 7) % 80; 
    
    return (
        <motion.div 
            layout
            onClick={() => { hapticLight(); onFocus(); }}
            className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all group cursor-pointer active:scale-[0.98]"
        >
            <div className="flex items-center gap-4">
                <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shadow-lg ring-1 ring-inset transition-all group-hover:scale-105",
                    `bg-${color}-500/20 ring-${color}-500/30 text-${color}-200`
                )}>
                    {entity.attributes.entity_picture ? (
                         <img src={entity.attributes.entity_picture} alt={name} className="w-full h-full rounded-full object-cover" />
                    ) : initials}
                </div>
                <div className="flex flex-col">
                    <span className="font-semibold text-sm text-white group-hover:text-indigo-300 transition-colors">{name}</span>
                    <div className="flex items-center gap-1.5 text-[10px] text-zinc-400">
                        <LocationIcon className="w-3 h-3" />
                        <span>{locationText}</span>
                        <span className="text-zinc-600">•</span>
                        <span>{new Date(entity.last_changed).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                    </div>
                </div>
            </div>
            
            <div className="flex flex-col items-end gap-1">
                <div className={cn(
                    "flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-medium border",
                    battery < 20 ? "bg-red-500/20 border-red-500/30 text-red-400" : "bg-zinc-800/50 border-white/5 text-zinc-400"
                )}>
                    <Battery className="w-2.5 h-2.5" />
                    {battery}%
                </div>
                <ChevronRight className="w-3 h-3 text-zinc-600 group-hover:text-white transition-colors" />
            </div>
        </motion.div>
    );
};

export const AuroraFamilyCard: React.FC<AuroraFamilyCardProps> = ({
  people,
  className,
  titleOverride,
}) => {
  const [open, setOpen] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const [activeTab, setActiveTab] = useState<"people" | "history" | "settings">("people");
  
  // Map State
  const [viewState, setViewState] = useState({
      longitude: HOME_COORDS.lng,
      latitude: HOME_COORDS.lat,
      zoom: 13,
      pitch: 45 // 3D feel
  });

  // Mock Settings State
  const [geofenceRadius, setGeofenceRadius] = useState(100);
  const [notifications, setNotifications] = useState(true);

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
  
  const displayPeople = people.slice(0, 4);

  // Live Marker Logic (Updates every 2s for "movement" effect)
  const [tick, setTick] = useState(0);
  useEffect(() => {
      if (!open) return;
      const interval = setInterval(() => setTick(t => t + 1), 2000);
      return () => clearInterval(interval);
  }, [open]);

  const markers = useMemo(() => {
      return people.map((id, i) => {
          const loc = getMockLocation(id, i, 1 + (tick * 0.05)); // Slight movement
          return { id, ...loc };
      });
  }, [people, tick]);

  // Handle missing icons to prevent console errors
  const onStyleImageMissing = (e: any) => {
    const map = e.target;
    if (!map.hasImage(e.id)) {
        map.addImage(e.id, { width: 1, height: 1, data: new Uint8Array(4) });
    }
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
        onClick={() => {
            if (!isPressed) {
                setOpen(true);
                hapticLight();
            }
        }}
      >
        <AuroraCard
          className={cn(
            "relative flex flex-col p-5 cursor-pointer overflow-hidden group select-none touch-pan-y",
            "min-h-[180px] rounded-[24px]",
            "bg-zinc-900/40 backdrop-blur-3xl",
            "ring-1 ring-white/10 ring-inset border border-white/5",
            "shadow-xl shadow-black/20",
            isPressed ? "scale-[0.98]" : "hover:bg-zinc-900/50 active:scale-[0.98]",
            "transition-all duration-200",
            className
          )}
        >
            {/* Static Map Background for Tile (Performance) */}
            <div className="absolute inset-0 opacity-10 bg-[url('https://images.unsplash.com/photo-1524661135-423995f22d0b?w=400&q=80')] bg-cover bg-center grayscale mix-blend-overlay pointer-events-none transition-opacity group-hover:opacity-20" />
            
            {/* Header */}
            <div className="relative z-10 flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 ring-1 ring-indigo-500/30 flex items-center justify-center backdrop-blur-md shadow-lg shadow-indigo-500/10">
                    <MapPin className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                    <h3 className="text-sm font-bold text-white tracking-wide">
                        {titleOverride || "Family"}
                    </h3>
                    <p className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Live Tracking
                    </p>
                </div>
            </div>

            {/* People Grid */}
            <div className="relative z-10 flex-1 flex items-center justify-around w-full gap-2">
                {displayPeople.map((id, i) => (
                    <PersonAvatarTile key={id} id={id} index={i} total={displayPeople.length} />
                ))}
                {people.length > 4 && (
                    <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-xs text-zinc-500 font-bold ring-1 ring-white/10">
                        +{people.length - 4}
                    </div>
                )}
            </div>
            
            {/* Bottom Interaction Hint */}
             <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity text-zinc-500">
                 <ChevronRight className="w-4 h-4" />
             </div>

        </AuroraCard>
      </motion.div>

      {/* --- INSPECTOR DIALOG --- */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-zinc-900/95 backdrop-blur-3xl ring-1 ring-white/10 ring-inset border border-white/5 shadow-2xl sm:max-w-[500px] sm:rounded-[32px] p-0 overflow-hidden gap-0 max-h-[90vh] flex flex-col">
           <DialogHeader className="sr-only">
            <DialogTitle>{titleOverride || "Family Location"}</DialogTitle>
            <DialogDescription>Family member status and location</DialogDescription>
          </DialogHeader>

          {/* Immersive Map View (Top 45%) */}
          <div className="relative h-[45vh] w-full shrink-0 bg-zinc-950 border-b border-white/5 overflow-hidden">
               {open && (
                   <Map
                        {...viewState}
                        onMove={evt => setViewState(evt.viewState)}
                        mapStyle={MAP_STYLE}
                        attributionControl={false}
                        maxPitch={60}
                        onStyleImageMissing={onStyleImageMissing}
                    >
                        {/* Home Zone Circle */}
                        <Marker longitude={HOME_COORDS.lng} latitude={HOME_COORDS.lat}>
                             <div className="w-32 h-32 rounded-full bg-indigo-500/10 border border-indigo-500/30 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
                                 <Home className="w-4 h-4 text-indigo-400 opacity-50" />
                             </div>
                        </Marker>

                        {/* Person Markers */}
                        {markers.map((m) => (
                            <Marker 
                                key={m.id} 
                                longitude={m.lng} 
                                latitude={m.lat} 
                                anchor="bottom"
                            >
                                <motion.div 
                                    initial={{ scale: 0, y: 20 }}
                                    animate={{ scale: 1, y: 0 }}
                                    className="flex flex-col items-center cursor-pointer group"
                                >
                                    {/* Floating Avatar Pin */}
                                    <div className="relative">
                                        <div className="w-12 h-12 rounded-full border-[3px] border-zinc-900 shadow-2xl overflow-hidden relative z-20 bg-indigo-500 flex items-center justify-center">
                                            <span className="text-xs font-bold text-white">
                                                {m.id.split(".")[1].slice(0,2).toUpperCase()}
                                            </span>
                                        </div>
                                        {/* Pulse Ring */}
                                        <div className="absolute inset-0 rounded-full bg-white/30 animate-ping z-10" />
                                    </div>
                                    
                                    {/* Name Tag */}
                                    <div className="px-2 py-1 mt-2 rounded-md bg-zinc-900/80 backdrop-blur-md text-[10px] font-bold text-white border border-white/10 shadow-lg whitespace-nowrap">
                                        {m.id.split(".")[1]}
                                    </div>
                                    
                                    {/* Pin Stick */}
                                    <div className="w-0.5 h-4 bg-white/30 -mt-1" />
                                    <div className="w-2 h-1 rounded-full bg-black/50 blur-[2px]" />
                                </motion.div>
                            </Marker>
                        ))}
                   </Map>
               )}
               
               {/* Glass Overlay Controls */}
               <div className="absolute top-4 right-4 flex flex-col gap-2">
                   <button 
                      onClick={() => setViewState({...viewState, zoom: viewState.zoom + 1})}
                      className="w-10 h-10 rounded-xl bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-white/10 active:scale-95 transition-all"
                   >
                       <Navigation className="w-4 h-4 fill-current" />
                   </button>
               </div>
          </div>

          {/* Bottom Sheet Content */}
          <div className="flex-1 flex flex-col min-h-0 bg-zinc-900/50">
               {/* Tabs */}
               <div className="flex items-center justify-around px-4 py-3 border-b border-white/5 bg-zinc-900/80 backdrop-blur-xl z-10">
                   {[
                       { id: "people", label: "People", icon: User },
                       { id: "history", label: "Timeline", icon: History },
                       { id: "settings", label: "Settings", icon: Settings },
                   ].map((tab) => (
                       <button
                           key={tab.id}
                           onClick={() => { setActiveTab(tab.id as any); hapticLight(); }}
                           className={cn(
                               "flex flex-col items-center gap-1 px-4 py-1 rounded-xl transition-all",
                               activeTab === tab.id 
                                 ? "text-indigo-400 bg-indigo-500/10" 
                                 : "text-zinc-500 hover:text-zinc-300"
                           )}
                       >
                           <tab.icon className={cn("w-5 h-5", activeTab === tab.id && "fill-current")} />
                           <span className="text-[10px] font-medium">{tab.label}</span>
                       </button>
                   ))}
               </div>

               {/* Tab Content */}
               <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
                   <AnimatePresence mode="wait">
                       {activeTab === "people" && (
                           <motion.div 
                               key="people-list"
                               initial={{ opacity: 0, y: 10 }}
                               animate={{ opacity: 1, y: 0 }}
                               exit={{ opacity: 0, y: -10 }}
                               className="space-y-2"
                           >
                               {people.map(id => (
                                   <PersonRowInspector 
                                       key={id} 
                                       id={id} 
                                       onFocus={() => {
                                           const loc = markers.find(m => m.id === id);
                                           if (loc) {
                                               setViewState(prev => ({
                                                   ...prev,
                                                   latitude: loc.lat,
                                                   longitude: loc.lng,
                                                   zoom: 15,
                                                   pitch: 60
                                               }));
                                           }
                                       }}
                                   />
                               ))}
                           </motion.div>
                       )}

                       {activeTab === "history" && (
                           <motion.div
                               key="history-list"
                               initial={{ opacity: 0, y: 10 }}
                               animate={{ opacity: 1, y: 0 }}
                               exit={{ opacity: 0, y: -10 }}
                               className="space-y-0 pl-2"
                           >
                               {[1, 2, 3, 4, 5].map((_, i) => (
                                   <div key={i} className="flex gap-4 pb-6 relative last:pb-0">
                                       <div className="absolute left-[15px] top-8 bottom-0 w-[1px] bg-white/5 last:hidden" />
                                       
                                       <div className="w-8 h-8 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center shrink-0 z-10 shadow-lg">
                                            {i % 2 === 0 ? <Home className="w-3 h-3 text-emerald-400" /> : <Car className="w-3 h-3 text-zinc-400" />}
                                       </div>
                                       <div className="flex flex-col pt-0.5">
                                           <span className="text-xs font-medium text-white">
                                               {i % 2 === 0 ? "Alex arrived home" : "Sam left for work"}
                                           </span>
                                           <span className="text-[10px] text-zinc-500 mt-0.5">
                                               {i === 0 ? "Just now" : `${i * 2} hours ago`} • {i % 2 === 0 ? "Automated" : "Geofence"}
                                           </span>
                                       </div>
                                   </div>
                               ))}
                           </motion.div>
                       )}
                       
                       {activeTab === "settings" && (
                           <motion.div
                               key="settings"
                               initial={{ opacity: 0, y: 10 }}
                               animate={{ opacity: 1, y: 0 }}
                               exit={{ opacity: 0, y: -10 }}
                               className="space-y-6"
                           >
                               {/* Geofence */}
                               <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-4">
                                   <div className="flex items-center gap-3 text-zinc-300">
                                       <Shield className="w-4 h-4 text-indigo-400" />
                                       <span className="text-sm font-medium">Home Zone Radius</span>
                                   </div>
                                   <div className="px-2">
                                       <Slider 
                                            defaultValue={[geofenceRadius]} 
                                            max={500} 
                                            step={10}
                                            onValueChange={(v) => { setGeofenceRadius(v[0]); hapticSlide(); }}
                                       />
                                   </div>
                                   <div className="flex justify-between text-[10px] text-zinc-500 font-medium uppercase">
                                       <span>50m</span>
                                       <span className="text-white">{geofenceRadius}m</span>
                                       <span>500m</span>
                                   </div>
                               </div>

                               {/* Notifications */}
                               <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-4">
                                   <div className="flex items-center justify-between">
                                       <div className="flex items-center gap-3 text-zinc-300">
                                           <Bell className="w-4 h-4 text-orange-400" />
                                           <div className="flex flex-col">
                                               <span className="text-sm font-medium">Arrival Alerts</span>
                                               <span className="text-[10px] text-zinc-500">Notify when family arrives</span>
                                           </div>
                                       </div>
                                       <Switch checked={notifications} onCheckedChange={setNotifications} />
                                   </div>
                                   
                                   <div className="flex items-center justify-between">
                                       <div className="flex items-center gap-3 text-zinc-300">
                                           <Radio className="w-4 h-4 text-emerald-400" />
                                           <div className="flex flex-col">
                                               <span className="text-sm font-medium">Share My Location</span>
                                               <span className="text-[10px] text-zinc-500">Visible to family members</span>
                                           </div>
                                       </div>
                                       <Switch defaultChecked />
                                   </div>
                               </div>
                           </motion.div>
                       )}
                   </AnimatePresence>
               </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
