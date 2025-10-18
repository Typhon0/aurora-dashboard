// src/components/aurora/AuroraGaugeCard.tsx
// Generic numeric gauge (maps to sensor/number/energy style value display).
import { AuroraCard } from "./base/AuroraCard";
import { useEntity, type EntityName } from "@hakit/core";
import { Progress } from "@/components/ui/progress";
import { Circle, Gauge } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
	entityId: EntityName; // numeric state expected
	min?: number;
	max?: number;
	unit?: string; // override unit_of_measurement
	size?: "small" | "medium" | "large";
	className?: string;
	titleOverride?: string;
	thresholds?: Array<{ value: number; className: string }>; // color bands
	format?: (value: number) => string;
}

export const AuroraGaugeCard: React.FC<Props> = ({
	entityId,
	min = 0,
	max = 100,
	unit,
	size = "medium",
	className,
	titleOverride,
	thresholds,
	format,
}) => {
	const entity = useEntity(entityId);
	const raw = parseFloat(entity.state);
	const value = Number.isFinite(raw) ? raw : 0;
	const pct = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
	const friendly = titleOverride || entity.attributes.friendly_name || entityId;
	const unitResolved = unit || entity.attributes.unit_of_measurement || "";

	let dynamicClass = "";
	if (thresholds) {
		for (let i = thresholds.length - 1; i >= 0; i--) {
			if (value >= thresholds[i].value) {
				dynamicClass = thresholds[i].className;
				break;
			}
		}
	}

	return (
		<AuroraCard
			size={size}
			className={className}
			state={"default"}
			title={friendly}
			icon={<Gauge className="w-5 h-5 text-white/70" />}
		>
			<div className="flex flex-col gap-3 pt-2">
				<div className="flex items-baseline gap-2">
					<div
						className={cn("text-3xl font-semibold text-white", dynamicClass)}
					>
						{format ? format(value) : value.toFixed(0)}
					</div>
					<div className="text-sm text-white/60">{unitResolved}</div>
				</div>
				<Progress
					value={pct}
					className={cn(
						"h-2 bg-white/15",
						dynamicClass && "[&>div]:transition-colors",
						dynamicClass,
					)}
				/>
				<div className="flex items-center justify-between text-[10px] text-white/40">
					<span>{min}</span>
					<span className="flex items-center gap-1">
						<Circle className="w-2 h-2 text-white/50" /> {pct.toFixed(0)}%
					</span>
					<span>{max}</span>
				</div>
			</div>
		</AuroraCard>
	);
};
