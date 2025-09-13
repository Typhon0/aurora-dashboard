// src/components/aurora/AuroraCalendarCard.tsx
import React, { useMemo } from "react";
import { useEntity, type EntityName } from "@hakit/core";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface Props {
	entityId: EntityName;
	limit?: number;
	className?: string;
}

export function AuroraCalendarCard({ entityId, limit = 5, className }: Props) {
	const entity = useEntity(entityId);
	const events = useMemo(
		() => ((entity.attributes as any)?.events as Array<any>) || [],
		[entity.attributes],
	);
	const list = events.slice(0, limit);

	return (
		<Card
			className={`backdrop-blur-md bg-white/10 border border-white/20 hover:bg-white/15 transition-all duration-300 ${className || ""}`}
		>
			<CardHeader className="pb-3">
				<CardTitle className="text-white text-base font-semibold">
					{entity.attributes.friendly_name || "Calendar"}
				</CardTitle>
			</CardHeader>
			<CardContent className="p-5 pt-0">
				{list.length === 0 ? (
					<div className="text-white/60 text-sm">No upcoming events</div>
				) : (
					<ul className="space-y-2 text-white/80 text-sm">
						{list.map((e, idx) => {
							const start = e.start ? new Date(e.start) : null;
							const date = start
								? start.toLocaleString("fr-FR", {
										day: "2-digit",
										month: "short",
										hour: "2-digit",
										minute: "2-digit",
									})
								: "--";
							return (
								<li key={idx} className="border-l-2 border-blue-400/70 pl-3">
									<div className="font-medium text-white truncate">
										{e.summary || "Event"}
									</div>
									<div className="text-white/60">{date}</div>
								</li>
							);
						})}
					</ul>
				)}
			</CardContent>
		</Card>
	);
}
