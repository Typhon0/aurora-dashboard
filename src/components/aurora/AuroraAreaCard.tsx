// src/components/aurora/AuroraAreaCard.tsx
import React from "react";
import { useEntity, type EntityName } from "@hakit/core";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";

interface Props {
	title: string;
	entityIds: EntityName[];
	className?: string;
}

export function AuroraAreaCard({ title, entityIds, className }: Props) {
	return (
		<Card className={`animate-fade-pop ${className ?? ""}`}>
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
