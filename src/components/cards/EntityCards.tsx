import React from "react";
import { Lightbulb, Thermometer, Power, Wifi, WifiOff } from "lucide-react";
import { AuroraCard } from "./AuroraCard";
import { useEntityControl } from "@/hooks/useHomeAssistant";
import { cn } from "@/utils/cn";
import type { HAEntity } from "@/types";

interface EntityCardProps {
	entity: HAEntity;
}

export function LightCard({ entity }: EntityCardProps) {
	const { mutate: controlEntity, isPending } = useEntityControl();

	const isOn = entity.state === "on";
	const brightness = entity.attributes.brightness
		? Math.round((entity.attributes.brightness / 255) * 100)
		: 0;

	const handleToggle = () => {
		controlEntity({
			entityId: entity.entity_id,
			domain: "light",
			service: "toggle",
		});
	};

	return (
		<AuroraCard
			title={entity.attributes.friendly_name}
			icon={
				<Lightbulb
					className={cn("w-4 h-4", isOn ? "text-yellow-400" : "text-white/50")}
				/>
			}
			value={isOn ? `${brightness}%` : "Éteint"}
			variant={isOn ? "accent" : "default"}
			onClick={handleToggle}
			className={cn(
				isPending && "animate-pulse",
				entity.state === "pending" && "ring-2 ring-aurora-500/50",
			)}
		>
			<div className="flex items-center justify-between">
				<span className="text-sm">
					{isOn ? "Luminosité actuelle" : "Appuyer pour allumer"}
				</span>
				{isPending && (
					<div className="w-4 h-4 rounded-full border-2 border-aurora-500 border-t-transparent animate-spin" />
				)}
			</div>
		</AuroraCard>
	);
}

export function ClimateCard({ entity }: EntityCardProps) {
	const currentTemp = entity.attributes.current_temperature;
	const targetTemp = entity.attributes.temperature;
	const mode = entity.state;

	return (
		<AuroraCard
			title={entity.attributes.friendly_name}
			icon={<Thermometer className="w-4 h-4 text-blue-400" />}
			value={currentTemp ? `${currentTemp}°C` : "---"}
			size="medium"
		>
			<div className="space-y-1 text-sm">
				<div>Consigne: {targetTemp}°C</div>
				<div className="capitalize">Mode: {mode}</div>
			</div>
		</AuroraCard>
	);
}

export function SensorCard({ entity }: EntityCardProps) {
	const getIconForSensor = (deviceClass: string) => {
		switch (deviceClass) {
			case "temperature":
				return <Thermometer className="w-4 h-4 text-blue-400" />;
			case "power":
				return <Power className="w-4 h-4 text-yellow-400" />;
			default:
				return <div className="w-4 h-4 bg-white/20 rounded" />;
		}
	};

	return (
		<AuroraCard
			title={entity.attributes.friendly_name}
			icon={getIconForSensor(entity.attributes.device_class || "default")}
			value={`${entity.state} ${entity.attributes.unit_of_measurement || ""}`}
			size="small"
		>
			<div className="text-sm">
				Mis à jour:{" "}
				{new Date(entity.last_updated).toLocaleTimeString("fr-FR", {
					hour: "2-digit",
					minute: "2-digit",
				})}
			</div>
		</AuroraCard>
	);
}
