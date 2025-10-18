import type React from "react";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

export interface ControlSwitchProps {
	checked?: boolean;
	defaultChecked?: boolean;
	disabled?: boolean;
	label?: React.ReactNode;
	description?: React.ReactNode;
	onCheckedChange?: (checked: boolean) => void;
	className?: string;
	layout?: "row" | "column"; // row: label left, switch right; column: label above
	size?: "sm" | "md" | "lg";
}

export const ControlSwitch: React.FC<ControlSwitchProps> = ({
	checked,
	defaultChecked,
	disabled,
	label,
	description,
	onCheckedChange,
	className,
	layout = "row",
	size = "md",
}) => {
	const sizeClasses =
		size === "sm"
			? "h-5 w-8 [&_span]:h-4 [&_span]:w-4 [&_span[data-state=checked]]:translate-x-3"
			: size === "lg"
				? "h-7 w-12 [&_span]:h-6 [&_span]:w-6 [&_span[data-state=checked]]:translate-x-5"
				: ""; // md default

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
						<div className="text-sm font-medium text-foreground/90 leading-none mb-1">
							{label}
						</div>
					)}
					{description && (
						<div className="text-xs text-muted-foreground/80 leading-snug">
							{description}
						</div>
					)}
				</div>
			)}
			<Switch
				checked={checked}
				defaultChecked={defaultChecked}
				disabled={disabled}
				onCheckedChange={onCheckedChange}
				className={cn(sizeClasses)}
			/>
		</div>
	);
};

ControlSwitch.displayName = "ControlSwitch";

export default ControlSwitch;
