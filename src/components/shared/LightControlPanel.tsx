import { useCallback, useMemo, useState, useEffect, useId } from "react";
import { useEntity, useService, type EntityName } from "@hakit/core";
import {
	getLightCapabilities,
	type HAEntityLike,
} from "../../lib/lightCapabilities";
import { Slider } from "../ui/slider";
import { ControlDial } from "./ControlDial";
import { Button } from "../ui/button";
import { ControlColorPicker } from "./index";
import { cn } from "../../lib/utils";
import { Palette, Sparkles } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

export interface LightControlPanelProps {
	entityId: EntityName;
	className?: string;
	onClose?: () => void;
}

// Utility convert brightness percent -> 0-255 and back
function pctTo255(p: number) {
	return Math.round((Math.min(100, Math.max(0, p)) / 100) * 255);
}
function fromEntityBrightness(raw?: number) {
	return raw != null ? Math.round((raw / 255) * 100) : 0;
}

export const LightControlPanel = ({
	entityId,
	className,
	onClose,
}: LightControlPanelProps) => {
	const entity = useEntity(entityId);
	const service = useService("light");
	interface LightEntityAttributes {
		brightness?: number;
		color_temp?: number;
		effect?: string;
		rgb_color?: [number, number, number];
		friendly_name?: string;
	}
	const attrs = (entity?.attributes || {}) as LightEntityAttributes;
	const caps = getLightCapabilities(entity as unknown as HAEntityLike);
	const [colorOpen, setColorOpen] = useState(false);
	// persist color picker open state per entity
	useEffect(() => {
		const key = `light:${entityId}:colorOpen`;
		const stored = localStorage.getItem(key);
		if (stored === "1") setColorOpen(true);
	}, [entityId]);
	useEffect(() => {
		const key = `light:${entityId}:colorOpen`;
		if (colorOpen) localStorage.setItem(key, "1");
		else localStorage.removeItem(key);
	}, [colorOpen, entityId]);

	const brightnessPct = fromEntityBrightness(attrs.brightness);
	// persist last manual brightness (only when >0)
	const [storedBrightness, setStoredBrightness] = useState<number | null>(null);
	useEffect(() => {
		const key = `light:${entityId}:brightness`;
		const v = localStorage.getItem(key);
		if (v) setStoredBrightness(Number(v));
	}, [entityId]);
	const effectiveBrightness =
		brightnessPct === 0 && storedBrightness ? storedBrightness : brightnessPct;
	const currentMired = attrs.color_temp;
	const currentEffect = attrs.effect;
	const colorValue = attrs.rgb_color;

	// Kelvin conversion (mireds -> Kelvin = 1,000,000 / mireds)
	const kelvin = useMemo(
		() => (currentMired ? Math.round(1000000 / currentMired) : undefined),
		[currentMired],
	);

	// Dynamic dial color preference: RGB if color mode present else based on color temp (approx warm/cool interpolation)
	const dialColor = useMemo(() => {
		if (colorValue) {
			return `rgb(${colorValue.join(",")})`;
		}
		if (currentMired) {
			// Map mired range (min=153 cool, max=500 warm) to gradient from cool #9bbcff to warm #ffb15e
			const min = 153;
			const max = 500;
			const t = Math.min(1, Math.max(0, (currentMired - min) / (max - min)));
			const cool = [155, 188, 255];
			const warm = [255, 177, 94];
			const mix = (a: number, b: number) => Math.round(a + (b - a) * t);
			return `rgb(${mix(cool[0], warm[0])},${mix(cool[1], warm[1])},${mix(cool[2], warm[2])})`;
		}
		return "#ffffff";
	}, [colorValue, currentMired]);
	const gradId = useId();

	const setBrightness = useCallback(
		async (vals: number[]) => {
			const pct = vals[0];
			const b = pctTo255(pct);
			await service.turnOn({
				target: entityId,
				serviceData: { brightness: b },
			});
		},
		[service, entityId],
	);

	const setColor = useCallback(
		async (rgb: [number, number, number]) => {
			await service.turnOn({
				target: entityId,
				serviceData: { rgb_color: rgb },
			});
		},
		[service, entityId],
	);

	const setColorTemp = useCallback(
		async (mired: number) => {
			await service.turnOn({
				target: entityId,
				serviceData: { color_temp: mired },
			});
		},
		[service, entityId],
	);

	const setEffect = useCallback(
		async (effect: string) => {
			await service.turnOn({ target: entityId, serviceData: { effect } });
		},
		[service, entityId],
	);

	const glass =
		"backdrop-blur-xl bg-white/10 border border-white/20 shadow-[0_0_0_1px_rgba(255,255,255,0.05)] rounded-2xl";
	const section = "p-4 rounded-xl bg-white/5 border border-white/10";
	const label = "text-xs uppercase tracking-wide text-white/50 font-medium";

	const tempRange = useMemo(
		() => ({
			min: caps.minMireds ?? 153,
			max: caps.maxMireds ?? 500,
		}),
		[caps.minMireds, caps.maxMireds],
	);

	return (
		<div className={cn("space-y-5 text-white", glass, className)}>
			<div className="flex items-center justify-between px-4 pt-4">
				<div>
					<h2 className="text-lg font-semibold drop-shadow-sm">
						{entity?.attributes?.friendly_name}
					</h2>
					<p className="text-xs text-white/50 mt-0.5">{entity?.entity_id}</p>
				</div>
				{onClose && (
					<Button
						size="sm"
						variant="ghost"
						className="text-white/70 hover:text-white"
						onClick={onClose}
					>
						Close
					</Button>
				)}
			</div>
			<AnimatePresence initial={false}>
				{caps.hasBrightness && (
					<motion.div
						key="brightness"
						initial={{ opacity: 0, y: 12, scale: 0.98 }}
						animate={{ opacity: 1, y: 0, scale: 1 }}
						exit={{ opacity: 0, y: -8, scale: 0.98 }}
						transition={{ duration: 0.25, ease: "easeOut" }}
						className={section + " flex flex-col items-center"}
					>
						<div className="relative">
							<div className="absolute inset-0 -m-4 pointer-events-none">
								<svg
									width={220}
									height={220}
									className="block mx-auto opacity-60"
								>
									<defs>
										<linearGradient
											id={gradId}
											x1="0%"
											y1="50%"
											x2="100%"
											y2="50%"
										>
											<stop offset="0%" stopColor="#9bbcff" />
											<stop offset="50%" stopColor="#ffffff" />
											<stop offset="100%" stopColor="#ffb15e" />
										</linearGradient>
									</defs>
									<circle
										cx={110}
										cy={110}
										r={100}
										stroke={`url(#${gradId})`}
										strokeWidth={8}
										fill="none"
										strokeOpacity={0.35}
									/>
								</svg>
							</div>
							<ControlDial
								value={effectiveBrightness}
								onCommit={(v) => {
									setBrightness([v]);
									if (v > 0) {
										localStorage.setItem(
											`light:${entityId}:brightness`,
											String(Math.round(v)),
										);
									}
								}}
								label="Brightness"
								size={180}
								thickness={12}
								progressColor={dialColor}
								glow
								step={5}
								snap
								haptics
								onSnap={() => {
									// snap feedback hook (placeholder)
								}}
							/>
						</div>
					</motion.div>
				)}
				{caps.hasColorTemp && (
					<motion.div
						key="temp"
						initial={{ opacity: 0, y: 12, scale: 0.98 }}
						animate={{ opacity: 1, y: 0, scale: 1 }}
						exit={{ opacity: 0, y: -8, scale: 0.98 }}
						transition={{ duration: 0.25, ease: "easeOut" }}
						className={section}
					>
						<div className="flex items-center justify-between mb-3">
							<span className={label}>Color Temp</span>
							{currentMired && (
								<span className="text-xs font-medium flex flex-col items-end leading-tight">
									<span>{currentMired} mireds</span>
									{kelvin && <span className="opacity-70">{kelvin}K</span>}
								</span>
							)}
						</div>
						<div className="h-2 w-full rounded-full mb-3 bg-gradient-to-r from-[#9bbcff] via-[#ffffff] to-[#ffd9a3]" />
						<Slider
							value={[currentMired ?? tempRange.min]}
							min={tempRange.min}
							max={tempRange.max}
							step={1}
							onValueChange={(v) => setColorTemp(v[0])}
						/>
						<div className="flex justify-between mt-1 text-[10px] text-white/40">
							<span>{tempRange.max}</span>
							<span>{tempRange.min}</span>
						</div>
					</motion.div>
				)}
				{caps.hasColor && (
					<motion.div
						key="color"
						initial={{ opacity: 0, y: 12, scale: 0.98 }}
						animate={{ opacity: 1, y: 0, scale: 1 }}
						exit={{ opacity: 0, y: -8, scale: 0.98 }}
						transition={{ duration: 0.25, ease: "easeOut" }}
						className={section}
					>
						<div className="flex items-center justify-between mb-2">
							<span className={label}>Color</span>
							<Button
								variant="ghost"
								size="sm"
								className="gap-1 text-white/70 hover:text-white"
								onClick={() => setColorOpen((o) => !o)}
							>
								<Palette className="w-4 h-4" />
								{colorValue ? (
									<span
										className="inline-block w-4 h-4 rounded-full border border-white/30"
										style={{ backgroundColor: `rgb(${colorValue.join(",")})` }}
									/>
								) : (
									<span className="text-xs">Pick</span>
								)}
							</Button>
						</div>
						<AnimatePresence initial={false}>
							{colorOpen && (
								<motion.div
									key="picker"
									initial={{ opacity: 0, y: 6 }}
									animate={{ opacity: 1, y: 0 }}
									exit={{ opacity: 0, y: -4 }}
									transition={{ duration: 0.2 }}
									className="mt-2"
								>
									<ControlColorPicker
										value={
											colorValue
												? `#${colorValue.map((c) => c.toString(16).padStart(2, "0")).join("")}`
												: undefined
										}
										onChange={(hex: string) => {
											if (!hex.startsWith("#") || hex.length < 7) return;
											const r = parseInt(hex.slice(1, 3), 16);
											const g = parseInt(hex.slice(3, 5), 16);
											const b = parseInt(hex.slice(5, 7), 16);
											setColor([r, g, b]);
										}}
										className="bg-white/5 p-3 rounded-lg border border-white/10"
									/>
								</motion.div>
							)}
						</AnimatePresence>
					</motion.div>
				)}
				{caps.hasEffects && caps.effects && (
					<motion.div
						key="effects"
						initial={{ opacity: 0, y: 12, scale: 0.98 }}
						animate={{ opacity: 1, y: 0, scale: 1 }}
						exit={{ opacity: 0, y: -8, scale: 0.98 }}
						transition={{ duration: 0.25, ease: "easeOut" }}
						className={section}
					>
						<div className="flex items-center justify-between mb-3">
							<span className={label}>Effects</span>
							{currentEffect && (
								<span className="text-xs px-2 py-0.5 rounded-full bg-white/10 border border-white/15">
									{currentEffect}
								</span>
							)}
						</div>
						<div className="flex flex-wrap gap-2">
							{caps.effects.map((eff) => (
								<Button
									key={eff}
									size="sm"
									variant={eff === currentEffect ? "default" : "outline"}
									className={cn(
										"backdrop-blur bg-white/10 border-white/20 hover:bg-white/20",
										eff === currentEffect &&
											"bg-white/30 text-black font-semibold",
									)}
									onClick={() => setEffect(eff)}
								>
									<Sparkles className="w-3 h-3 mr-1" />
									{eff}
								</Button>
							))}
						</div>
					</motion.div>
				)}
			</AnimatePresence>
			<div className="pb-4 px-4 flex justify-end gap-2">
				{onClose && (
					<Button size="sm" variant="ghost" onClick={onClose}>
						Done
					</Button>
				)}
			</div>
		</div>
	);
};

LightControlPanel.displayName = "LightControlPanel";

export default LightControlPanel;
