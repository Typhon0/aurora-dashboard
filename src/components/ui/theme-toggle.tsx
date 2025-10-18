import { useEffect, useState, useCallback } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, MonitorSmartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Cycles: dark -> light -> system
const order: Array<"dark" | "light" | "system"> = ["dark", "light", "system"];

export function ThemeToggle({ className }: { className?: string }) {
	const { theme, setTheme, systemTheme } = useTheme();
	const [mounted, setMounted] = useState(false);
	useEffect(() => setMounted(true), []);

	const current =
		theme === "system"
			? (systemTheme as "dark" | "light" | undefined) || "dark"
			: (theme as "dark" | "light");

	const cycle = useCallback(() => {
		const value = (theme as "dark" | "light" | "system" | undefined) || "dark";
		const idx = order.indexOf(value);
		const next = order[(idx + 1) % order.length];
		setTheme(next);
	}, [theme, setTheme]);

	const Icon =
		current === "dark" ? Moon : current === "light" ? Sun : MonitorSmartphone;

	return (
		<Button
			variant="ghost"
			size="icon"
			aria-label="Toggle theme"
			title={`Theme: ${theme}`}
			onClick={cycle}
			className={cn(
				"relative overflow-hidden rounded-full border border-white/20 bg-white/5 backdrop-blur-md hover:bg-white/10 transition",
				"shadow-[0_0_0_0.5px_rgba(255,255,255,0.4)]",
				className,
			)}
		>
			{mounted && <Icon className="h-4 w-4 text-white/80" />}
		</Button>
	);
}
