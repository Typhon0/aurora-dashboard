// src/components/aurora/AuroraEntitiesCard.tsx
import type { EntityName } from "@hakit/core";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export interface AuroraEntityLike {
	id: EntityName | string;
	state: unknown;
	attributes: { friendly_name?: string; [key: string]: unknown };
}

interface Props {
	entities: AuroraEntityLike[];
	title?: string;
	className?: string;
	emptyMessage?: string;
}

export function AuroraEntitiesCard({
	entities,
	title = "Entities",
	className,
	emptyMessage = "No entities",
}: Props) {
	return (
		<Card className={`animate-fade-pop ${className ?? ""}`}>
			<CardHeader className="pb-3">
				<CardTitle className="text-white text-base font-semibold">{title}</CardTitle>
			</CardHeader>
			<CardContent className="p-5 pt-0">
				{entities.length === 0 ? (
					<div className="text-xs text-white/40 italic py-2">{emptyMessage}</div>
				) : (
					<ul className="divide-y divide-white/10">
						{entities.map((item) => (
							<li
								key={item.id}
								className="py-2 flex items-center justify-between text-white/80"
							>
								<span className="truncate">{item.attributes.friendly_name || item.id}</span>
								<span className="text-white/60">{String(item.state ?? "--")}</span>
							</li>
						))}
					</ul>
				)}
			</CardContent>
		</Card>
	);
}
