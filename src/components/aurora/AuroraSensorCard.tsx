import React, { useMemo } from "react";
import { useEntity, type EntityName } from "@hakit/core";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Thermometer, Droplets, Zap, Gauge, Activity } from "lucide-react";

export function AuroraSensor({
	entityId,
	className,
}: {
	entityId: EntityName;
	className?: string;
}) {
	const entity = useEntity(entityId);

	const icon = useMemo(() => {
		const cls = "w-4 h-4 text-white/80";
		switch (entity.attributes.device_class) {
			case "temperature":
				return <Thermometer className={cls} />;
			case "humidity":
				return <Droplets className={cls} />;
			case "power":
			case "energy":
				return <Zap className={cls} />;
			case "battery":
				return <Activity className={cls} />;
			default:
				return <Gauge className={cls} />;
		}
	}, [entity.attributes.device_class]);

	const formatted = useMemo(() => {
		const n = parseFloat(entity.state);
		if (Number.isNaN(n)) return entity.state;
		const unit = entity.attributes.unit_of_measurement || "";
		if (unit === "°C" || unit === "°F") return `${n.toFixed(1)}${unit}`;
		if (unit === "%") return `${Math.round(n)}%`;
		if (unit === "W" || unit === "kW")
			return `${n < 1 ? n.toFixed(2) : n.toFixed(0)} ${unit}`;
		return `${n.toFixed(1)} ${unit}`;
	}, [entity.state, entity.attributes.unit_of_measurement]);

	return (
		<Card
			className={`backdrop-blur-md bg-white/10 border border-white/20 hover:bg-white/15 transition-all duration-300 ${className || ""}`}
		>
			<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
				<div className="flex items-center gap-2">
					{icon}
					<CardTitle className="text-white text-base font-semibold">
						{entity.attributes.friendly_name || "Sensor"}
					</CardTitle>
				</div>
			</CardHeader>
			<CardContent className="p-5 pt-0">
				<div className="text-2xl font-bold text-white">{formatted}</div>
				<div className="text-xs text-white/60 mt-2">
					{new Date(entity.last_updated).toLocaleTimeString("fr-FR", {
						hour: "2-digit",
						minute: "2-digit",
					})}
				</div>
			</CardContent>
		</Card>
	);
}
