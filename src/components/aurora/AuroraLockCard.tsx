import React, {
  useCallback,
  useRef,
  useState,
  useEffect,
  useMemo,
} from "react";
import {
  useEntity,
  useService,
  type EntityName,
} from "@hakit/core";
import { Card } from "../ui/card";
import {
  Lock,
  Unlock,
  Fence,
  Warehouse,
  CarFront,
  Baby,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "../../lib/utils";

type LockVariant =
  | "default"
  | "gate"
  | "garage"
  | "car"
  | "child";

interface Props {
  entityId: EntityName;
  className?: string;
  titleOverride?: string;
  variant?: LockVariant;
}

export const AuroraLockCard: React.FC<Props> = ({
  entityId,
  className,
  titleOverride,
  variant,
}) => {
  const entity = useEntity(entityId);
  const lockSvc = useService("lock");

  // Detect variant if not provided
  const detectedVariant = useMemo((): LockVariant => {
    if (variant) return variant;
    const deviceClass = entity.attributes.device_class;
    if (deviceClass === "garage") return "garage";
    if (deviceClass === "gate") return "gate";
    if (entityId.includes("garage")) return "garage";
    if (entityId.includes("gate")) return "gate";
    if (entityId.includes("car") || entityId.includes("tesla"))
      return "car";
    if (entityId.includes("child") || entityId.includes("kid"))
      return "child";
    return "default";
  }, [variant, entity.attributes.device_class, entityId]);

  // State
  const isLocked =
    entity.state === "locked" ||
    entity.state === "closed" ||
    entity.state === "off";
  const isUnlocked = !isLocked;

  // Interaction State
  const [isPressed, setIsPressed] = useState(false);
  const [progress, setProgress] = useState(0);
  const requestRef = useRef<number>();
  const startTimeRef = useRef<number>();

  // Constants
  const PRESS_DURATION = 600; // 0.6s

  // Battery info
  const batteryLevel = entity.attributes.battery_level as
    | number
    | undefined;

  const toggle = useCallback(async () => {
    // Haptic feedback
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(50);
    }

    try {
      toast.loading(isLocked ? "Opening..." : "Closing...", {
        id: entityId,
        duration: 1000,
      });

      // Support for simple locks
      if (isLocked) await lockSvc.unlock({ target: entityId });
      else await lockSvc.lock({ target: entityId });

      toast.success(isLocked ? "Opened" : "Closed", {
        id: entityId,
        duration: 2000,
      });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Failed";
      toast.error(message, { id: entityId });
    }
  }, [lockSvc, entityId, isLocked]);

  const cancelAnimation = () => {
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
      requestRef.current = undefined;
    }
  };

  const animate = useCallback((time: number) => {
    if (startTimeRef.current === undefined) {
      startTimeRef.current = time;
    }
    const elapsed = time - startTimeRef.current;

    if (elapsed >= PRESS_DURATION) {
      toggle();
      setIsPressed(false);
      setProgress(0);
      cancelAnimation();
      return;
    }

    const newProgress = Math.min(100, (elapsed / PRESS_DURATION) * 100);
    setProgress(newProgress);
    requestRef.current = requestAnimationFrame(animate);
  }, [toggle, PRESS_DURATION]);

  const handlePressStart = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      // Prevent default if touch to avoid scrolling and ghost clicks
      if ('touches' in e) {
        // e.preventDefault(); // We handle this via touch-action: none in CSS to allow scrolling on non-active areas if needed, but for the button we want to block.
        // However, to strictly prevent ghost mouse events:
        // e.preventDefault(); 
      }

      cancelAnimation();
      setIsPressed(true);
      setProgress(0);
      startTimeRef.current = undefined;
      requestRef.current = requestAnimationFrame(animate);
    },
    [animate],
  );

  const handlePressEnd = useCallback(() => {
    cancelAnimation();
    setIsPressed(false);
    setProgress(0);
  }, []);

  useEffect(() => {
    return () => cancelAnimation();
  }, []);

  // Icon Selection
  const renderIcon = () => {
    const iconProps = {
      className: cn(
        "w-5 h-5 transition-colors duration-300",
        isUnlocked ? "text-amber-500" : "text-zinc-400",
      ),
    };

    switch (detectedVariant) {
      case "gate":
        return <Fence {...iconProps} />;
      case "garage":
        return <Warehouse {...iconProps} />;
      case "car":
        return <CarFront {...iconProps} />;
      case "child":
        return <Baby {...iconProps} />;
      default:
        return isUnlocked ? (
          <Unlock {...iconProps} />
        ) : (
          <Lock {...iconProps} />
        );
    }
  };

  const getStatusText = () => {
    if (
      detectedVariant === "default" ||
      detectedVariant === "child"
    ) {
      return isUnlocked ? "Ouvert" : "Verrouillé";
    }
    return isUnlocked ? "Ouvert" : "Fermé";
  };

  const getSecondaryText = () => {
    if (batteryLevel) return `Batterie ${batteryLevel}%`;
    switch (detectedVariant) {
      case "gate":
        return "Portail";
      case "garage":
        return "Garage";
      case "car":
        return "Véhicule";
      case "child":
        return "Sécurité";
      default:
        return "Smart Lock";
    }
  };

  return (
    <Card
      className={cn(
        "group relative flex flex-col h-full justify-between overflow-hidden p-4 select-none touch-none transition-all duration-300",
        "rounded-[24px]",
        "bg-zinc-900/40 backdrop-blur-3xl",
        "ring-1 ring-white/10 ring-inset",
        "border border-white/5",
        "shadow-xl shadow-black/20",
        "hover:bg-zinc-900/50 active:scale-[0.98]",
        className,
      )}
      onMouseDown={handlePressStart}
      onMouseUp={handlePressEnd}
      onMouseLeave={handlePressEnd}
      onTouchStart={handlePressStart}
      onTouchEnd={handlePressEnd}
      onTouchCancel={handlePressEnd}
      onContextMenu={(e) => e.preventDefault()}
    >
      {isUnlocked && (
        <div
          className="absolute inset-0 opacity-20 pointer-events-none transition-opacity duration-500"
          style={{
            background:
              "radial-gradient(circle at top left, rgba(245, 158, 11, 0.15), transparent 60%)",
          }}
        />
      )}

      <div className="relative z-10 flex items-start justify-between">
        <div className="relative w-10 h-10">
          <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none" viewBox="0 0 40 40">
            <circle
              cx="20"
              cy="20"
              r="18"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-white transition-all duration-75 ease-linear"
              style={{
                strokeDasharray: 113,
                strokeDashoffset: 113 - (113 * progress) / 100,
                opacity: isPressed ? 1 : 0,
              }}
            />
          </svg>

          <div className="absolute inset-0.5 rounded-full flex items-center justify-center bg-white/10 transition-colors duration-300">
            {renderIcon()}
          </div>
        </div>

        <span className="text-[10px] font-bold uppercase tracking-wider text-white/40 pt-1">
          {getStatusText()}
        </span>
      </div>

      <div className="relative z-10 mt-auto">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-white text-[15px] leading-snug line-clamp-1 tracking-wide">
            {titleOverride ||
              entity.attributes.friendly_name ||
              "Appareil"}
          </h3>
          {isUnlocked && (
            <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
          )}
        </div>

        <p className="text-xs font-medium text-white/30 mt-0.5">
          {getSecondaryText()}
        </p>
      </div>
    </Card>
  );
};
