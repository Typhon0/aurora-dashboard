// src/components/aurora/AuroraWeatherCard.tsx
import { useEntity, type EntityName } from "@hakit/core";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Sun, Cloud, CloudRain, CloudSnow, CloudLightning } from "lucide-react";

interface Props {
	entityId: EntityName;
	className?: string;
}

export function AuroraWeatherCard({ entityId, className }: Props) {
	const entity = useEntity(entityId);
	const temp = entity.attributes.temperature as number | undefined;
	const cond = String(entity.state || "");
	const humidity = entity.attributes.humidity as number | undefined;
	const pressure = entity.attributes.pressure as number | undefined;
	const wind = entity.attributes.wind_speed as number | undefined;
	const visibility = entity.attributes.visibility as number | undefined;

	const icon = (() => {
		const c = cond.toLowerCase();
		if (c.includes("rain"))
			return <CloudRain className="w-6 h-6 text-blue-400" />;
		if (c.includes("snow"))
			return <CloudSnow className="w-6 h-6 text-blue-200" />;
		if (c.includes("thunder") || c.includes("storm"))
			return <CloudLightning className="w-6 h-6 text-yellow-400" />;
		if (c.includes("cloud")) return <Cloud className="w-6 h-6 text-gray-300" />;
		return <Sun className="w-6 h-6 text-yellow-400" />;
	})();

	return (
		<Card className={`animate-fade-pop ${className || ""}`}>
			<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
				<CardTitle className="text-white text-base font-semibold">
					{entity.attributes.friendly_name || "Weather"}
				</CardTitle>
				{icon}
			</CardHeader>
			<CardContent className="p-5 pt-0">
				<div className="grid grid-cols-2 gap-4">
					<div>
						<div className="text-4xl font-bold text-white">
							{typeof temp === "number" ? `${Math.round(temp)}°` : "--°"}
						</div>
						<div className="text-sm text-white/60 capitalize">
							{cond || "--"}
						</div>
					</div>
					<div className="space-y-2 text-sm text-white/80">
						{humidity !== undefined && (
							<div>
								Humidity: <span className="text-white">{humidity}%</span>
							</div>
						)}
						{wind !== undefined && (
							<div>
								Wind: <span className="text-white">{wind} km/h</span>
							</div>
						)}
						{pressure !== undefined && (
							<div>
								Pressure: <span className="text-white">{pressure} hPa</span>
							</div>
						)}
						{visibility !== undefined && (
							<div>
								Visibility: <span className="text-white">{visibility} km</span>
							</div>
						)}
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
