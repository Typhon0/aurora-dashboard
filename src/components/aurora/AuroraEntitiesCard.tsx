// src/components/aurora/AuroraEntitiesCard.tsx
import React from "react";
import { useEntity, type EntityName } from "@hakit/core";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface Props {
	entityIds: EntityName[];
	title?: string;
	className?: string;
}

export function AuroraEntitiesCard({
	entityIds,
	title = "Entities",
	className,
}: Props) {
	return (
		<Card
			className={`backdrop-blur-md bg-white/10 border border-white/20 hover:bg-white/15 transition-all duration-300 ${className || ""}`}
		>
			<CardHeader className="pb-3">
				<CardTitle className="text-white text-base font-semibold">
					{title}
				</CardTitle>
			</CardHeader>
			<CardContent className="p-5 pt-0">
				<ul className="divide-y divide-white/10">
					{entityIds.map((id) => {
						const e = useEntity(id);
						return (
							<li
								key={id}
								className="py-2 flex items-center justify-between text-white/80"
							>
								<span className="truncate">
									{e.attributes.friendly_name || id}
								</span>
								<span className="text-white/60">{String(e.state ?? "--")}</span>
							</li>
						);
					})}
				</ul>
			</CardContent>
		</Card>
	);
}
