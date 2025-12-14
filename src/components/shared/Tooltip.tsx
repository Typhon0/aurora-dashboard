import type { ReactNode } from "react";
import { useState, useId } from "react";

export interface TooltipProps {
	content: ReactNode;
	children: ReactNode;
	side?: "top" | "bottom" | "left" | "right";
	delay?: number; // ms
	className?: string;
	asChild?: boolean; // in future for wrapping direct element
}

export function Tooltip({
	content,
	children,
	side = "top",
	delay = 200,
	className,
}: TooltipProps) {
	const [open, setOpen] = useState(false);
	const [timer, setTimer] = useState<number | null>(null);
	const id = useId();

	const show = () => {
		if (timer) window.clearTimeout(timer);
		const t = window.setTimeout(() => setOpen(true), delay);
		setTimer(t);
	};
	const hide = () => {
		if (timer) window.clearTimeout(timer);
		setOpen(false);
	};

	const pos: Record<string, string> = {
		top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
		bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
		left: "right-full top-1/2 -translate-y-1/2 mr-2",
		right: "left-full top-1/2 -translate-y-1/2 ml-2",
	};

	return (
		<span
			className="relative inline-flex"
			onMouseEnter={show}
			onMouseLeave={hide}
			onFocus={show}
			onBlur={hide}
			aria-describedby={open ? id : undefined}
		>
			{children}
			<span
				id={id}
				role="tooltip"
				className={`pointer-events-none absolute z-50 px-2 py-1 text-xs rounded-md bg-neutral-900/90 text-white opacity-0 shadow transition-opacity duration-150 data-[open=true]:opacity-100 ${
					pos[side]
				} ${className ?? ""}`}
				data-open={open}
			>
				{content}
			</span>
		</span>
	);
}
