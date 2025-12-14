import { Card } from "../ui/card";
import { useEntity, useService, type EntityName } from "@hakit/core";
import { useCallback } from "react";
import { Power } from "lucide-react";
import { toast } from "sonner";
import { cn } from "../../lib/utils";

interface Props {
	entityId: EntityName;
	className?: string;
	titleOverride?: string;
}

export const AuroraSwitchCard: React.FC<Props> = ({
	entityId,
	className,
	titleOverride,
}) => {
	const entity = useEntity(entityId);
	const domain = entityId.split(".")[0];
	const svc = useService(
		domain === "input_boolean" ? "inputBoolean" : "switch",
	);
	const isOn = entity.state === "on";

	const toggle = useCallback(async (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		try {
			toast.loading(isOn ? "Turning off..." : "Turning on...", { id: entityId, duration: 1000 });
			await svc.toggle({ target: entityId });
			toast.success(isOn ? "Turned off" : "Turned on", { id: entityId, duration: 2000 });
		} catch (e: unknown) {
			const message = e instanceof Error ? e.message : "Failed";
			toast.error(message, { id: entityId });
		}
	}, [svc, entityId, isOn]);

	return (
		<Card
			onClick={toggle}
			className={cn(
				"group relative flex flex-col justify-between overflow-hidden p-4 cursor-pointer transition-all duration-300",
				"h-full rounded-[24px]",
				"bg-zinc-900/40 backdrop-blur-3xl",
				"ring-1 ring-white/10 ring-inset",
				"border border-white/5",
				"shadow-xl shadow-black/20",
				"hover:bg-zinc-900/50 active:scale-[0.98]",
				isOn && "shadow-[0_0_30px_-5px_rgba(255,255,255,0.1)]",
				className
			)}
		>
			{/* Ambient Glow Effect */}
			<div
				className={cn(
					"absolute inset-0 opacity-0 transition-opacity duration-500 pointer-events-none",
					isOn ? "opacity-100" : "group-hover:opacity-20"
				)}
				style={{
					background: "radial-gradient(circle at top left, rgba(255,255,255,0.2), transparent 70%)"
				}}
			/>

			<div className="relative z-10 flex items-start justify-between">
				<div
					className={cn(
						"flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300",
						isOn
							? "bg-white text-black shadow-lg scale-110"
							: "bg-white/10 text-white group-hover:bg-white/20"
					)}
				>
					<Power className="w-5 h-5" />
				</div>
			</div>

			<div className="relative z-10 mt-auto">
				<h3 className="font-semibold text-white text-[15px] leading-snug line-clamp-2 tracking-wide">
					{titleOverride || entity.attributes.friendly_name}
				</h3>
				<p className={cn(
					"text-xs font-medium mt-1 transition-colors duration-300",
					isOn ? "text-white/90" : "text-white/50"
				)}>
					{isOn ? "On" : "Off"}
				</p>
			</div>
		</Card>
	);
};
