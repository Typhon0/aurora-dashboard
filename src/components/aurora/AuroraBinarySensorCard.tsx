// src/components/aurora/AuroraBinarySensorCard.tsx
// Placeholder for binary_sensor domain. Shows state + icon colorization.
import { AuroraCard } from "./base/AuroraCard";
import { useEntity, type EntityName } from "@hakit/core";
import { Shield, ShieldAlert } from "lucide-react";

interface Props {
	entityId: EntityName; // e.g. 'binary_sensor.door_front'
	size?: "small" | "medium" | "large";
	className?: string;
	titleOverride?: string;
	activeStates?: string[]; // states considered 'on'/active. Default ['on'].
}

export const AuroraBinarySensorCard: React.FC<Props> = ({
	entityId,
	size = "small",
	className,
	titleOverride,
	activeStates = ["on"],
}) => {
	const entity = useEntity(entityId);
	const isActive = activeStates.includes(entity.state);
	const friendly = titleOverride || entity.attributes.friendly_name || entityId;

	return (
		<AuroraCard
			size={size}
			className={className}
			state={isActive ? "active" : "default"}
			title={friendly}
			icon={
				isActive ? (
					<ShieldAlert className="w-5 h-5 text-red-400" />
				) : (
					<Shield className="w-5 h-5 text-white/60" />
				)
			}
		>
			<div className="flex flex-col gap-1 text-sm text-white/70 pt-1">
				<div>
					State: <span className="text-white font-medium">{entity.state}</span>
				</div>
				{entity.attributes.device_class && (
					<div className="text-xs text-white/50">
						{entity.attributes.device_class}
					</div>
				)}
			</div>
		</AuroraCard>
	);
};
