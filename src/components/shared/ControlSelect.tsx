import type React from "react";
import { useId } from "react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  SelectGroup,
  SelectLabel as PrimitiveLabel,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

// ControlSelect rationale / alternatives:
// - Uses Radix Select via shadcn for accessibility & keyboard support.
// - Alternative: native <select> (less styling flexibility, poorer virtualized performance).
// - Alternative: Command palette style combobox (shadcn Command) if large dynamic list / search needed.
// - Future enhancement: virtualized list (e.g., react-aria, react-virtual) when item count > ~200.

export interface ControlSelectOption<T extends string | number = string> {
  value: T;
  label: React.ReactNode;
  disabled?: boolean;
}

export interface ControlSelectProps<T extends string | number = string> {
  value?: T;
  defaultValue?: T;
  onValueChange?: (value: T) => void;
  options: ControlSelectOption<T>[];
  placeholder?: React.ReactNode;
  label?: React.ReactNode;
  description?: React.ReactNode;
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
  layout?: "row" | "column";
  size?: "sm" | "md" | "lg";
  groupLabel?: React.ReactNode; // optional single group wrapper label
}

export function ControlSelect<T extends string | number = string>({
  value,
  defaultValue,
  onValueChange,
  options,
  placeholder = "Select…",
  label,
  description,
  disabled,
  className,
  triggerClassName,
  layout = "row",
  size = "md",
  groupLabel,
}: ControlSelectProps<T>) {
  const id = useId();
  const triggerSize =
    size === "sm"
      ? "h-8"
      : size === "lg"
        ? "h-10 text-base"
        : "h-9"; // md

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
            <div className="mb-1 text-sm font-medium leading-none text-foreground/90" id={`${id}-label`}>
              {label}
            </div>
          )}
          {description && (
            <div className="text-xs leading-snug text-muted-foreground/80" id={`${id}-desc`}>
              {description}
            </div>
          )}
        </div>
      )}
      <Select
        value={value !== undefined ? String(value) : undefined}
        defaultValue={defaultValue !== undefined ? String(defaultValue) : undefined}
        onValueChange={(v) => {
          // Map back to original option type if numeric
          const match = options.find((o) => String(o.value) === v);
            if (match) onValueChange?.(match.value);
        }}
        disabled={disabled}
      >
        <SelectTrigger
          aria-labelledby={label ? `${id}-label` : undefined}
          aria-describedby={description ? `${id}-desc` : undefined}
          className={cn(triggerSize, "w-44", triggerClassName)}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {groupLabel && <PrimitiveLabel>{groupLabel}</PrimitiveLabel>}
            {options.map((o) => (
              <SelectItem
                key={String(o.value)}
                value={String(o.value)}
                disabled={o.disabled}
              >
                {o.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}

ControlSelect.displayName = "ControlSelect";

export default ControlSelect;