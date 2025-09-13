// src/components/aurora/AuroraNumberCard.tsx
import React, { useCallback, useState } from "react";
import { useEntity, useService, type EntityName } from "@hakit/core";
import { AuroraCard } from "./base/AuroraCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Minus, Plus } from "lucide-react";
import { toast } from "sonner";

interface Props {
	entityId: EntityName;
	className?: string;
}

export const AuroraNumberCard: React.FC<Props> = ({ entityId, className }) => {
	const entity = useEntity(entityId);
	const inputNumber = useService("input_number");
	const value = parseFloat(entity.state) || 0;
	const min = entity.attributes.min ?? 0;
	const max = entity.attributes.max ?? 100;
	const step = entity.attributes.step ?? 1;
	const unit = entity.attributes.unit_of_measurement || "";
	const [direct, setDirect] = useState("");

	const setValue = useCallback(
		async (v: number) => {
			const clamped = Math.max(min, Math.min(max, v));
			try {
				toast.loading("Updating…", { id: entityId });
				await inputNumber.setValue({
					target: entityId,
					serviceData: { value: clamped },
				});
				toast.success(`${clamped}${unit}`, { id: entityId });
			} catch (e: any) {
				toast.error(e.message ?? "Failed", { id: entityId });
			}
		},
		[inputNumber, entityId, min, max, unit],
	);

	return (
		<AuroraCard title={entity.attributes.friendly_name} className={className}>
			<div className="space-y-3">
				<div className="text-3xl font-bold text-blue-400">
					{value}
					{unit}
				</div>
				<div className="text-sm text-white/60">
					Range: {min}-{max}
					{unit}
				</div>

				<div className="flex items-center gap-2">
					<Button
						onClick={() => setValue(value - step)}
						className="bg-white/10 hover:bg-white/20 border border-white/20"
					>
						<Minus className="w-4 h-4" />
					</Button>
					<div className="flex-1 text-center font-mono text-white bg-white/10 rounded py-2">
						{value.toFixed(step < 1 ? 1 : 0)}
						{unit}
					</div>
					<Button
						onClick={() => setValue(value + step)}
						className="bg-white/10 hover:bg-white/20 border border-white/20"
					>
						<Plus className="w-4 h-4" />
					</Button>
				</div>

				<div className="flex items-center gap-2">
					<Input
						type="number"
						value={direct}
						onChange={(e) => setDirect(e.target.value)}
						onKeyDown={(e) =>
							e.key === "Enter" &&
							!isNaN(parseFloat(direct)) &&
							setValue(parseFloat(direct))
						}
						min={min}
						max={max}
						step={step}
						placeholder={`${min}-${max}`}
						className="bg-white/10 border-white/20 text-white"
					/>
					<Button
						disabled={direct === ""}
						onClick={() =>
							!isNaN(parseFloat(direct)) && setValue(parseFloat(direct))
						}
					>
						OK
					</Button>
				</div>
			</div>
		</AuroraCard>
	);
};
