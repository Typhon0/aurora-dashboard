import React, { useCallback } from "react";
import { useEntity, useService, type EntityName } from "@hakit/core";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Square } from "lucide-react";
import { toast } from "sonner";

export function AuroraCover({
	entityId,
	className,
}: {
	entityId: EntityName;
	className?: string;
}) {
	const entity = useEntity(entityId);
	const cover = useService("cover");

	const open = useCallback(async () => {
		try {
			toast.loading("Opening…", { id: entityId });
			await cover.openCover({ target: entityId });
			toast.success("Opening", { id: entityId });
		} catch (e: any) {
			toast.error(e?.message ?? "Failed", { id: entityId });
		}
	}, [cover, entityId]);
	const close = useCallback(async () => {
		try {
			toast.loading("Closing…", { id: entityId });
			await cover.closeCover({ target: entityId });
			toast.success("Closing", { id: entityId });
		} catch (e: any) {
			toast.error(e?.message ?? "Failed", { id: entityId });
		}
	}, [cover, entityId]);
	const stop = useCallback(async () => {
		try {
			await cover.stopCover({ target: entityId });
			toast.success("Stopped", { id: entityId });
		} catch (e: any) {
			toast.error(e?.message ?? "Failed", { id: entityId });
		}
	}, [cover, entityId]);

	const pos = entity.attributes.current_position as number | undefined;

	return (
		<Card
			className={`backdrop-blur-md bg-white/10 border border-white/20 hover:bg-white/15 transition-all duration-300 ${className || ""}`}
		>
			<CardHeader className="pb-3">
				<CardTitle className="text-white text-base font-semibold">
					{entity.attributes.friendly_name || "Cover"}
				</CardTitle>
			</CardHeader>
			<CardContent className="p-5 pt-0">
				{typeof pos === "number" && (
					<div className="mb-4">
						<div className="flex items-center justify-between text-sm text-white/70">
							<span>Position</span>
							<span>{pos}%</span>
						</div>
						<div className="w-full h-2 bg-white/20 rounded">
							<div
								className="h-2 bg-blue-400 rounded"
								style={{ width: `${pos}%` }}
							/>
						</div>
					</div>
				)}
				<div className="flex items-center justify-center gap-3">
					<Button
						onClick={open}
						className="bg-white/10 hover:bg-white/20 border border-white/20"
					>
						<ChevronUp className="w-4 h-4" />
					</Button>
					<Button
						onClick={stop}
						className="bg-white/10 hover:bg-white/20 border border-white/20"
					>
						<Square className="w-4 h-4" />
					</Button>
					<Button
						onClick={close}
						className="bg-white/10 hover:bg-white/20 border border-white/20"
					>
						<ChevronDown className="w-4 h-4" />
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}
