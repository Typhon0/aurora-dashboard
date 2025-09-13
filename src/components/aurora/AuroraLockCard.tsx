// src/components/aurora/AuroraLockCard.tsx
import React, { useCallback } from "react";
import { useEntity, useService, type EntityName } from "@hakit/core";
import { AuroraCard } from "./base/AuroraCard";
import { Button } from "@/components/ui/button";
import { Lock, Unlock } from "lucide-react";
import { toast } from "sonner";

interface Props {
	entityId: EntityName;
	className?: string;
}

export const AuroraLockCard: React.FC<Props> = ({ entityId, className }) => {
	const entity = useEntity(entityId);
	const lockSvc = useService("lock");

	const isLocked = entity.state === "locked";

	const toggle = useCallback(async () => {
		try {
			toast.loading(isLocked ? "Unlocking…" : "Locking…", { id: entityId });
			if (isLocked) await lockSvc.unlock({ target: entityId });
			else await lockSvc.lock({ target: entityId });
			toast.success(isLocked ? "Unlocked" : "Locked", { id: entityId });
		} catch (e: any) {
			toast.error(e.message ?? "Failed", { id: entityId });
		}
	}, [lockSvc, entityId, isLocked]);

	return (
		<AuroraCard
			title={entity.attributes.friendly_name}
			className={className}
			state={isLocked ? "active" : "default"}
		>
			<div className="flex items-center justify-between">
				<div className="text-white/80">{isLocked ? "Locked" : "Unlocked"}</div>
				<Button
					onClick={toggle}
					className="bg-white/10 hover:bg-white/20 border border-white/20"
				>
					{isLocked ? (
						<Unlock className="w-4 h-4" />
					) : (
						<Lock className="w-4 h-4" />
					)}
				</Button>
			</div>
		</AuroraCard>
	);
};
