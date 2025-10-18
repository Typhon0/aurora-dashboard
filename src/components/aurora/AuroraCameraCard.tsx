// src/components/aurora/AuroraCameraCard.tsx
import { useEntity, type EntityName } from "@hakit/core";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface Props {
	entityId: EntityName;
	className?: string;
}

export function AuroraCameraCard({ entityId, className }: Props) {
	const entity = useEntity(entityId);
	const image = (entity.attributes as { entity_picture?: string }).entity_picture;

	return (
		<Card className={`animate-fade-pop ${className ?? ""}`}>
			<CardHeader className="pb-3">
				<CardTitle className="text-white text-base font-semibold">
					{entity.attributes.friendly_name || "Camera"}
				</CardTitle>
			</CardHeader>
			<CardContent className="p-0">
				{image ? (
					<img
						src={image}
						alt={entity.attributes.friendly_name || "Camera"}
						className="w-full h-56 object-cover rounded-b-[calc(var(--radius))]"
					/>
				) : (
					<div className="h-56 flex items-center justify-center text-white/60">
						No image
					</div>
				)}
			</CardContent>
		</Card>
	);
}
