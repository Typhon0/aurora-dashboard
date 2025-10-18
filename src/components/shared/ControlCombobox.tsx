import type React from "react";
import { useState, useMemo, useId, useCallback } from "react";
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown, X } from "lucide-react";

export interface ComboboxOption<T extends string = string> {
  value: T;
  label: string;
  keywords?: string[]; // extra search terms
  disabled?: boolean;
}

export interface ControlComboboxProps<T extends string = string> {
  value?: T;
  defaultValue?: T;
  onValueChange?: (value: T | undefined) => void;
  options: ComboboxOption<T>[];
  label?: React.ReactNode;
  description?: React.ReactNode;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  clearable?: boolean;
  disabled?: boolean;
  className?: string;
  buttonClassName?: string;
  maxHeightPx?: number;
  layout?: "row" | "column";
  size?: "sm" | "md" | "lg";
  filter?: (query: string, option: ComboboxOption<T>) => boolean; // custom filter override
}

export function ControlCombobox<T extends string = string>({
  value,
  defaultValue,
  onValueChange,
  options,
  label,
  description,
  placeholder = "Select...",
  searchPlaceholder = "Search...",
  emptyText = "No results",
  clearable = true,
  disabled,
  className,
  buttonClassName,
  maxHeightPx = 260,
  layout = "row",
  size = "md",
  filter,
}: ControlComboboxProps<T>) {
  const [open, setOpen] = useState(false);
  const isControlled = value !== undefined;
  const [internal, setInternal] = useState<T | undefined>(defaultValue);
  const current = isControlled ? value : internal;
  const [query, setQuery] = useState("");
  const id = useId();

  const sizeCls = size === "sm" ? "h-8 text-xs" : size === "lg" ? "h-10 text-base" : "h-9";

  const effectiveFilter = useCallback(
    (q: string, o: ComboboxOption<T>) => {
      if (filter) return filter(q, o);
      if (!q) return true;
      const hay = (o.label + " " + (o.keywords?.join(" ") || "")).toLowerCase();
      return hay.includes(q.toLowerCase());
    },
    [filter],
  );

  const filtered = useMemo(
    () => options.filter((o) => effectiveFilter(query, o)),
    [options, query, effectiveFilter],
  );

  const setValue = (v: T | undefined) => {
    if (!isControlled) setInternal(v);
    onValueChange?.(v);
  };

  const clear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setValue(undefined);
  };

  const selectedLabel = options.find((o) => o.value === current)?.label;

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
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            aria-labelledby={label ? `${id}-label` : undefined}
            aria-describedby={description ? `${id}-desc` : undefined}
            className={cn(
              "justify-between gap-2",
              sizeCls,
              "w-48", // base width
              !selectedLabel && "text-muted-foreground",
              buttonClassName,
            )}
          >
            <span className="line-clamp-1 flex-1 text-left">
              {selectedLabel || placeholder}
            </span>
            {clearable && current && !disabled && (
              <X
                className="h-4 w-4 opacity-60 hover:opacity-100"
                onClick={clear}
              />
            )}
            <ChevronsUpDown className="ml-1 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0" align="start" style={{ width: "var(--radix-popover-trigger-width)" }}>
          <Command shouldFilter={false} onKeyDown={(e) => {
            if (e.key === "Escape") setOpen(false);
          }}>
            <CommandInput
              placeholder={searchPlaceholder}
              value={query}
              onValueChange={setQuery}
              autoFocus
            />
            <CommandList style={{ maxHeight: maxHeightPx }}>
              <CommandEmpty>{emptyText}</CommandEmpty>
              <CommandGroup>
                {filtered.map((o) => {
                  const selected = o.value === current;
                  return (
                    <CommandItem
                      key={o.value}
                      value={o.label}
                      disabled={o.disabled}
                      onSelect={() => {
                        setValue(o.value);
                        setOpen(false);
                      }}
                      className={cn("flex items-center", selected && "aria-selected:bg-accent")}
                    >
                      <Check className={cn("mr-2 h-4 w-4", selected ? "opacity-100" : "opacity-0")} />
                      <span className="line-clamp-1">{o.label}</span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}

ControlCombobox.displayName = "ControlCombobox";

export default ControlCombobox;
