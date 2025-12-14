import React from "react";
import { Slider } from "../ui/slider";
import { cn } from "../../lib/utils";

// Simplified Radix-based ControlSlider wrapper.
// Features:
// - Single value slider (horizontal or vertical)
// - Optional label, min/max labels, value display
// - formatValue + unit support
// - compact vs default spacing
// Intentionally omitted advanced original modes (start/end/cursor) and custom pointer logic.

export interface ControlSliderProps {
  value?: number;
  defaultValue?: number;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  label?: React.ReactNode;
  className?: string;
  trackClassName?: string;
  showValue?: boolean;
  formatValue?: (v: number) => React.ReactNode;
  unit?: string;
  hideRangeLabels?: boolean;
  onValueChange?: (value: number) => void;
  orientation?: "horizontal" | "vertical";
  variant?: "default" | "compact";
}

export const ControlSlider: React.FC<ControlSliderProps> = ({
  value,
  defaultValue,
  min = 0,
  max = 100,
  step = 1,
  disabled,
  label,
  className,
  trackClassName,
  showValue = true,
  formatValue,
  unit,
  hideRangeLabels,
  onValueChange,
  orientation = "horizontal",
  variant = "default",
}) => {
  const internal = value !== undefined ? [value] : undefined;
  const defaultArr = defaultValue !== undefined ? [defaultValue] : undefined;

  const handleChange = (vals: number[]) => {
    if (onValueChange) onValueChange(vals[0]);
  };

  const fmt = (v: number) => (formatValue ? formatValue(v) : `${v}${unit ? unit : ""}`);
  const vertical = orientation === "vertical";
  const compact = variant === "compact";
  const currentVal = value ?? defaultValue ?? min;

  return (
    <div
      className={cn(
        "flex w-full select-none",
        vertical ? "h-40 flex-col items-center justify-center" : "items-center",
        compact && !vertical && "gap-2",
        !compact && !vertical && "gap-3",
        className,
      )}
    >
      {label && (
        <div
          className={cn(
            "text-sm font-medium text-foreground/80",
            vertical ? "mb-2" : "min-w-0 flex-1",
          )}
        >
          {label}
        </div>
      )}
      <div
        className={cn(
          "flex",
          vertical ? "flex-col items-center" : "flex-1 items-center",
          compact && !vertical && "gap-1",
          !compact && !vertical && "gap-2",
        )}
      >
        <div
          className={cn(
            "relative flex",
            vertical ? "h-full w-8 flex-col justify-center" : "w-full flex-col",
          )}
        >
          <Slider
            value={internal}
            defaultValue={defaultArr}
            onValueChange={handleChange}
            max={max}
            min={min}
            step={step}
            disabled={disabled}
            orientation={orientation}
            className={cn(
              vertical
                ? "h-full w-8 data-[orientation=vertical]:flex-col"
                : "w-full",
              trackClassName,
            )}
          />
          {!hideRangeLabels && !vertical && (
            <div className="mt-1 flex w-full justify-between text-[10px] text-muted-foreground/70">
              <span>{min}</span>
              <span>{max}</span>
            </div>
          )}
        </div>
        {showValue && !vertical && (
          <div className="ml-1 min-w-[2.5rem] text-right text-xs tabular-nums text-foreground/80">
            {fmt(currentVal)}
          </div>
        )}
        {vertical && showValue && (
          <div className="mt-2 text-xs tabular-nums text-foreground/80">{fmt(currentVal)}</div>
        )}
      </div>
    </div>
  );
};

ControlSlider.displayName = "ControlSlider";

export default ControlSlider;
