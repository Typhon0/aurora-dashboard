// src/components/aurora/AuroraSceneCard.tsx
import { useCallback } from "react";
import { useEntity, useService, type EntityName } from "@hakit/core";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";

interface Props {
	entityId: EntityName;
	title?: string;
	className?: string;
}

export function AuroraSceneCard({ entityId, title, className }: Props) {
	const entity = useEntity(entityId);
	const scene = useService("scene");
	const name = title || entity.attributes.friendly_name || "Scene";

	const activate = useCallback(async () => {
		try {
			toast.loading("Activating…", { id: entityId });
			await scene.turnOn({ target: entityId });
			toast.success("Scene activated", { id: entityId });
		} catch (e: any) {
			toast.error(e?.message ?? "Failed", { id: entityId });
		}
	}, [scene, entityId]);

	return (
		<Card
			className={`backdrop-blur-md bg-white/10 border border-white/20 hover:bg-white/15 transition-all duration-300 ${className || ""}`}
		>
			<CardHeader className="flex items-center justify-between pb-3">
				<div className="flex items-center gap-2">
					<Sparkles className="w-5 h-5 text-purple-300" />
					<CardTitle className="text-white text-base font-semibold">
						{name}
					</CardTitle>
				</div>
			</CardHeader>
			<CardContent className="p-5 pt-0">
				<Button
					onClick={activate}
					className="w-full bg-white/10 hover:bg-white/20 border border-white/20"
				>
					Activate
				</Button>
			</CardContent>
		</Card>
	);
}
