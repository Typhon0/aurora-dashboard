import React from "react";
import { useEntity, type EntityName } from "@hakit/core";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { cn } from "../../lib/utils";

interface Props {
	entityIds: EntityName[];
	title?: string;
	className?: string;
	emptyMessage?: string;
}

// Inner component to render individual entity row
const EntityRow = ({ entityId }: { entityId: EntityName }) => {
    const entity = useEntity(entityId);
    const formatted = React.useMemo(() => {
        const state = entity.state;
        const unit = entity.attributes.unit_of_measurement;
        if (state === undefined || state === null) return "--";
        if (unit) return `${state} ${unit}`;
        return state;
    }, [entity.state, entity.attributes.unit_of_measurement]);

    return (
        <li className="py-3 flex items-center justify-between text-white/80 first:pt-0 last:pb-0">
            <div className="flex items-center gap-3 min-w-0">
                {/* Optional: Add icon here if needed */}
                <span className="truncate text-sm font-medium text-white/90">
                    {entity.attributes.friendly_name || entityId}
                </span>
            </div>
            <span className="text-sm text-white/60 font-mono tracking-tight">
                {formatted}
            </span>
        </li>
    );
};

export function AuroraEntitiesCard({
	entityIds,
	title = "Entities",
	className,
	emptyMessage = "No entities",
}: Props) {
	return (
		<Card className={cn("animate-fade-pop border-0 p-6 overflow-hidden bg-white/5 backdrop-blur-lg", className)}>
			<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 p-0 mb-4">
				<CardTitle className="text-white text-base font-semibold pl-1 border-l-2 border-blue-500/50">
                    <span className="ml-2">{title}</span>
                </CardTitle>
			</CardHeader>
			<CardContent className="p-0">
				{(!entityIds || entityIds.length === 0) ? (
					<div className="text-xs text-white/40 italic py-4 text-center border border-dashed border-white/10 rounded-xl">
                        {emptyMessage}
                    </div>
				) : (
					<ul className="bg-white/5 rounded-2xl p-4 divide-y divide-white/5 backdrop-blur-sm border border-white/5 shadow-inner">
						{entityIds.map((id) => (
							<EntityRow key={id} entityId={id} />
						))}
					</ul>
				)}
			</CardContent>
		</Card>
	);
}
