// src/components/aurora/AuroraFanCard.tsx
import React, { useCallback, useMemo } from "react";
import { useEntity, useService, type EntityName } from "@hakit/core";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
		} catch (e: any) {
			toast.error(e?.message ?? "Failed", { id: entityId });
		}
	}, [fan, entityId, isOn]);

	const setPct = useCallback(
		async (value: number[]) => {
			const pct = Math.max(0, Math.min(100, value));
			try {
				if (pct === 0) await fan.turnOff({ target: entityId });
				else
					await fan.setPercentage({
						target: entityId,
						serviceData: { percentage: pct },
					});
			} catch (e: any) {
				toast.error(e?.message ?? "Failed", { id: entityId });
			}
		},
		[fan, entityId],
	);

	return (
		<Card
			className={`backdrop-blur-md bg-white/10 border border-white/20 hover:bg-white/15 transition-all duration-300 ${className || ""}`}
		>
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
					<Button
						onClick={toggle}
						className="bg-white/10 hover:bg-white/20 border border-white/20"
					>
						{isOn ? "Off" : "On"}
					</Button>
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
