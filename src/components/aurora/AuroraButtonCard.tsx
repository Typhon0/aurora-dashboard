// src/components/aurora/AuroraButtonCard.tsx
import React, { useCallback } from "react";
import { useEntity, useService, type EntityName } from "@hakit/core";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Power, MousePointerClick } from "lucide-react";
import { toast } from "sonner";

interface Props {
	entityId: EntityName;
	className?: string;
	title?: string;
}

export function AuroraButtonCard({ entityId, className, title }: Props) {
	const entity = useEntity(entityId);
	const domain = entityId.split(".") as unknown as
		| "button"
		| "switch"
		| "input_boolean";
	const svc = useService(domain);

	const run = useCallback(async () => {
		try {
			toast.loading("Running…", { id: entityId });
			if (domain === "button") await (svc as any).press({ target: entityId });
			else await (svc as any).toggle({ target: entityId });
			toast.success("Done", { id: entityId });
		} catch (e: any) {
			toast.error(e?.message ?? "Failed", { id: entityId });
		}
	}, [svc, entityId, domain]);

	const isOn = entity.state === "on";

	return (
		<Card
			className={`backdrop-blur-md bg-white/10 border border-white/20 hover:bg-white/15 transition-all duration-300 ${className || ""}`}
		>
			<CardHeader className="flex items-center justify-between pb-3">
				<div className="flex items-center gap-2">
					{domain === "button" ? (
						<MousePointerClick className="w-5 h-5 text-blue-300" />
					) : (
						<Power className="w-5 h-5 text-blue-300" />
					)}
					<CardTitle className="text-white text-base font-semibold">
						{title || entity.attributes.friendly_name || "Action"}
					</CardTitle>
				</div>
				<Badge className="bg-white/20 text-white/70">
					{isOn ? "ON" : "OFF"}
				</Badge>
			</CardHeader>
			<CardContent className="p-5 pt-0">
				<Button
					onClick={run}
					className="w-full bg-white/10 hover:bg-white/20 border border-white/20"
				>
					{domain === "button" ? "Press" : isOn ? "Toggle Off" : "Toggle On"}
				</Button>
			</CardContent>
		</Card>
	);
}
