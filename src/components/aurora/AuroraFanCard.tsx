// src/components/aurora/AuroraFanCard.tsx
import { useCallback, useMemo } from "react";
import { useEntity, useService, type EntityName } from "@hakit/core";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ControlToggle } from "@/components/shared";
import { Slider } from "@/components/ui/slider";
import { Wind } from "lucide-react";
import { toast } from "sonner";

interface Props {
	entityId: EntityName;
	className?: string;
}

export function AuroraFanCard({ entityId, className }: Props) {
	const entity = useEntity(entityId);
	const fan = useService("fan");
	const isOn = entity.state === "on";
	const perc = (entity.attributes.percentage as number | undefined) ?? 0;
	const speedStep = useMemo(
		() => (entity.attributes.percentage_step as number | undefined) ?? 10,
		[entity.attributes],
	);

	const toggle = useCallback(async () => {
		try {
			toast.loading(isOn ? "Turning off…" : "Turning on…", { id: entityId });
			await fan.toggle({ target: entityId });
			toast.success(isOn ? "Off" : "On", { id: entityId });
		} catch (e: unknown) {
			const msg = (() => {
				if (e instanceof Error) return e.message;
				if (typeof e === "object" && e && "message" in e) {
					const m = (e as { message?: unknown }).message;
					return typeof m === "string" ? m : "Failed";
				}
				return "Failed";
			})();
			toast.error(msg, { id: entityId });
		}
	}, [fan, entityId, isOn]);

	const setPct = useCallback(
		async (value: number[]) => {
			const raw = value?.[0] ?? 0;
			const pct = Math.max(0, Math.min(100, raw));
			try {
				if (pct === 0) await fan.turnOff({ target: entityId });
				else
					await fan.setPercentage({
						target: entityId,
						serviceData: { percentage: pct },
					});
			} catch (e: unknown) {
				const msg = (() => {
					if (e instanceof Error) return e.message;
					if (typeof e === "object" && e && "message" in e) {
						const m = (e as { message?: unknown }).message;
						return typeof m === "string" ? m : "Failed";
					}
					return "Failed";
				})();
				toast.error(msg, { id: entityId });
			}
		},
		[fan, entityId],
	);

	return (
		<Card className={`animate-fade-pop${className ? ` ${className}` : ""}`}>
			<CardHeader className="flex items-center justify-between pb-3">
				<div className="flex items-center gap-2">
					<Wind
						className={`w-5 h-5 ${isOn ? "text-blue-400" : "text-white/60"}`}
					/>
					<CardTitle className="text-white text-base font-semibold">
						{entity.attributes.friendly_name || "Fan"}
					</CardTitle>
				</div>
				<span className="text-xs text-white/70">{isOn ? "On" : "Off"}</span>
			</CardHeader>
			<CardContent className="p-5 pt-0 space-y-3">
				<div className="flex items-center justify-between">
					<div className="text-2xl font-bold text-white">{perc}%</div>
					<ControlToggle
						checked={isOn}
						vertical={false}
						thickness={42}
						onChange={() => toggle()}
						className="w-28 h-10"
					/>
				</div>
				<Slider
					value={[perc]}
					onValueChange={setPct}
					step={speedStep}
					max={100}
				/>
			</CardContent>
		</Card>
	);
}
