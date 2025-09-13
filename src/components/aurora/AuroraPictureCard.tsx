// src/components/aurora/AuroraPictureCard.tsx
import { useEntity, type EntityName } from "@hakit/core";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface Props {
	entityId: EntityName;
	title?: string;
	className?: string;
}

export function AuroraPictureCard({ entityId, title, className }: Props) {
	const entity = useEntity(entityId);
	const image = (entity.attributes as any)?.entity_picture as
		| string
		| undefined;

	return (
		<Card
			className={`backdrop-blur-md bg-white/10 border border-white/20 hover:bg-white/15 transition-all duration-300 ${className || ""}`}
		>
			{(title || entity.attributes.friendly_name) && (
				<CardHeader className="pb-3">
					<CardTitle className="text-white text-base font-semibold">
						{title || entity.attributes.friendly_name || "Picture"}
					</CardTitle>
				</CardHeader>
			)}
			<CardContent className="p-0">
				{image ? (
					<img
						src={image}
						alt={entity.attributes.friendly_name || "Picture"}
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
