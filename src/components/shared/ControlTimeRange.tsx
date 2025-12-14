import type React from "react";
import { useState, useId, useMemo } from "react";
import {
	Popover,
	PopoverTrigger,
	PopoverContent,
} from "../ui/popover";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { cn } from "../../lib/utils";
import { Clock, ChevronsUpDown } from "lucide-react";

export interface ControlTimeRangeValue {
	start: string; // HH:MM (24h)
	end: string; // HH:MM
}

export interface TimePreset {
	label: string;
	start: string;
	end: string;
}

export interface ControlTimeRangeProps {
	value?: ControlTimeRangeValue;
	defaultValue?: ControlTimeRangeValue;
	onChange?: (value: ControlTimeRangeValue) => void;
	label?: React.ReactNode;
	description?: React.ReactNode;
	disabled?: boolean;
	presets?: TimePreset[];
	className?: string;
	layout?: "row" | "column";
	variant?: "default" | "compact";
	allowInvert?: boolean; // if true, end can be before start (overnight)
}

const DEFAULT_PRESETS: TimePreset[] = [
	{ label: "Morning", start: "06:00", end: "12:00" },
	{ label: "Afternoon", start: "12:00", end: "18:00" },
	{ label: "Evening", start: "18:00", end: "23:00" },
	{ label: "Night", start: "23:00", end: "06:00" },
];

function isValid(time: string) {
	return /^([01]\d|2[0-3]):[0-5]\d$/.test(time);
}
function compare(a: string, b: string) {
	return a.localeCompare(b);
}

export const ControlTimeRange: React.FC<ControlTimeRangeProps> = ({
	value,
	defaultValue = { start: "08:00", end: "17:00" },
	onChange,
	label,
	description,
	disabled,
	presets = DEFAULT_PRESETS,
	className,
	layout = "row",
	variant = "default",
	allowInvert = false,
}) => {
	const isControlled = value !== undefined;
	const [open, setOpen] = useState(false);
	const [internal, setInternal] = useState(defaultValue);
	const val = isControlled ? (value as ControlTimeRangeValue) : internal;
	const id = useId();
	const gap = variant === "compact" ? "gap-2" : "gap-3";

	const invalid = useMemo(() => {
		if (!isValid(val.start) || !isValid(val.end)) return true;
		if (allowInvert) return false;
		return compare(val.start, val.end) >= 0;
	}, [val.start, val.end, allowInvert]);

	const update = (next: Partial<ControlTimeRangeValue>) => {
		const merged = { ...val, ...next };
		if (!isControlled) setInternal(merged);
		onChange?.(merged);
	};

	const applyPreset = (p: TimePreset) => {
		update({ start: p.start, end: p.end });
	};

	return (
		<div
			className={cn(
				"flex w-full",
				layout === "row"
					? "items-center justify-between gap-4"
					: "flex-col gap-2",
				className,
			)}
		>
			{(label || description) && (
				<div className={cn("min-w-0", layout === "row" ? "flex-1" : "w-full")}>
					{label && (
						<div
							id={`${id}-label`}
							className="mb-1 text-sm font-medium leading-none text-foreground/90"
						>
							{label}
						</div>
					)}
					{description && (
						<div
							id={`${id}-desc`}
							className="text-xs leading-snug text-muted-foreground/80"
						>
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
							"h-9 w-56 justify-between gap-2",
							invalid && "border-destructive text-destructive",
						)}
					>
						<span className="flex items-center gap-2 text-xs font-mono">
							<Clock className="h-4 w-4 opacity-70" />
							{val.start} – {val.end}
						</span>
						<ChevronsUpDown className="h-4 w-4 opacity-50" />
					</Button>
				</PopoverTrigger>
				<PopoverContent className={cn("p-4 w-80 space-y-4", gap)} align="start">
					<div className="flex items-center gap-3">
						<div className="flex flex-col gap-1">
							<label className="text-[10px] uppercase tracking-wide text-muted-foreground">
								Start
							</label>
							<Input
								type="time"
								step={300}
								defaultValue={val.start}
								onBlur={(e) =>
									isValid(e.target.value) && update({ start: e.target.value })
								}
								className="h-8 font-mono text-xs"
							/>
						</div>
						<div className="flex flex-col gap-1">
							<label className="text-[10px] uppercase tracking-wide text-muted-foreground">
								End
							</label>
							<Input
								type="time"
								step={300}
								defaultValue={val.end}
								onBlur={(e) =>
									isValid(e.target.value) && update({ end: e.target.value })
								}
								className="h-8 font-mono text-xs"
							/>
						</div>
					</div>
					<div className="space-y-2">
						<div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
							Presets
						</div>
						<div className="flex flex-wrap gap-2">
							{presets.map((p) => (
								<button
									key={p.label}
									type="button"
									onClick={() => applyPreset(p)}
									className={cn(
										"rounded-md border px-2 py-1 text-[11px] font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
										val.start === p.start &&
											val.end === p.end &&
											"bg-primary text-primary-foreground border-primary",
									)}
								>
									{p.label}
								</button>
							))}
						</div>
					</div>
					{!allowInvert && invalid && (
						<div className="rounded-md border border-destructive/40 bg-destructive/10 p-2 text-[11px] text-destructive">
							End must be after start.
						</div>
					)}
				</PopoverContent>
			</Popover>
		</div>
	);
};

ControlTimeRange.displayName = "ControlTimeRange";

export default ControlTimeRange;
