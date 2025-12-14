import { useCallback, useState } from "react";
import { useEntity, useService, type EntityName } from "@hakit/core";
import { AuroraCard } from "./base/AuroraCard";
import { Sparkles, Play } from "lucide-react";
import { toast } from "sonner";
import { cn } from "../../lib/utils";

interface Props {
  entityId: EntityName;
  title?: string;
  className?: string;
  icon?: React.ComponentType<{ className?: string }>;
  color?: string;
}

export function AuroraSceneCard({
  entityId,
  title,
  className,
  icon: CustomIcon,
  color = "bg-amber-500" // Default Scene Color
}: Props) {
  const entity = useEntity(entityId);
  const scene = useService("scene");
  const name = title || entity.attributes.friendly_name || "Scene";

  const [isActive, setIsActive] = useState(false);

  const Icon = CustomIcon || Sparkles;

  const activate = useCallback(async () => {
    try {
      setIsActive(true);
      // Haptic feedback if available
      if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(10);

      await scene.turnOn({ target: entityId });
      toast.success(`Scène "${name}" activée`, {
        position: "top-center",
        style: { background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', color: 'white', border: 'none' }
      });

      // Reset active state animation after a moment
      setTimeout(() => setIsActive(false), 1000);
    } catch (e: any) {
      toast.error("Échec de l'activation");
      setIsActive(false);
    }
  }, [scene, entityId, name]);

  return (
    <AuroraCard
      onClick={activate}
      className={cn(
        "group relative cursor-pointer overflow-hidden flex flex-col p-4 justify-between transition-all duration-300",
        "h-full rounded-[24px]",
        "bg-zinc-900/40 backdrop-blur-3xl",
        "ring-1 ring-white/10 ring-inset",
        "border border-white/5",
        "shadow-xl shadow-black/20",
        "hover:bg-zinc-900/50 active:scale-[0.98]",
        className
      )}
    >
      {/* Active Flash Background */}
      <div
        className={cn(
          "absolute inset-0 transition-opacity duration-700 pointer-events-none",
          isActive ? "opacity-100" : "opacity-0"
        )}
        style={{ background: "radial-gradient(circle at center, rgba(255,255,255,0.2), transparent 70%)" }}
      />

      {/* Icon Circle */}
      <div className={cn(
        "w-10 h-10 rounded-full flex items-center justify-center text-white shadow-lg transition-transform duration-500 group-hover:scale-110",
        color,
        isActive && "animate-pulse scale-110"
      )}>
        <Icon className="w-5 h-5 fill-current" />
      </div>

      {/* Info */}
      <div className="flex flex-col gap-0.5 z-10">
        <span className="text-[15px] font-semibold text-white leading-tight line-clamp-2">
          {name}
        </span>
        <span className={cn(
          "text-xs font-medium text-white/50 transition-colors",
          isActive ? "text-amber-400" : ""
        )}>
          {isActive ? "Activée" : "Scène"}
        </span>
      </div>

      {/* Play Overlay Icon (Optional, appears on hover) */}
      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-x-2 group-hover:translate-x-0">
        <Play className="w-4 h-4 text-white/30 fill-white/30" />
      </div>
    </AuroraCard>
  );
}
