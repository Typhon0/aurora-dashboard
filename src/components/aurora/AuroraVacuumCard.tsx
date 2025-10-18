// src/components/aurora/AuroraVacuumCard.tsx
import { useCallback } from "react";
import { useEntity, useService, type EntityName } from "@hakit/core";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ControlToggle } from "@/components/shared";
import { Home } from "lucide-react";
import { toast } from "sonner";

interface Props {
	entityId: EntityName;
	className?: string;
}

export function AuroraVacuumCard({ entityId, className }: Props) {
	const entity = useEntity(entityId);
	const vacuum = useService("vacuum");

	const start = useCallback(async () => {
		try {
			toast.loading("Starting…", { id: entityId });
			await vacuum.start({ target: entityId });
			toast.success("Started", { id: entityId });
		} catch (e: unknown) {
			const msg =
				e instanceof Error
					? e.message
					: typeof e === "object" && e && "message" in e
					? String((e as { message?: unknown }).message)
					: "Failed";
			toast.error(msg, { id: entityId });
		}
	}, [vacuum, entityId]);
	const pause = useCallback(async () => {
		try {
			await vacuum.pause({ target: entityId });
			toast.success("Paused", { id: entityId });
		} catch (e: unknown) {
			const msg =
				e instanceof Error
					? e.message
					: typeof e === "object" && e && "message" in e
					? String((e as { message?: unknown }).message)
					: "Failed";
			toast.error(msg, { id: entityId });
		}
	}, [vacuum, entityId]);
	const dock = useCallback(async () => {
		try {
			await vacuum.returnToBase({ target: entityId });
			toast.success("Returning to base", { id: entityId });
		} catch (e: unknown) {
			const msg =
				e instanceof Error
					? e.message
					: typeof e === "object" && e && "message" in e
					? String((e as { message?: unknown }).message)
					: "Failed";
			toast.error(msg, { id: entityId });
		}
	}, [vacuum, entityId]);

	const isCleaning = entity.state === "cleaning" || entity.state === "on";

	return (
		<Card className={`animate-fade-pop ${className ?? ""}`}>
			<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
				<CardTitle className="text-white text-base font-semibold">
					{entity.attributes.friendly_name || "Vacuum"}
				</CardTitle>
				<span className="text-xs text-white/70">
					{(entity.state || "idle").toUpperCase()}
				</span>
			</CardHeader>
			<CardContent className="p-5 pt-0 space-y-4">
				<div className="flex items-center justify-center">
					<ControlToggle
						checked={isCleaning}
						vertical={false}
						thickness={48}
						showLabel
						onLabel="Pause"
						offLabel="Start"
						onChange={(next) => {
							if (next) start();
							else pause();
						}}
						className="w-40 h-12"
					/>
				</div>
				<div className="flex justify-center">
					<Button
						variant="ghost"
						className="bg-white/10 hover:bg-white/20 border border-white/20"
						onClick={dock}
					>
						<Home className="w-4 h-4" />
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}
