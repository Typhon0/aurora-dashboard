"use client";

import React, { useState, useCallback } from "react";
import { cn } from "@/lib/utils";

export interface SwitchProps
	extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onChange"> {
	checked?: boolean;
	defaultChecked?: boolean;
	onCheckedChange?: (checked: boolean) => void;
}

export const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
	(
		{ checked, defaultChecked, onCheckedChange, disabled, className, ...rest },
		ref,
	) => {
		const [internal, setInternal] = useState<boolean>(defaultChecked ?? false);
		const isControlled = typeof checked === "boolean";
		const current = isControlled ? checked : internal;

		const toggle = useCallback(() => {
			if (disabled) return;
			const next = !current;
			if (!isControlled) setInternal(next);
			onCheckedChange?.(next);
		}, [current, disabled, isControlled, onCheckedChange]);

		return (
			<button
				type="button"
				role="switch"
				aria-checked={current}
				data-state={current ? "checked" : "unchecked"}
				disabled={disabled}
				onClick={toggle}
				ref={ref}
				className={cn(
					"inline-flex h-6 w-10 shrink-0 cursor-pointer items-center rounded-full border border-transparent transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
					current ? "bg-primary" : "bg-muted",
					className,
				)}
				{...rest}
			>
				<span
					className={cn(
						"pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform",
						current ? "translate-x-4" : "translate-x-0",
					)}
				/>
			</button>
		);
	},
);
Switch.displayName = "Switch";

export default Switch;
