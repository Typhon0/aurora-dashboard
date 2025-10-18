import { useCallback, useMemo } from "react";
import { useEntity, useService, type EntityName } from "@hakit/core";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronUp, ChevronDown, Thermometer } from "lucide-react";
import { toast } from "sonner";

interface AuroraClimateProps {
	entityId: EntityName;
	className?: string;
	// Optional override to match v5.0.1 behavior (entity step > override > fallback)
	stepOverride?: number;
}

export function AuroraClimateCard({
	entityId,
	className,
	stepOverride,
}: AuroraClimateProps) {
	const entity = useEntity(entityId);
	const climate = useService("climate");

	const current = entity.attributes.current_temperature as number | undefined;
	const target = entity.attributes.temperature as number | undefined;
	const unit = entity.attributes.unit_of_measurement || "°C";
	const hvac = entity.state as string | undefined;

	const step = useMemo(() => {
		// Per upstream change: entity step preferred, allow override, fallback 0.5°C or 1°F
		const entityAttrs = entity.attributes as Record<string, unknown>;
		const entityStep = entityAttrs?.target_temp_step as number | undefined;
		if (typeof stepOverride === "number") return stepOverride;
		if (typeof entityStep === "number") return entityStep;
		return unit === "°F" ? 1 : 0.5;
	}, [entity.attributes, stepOverride, unit]);

	const adjust = useCallback(
		async (delta: number) => {
			if (typeof target !== "number") return;
			const next = Math.round((target + delta) * 10) / 10;
			try {
				toast.loading("Updating…", { id: entityId });
				await climate.setTemperature({
					target: entityId,
					serviceData: { temperature: next },
				});
				toast.success(`Setpoint ${next}${unit}`, { id: entityId });
			} catch (e: unknown) {
				const message = e instanceof Error ? e.message : "Failed";
				toast.error(message, { id: entityId });
			}
		},
		[climate, entityId, target, unit],
	);

	const toggle = useCallback(async () => {
		try {
			toast.loading("Toggling…", { id: entityId });
			if (hvac === "off") {
				await climate.setHvacMode({
					target: entityId,
					serviceData: { hvac_mode: "heat" },
				});
			} else {
				await climate.turnOff({ target: entityId });
			}
			toast.success("Mode updated", { id: entityId });
		} catch (e: unknown) {
			const message = e instanceof Error ? e.message : "Failed";
			toast.error(message, { id: entityId });
		}
	}, [climate, entityId, hvac]);

	return (
		<Card className={`animate-fade-pop ${className ?? ""}`}>
			<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
				<div className="flex items-center gap-2">
					<Thermometer className="w-5 h-5 text-blue-400" />
					<CardTitle className="text-white text-base font-semibold">
						{entity.attributes.friendly_name || "Climate"}
					</CardTitle>
				</div>
				<Badge className="bg-white/20 text-white/80">
					{(hvac || "off").toUpperCase()}
				</Badge>
			</CardHeader>
			<CardContent className="p-5 pt-0">
				<div className="flex items-center justify-between">
					<div className="text-center">
						<div className="text-3xl font-bold text-white">
							{typeof current === "number" ? `${current}${unit}` : `--${unit}`}
						</div>
						<div className="text-sm text-white/60">Current</div>
					</div>
					{typeof target === "number" && (
						<div className="text-center">
							<div className="text-3xl font-bold text-blue-400">
								{target}
								{unit}
							</div>
							<div className="text-sm text-white/60">Setpoint</div>
						</div>
					)}
				</div>

				{typeof target === "number" && hvac !== "off" && (
					<div className="flex items-center justify-center gap-4 mt-4">
						<Button
							onClick={() => adjust(-step)}
							className="bg-white/10 hover:bg-white/20 border border-white/20"
						>
							<ChevronDown className="w-4 h-4" />
						</Button>
						<Button
							onClick={toggle}
							className="bg-white/10 hover:bg-white/20 border border-white/20"
						>
							{hvac === "off" ? "On" : "Off"}
						</Button>
						<Button
							onClick={() => adjust(step)}
							className="bg-white/10 hover:bg-white/20 border border-white/20"
						>
							<ChevronUp className="w-4 h-4" />
						</Button>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
