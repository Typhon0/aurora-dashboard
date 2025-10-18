// src/components/aurora/AuroraSwitchCard.tsx
// Placeholder implementation for a Switch entity card (input_boolean / switch domain)
// Focus: glassmorphic visuals + consistent API; real-time state + service wiring can be enhanced later.
import { AuroraCard } from "./base/AuroraCard";
import { useEntity, useService, type EntityName } from "@hakit/core";
import { useCallback } from "react";
import { ToggleLeft, ToggleRight } from "lucide-react";
import { ControlToggle } from "@/components/shared";
import { toast } from "sonner";

interface Props {
	entityId: EntityName; // e.g. 'switch.living_room_lamp' or 'input_boolean.guest_mode'
	size?: "small" | "medium" | "large";
	className?: string;
	titleOverride?: string;
}

export const AuroraSwitchCard: React.FC<Props> = ({
	entityId,
	size = "small",
	className,
	titleOverride,
}) => {
	const entity = useEntity(entityId);
	const domain = entityId.split(".")[0];
	// Pick appropriate service collection based on domain
	const svc = useService(
		domain === "input_boolean" ? "inputBoolean" : "switch",
	);
	const isOn = entity.state === "on"; // input_boolean uses 'on'/'off' as well

	const toggle = useCallback(async () => {
		try {
			toast.loading(isOn ? "Turning off…" : "Turning on…", { id: entityId });
			await svc.toggle({ target: entityId });
			toast.success(isOn ? "Turned off" : "Turned on", { id: entityId });
		} catch (e: unknown) {
			const message = e instanceof Error ? e.message : "Failed";
			toast.error(message, { id: entityId });
		}
	}, [svc, entityId, isOn]);

	return (
		<AuroraCard
			size={size}
			className={className}
			state={isOn ? "active" : "default"}
			title={titleOverride || entity.attributes.friendly_name}
			icon={
				isOn ? (
					<ToggleRight className="w-5 h-5 text-emerald-400" />
				) : (
					<ToggleLeft className="w-5 h-5 text-white/60" />
				)
			}
			actions={
				<ControlToggle
					checked={isOn}
					vertical={false}
					thickness={38}
					onChange={toggle}
					className="w-24 h-9"
				/>
			}
		>
			<div className="pt-1 px-0 text-sm text-white/70">
				{isOn ? "Active" : "Inactive"}
			</div>
		</AuroraCard>
	);
};
