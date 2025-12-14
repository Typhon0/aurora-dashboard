import React from "react";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Button } from "../ui/button";
import { CalendarIcon } from "lucide-react";
import { cn } from "../../lib/utils";
import { Calendar } from "../ui/calendar";

export interface ControlDatePickerProps {
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
}

export const ControlDatePicker: React.FC<ControlDatePickerProps> = ({
  value,
  onChange,
  label,
  description,
  disabled,
  className,
  placeholder = "Pick a date",
}) => {
  const [open, setOpen] = React.useState(false);
  return (
    <div className={cn("space-y-1", className)}>
      {label && <div className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">{label}</div>}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            disabled={disabled}
            className={cn(
              "w-full justify-start text-left font-normal",
              !value && "text-muted-foreground",
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value ? value.toLocaleDateString() : <span>{placeholder}</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={value}
            onSelect={(d: Date | undefined) => {
              onChange?.(d);
              if (d) setOpen(false);
            }}
            initialFocus
            disabled={disabled}
          />
        </PopoverContent>
      </Popover>
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
    </div>
  );
};

ControlDatePicker.displayName = "ControlDatePicker";

export default ControlDatePicker;
