import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "../../utils/cn";
import { Power, PowerOff } from "lucide-react";

export interface ControlToggleProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  disabled?: boolean;
  vertical?: boolean;
  reversed?: boolean;
  checked?: boolean;
  thickness?: number; // px size basis
  onIcon?: React.ReactNode;
  offIcon?: React.ReactNode;
  onChange?: (checked: boolean) => void;
  color?: string; // css color for active
  onLabel?: string;
  offLabel?: string;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg"; // affects knob rounding and font
}

export function ControlToggle({
  disabled = false,
  vertical = true,
  reversed = false,
  thickness = 100,
  checked: controlled,
  onIcon,
  offIcon,
  onChange,
  className,
  color,
  onLabel = "On",
  offLabel = "Off",
  showLabel = false,
  size = "md",
  ...rest
}: ControlToggleProps) {
  const isControlled = controlled !== undefined;
  const [internal, setInternal] = useState<boolean>(controlled ?? false);
  const checked = isControlled ? (controlled as boolean) : internal;
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
  if (isControlled) setInternal(controlled as boolean);
  }, [controlled, isControlled]);

  const toggle = useCallback(() => {
    if (disabled) return;
    const next = !checked;
    if (!isControlled) setInternal(next);
    onChange?.(next);
  }, [checked, disabled, isControlled, onChange]);

  const orientationClasses = vertical
    ? "w-[var(--size)] h-[45vh] max-h-[320px] min-h-[200px]"
    : "h-[var(--size)] max-w-[420px] min-w-[320px] w-full";

  const sizeClasses =
    size === "sm"
      ? "text-xs"
      : size === "lg"
      ? "text-base"
      : "text-sm";

  return (
    <div
      ref={ref}
      role="switch"
      aria-checked={checked}
      tabIndex={disabled ? -1 : 0}
      onClick={toggle}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          toggle();
        }
      }}
      style={{
        ...(rest.style || {}),
        ["--size" as unknown as string]: `${thickness}px`,
        ["--color" as unknown as string]: color || "hsl(var(--primary))",
      }}
      className={cn(
        "group relative select-none outline-none cursor-pointer",
        "transition-shadow focus-visible:ring-2 ring-offset-0 ring-[--color] rounded-xl",
        disabled && "opacity-50 cursor-not-allowed",
        orientationClasses,
        reversed && vertical && "flex flex-col-reverse",
        reversed && !vertical && "flex-row-reverse",
        className,
      )}
      {...rest}
    >
      <div
        className={cn(
          "relative h-full w-full flex overflow-hidden rounded-xl p-1",
          "before:absolute before:inset-0 before:opacity-20 before:bg-[--color] before:transition-colors",
          "surface-glass",
          vertical ? "flex-col" : "flex-row",
          reversed && vertical && "flex-col-reverse",
          reversed && !vertical && "flex-row-reverse",
        )}
      >
        <div
          className={cn(
            "absolute inset-0 transition-colors",
            checked ? "bg-[--color]/20" : "bg-muted/20",
          )}
        />
        <div
          className={cn(
            "z-10 flex items-center justify-center rounded-lg bg-[--color] text-white transition-transform will-change-transform",
            vertical
              ? "h-1/2 w-full translate-y-0"
              : "w-1/2 h-full translate-x-0",
            checked && vertical && !reversed && "translate-y-full",
            checked && vertical && reversed && "-translate-y-full",
            checked && !vertical && !reversed && "translate-x-full",
            checked && !vertical && reversed && "-translate-x-full",
            size === "sm" && "rounded-md",
            size === "lg" && "rounded-xl",
          )}
        >
          {showLabel ? (
            <span className={cn("font-medium", sizeClasses)}>
              {checked ? onLabel : offLabel}
            </span>
          ) : checked ? (
            onIcon || <Power className="h-5 w-5" />
          ) : (
            offIcon || <PowerOff className="h-5 w-5" />
          )}
        </div>
      </div>
    </div>
  );
}
