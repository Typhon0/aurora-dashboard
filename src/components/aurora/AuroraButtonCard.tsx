// src/components/aurora/AuroraButtonCard.tsx
import { useCallback } from "react";
import { ControlToggle } from "@/components/shared";
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
			const serviceObj = svc as unknown as Record<string, unknown>;
			if (domain === "button" && typeof serviceObj.press === "function") {
				await (
					serviceObj.press as (o: { target: EntityName }) => Promise<void>
				)({
					target: entityId,
				});
			} else if (typeof serviceObj.toggle === "function") {
				await (
					serviceObj.toggle as (o: { target: EntityName }) => Promise<void>
				)({
					target: entityId,
				});
			}
			toast.success("Done", { id: entityId });
		} catch (e: unknown) {
			toast.error(e instanceof Error ? e.message : "Failed", { id: entityId });
		}
	}, [svc, entityId, domain]);

	const isOn = entity.state === "on";

	return (
		<Card className={`animate-fade-pop ${className ?? ""} overflow-hidden`}>
			<CardHeader className="flex items-center justify-between pb-3 flex-wrap gap-2">
				<div className="flex items-center gap-2 min-w-0 max-w-full">
					{domain === "button" ? (
						<MousePointerClick className="w-5 h-5 text-blue-300" />
					) : (
						<Power className="w-5 h-5 text-blue-300" />
					)}
					<CardTitle className="text-white text-base font-semibold truncate max-w-[12ch] sm:max-w-[20ch]">
						{title || entity.attributes.friendly_name || "Action"}
					</CardTitle>
				</div>
				<Badge className="bg-white/20 text-white/70 shrink-0">
					{isOn ? "ON" : "OFF"}
				</Badge>
			</CardHeader>
			<CardContent className="p-5 pt-0">
				{domain === "button" ? (
					<Button
						onClick={run}
						className="w-full bg-white/10 hover:bg-white/20 border border-white/20 text-sm truncate"
					>
						Press
					</Button>
				) : (
					<ControlToggle
						checked={isOn}
						vertical={false}
						thickness={42}
						showLabel
						onLabel="On"
						offLabel="Off"
						onChange={() => run()}
						className="w-full h-11"
					/>
				)}
			</CardContent>
		</Card>
	);
}
