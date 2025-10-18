// src/components/aurora/AuroraGarbageCollectionCard.tsx
import React from "react";
import { useEntity, type EntityName } from "@hakit/core";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface Props {
	entityId: EntityName;
	className?: string;
}

export function AuroraGarbageCollectionCard({ entityId, className }: Props) {
	const entity = useEntity(entityId);
	const next = (entity.attributes as any)?.next_date as string | undefined;
	const friendly = next
		? new Date(next).toLocaleDateString("fr-FR", {
				weekday: "long",
				day: "2-digit",
				month: "long",
			})
		: "—";
	const type =
		(entity.attributes as any)?.type ||
		entity.attributes.friendly_name ||
		"Garbage";

	return (
		<Card className={`animate-fade-pop ${className ?? ""}`}>
			<CardHeader className="pb-3">
				<CardTitle className="text-white text-base font-semibold">
					{type}
				</CardTitle>
			</CardHeader>
			<CardContent className="p-5 pt-0">
				<div className="text-white/80">Next collection:</div>
				<div className="text-2xl font-bold text-white mt-1">{friendly}</div>
			</CardContent>
		</Card>
	);
}
