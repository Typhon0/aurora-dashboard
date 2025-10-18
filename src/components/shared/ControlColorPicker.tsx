import type React from "react";
import { useState, useId, useMemo, useCallback } from "react";
import {
	Popover,
	PopoverTrigger,
	PopoverContent,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// Simple HSL-based color picker (hybrid: Popover + Sliders). Alternatives: react-colorful (heavier) or a canvas-based picker.

export interface ControlColorPickerProps {
	value?: string; // hex (#rrggbb or #rrggbbaa)
	defaultValue?: string;
	onChange?: (hex: string) => void;
	label?: React.ReactNode;
	description?: React.ReactNode;
	showAlpha?: boolean;
	disabled?: boolean;
	className?: string;
	layout?: "row" | "column";
	variant?: "default" | "compact";
}

function clamp(v: number, min: number, max: number) {
	return Math.min(Math.max(v, min), max);
}

function hexToRgba(
	hex: string,
): { r: number; g: number; b: number; a: number } | null {
	const cleaned = hex.replace(/#/g, "").trim();
	if (![6, 8].includes(cleaned.length)) return null;
	const r = parseInt(cleaned.slice(0, 2), 16);
	const g = parseInt(cleaned.slice(2, 4), 16);
	const b = parseInt(cleaned.slice(4, 6), 16);
	const a = cleaned.length === 8 ? parseInt(cleaned.slice(6, 8), 16) / 255 : 1;
	return { r, g, b, a };
}

function rgbaToHex(r: number, g: number, b: number, a = 1) {
	const toHex = (x: number) => x.toString(16).padStart(2, "0");
	return `#${toHex(r)}${toHex(g)}${toHex(b)}${a < 1 ? toHex(Math.round(a * 255)) : ""}`;
}

function rgbToHsl(r: number, g: number, b: number) {
	r /= 255;
	g /= 255;
	b /= 255;
	const max = Math.max(r, g, b),
		min = Math.min(r, g, b);
	let h = 0,
		s = 0,
		l = (max + min) / 2;
	const d = max - min;
	if (d !== 0) {
		s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
		switch (max) {
			case r:
				h = (g - b) / d + (g < b ? 6 : 0);
				break;
			case g:
				h = (b - r) / d + 2;
				break;
			default:
				h = (r - g) / d + 4;
		}
		h /= 6;
	}
	return { h: h * 360, s, l };
}

function hslToRgb(h: number, s: number, l: number) {
	h /= 360;
	let r: number, g: number, b: number;
	if (s === 0) {
		r = g = b = l;
	} else {
		const hue2rgb = (p: number, q: number, t: number) => {
			if (t < 0) t += 1;
			if (t > 1) t -= 1;
			if (t < 1 / 6) return p + (q - p) * 6 * t;
			if (t < 1 / 2) return q;
			if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
			return p;
		};
		const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
		const p = 2 * l - q;
		r = hue2rgb(p, q, h + 1 / 3);
		g = hue2rgb(p, q, h);
		b = hue2rgb(p, q, h - 1 / 3);
	}
	return {
		r: Math.round(r * 255),
		g: Math.round(g * 255),
		b: Math.round(b * 255),
	};
}

export const ControlColorPicker: React.FC<ControlColorPickerProps> = ({
	value,
	defaultValue = "#4185f4",
	onChange,
	label,
	description,
	showAlpha = false,
	disabled,
	className,
	layout = "row",
	variant = "default",
}) => {
	const isControlled = value !== undefined;
	const [open, setOpen] = useState(false);
	const [internal, setInternal] = useState(defaultValue);
	const hex = (isControlled ? value : internal) || defaultValue;
	const parsed = useMemo(
		() => hexToRgba(hex) || { r: 66, g: 133, b: 244, a: 1 },
		[hex],
	);
	const { h, s, l } = useMemo(() => {
		const hsl = rgbToHsl(parsed.r, parsed.g, parsed.b);
		return { h: hsl.h, s: hsl.s, l: hsl.l };
	}, [parsed]);
	const [hue, setHue] = useState(h);
	const [sat, setSat] = useState(s);
	const [light, setLight] = useState(l);
	const [alpha, setAlpha] = useState(parsed.a);
	const id = useId();

	// Sync when external value changes
	if (
		hex &&
		(Math.abs(hue - h) > 0.5 ||
			Math.abs(sat - s) > 0.01 ||
			Math.abs(light - l) > 0.01 ||
			Math.abs(alpha - parsed.a) > 0.01)
	) {
		// schedule state updates (avoid render loop by comparing first)
		// eslint-disable-next-line no-console
		setHue(h);
		setSat(s);
		setLight(l);
		setAlpha(parsed.a);
	}

	const commit = useCallback(
		(nh: number, ns: number, nl: number, na: number) => {
			const rgb = hslToRgb(nh, ns, nl);
			const nextHex = rgbaToHex(rgb.r, rgb.g, rgb.b, na);
			if (!isControlled) setInternal(nextHex);
			onChange?.(nextHex);
		},
		[isControlled, onChange],
	);

	const updateHue = (v: number) => {
		setHue(v);
		commit(v, sat, light, alpha);
	};
	const updateSat = (v: number) => {
		setSat(v);
		commit(hue, v, light, alpha);
	};
	const updateLight = (v: number) => {
		setLight(v);
		commit(hue, sat, v, alpha);
	};
	const updateAlpha = (v: number) => {
		setAlpha(v);
		commit(hue, sat, light, v);
	};

	const handleHexInput = (raw: string) => {
		const v = raw.trim();
		if (/^#?[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$/.test(v)) {
			const normalized = v.startsWith("#") ? v : `#${v}`;
			if (!isControlled) setInternal(normalized);
			onChange?.(normalized);
		}
	};

	const previewStyle: React.CSSProperties = {
		background: hex,
		borderRadius: 4,
	};

	const sliderCommon = "w-full";
	const gap = variant === "compact" ? "gap-2" : "gap-3";

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
						className={cn(
							"h-9 w-40 justify-start gap-3",
							!hex && "text-muted-foreground",
						)}
						aria-labelledby={label ? `${id}-label` : undefined}
						aria-describedby={description ? `${id}-desc` : undefined}
					>
						<span className="h-5 w-5 rounded" style={previewStyle} />
						<span className="truncate text-xs font-mono">{hex}</span>
					</Button>
				</PopoverTrigger>
				<PopoverContent className={cn("p-3 space-y-3 w-72", gap)} align="start">
					<div className="flex items-center gap-2">
						<span className="text-xs text-muted-foreground w-10">HEX</span>
						<Input
							defaultValue={hex.replace("#", "")}
							onBlur={(e) => handleHexInput(e.target.value)}
							className="h-8 font-mono text-xs"
						/>
					</div>
					<div className="space-y-2">
						<div className="flex items-center gap-2">
							<span className="w-10 text-xs text-muted-foreground">Hue</span>
							<Slider
								value={[hue]}
								min={0}
								max={360}
								step={1}
								onValueChange={(v) => updateHue(clamp(v[0], 0, 360))}
								className={sliderCommon}
							/>
						</div>
						<div className="flex items-center gap-2">
							<span className="w-10 text-xs text-muted-foreground">Sat</span>
							<Slider
								value={[sat]}
								min={0}
								max={1}
								step={0.01}
								onValueChange={(v) => updateSat(clamp(v[0], 0, 1))}
								className={sliderCommon}
							/>
						</div>
						<div className="flex items-center gap-2">
							<span className="w-10 text-xs text-muted-foreground">Light</span>
							<Slider
								value={[light]}
								min={0}
								max={1}
								step={0.01}
								onValueChange={(v) => updateLight(clamp(v[0], 0, 1))}
								className={sliderCommon}
							/>
						</div>
						{showAlpha && (
							<div className="flex items-center gap-2">
								<span className="w-10 text-xs text-muted-foreground">
									Alpha
								</span>
								<Slider
									value={[alpha]}
									min={0}
									max={1}
									step={0.01}
									onValueChange={(v) => updateAlpha(clamp(v[0], 0, 1))}
									className={sliderCommon}
								/>
							</div>
						)}
					</div>
				</PopoverContent>
			</Popover>
		</div>
	);
};

ControlColorPicker.displayName = "ControlColorPicker";

export default ControlColorPicker;
