import type React from "react";
import { useState, useCallback } from "react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { cn } from "../../lib/utils";

export interface ControlNumberProps {
	value?: number;
	defaultValue?: number;
	min?: number;
	max?: number;
	step?: number;
	label?: React.ReactNode;
	description?: React.ReactNode;
	disabled?: boolean;
	onValueChange?: (value: number) => void;
	className?: string;
	inputClassName?: string;
	layout?: "row" | "column"; // row -> label left input right
	variant?: "default" | "compact";
	unit?: string;
	showControls?: boolean; // show +/- buttons
}

export const ControlNumber: React.FC<ControlNumberProps> = ({
	value,
	defaultValue,
	min = Number.NEGATIVE_INFINITY,
	max = Number.POSITIVE_INFINITY,
	step = 1,
	label,
	description,
	disabled,
	onValueChange,
	className,
	inputClassName,
	layout = "row",
	variant = "default",
	unit,
	showControls = true,
}) => {
	const isControlled = typeof value === "number";
	const [internal, setInternal] = useState<number>(value ?? defaultValue ?? 0);
	const current = isControlled ? (value as number) : internal;

	const clamp = useCallback(
		(v: number) => Math.min(Math.max(v, min), max),
		[min, max],
	);

	const commit = useCallback(
		(next: number) => {
			const clamped = clamp(Number.isNaN(next) ? current : next);
			if (!isControlled) setInternal(clamped);
			onValueChange?.(clamped);
		},
		[clamp, current, isControlled, onValueChange],
	);

	const adjust = (dir: 1 | -1) => {
		commit(current + dir * step);
	};

	const onBlur = (e: React.FocusEvent<HTMLInputElement>) => {
		commit(parseFloat(e.target.value));
	};
	const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "ArrowUp") {
			e.preventDefault();
			adjust(1);
		} else if (e.key === "ArrowDown") {
			e.preventDefault();
			adjust(-1);
		} else if (e.key === "Enter") {
			commit(parseFloat((e.target as HTMLInputElement).value));
		}
	};

	const baseWrapper = cn(
		"flex w-full",
		layout === "row" ? "items-center justify-between gap-4" : "flex-col gap-2",
		className,
	);

	const controlsSize = variant === "compact" ? "h-7 w-7" : "h-8 w-8";

	return (
		<div className={baseWrapper}>
			{(label || description) && (
				<div className={cn("min-w-0", layout === "row" ? "flex-1" : "w-full")}>
					{label && (
						<div className="mb-1 text-sm font-medium leading-none text-foreground/90">
							{label}
						</div>
					)}
					{description && (
						<div className="text-xs leading-snug text-muted-foreground/80">
							{description}
						</div>
					)}
				</div>
			)}
			<div
				className={cn(
					"flex items-center",
					variant === "compact" ? "gap-1" : "gap-2",
				)}
			>
				{showControls && (
					<Button
						type="button"
						variant="outline"
						size="icon"
						disabled={disabled || current <= min}
						onClick={() => adjust(-1)}
						className={cn(controlsSize)}
					>
						–
					</Button>
				)}
				<div className="relative flex items-center">
					<Input
						type="number"
						inputMode="decimal"
						disabled={disabled}
						defaultValue={current}
						onBlur={onBlur}
						onKeyDown={onKeyDown}
						className={cn(
							"w-24 text-center tabular-nums",
							variant === "compact" && "h-8",
							inputClassName,
						)}
					/>
					{unit && (
						<span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground/70">
							{unit}
						</span>
					)}
				</div>
				{showControls && (
					<Button
						type="button"
						variant="outline"
						size="icon"
						disabled={disabled || current >= max}
						onClick={() => adjust(1)}
						className={cn(controlsSize)}
					>
						+
					</Button>
				)}
			</div>
		</div>
	);
};

ControlNumber.displayName = "ControlNumber";

export default ControlNumber;
