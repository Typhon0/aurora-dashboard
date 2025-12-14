import React from "react";
import {
	Popover,
	PopoverTrigger,
	PopoverContent,
} from "../ui/popover";
import { Button } from "../ui/button";
import { CalendarIcon, X } from "lucide-react";
import { cn } from "../../lib/utils";
import { Calendar } from "../ui/calendar";
import type { DateRange } from "react-day-picker";

export interface DateRangeValue {
	from?: Date;
	to?: Date;
}

export interface ControlDateRangePickerProps {
	value?: DateRangeValue;
	onChange?: (range: DateRangeValue | undefined) => void;
	label?: string;
	description?: string;
	disabled?: boolean;
	className?: string;
	placeholder?: string;
	allowClear?: boolean;
}

function formatRange(range?: DateRangeValue) {
	if (!range?.from && !range?.to) return "";
	if (range?.from && !range.to) return range.from.toLocaleDateString();
	if (!range?.from && range?.to) return range.to.toLocaleDateString();
	if (range?.from && range?.to) {
		return `${range.from.toLocaleDateString()} – ${range.to.toLocaleDateString()}`;
	}
	return "";
}

export const ControlDateRangePicker: React.FC<ControlDateRangePickerProps> = ({
	value,
	onChange,
	label,
	description,
	disabled,
	className,
	placeholder = "Pick a date range",
	allowClear = true,
}) => {
	const [open, setOpen] = React.useState(false);
	const labelId = React.useId();
	const rangeLabel = formatRange(value);

	return (
		<div className={cn("space-y-1", className)}>
			{label && (
				<div
					id={labelId}
					className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
				>
					{label}
				</div>
			)}
			<Popover open={open} onOpenChange={setOpen}>
				<PopoverTrigger asChild>
					<Button
						variant="outline"
						disabled={disabled}
						aria-labelledby={labelId}
						className={cn(
							"w-full justify-start text-left font-normal flex items-center gap-2",
							!rangeLabel && "text-muted-foreground",
						)}
					>
						<CalendarIcon className="h-4 w-4" />
						<span className="flex-1 truncate">{rangeLabel || placeholder}</span>
						{allowClear && rangeLabel && !disabled && (
							<X
								role="button"
								aria-label="Clear"
								className="h-3.5 w-3.5 opacity-60 hover:opacity-100"
								onClick={(e) => {
									e.stopPropagation();
									onChange?.(undefined);
								}}
							/>
						)}
					</Button>
				</PopoverTrigger>
				<PopoverContent className="w-auto p-2" align="start">
					<Calendar
						mode="range"
						numberOfMonths={2}
						selected={value as DateRange | undefined}
						onSelect={(range: DateRange | undefined) => {
							const next = range?.from || range?.to ? range : undefined;
							onChange?.(next);
						}}
						initialFocus
						disabled={disabled}
					/>
				</PopoverContent>
			</Popover>
			{description && (
				<p className="text-xs text-muted-foreground">{description}</p>
			)}
		</div>
	);
};

ControlDateRangePicker.displayName = "ControlDateRangePicker";

export default ControlDateRangePicker;
