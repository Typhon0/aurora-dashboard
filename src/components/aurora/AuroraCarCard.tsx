import React, { useState, useRef, useEffect } from "react";
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
  Car,
  Lock,
  Unlock,
  Zap,
  Thermometer,
  Wind,
  MapPin,
  Gauge,
  AlertTriangle,
  Fan,
  ChevronRight,
  Battery,
  BatteryCharging,
  Maximize2
} from "lucide-react";
import { cn } from "../../lib/utils";
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from "motion/react";
import { Switch } from "../ui/switch";
import { Slider } from "../ui/slider";
import { format } from "date-fns";

// --- Types based on Mercedes Integration ---
interface CarAttributes {
    doorLockStatusOverall?: number; // 0: unlocked, 1: internal locked, 2: external locked
    doorStatusOverall?: boolean;
    tankLevelPercent?: number;
    rangeLiquid?: number;
    soc?: number; // Electric %
    maxrange?: number;
    rangeElectric?: number;
    chargingstatus?: number; // 0=not, 1=charging?
    tirepressureFrontLeft?: number;
    tirepressureFrontRight?: number;
    tirepressureRearLeft?: number;
    tirepressureRearRight?: number;
    windowstatusfrontleft?: number;
    windowstatusfrontright?: number;
    odometer?: number;
    lock?: string; // "locked", "unlocked"
    precondActive?: boolean;
}

interface AuroraCarCardProps {
  entityId: EntityName; // Main entity (likely the lock or soc sensor)
  className?: string;
  carImage?: string; // Optional custom image
  carName?: string;
}

// --- Haptics ---
const hapticLight = () => {
  if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(10);
};
const hapticSuccess = () => {
  if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate([10, 30, 10]);
};
const hapticHeavy = () => {
    if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(50);
}

// --- Components ---

// Tire Pressure Widget
const TireWidget = ({ fl, fr, rl, rr }: { fl: number, fr: number, rl: number, rr: number }) => {
    const getStatusColor = (pressure: number) => {
        if (pressure < 200) return "text-red-500"; // Low
        if (pressure > 300) return "text-orange-500"; // High
        return "text-emerald-500"; // OK (assuming kPa)
    };

    return (
        <div className="relative w-32 h-48 mx-auto">
            {/* Car Outline (Abstract) */}
            <div className="absolute inset-0 border-2 border-white/10 rounded-[2rem] opacity-50" />
            
            {/* Tires */}
            <div className="absolute top-4 left-0 -translate-x-1/2 bg-black/50 backdrop-blur px-2 py-1 rounded-lg border border-white/10">
                <span className={cn("text-xs font-bold", getStatusColor(fl))}>{fl}</span>
            </div>
            <div className="absolute top-4 right-0 translate-x-1/2 bg-black/50 backdrop-blur px-2 py-1 rounded-lg border border-white/10">
                <span className={cn("text-xs font-bold", getStatusColor(fr))}>{fr}</span>
            </div>
            <div className="absolute bottom-8 left-0 -translate-x-1/2 bg-black/50 backdrop-blur px-2 py-1 rounded-lg border border-white/10">
                <span className={cn("text-xs font-bold", getStatusColor(rl))}>{rl}</span>
            </div>
            <div className="absolute bottom-8 right-0 translate-x-1/2 bg-black/50 backdrop-blur px-2 py-1 rounded-lg border border-white/10">
                <span className={cn("text-xs font-bold", getStatusColor(rr))}>{rr}</span>
            </div>
        </div>
    );
};

export const AuroraCarCard: React.FC<AuroraCarCardProps> = ({
  entityId,
  className,
  carImage = "https://images.unsplash.com/photo-1617788138017-80ad40651399?q=80&w=1000&auto=format&fit=crop", // Placeholder Mercedes-ish
  carName = "EQS 580"
}) => {
  // In a real scenario, we would fetch multiple entities. 
  // For this component, we'll mock the data structure based on the Mercedes integration description
  // assuming the `entityId` passed is the main 'lock' or 'sensor' entry point, 
  // or we just use it to get the hass object if needed.
  
  // Mock Data State (simulating the Mercedes attributes)
  const [carData, setCarData] = useState<CarAttributes>({
      lock: "locked",
      doorLockStatusOverall: 2, // Locked
      rangeElectric: 420, // km
      soc: 78, // %
      chargingstatus: 0,
      tirepressureFrontLeft: 240,
      tirepressureFrontRight: 242,
      tirepressureRearLeft: 238,
      tirepressureRearRight: 239,
      windowstatusfrontleft: 2, // Closed? Assuming 2 is closed based on context
      odometer: 12543,
      precondActive: false
  });

  const [open, setOpen] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [activeTab, setActiveTab] = useState<"controls" | "charging" | "climate">("controls");
  
  // Interactive States
  const [targetTemp, setTargetTemp] = useState(21);
  const [chargeLimit, setChargeLimit] = useState(80);

  // Animations
  const carX = useSpring(1000, { stiffness: 100, damping: 20 });
  const carOpacity = useTransform(carX, [1000, 0], [0, 1]);

  useEffect(() => {
      if (open) {
          // Delay slightly for the modal to open, then slide car in
          setTimeout(() => carX.set(0), 200);
      } else {
          carX.set(500);
      }
  }, [open, carX]);

  // --- Handlers ---

  const toggleLock = () => {
      const newStatus = carData.lock === "locked" ? "unlocked" : "locked";
      setCarData(prev => ({ ...prev, lock: newStatus }));
      hapticHeavy();
  };

  const toggleClimate = () => {
      setCarData(prev => ({ ...prev, precondActive: !prev.precondActive }));
      hapticSuccess();
  };

  // --- Render ---
  return (
    <>
      {/* --- TILE --- */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className={cn("relative h-full col-span-2", className)}
        onMouseDown={() => setIsPressed(true)}
        onMouseUp={() => setIsPressed(false)}
        onMouseLeave={() => setIsPressed(false)}
        onClick={() => {
            if (!isPressed) {
                setOpen(true);
                hapticLight();
            }
        }}
      >
        <AuroraCard
            className={cn(
                "relative flex flex-col justify-between p-5 cursor-pointer overflow-hidden group select-none touch-none",
                "min-h-[180px] rounded-[24px]",
                "bg-zinc-900/40 backdrop-blur-3xl",
                "ring-1 ring-white/10 ring-inset border border-white/5",
                "shadow-xl shadow-black/20",
                isPressed ? "scale-[0.98]" : "hover:bg-zinc-900/50 active:scale-[0.98]",
                "transition-all duration-200"
            )}
        >
             {/* Header */}
             <div className="flex justify-between items-start z-10">
                 <div>
                     <h3 className="text-lg font-bold text-white">{carName}</h3>
                     <div className="flex items-center gap-1 text-xs text-zinc-400 mt-0.5">
                         {carData.lock === "locked" ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3 text-red-400" />}
                         <span>{carData.lock === "locked" ? "Locked" : "Unlocked"}</span>
                         {carData.chargingstatus === 1 && <span className="text-emerald-400">• Charging</span>}
                     </div>
                 </div>
                 {/* Battery Ring */}
                 <div className="relative w-10 h-10 flex items-center justify-center">
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                          <path className="text-white/10" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                          <path 
                            className={cn("transition-all duration-1000", carData.soc! > 20 ? "text-emerald-500" : "text-red-500")} 
                            strokeDasharray={`${carData.soc}, 100`} 
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
                            fill="none" 
                            stroke="currentColor" 
                            strokeWidth="3" 
                          />
                      </svg>
                      <span className="absolute text-[10px] font-bold text-white">{carData.soc}%</span>
                 </div>
             </div>

             {/* Car Image (Tile View) */}
             <div className="absolute right-[-20px] bottom-[-20px] w-48 h-32 opacity-50 grayscale group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500">
                 <img src={carImage} className="w-full h-full object-cover mask-image-gradient" style={{ maskImage: 'linear-gradient(to top, black 50%, transparent 100%)' }} />
             </div>

             {/* Bottom Stats */}
             <div className="relative z-10 flex gap-4">
                 <div className="flex flex-col">
                     <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium">Range</span>
                     <span className="text-xl font-light text-white">{carData.rangeElectric} <span className="text-sm text-zinc-500">km</span></span>
                 </div>
             </div>
        </AuroraCard>
      </motion.div>

      {/* --- INSPECTOR DIALOG --- */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-zinc-900/95 backdrop-blur-3xl ring-1 ring-white/10 ring-inset border border-white/5 shadow-2xl sm:max-w-[800px] sm:rounded-[32px] p-0 overflow-hidden gap-0 max-h-[90vh] flex flex-col">
           <DialogHeader className="sr-only">
            <DialogTitle>{carName} Control</DialogTitle>
            <DialogDescription>Vehicle Status and Settings</DialogDescription>
          </DialogHeader>

          {/* HERO SECTION (Car Animation) */}
          <div className="relative h-[300px] w-full bg-gradient-to-b from-zinc-800/50 to-zinc-950 border-b border-white/5 overflow-hidden">
              {/* Background Elements */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-zinc-700/20 via-zinc-900/50 to-zinc-950" />
              
              {/* The 3D Car Sliding In */}
              <motion.div 
                style={{ x: carX, opacity: carOpacity }}
                className="absolute inset-0 flex items-center justify-center z-10"
              >
                  <img 
                    src={carImage} 
                    className="w-[90%] h-auto object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.8)]" 
                    alt="Car 3D"
                  />
                  {/* Reflective shine effect */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent opacity-0 animate-shine pointer-events-none" />
              </motion.div>

              {/* Floating Status Pills */}
              <div className="absolute top-6 left-6 flex gap-2 z-20">
                  <div className={cn(
                      "px-3 py-1.5 rounded-full backdrop-blur-md border flex items-center gap-2 transition-colors",
                      carData.lock === "locked" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-red-500/10 border-red-500/20 text-red-400"
                  )}>
                      {carData.lock === "locked" ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                      <span className="text-xs font-bold uppercase tracking-wider">{carData.lock}</span>
                  </div>
                  {carData.precondActive && (
                      <div className="px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 backdrop-blur-md flex items-center gap-2">
                          <Fan className="w-3 h-3 animate-spin" />
                          <span className="text-xs font-bold uppercase tracking-wider">AC ON</span>
                      </div>
                  )}
              </div>

              {/* Tab Switcher Floating at Bottom */}
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex bg-black/40 backdrop-blur-xl p-1 rounded-full border border-white/10 z-30">
                  {[
                      { id: "controls", icon: Car, label: "Controls" },
                      { id: "charging", icon: Zap, label: "Charge" },
                      { id: "climate", icon: Thermometer, label: "Climate" }
                  ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => { setActiveTab(tab.id as any); hapticLight(); }}
                        className={cn(
                            "px-4 py-2 rounded-full flex items-center gap-2 text-xs font-medium transition-all",
                            activeTab === tab.id ? "bg-white text-black shadow-lg" : "text-zinc-400 hover:text-white hover:bg-white/10"
                        )}
                      >
                          <tab.icon className="w-3 h-3" />
                          {tab.label}
                      </button>
                  ))}
              </div>
          </div>

          {/* CONTROL PANELS (Tabs) */}
          <div className="flex-1 bg-zinc-950/50 p-6 overflow-y-auto min-h-[300px]">
              <AnimatePresence mode="wait">
                  {/* --- CONTROLS TAB --- */}
                  {activeTab === "controls" && (
                      <motion.div 
                        key="controls"
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                        className="grid grid-cols-2 md:grid-cols-3 gap-4"
                      >
                          {/* Big Lock Button */}
                          <button 
                            onClick={toggleLock}
                            className="col-span-2 md:col-span-1 h-32 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 flex flex-col items-center justify-center gap-3 group transition-colors"
                          >
                              <div className={cn(
                                  "w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-[0_0_20px_rgba(0,0,0,0.5)]",
                                  carData.lock === "locked" ? "bg-emerald-500 text-white" : "bg-red-500 text-white"
                              )}>
                                  {carData.lock === "locked" ? <Lock className="w-6 h-6" /> : <Unlock className="w-6 h-6" />}
                              </div>
                              <span className="text-sm font-medium text-zinc-300 group-hover:text-white">
                                  {carData.lock === "locked" ? "Tap to Unlock" : "Tap to Lock"}
                              </span>
                          </button>

                          {/* Windows */}
                          <div className="col-span-1 p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col justify-between">
                               <div className="flex items-center gap-2 text-zinc-400">
                                   <Maximize2 className="w-4 h-4" />
                                   <span className="text-xs font-bold uppercase">Windows</span>
                               </div>
                               <div className="flex items-center justify-between mt-2">
                                   <span className="text-lg font-medium text-white">Closed</span>
                                   <button className="px-3 py-1 rounded-full bg-white/10 text-xs hover:bg-white/20 transition-colors">Vent</button>
                               </div>
                          </div>

                           {/* Sunroof */}
                           <div className="col-span-1 p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col justify-between">
                               <div className="flex items-center gap-2 text-zinc-400">
                                   <Wind className="w-4 h-4" />
                                   <span className="text-xs font-bold uppercase">Sunroof</span>
                               </div>
                               <div className="flex items-center justify-between mt-2">
                                   <span className="text-lg font-medium text-white">Closed</span>
                                   <button className="px-3 py-1 rounded-full bg-white/10 text-xs hover:bg-white/20 transition-colors">Open</button>
                               </div>
                          </div>

                          {/* Odometer */}
                          <div className="col-span-2 p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
                               <div className="flex items-center gap-3">
                                   <Gauge className="w-5 h-5 text-zinc-500" />
                                   <div className="flex flex-col">
                                       <span className="text-xs text-zinc-500">Odometer</span>
                                       <span className="text-xl font-mono text-white">{carData.odometer?.toLocaleString()} km</span>
                                   </div>
                               </div>
                               <div className="h-8 w-[1px] bg-white/10 mx-4" />
                               <div className="flex items-center gap-3">
                                   <MapPin className="w-5 h-5 text-zinc-500" />
                                   <div className="flex flex-col">
                                       <span className="text-xs text-zinc-500">Location</span>
                                       <span className="text-sm text-white truncate max-w-[120px]">Home Garage</span>
                                   </div>
                               </div>
                          </div>
                      </motion.div>
                  )}

                  {/* --- CHARGING TAB --- */}
                  {activeTab === "charging" && (
                      <motion.div 
                        key="charging"
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                        className="space-y-6"
                      >
                          <div className="flex items-center justify-between p-6 rounded-2xl bg-gradient-to-br from-emerald-900/20 to-zinc-900 border border-emerald-500/20">
                              <div>
                                  <span className="text-emerald-400 font-bold text-sm uppercase tracking-wider mb-1 block">Battery Level</span>
                                  <div className="flex items-baseline gap-2">
                                      <span className="text-5xl font-thin text-white">{carData.soc}%</span>
                                      <span className="text-zinc-400">{carData.rangeElectric} km</span>
                                  </div>
                              </div>
                              <div className="relative w-24 h-24">
                                  {/* Circular Progress reused or Icon */}
                                  <BatteryCharging className="w-16 h-16 text-emerald-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                              </div>
                          </div>

                          <div className="space-y-4">
                              <div className="flex justify-between text-sm">
                                  <span className="text-zinc-400">Charge Limit</span>
                                  <span className="text-white font-bold">{chargeLimit}%</span>
                              </div>
                              <Slider 
                                value={[chargeLimit]} 
                                onValueChange={(v) => { setChargeLimit(v[0]); hapticLight(); }} 
                                max={100} step={5} 
                                className="py-2"
                              />
                              <p className="text-xs text-zinc-500">Recommended 80% for daily use to preserve battery health.</p>
                          </div>

                          <button className="w-full py-4 rounded-xl bg-white text-black font-bold text-sm hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2">
                              <Zap className="w-4 h-4 fill-black" />
                              {carData.chargingstatus === 1 ? "Stop Charging" : "Start Charging"}
                          </button>
                      </motion.div>
                  )}

                  {/* --- CLIMATE TAB --- */}
                  {activeTab === "climate" && (
                      <motion.div 
                        key="climate"
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                        className="space-y-6"
                      >
                           <div className="flex items-center justify-between">
                               <h3 className="text-lg font-medium text-white">Preconditioning</h3>
                               <Switch checked={!!carData.precondActive} onCheckedChange={toggleClimate} />
                           </div>

                           {/* Temp Control */}
                           <div className="flex items-center justify-center gap-8 py-8">
                               <button 
                                onClick={() => setTargetTemp(t => t - 0.5)}
                                className="w-12 h-12 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white text-2xl flex items-center justify-center"
                               >
                                   -
                               </button>
                               <div className="flex flex-col items-center">
                                   <span className="text-5xl font-light text-white">{targetTemp}°</span>
                                   <span className="text-xs text-zinc-500 mt-1">Target Temperature</span>
                               </div>
                               <button 
                                onClick={() => setTargetTemp(t => t + 0.5)}
                                className="w-12 h-12 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white text-2xl flex items-center justify-center"
                               >
                                   +
                               </button>
                           </div>

                           {/* Tire Pressure (Moved to Climate/Service usually, putting here or creating new tab, user requested visualized car) */}
                           <div className="mt-8 border-t border-white/5 pt-6">
                               <h4 className="text-sm text-zinc-400 mb-4">Tire Pressure (kPa)</h4>
                               <TireWidget 
                                 fl={carData.tirepressureFrontLeft || 0} 
                                 fr={carData.tirepressureFrontRight || 0} 
                                 rl={carData.tirepressureRearLeft || 0} 
                                 rr={carData.tirepressureRearRight || 0} 
                               />
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
