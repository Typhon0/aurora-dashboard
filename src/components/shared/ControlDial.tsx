import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { cn } from "@/lib/utils";
import { computeSnapped } from "@/utils/dial";

export interface ControlDialProps {
  value: number; // 0-100
  onChange?: (value: number) => void;
  onCommit?: (value: number) => void;
  size?: number; // px
  thickness?: number; // stroke thickness
  className?: string;
  trackColor?: string;
  progressColor?: string;
  glow?: boolean;
  label?: string;
  disabled?: boolean;
  children?: React.ReactNode; // custom center content
  springStrength?: number; // 0..1 smaller = slower follow
  displayFormatter?: (value: number) => string; // central numeric formatting
  step?: number; // snap interval (percent units)
  snap?: boolean; // enable snapping while dragging / keyboard
  onSnap?: (value: number) => void; // fired when snapped boundary crossed
  haptics?: boolean; // vibrate on snap (best-effort)
  tickStep?: number; // interval for tick marks (percent units)
  tickColor?: string;
  tickSize?: number; // length in px
  tickMinorStep?: number; // secondary ticks
  tickMinorSize?: number;
  tickMinorColor?: string;
  highlightActiveTicks?: boolean; // disable to keep uniform tick weight
  inertia?: boolean; // enable fling inertia
  inertiaThreshold?: number; // minimum velocity (percent per second) to trigger inertia
  inertiaFriction?: number; // 0..1 fraction of velocity retained each frame (closer to 1 = longer)
  inertiaMaxDuration?: number; // ms cap
  onInertiaStart?: () => void;
  onInertiaEnd?: () => void;
  inertiaMode?: 'reflect' | 'clamp' | 'overshoot';
  overshootLimit?: number; // percent beyond 0..100 when overshoot mode
  edgeGlow?: boolean;
  edgeGlowColor?: string;
  edgeGlowDuration?: number; // ms
}

export const ControlDial = ({
  value,
  onChange,
  onCommit,
  size = 140,
  thickness = 10,
  className,
  trackColor = "rgba(255,255,255,0.15)",
  progressColor = "#ffffff",
  glow = true,
  label,
  disabled,
  children,
  springStrength = 0.18,
  displayFormatter,
  step = 1,
  snap = true,
  onSnap,
  haptics = false,
  tickStep,
  tickColor = "rgba(255,255,255,0.35)",
  tickSize = 6,
  tickMinorStep,
  tickMinorSize = 3,
  tickMinorColor = "rgba(255,255,255,0.25)",
  highlightActiveTicks = true,
  inertia = true,
  inertiaThreshold = 120, // pct / sec
  inertiaFriction = 0.92,
  inertiaMaxDuration = 1200,
  onInertiaStart,
  onInertiaEnd,
  inertiaMode = 'reflect',
  overshootLimit = 8,
  edgeGlow = true,
  edgeGlowColor = 'rgba(255,255,255,0.6)',
  edgeGlowDuration = 260,
}: ControlDialProps) => {
  const clamped = Math.min(100, Math.max(0, value));
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;
  const ref = useRef<HTMLDivElement | null>(null);
  const dragging = useRef(false);
  const [internal, setInternal] = useState(clamped);
  const targetRef = useRef(clamped);
  const rafRef = useRef<number | null>(null);
  const lastSnapRef = useRef<number | null>(null);
  const liveRegionRef = useRef<HTMLDivElement | null>(null);
  const velocitySamples = useRef<Array<{t:number; v:number}>>([]); // time,value
  const inertiaActive = useRef(false);
  const inertiaRaf = useRef<number | null>(null);
  const inertiaStartTime = useRef<number>(0);
  const edgeGlowState = useRef<{t:number; side:'min'|'max'|null}>({ t:0, side:null });
  const triggerEdge = (side:'min'|'max') => {
    if (!edgeGlow) return;
    edgeGlowState.current = { t: performance.now(), side };
  };
  const majorTicks = useMemo(() => {
    if (!tickStep || tickStep <= 0 || tickStep >= 100) return null;
    return Array.from({ length: Math.floor(100 / tickStep) + 1 }).map((_, i) => {
      const pct = i * tickStep;
      const angle = (pct / 100) * 360 - 90;
      const rad = (angle * Math.PI) / 180;
      const ir = radius - thickness / 2 - 2;
      const or = ir - tickSize;
      const x1 = size / 2 + Math.cos(rad) * ir;
      const y1 = size / 2 + Math.sin(rad) * ir;
      const x2 = size / 2 + Math.cos(rad) * or;
      const y2 = size / 2 + Math.sin(rad) * or;
      const active = pct <= internal + 0.0001;
      return { pct, x1, y1, x2, y2, active };
    });
  }, [tickStep, size, radius, thickness, tickSize, internal]);
  const minorTicks = useMemo(() => {
    if (!tickMinorStep || tickMinorStep <= 0 || tickMinorStep >= 100) return null;
    // Avoid duplicating major ticks
    const majors = new Set(majorTicks?.map(t => t.pct));
    return Array.from({ length: Math.floor(100 / tickMinorStep) + 1 }).map((_, i) => {
      const pct = i * tickMinorStep;
      if (majors.has(pct)) return null;
      const angle = (pct / 100) * 360 - 90;
      const rad = (angle * Math.PI) / 180;
      const ir = radius - thickness / 2 - 2;
      const or = ir - tickMinorSize;
      const x1 = size / 2 + Math.cos(rad) * ir;
      const y1 = size / 2 + Math.sin(rad) * ir;
      const x2 = size / 2 + Math.cos(rad) * or;
      const y2 = size / 2 + Math.sin(rad) * or;
      const active = pct <= internal + 0.0001;
      return { pct, x1, y1, x2, y2, active };
    }).filter(Boolean) as typeof majorTicks;
  }, [tickMinorStep, majorTicks, radius, thickness, tickMinorSize, size, internal]);

  // Spring-like interpolation when external value changes.
  useEffect(() => {
    if (dragging.current) return; // while dragging we follow pointer directly
    // interrupt inertia if external driver jumps far
    if (inertiaActive.current && Math.abs(clamped - targetRef.current) > 3) {
      if (inertiaRaf.current) cancelAnimationFrame(inertiaRaf.current);
      inertiaRaf.current = null;
      inertiaActive.current = false;
      onInertiaEnd?.();
    }
    targetRef.current = clamped;
    if (rafRef.current) return; // loop already running
    const tick = () => {
      const current = internal;
      const target = targetRef.current;
      const diff = target - current;
      const speed = Math.min(1, Math.max(0.01, springStrength));
      const next = Math.abs(diff) < 0.1 ? target : current + diff * speed;
      if (next !== current) setInternal(next);
      if (Math.abs(diff) > 0.1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        rafRef.current = null;
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [clamped, internal, springStrength, onInertiaEnd]);

  // Sync if value jumps externally while idle.
  useEffect(() => {
    if (!dragging.current) setInternal(clamped);
  }, [clamped]);

  const snapValue = useCallback((pct: number, committing: boolean) => {
    const { value: snapped, changed } = computeSnapped(pct, lastSnapRef.current, { snap, step, onSnap });
    if (changed) {
      lastSnapRef.current = snapped;
      if (haptics && typeof window !== "undefined") {
        const nav = navigator as Navigator & { vibrate?: (pattern: number | number[]) => void };
        nav.vibrate?.(committing ? 15 : 8);
      }
      const lr = liveRegionRef.current;
      if (lr) lr.textContent = `${Math.round(snapped)} percent`;
    }
    return snapped;
  }, [snap, step, onSnap, haptics]);

  const updateFromEvent = useCallback(
    (clientX: number, clientY: number, commit = false) => {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = clientX - cx;
      const dy = clientY - cy;
      let angle = Math.atan2(dy, dx); // -PI..PI
      angle = (angle * 180) / Math.PI; // to degrees
      angle = (angle + 450) % 360; // start at top (0) going clockwise
      let pct = Math.min(100, Math.max(0, (angle / 360) * 100));
      pct = snapValue(pct, commit);
      if (dragging.current) {
        setInternal(pct);
        onChange?.(pct);
        // velocity capture
        if (inertia) {
          const now = performance.now();
            velocitySamples.current.push({ t: now, v: pct });
            // keep last 120ms window
            const cutoff = now - 120;
            while (velocitySamples.current.length > 2 && velocitySamples.current[0].t < cutoff) {
              velocitySamples.current.shift();
            }
        }
      } else {
        targetRef.current = pct;
      }
      if (commit) {
        targetRef.current = pct;
        onCommit?.(pct);
      }
    },
    [onChange, onCommit, snapValue, inertia]
  );

  const onPointerDown = (e: React.PointerEvent) => {
    if (disabled) return;
    dragging.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    velocitySamples.current = [];
    updateFromEvent(e.clientX, e.clientY);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    updateFromEvent(e.clientX, e.clientY);
  };
  const onPointerUp = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    dragging.current = false;
    updateFromEvent(e.clientX, e.clientY, true);

    if (inertia) {
      const samples = velocitySamples.current;
      if (samples.length >= 2) {
        const first = samples[0];
        const last = samples[samples.length - 1];
        const dt = (last.t - first.t) / 1000; // seconds
        if (dt > 0) {
          let velocity = (last.v - first.v) / dt; // pct per second
          const absV = Math.abs(velocity);
          if (absV >= inertiaThreshold) {
            inertiaActive.current = true;
            onInertiaStart?.();
            inertiaStartTime.current = performance.now();
            const startValue = last.v;
            let currentValue = startValue;
            const stepInertia = () => {
              const now = performance.now();
              const elapsed = now - inertiaStartTime.current;
              velocity *= inertiaFriction;
              currentValue += (velocity / 60);
              if (inertiaMode === 'reflect') {
                if (currentValue < 0) { currentValue = 0; velocity = -velocity * 0.4; triggerEdge('min'); }
                else if (currentValue > 100) { currentValue = 100; velocity = -velocity * 0.4; triggerEdge('max'); }
              } else if (inertiaMode === 'clamp') {
                if (currentValue < 0) { currentValue = 0; velocity = 0; triggerEdge('min'); }
                if (currentValue > 100) { currentValue = 100; velocity = 0; triggerEdge('max'); }
              } else if (inertiaMode === 'overshoot') {
                if (currentValue < -overshootLimit) { currentValue = -overshootLimit; velocity = 0; }
                if (currentValue > 100 + overshootLimit) { currentValue = 100 + overshootLimit; velocity = 0; }
                if (currentValue < 0) {
                  const spring = (0 - currentValue) * 0.12;
                  velocity += spring;
                  if (Math.abs(currentValue) < 0.2 && Math.abs(velocity) < 5) { currentValue = 0; triggerEdge('min'); }
                } else if (currentValue > 100) {
                  const spring = (100 - currentValue) * 0.12;
                  velocity += spring;
                  if (Math.abs(currentValue - 100) < 0.2 && Math.abs(velocity) < 5) { currentValue = 100; triggerEdge('max'); }
                }
              }
              const snapped = snapValue(currentValue, false);
              setInternal(snapped);
              onChange?.(snapped);
              targetRef.current = snapped;
              const stillEnergy = Math.abs(velocity) > 5; // pct/sec
              const withinTime = elapsed < inertiaMaxDuration;
              if (stillEnergy && withinTime) {
                inertiaRaf.current = requestAnimationFrame(stepInertia);
              } else {
                inertiaActive.current = false;
                onCommit?.(snapped);
                onInertiaEnd?.();
              }
            };
            inertiaRaf.current = requestAnimationFrame(stepInertia);
          }
        }
      }
    }
  };

  return (
    <div
      ref={ref}
      className={cn("relative select-none touch-none", className)}
      style={{ width: size, height: size }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      role="slider"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(internal)}
      aria-valuetext={
        displayFormatter ? displayFormatter(Math.round(internal)) : `${Math.round(internal)} percent`
      }
      aria-label={label || "Dial"}
      tabIndex={0}
      onKeyDown={(e) => {
        if (disabled) return;
        const interval = Math.max(0.1, step);
        let delta = interval;
        if (e.shiftKey) delta *= 5;
        let next = internal;
        if (e.key === "ArrowUp" || e.key === "ArrowRight") next = Math.min(100, internal + delta);
        if (e.key === "ArrowDown" || e.key === "ArrowLeft") next = Math.max(0, internal - delta);
        if (next !== internal) {
          next = snap ? snapValue(next, true) : next;
          setInternal(next);
          onChange?.(next);
          onCommit?.(next);
        }
      }}
    >
      <svg width={size} height={size} className="block">
        {edgeGlow && (() => {
          const now = typeof performance !== 'undefined' ? performance.now() : 0;
          const age = now - edgeGlowState.current.t;
          if (edgeGlowState.current.side && age < edgeGlowDuration) {
            const alpha = 1 - age / edgeGlowDuration;
            const spread = 6 + (1 - alpha) * 14; // expand
            return (
              <circle
                cx={size/2}
                cy={size/2}
                r={radius + spread}
                fill="none"
                stroke={edgeGlowColor}
                strokeWidth={2}
                strokeOpacity={alpha * 0.6}
              />
            );
          }
          return null;
        })()}
        {minorTicks && (
          <g>
            {minorTicks.map(t => (
              <line
                key={`m-${t.pct}`}
                x1={t.x1}
                y1={t.y1}
                x2={t.x2}
                y2={t.y2}
                stroke={tickMinorColor}
                strokeWidth={1}
                strokeOpacity={t.active ? 0.55 : 0.3}
                strokeLinecap="round"
              />
            ))}
          </g>
        )}
        {majorTicks && (
          <g>
            {majorTicks.map(t => (
              <line
                key={t.pct}
                x1={t.x1}
                y1={t.y1}
                x2={t.x2}
                y2={t.y2}
                stroke={tickColor}
                strokeWidth={highlightActiveTicks && t.active ? 2 : 1}
                strokeOpacity={highlightActiveTicks && t.active ? 0.9 : 0.5}
                strokeLinecap="round"
              />
            ))}
          </g>
        )}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor}
          strokeWidth={thickness}
          fill="none"
          strokeLinecap="round"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={progressColor}
          strokeWidth={thickness}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: dragging.current ? "none" : "stroke-dashoffset 160ms linear" }}
          className={glow ? "drop-shadow-[0_0_6px_rgba(255,255,255,0.6)]" : undefined}
        />
        {(() => {
          const angle = (internal / 100) * 360 - 90;
          const rad = (angle * Math.PI) / 180;
          const kx = size / 2 + Math.cos(rad) * radius;
          const ky = size / 2 + Math.sin(rad) * radius;
          return (
            <circle
              cx={kx}
              cy={ky}
              r={thickness * 0.75}
              fill={progressColor}
              className={glow ? "shadow-lg" : undefined}
            />
          );
        })()}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
        {children ? (
          children
        ) : (
          <>
            <div className="text-xs tracking-wide uppercase opacity-60">{label || "Brightness"}</div>
            <div className="text-2xl font-semibold tabular-nums">
              {displayFormatter ? displayFormatter(internal) : `${Math.round(internal)}%`}
            </div>
          </>
        )}
      </div>
      {/* aria-live region for snap announcements */}
      <div
        ref={liveRegionRef}
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />
    </div>
  );
};

ControlDial.displayName = "ControlDial";

export default ControlDial;