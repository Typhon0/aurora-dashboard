import type React from "react";
import { useId } from "react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";

export interface SegmentedOption<T extends string = string> {
  value: T;
  label: React.ReactNode;
  disabled?: boolean;
}

export interface ControlSegmentedProps<T extends string = string> {
  value?: T;
  defaultValue?: T;
  onValueChange?: (value: T) => void;
  options: SegmentedOption<T>[];
  label?: React.ReactNode;
  description?: React.ReactNode;
  size?: "sm" | "md" | "lg";
  layout?: "row" | "column";
  disabled?: boolean;
  className?: string;
  groupClassName?: string;
  fullWidth?: boolean;
}

export function ControlSegmented<T extends string = string>({
  value,
  defaultValue,
  onValueChange,
  options,
  label,
  description,
  size = "md",
  layout = "row",
  disabled,
  className,
  groupClassName,
  fullWidth,
}: ControlSegmentedProps<T>) {
  const id = useId();
  const sizeCls =
    size === "sm" ? "text-xs h-7 px-2" : size === "lg" ? "h-10 px-4" : "h-8 px-3";

  return (
    <div
      className={cn(
        "flex w-full",
        layout === "row" ? "items-center justify-between gap-4" : "flex-col gap-2",
        className,
      )}
    >
      {(label || description) && (
        <div className={cn("min-w-0", layout === "row" ? "flex-1" : "w-full")}> 
          {label && (
            <div id={`${id}-label`} className="mb-1 text-sm font-medium leading-none text-foreground/90">
              {label}
            </div>
          )}
          {description && (
            <div id={`${id}-desc`} className="text-xs leading-snug text-muted-foreground/80">
              {description}
            </div>
          )}
        </div>
      )}
      <ToggleGroup
        type="single"
        value={value}
        defaultValue={defaultValue}
        onValueChange={(v: string) => {
          if (v) onValueChange?.(v as T);
        }}
        disabled={disabled}
        aria-labelledby={label ? `${id}-label` : undefined}
        aria-describedby={description ? `${id}-desc` : undefined}
        className={cn(fullWidth && "flex-1", groupClassName)}
      >
        {options.map((o) => (
          <ToggleGroupItem
            key={o.value}
            value={o.value}
            disabled={o.disabled || disabled}
            className={cn(sizeCls, fullWidth && "flex-1 text-center")}
          >
            {o.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );
}

ControlSegmented.displayName = "ControlSegmented";

export default ControlSegmented;
