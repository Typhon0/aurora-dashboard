import React, { useState, useMemo, useCallback, useRef, useEffect } from "react";
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
  Shield, ShieldAlert, ShieldCheck, Lock, Unlock,
  Bell, History, Settings, Check, X, Delete,
  Activity, AlertTriangle, Moon, Sun, Home
} from "lucide-react";
import { cn } from "../../lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import ReactECharts from "echarts-for-react";

interface AuroraAlarmCardProps {
  entityId: EntityName;
  className?: string;
  titleOverride?: string;
}

// --- Haptic Feedback Helpers ---
const hapticLight = () => {
  if (typeof navigator !== "undefined" && navigator.vibrate) {
    navigator.vibrate(10);
  }
};

const hapticMedium = () => {
  if (typeof navigator !== "undefined" && navigator.vibrate) {
    navigator.vibrate(20);
  }
};

const hapticSuccess = () => {
  if (typeof navigator !== "undefined" && navigator.vibrate) {
    navigator.vibrate([10, 30, 10]);
  }
};

const hapticError = () => {
  if (typeof navigator !== "undefined" && navigator.vibrate) {
    navigator.vibrate([100, 50, 100]);
  }
};

// --- State Configuration ---
const stateConfig = {
  disarmed: {
    label: "Désarmé",
    color: "zinc",
    icon: Unlock,
    gradient: "from-zinc-500/20 to-zinc-600/10",
    glow: "#71717A",
    description: "Système inactif",
  },
  armed_home: {
    label: "Armé (Maison)",
    color: "amber",
    icon: Home,
    gradient: "from-amber-500/20 to-yellow-500/10",
    glow: "#F59E0B",
    description: "Protection périmétrique",
  },
  armed_away: {
    label: "Armé (Absent)",
    color: "red",
    icon: ShieldCheck,
    gradient: "from-red-500/20 to-rose-500/10",
    glow: "#EF4444",
    description: "Protection complète",
  },
  armed_night: {
    label: "Armé (Nuit)",
    color: "indigo",
    icon: Moon,
    gradient: "from-indigo-500/20 to-blue-500/10",
    glow: "#6366F1",
    description: "Mode silencieux",
  },
  pending: {
    label: "En attente",
    color: "yellow",
    icon: Activity,
    gradient: "from-yellow-500/20 to-amber-500/10",
    glow: "#EAB308",
    description: "Sortie/Entrée en cours",
  },
  triggered: {
    label: "ALERTE",
    color: "red",
    icon: ShieldAlert,
    gradient: "from-red-500/30 to-red-600/20",
    glow: "#DC2626",
    description: "Intrusion détectée",
  },
  unavailable: {
    label: "Indisponible",
    color: "zinc",
    icon: AlertTriangle,
    gradient: "from-zinc-500/10 to-zinc-600/5",
    glow: "#52525B",
    description: "Erreur de connexion",
  },
};

// --- Mock History Data ---
const generateMockHistory = () => {
  const events = [];
  const now = Date.now();
  const actions = ["Armé (Absent)", "Désarmé", "Armé (Maison)", "Désarmé"];

  for (let i = 0; i < 10; i++) {
    const timestamp = now - (i * Math.floor(Math.random() * 40000000 + 3600000));
    const action = actions[i % actions.length];
    events.push({
      id: i,
      action,
      user: i % 3 === 0 ? "Automatique" : "Utilisateur",
      timestamp,
    });
  }
  return events;
};

// --- Keypad Component ---
const Keypad = ({ onKeyPress, onDelete, onClear }: { onKeyPress: (k: string) => void, onDelete: () => void, onClear: () => void }) => {
  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "C", "0", "back"];

  return (
    <div className="grid grid-cols-3 gap-3 w-full max-w-[280px] mx-auto">
      {keys.map((key) => (
        <motion.button
          key={key}
          whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.1)" }}
          whileTap={{ scale: 0.9 }}
          onClick={() => {
            if (key === "back") onDelete();
            else if (key === "C") onClear();
            else onKeyPress(key);
            hapticLight();
          }}
          className={cn(
            "h-16 w-16 rounded-full flex items-center justify-center text-xl font-medium transition-colors mx-auto",
            key === "back" || key === "C"
              ? "bg-transparent text-zinc-500 hover:text-zinc-300"
              : "bg-white/5 text-white hover:bg-white/10 border border-white/5 shadow-lg shadow-black/20"
          )}
        >
          {key === "back" ? <Delete className="w-6 h-6" /> : key}
        </motion.button>
      ))}
    </div>
  );
};

export const AuroraAlarmCard: React.FC<AuroraAlarmCardProps> = ({
  entityId,
  className,
  titleOverride,
}) => {
  let entity: any;
  try {
    entity = useEntity(entityId);
  } catch (e) {
    entity = {
      state: "disarmed",
      attributes: { friendly_name: titleOverride || "Home Alarm" }
    };
  }
  const alarm = useService("alarm_control_panel");

  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [activeTab, setActiveTab] = useState<"control" | "history" | "settings">("control");
  const [isPressed, setIsPressed] = useState(false);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  const state = (entity.state as string) || "unavailable";
  const config = stateConfig[state as keyof typeof stateConfig] || stateConfig.unavailable;
  const isArmed = state.includes("armed");
  const isTriggered = state === "triggered";

  const friendly = titleOverride || entity.attributes.friendly_name || "Alarme";

  // Reset state on close
  useEffect(() => {
    if (!open) {
      setCode("");
      setActiveTab("control");
    }
  }, [open]);

  // Handle Service Calls
  const handleAction = async (action: "alarmArmHome" | "alarmArmAway" | "alarmArmNight" | "alarmDisarm") => {
    try {
      // Simple validation (mock) - in real app, check if code matches
      if (code.length < 4 && action === "alarmDisarm") {
        toast.error("Code requis (4 chiffres)");
        hapticError();
        return;
      }

      const serviceData: Record<string, string> = {};
      if (code) serviceData.code = code;

      toast.loading("Traitement...", { id: entityId });

      // Call the service
      // @ts-ignore - Dynamic call
      await alarm[action]({ target: entityId, ...serviceData });

      toast.success("Commande envoyée", { id: entityId });
      hapticSuccess();
      setCode("");

      // Close dialog if disarming was successful (optimistic)
      if (action === "alarmDisarm") {
        setTimeout(() => setOpen(false), 500);
      }
    } catch (e: unknown) {
      toast.error("Échec de la commande", { id: entityId });
      hapticError();
    }
  };

  // Card Interaction Handlers
  const handleTouchStart = useCallback(() => {
    setIsPressed(true);
    hapticLight();
    longPressTimer.current = setTimeout(() => {
      hapticSuccess();
      setOpen(true);
      setIsPressed(false);
    }, 500);
  }, []);

  const handleTouchEnd = useCallback(() => {
    setIsPressed(false);
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const handleCardClick = useCallback(() => {
    hapticLight();
    setOpen(true);
  }, []);

  return (
    <>
      {/* --- TILE --- */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="relative h-full"
      >
        <AuroraCard
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onClick={handleCardClick}
          className={cn(
            "relative flex flex-col justify-between p-5 select-none cursor-pointer overflow-hidden group",
            "min-h-[180px] rounded-[24px]", // Matches Vacuum card
            "bg-zinc-900/40 backdrop-blur-3xl",
            "ring-1 ring-white/10 ring-inset",
            "border border-white/5",
            "shadow-xl shadow-black/20",
            isPressed ? "scale-[1.02]" : "hover:bg-zinc-900/50 active:scale-[0.98]",
            "transition-all duration-300",
            className
          )}
        >
          {/* Background Ambient Glow */}
          {(isArmed || isTriggered) && (
            <motion.div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `radial-gradient(circle at 80% 20%, ${config.glow}15, transparent 60%)`
              }}
              animate={{
                opacity: isTriggered ? [0.3, 0.7, 0.3] : 1,
              }}
              transition={{
                duration: isTriggered ? 1 : 0,
                repeat: isTriggered ? Infinity : 0,
              }}
            />
          )}

          <div className="flex justify-between items-start relative z-10">
            <motion.div
              className={cn(
                "w-11 h-11 rounded-[14px] flex items-center justify-center relative",
                "ring-1 ring-inset backdrop-blur-xl",
                isArmed || isTriggered
                  ? `bg-${config.color}-500/20 ring-${config.color}-500/30`
                  : "bg-white/5 ring-white/10"
              )}
              style={{
                backgroundColor: (isArmed || isTriggered) ? `${config.glow}20` : undefined,
                boxShadow: (isArmed || isTriggered) ? `0 0 20px ${config.glow}40` : undefined
              }}
            >
              <config.icon
                className={cn(
                  "w-5 h-5 relative z-10",
                  (isArmed || isTriggered) ? `text-${config.color}-400` : "text-zinc-400"
                )}
              />
            </motion.div>

            {/* Small Status Pill */}
            <div className={cn(
              "px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wide uppercase border",
              (isArmed || isTriggered)
                ? `bg-${config.color}-500/10 text-${config.color}-300 border-${config.color}-500/20`
                : "bg-zinc-800/50 text-zinc-400 border-white/5"
            )}>
              {isTriggered ? "ALERTE" : isArmed ? "ARMÉ" : "OFF"}
            </div>
          </div>

          {/* Center Visual - Shield Pulse */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10 group-hover:opacity-20 transition-opacity">
            <Shield className="w-32 h-32" />
          </div>

          {/* Bottom Info */}
          <div className="flex flex-col gap-1 relative z-10 mt-auto">
            <span className="text-xs font-medium text-zinc-500 tracking-wider uppercase">
              {friendly}
            </span>
            <span
              className="text-lg font-semibold leading-tight text-white/90"
              style={isArmed || isTriggered ? { color: config.glow } : {}}
            >
              {config.label}
            </span>
          </div>
        </AuroraCard>
      </motion.div>

      {/* --- INSPECTOR DIALOG --- */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-zinc-900/95 backdrop-blur-3xl ring-1 ring-white/10 ring-inset border border-white/5 shadow-2xl sm:max-w-[480px] sm:rounded-[28px] p-0 overflow-hidden gap-0">
          <DialogHeader className="sr-only">
            <DialogTitle>{friendly}</DialogTitle>
            <DialogDescription>Contrôle du système d'alarme</DialogDescription>
          </DialogHeader>

          {/* Dialog Header Area */}
          <div className="relative pt-8 pb-6 px-6 flex flex-col items-center justify-center border-b border-white/5 bg-black/20">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={cn(
                "w-24 h-24 rounded-full flex items-center justify-center mb-4 relative ring-1 ring-inset backdrop-blur-xl",
                `bg-${config.color}-500/10 ring-${config.color}-500/20`
              )}
              style={{ boxShadow: `0 0 40px ${config.glow}30` }}
            >
              <config.icon className={cn("w-10 h-10", `text-${config.color}-400`)} />
            </motion.div>
            <h2 className="text-xl font-semibold text-white tracking-tight">{config.label}</h2>
            <p className="text-sm text-zinc-500 mt-1">{config.description}</p>
          </div>

          {/* Tabs Navigation */}
          <div className="flex p-1 mx-6 my-4 bg-zinc-800/50 rounded-xl border border-white/5">
            <button
              onClick={() => setActiveTab("control")}
              className={cn("flex-1 py-2 text-xs font-medium rounded-lg transition-all", activeTab === "control" ? "bg-zinc-700 text-white shadow-sm" : "text-zinc-400 hover:text-zinc-200")}
            >
              Contrôle
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={cn("flex-1 py-2 text-xs font-medium rounded-lg transition-all", activeTab === "history" ? "bg-zinc-700 text-white shadow-sm" : "text-zinc-400 hover:text-zinc-200")}
            >
              Historique
            </button>
            <button
              onClick={() => setActiveTab("settings")}
              className={cn("flex-1 py-2 text-xs font-medium rounded-lg transition-all", activeTab === "settings" ? "bg-zinc-700 text-white shadow-sm" : "text-zinc-400 hover:text-zinc-200")}
            >
              Réglages
            </button>
          </div>

          {/* Main Content Area */}
          <div className="px-6 pb-8 min-h-[320px] flex flex-col">
            <AnimatePresence mode="wait">
              {activeTab === "control" && (
                <motion.div
                  key="control"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex flex-col h-full justify-between"
                >
                  {/* Code Display */}
                  <div className="flex justify-center mb-6 h-12 items-center">
                    <div className="flex gap-4">
                      {[0, 1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className={cn(
                            "w-4 h-4 rounded-full transition-all duration-200",
                            code.length > i
                              ? "bg-white scale-110 shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                              : "bg-zinc-700 border border-white/5"
                          )}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Keypad */}
                  <div className="mb-6">
                    <Keypad
                      onKeyPress={(k) => {
                        if (code.length < 4) setCode(prev => prev + k);
                      }}
                      onDelete={() => setCode(prev => prev.slice(0, -1))}
                      onClear={() => setCode("")}
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-3 gap-3 mt-auto">
                    {isArmed ? (
                      <button
                        onClick={() => handleAction("alarmDisarm")}
                        disabled={code.length !== 4} // Require code for disarm example
                        className={cn(
                          "col-span-3 py-3 rounded-[16px] font-semibold text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2",
                          code.length === 4
                            ? "bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.4)] hover:bg-red-600"
                            : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                        )}
                      >
                        <Unlock className="w-4 h-4" />
                        Désarmer
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => handleAction("alarmArmHome")}
                          className="py-3 px-2 rounded-[16px] bg-zinc-800 hover:bg-zinc-700 text-white border border-white/5 font-medium text-xs flex flex-col items-center gap-1 transition-all active:scale-[0.98]"
                        >
                          <Home className="w-4 h-4 text-amber-400" />
                          Maison
                        </button>
                        <button
                          onClick={() => handleAction("alarmArmAway")}
                          className="py-3 px-2 rounded-[16px] bg-zinc-800 hover:bg-zinc-700 text-white border border-white/5 font-medium text-xs flex flex-col items-center gap-1 transition-all active:scale-[0.98]"
                        >
                          <ShieldCheck className="w-4 h-4 text-emerald-400" />
                          Absent
                        </button>
                        <button
                          onClick={() => handleAction("alarmArmNight")}
                          className="py-3 px-2 rounded-[16px] bg-zinc-800 hover:bg-zinc-700 text-white border border-white/5 font-medium text-xs flex flex-col items-center gap-1 transition-all active:scale-[0.98]"
                        >
                          <Moon className="w-4 h-4 text-indigo-400" />
                          Nuit
                        </button>
                      </>
                    )}
                  </div>
                </motion.div>
              )}

              {activeTab === "history" && (
                <motion.div
                  key="history"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <History className="w-4 h-4 text-zinc-400" />
                    <span className="text-sm font-medium text-zinc-300">Derniers événements</span>
                  </div>

                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {generateMockHistory().map((event, i) => (
                      <div
                        key={event.id}
                        className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center">
                            {event.action.includes("Désarmé") ? (
                              <Unlock className="w-4 h-4 text-zinc-400" />
                            ) : (
                              <ShieldCheck className="w-4 h-4 text-emerald-400" />
                            )}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-zinc-200">{event.action}</span>
                            <span className="text-[10px] text-zinc-500">{event.user}</span>
                          </div>
                        </div>
                        <span className="text-xs text-zinc-500 tabular-nums">
                          {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {activeTab === "settings" && (
                <motion.div
                  key="settings"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center h-full text-zinc-500 gap-4 py-12"
                >
                  <Settings className="w-12 h-12 opacity-20" />
                  <p className="text-sm text-center max-w-[200px]">
                    Les paramètres avancés de l'alarme sont gérés par Home Assistant.
                  </p>
                  <button className="px-4 py-2 rounded-lg bg-white/5 text-zinc-400 text-xs hover:bg-white/10 transition-colors">
                    Ouvrir Home Assistant
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
