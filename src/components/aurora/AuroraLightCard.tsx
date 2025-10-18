// src/components/aurora/AuroraLightCard.tsx
import { useCallback, useState } from "react";
import { useEntity, useService, type EntityName } from "@hakit/core";
import { AuroraCard } from "./base/AuroraCard";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ControlToggle } from "@/components/shared";
import { Lightbulb, Palette } from "lucide-react";
import { toast } from "sonner";

interface Props {
	entityId: EntityName;
	size?: "small" | "medium" | "large";
	className?: string;
}

export const AuroraLightCard: React.FC<Props> = ({
	entityId,
	size = "medium",
	className,
}) => {
	const entity = useEntity(entityId);
	const light = useService("light");

	const [colorOpen, setColorOpen] = useState(false);
	const isOn = entity.state === "on";
	const brightness = entity.attributes.brightness
		? Math.round((entity.attributes.brightness / 255) * 100)
		: 0;
	const hasRGB = entity.attributes.supported_color_modes?.includes("rgb");

	const toggle = useCallback(async () => {
		try {
			toast.loading(isOn ? "Turning off…" : "Turning on…", { id: entityId });
			await light.toggle({ target: entityId });
			toast.success(isOn ? "Light turned off" : "Light turned on", {
				id: entityId,
			});
		} catch (e: unknown) {
			const message = e instanceof Error ? e.message : "Failed";
			toast.error(message, { id: entityId });
		}
	}, [light, entityId, isOn]);

	const setBrightness = useCallback(
		async (value: number[]) => {
			const pct = value?.[0] ?? 0; // Slider returns an array, take first value
			const clamped = Math.min(100, Math.max(0, pct));
			const brightness255 = Math.round((clamped / 100) * 255);
			try {
				if (clamped === 0) {
					await light.turnOff({ target: entityId });
				} else {
					await light.turnOn({
						target: entityId,
						serviceData: { brightness: brightness255 },
					});
				}
			} catch (e: unknown) {
				const message = e instanceof Error ? e.message : "Failed";
				toast.error(message, { id: entityId });
			}
		},
		[light, entityId],
	);

	const setColor = useCallback(
		async (rgb: [number, number, number]) => {
			try {
				toast.loading("Changing color…", { id: entityId });
				await light.turnOn({
					target: entityId,
					serviceData: { rgb_color: rgb },
				});
				toast.success("Color updated", { id: entityId });
				setColorOpen(false);
			} catch (e: unknown) {
				const message = e instanceof Error ? e.message : "Failed";
				toast.error(message, { id: entityId });
			}
		},
		[light, entityId],
	);

	const presets: Array<{ name: string; rgb: [number, number, number] }> = [
		{ name: "White", rgb: [255, 255, 255] },
		{ name: "Red", rgb: [255, 0, 0] },
		{ name: "Green", rgb: [0, 255, 0] },
		{ name: "Blue", rgb: [0, 0, 255] },
		{ name: "Purple", rgb: [128, 0, 128] },
		{ name: "Orange", rgb: [255, 165, 0] },
	];

	return (
		<AuroraCard
			title={entity.attributes.friendly_name}
			size={size}
			state={isOn ? "active" : "default"}
			className={className}
			icon={
				<Lightbulb
					className={`w-5 h-5 ${isOn ? "text-yellow-400" : "text-white/60"}`}
				/>
			}
			actions={
				<div className="flex items-center gap-2">
					{hasRGB && (
						<Dialog open={colorOpen} onOpenChange={setColorOpen}>
							<DialogTrigger asChild>
								<Button
									variant="ghost"
									className="border border-white/20 bg-white/10 hover:bg-white/20"
								>
									<Palette className="w-4 h-4" />
								</Button>
							</DialogTrigger>
							<DialogContent className="aurora-glass">
								<DialogHeader>
									<DialogTitle className="text-white">Colors</DialogTitle>
								</DialogHeader>
								<div className="grid grid-cols-2 gap-3">
									{presets.map((p) => (
										<Button
											key={p.name}
											variant="ghost"
											className="h-10 border border-white/20"
											style={{
												backgroundColor: `rgb(${p.rgb.join(",")})`,
												color: "#000",
											}}
											onClick={() => setColor(p.rgb)}
										>
											{p.name}
										</Button>
									))}
								</div>
							</DialogContent>
						</Dialog>
					)}
					<ControlToggle
						checked={isOn}
						vertical={false}
						thickness={42}
						onChange={() => toggle()}
						className="w-28 h-10"
					/>
				</div>
			}
		>
			<div className="space-y-4">
				<div className="flex items-center justify-between">
					<div>
						<div className="text-2xl font-bold text-white">
							{isOn ? `${brightness}%` : "Off"}
						</div>
						<Badge className={`mt-1 bg-white/20 text-white/70`}>
							{isOn ? "On" : "Off"}
						</Badge>
					</div>
				</div>
				{isOn && (
					<div className="space-y-2">
						<label className="text-sm text-white/70">Brightness</label>
						<Slider
							value={[brightness]}
							onValueChange={setBrightness}
							max={100}
							step={1}
						/>
					</div>
				)}
			</div>
		</AuroraCard>
	);
};
