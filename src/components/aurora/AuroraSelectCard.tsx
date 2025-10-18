import React, { useCallback } from "react";
import { useEntity, useService, type EntityName } from "@hakit/core";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export function AuroraSelectCard({
	entityId,
	className,
}: {
	entityId: EntityName;
	className?: string;
}) {
	const entity = useEntity(entityId);
	const inputSelect = useService("input_select");

	const options: string[] = entity.attributes.options || [];
	const value = String(entity.state ?? "");

	const setOption = useCallback(
		async (option: string) => {
			try {
				toast.loading("Changing…", { id: entityId });
				await inputSelect.selectOption({
					target: entityId,
					serviceData: { option },
				});
				toast.success(`Selected: ${option}`, { id: entityId });
			} catch (e: any) {
				toast.error(e?.message ?? "Failed", { id: entityId });
			}
		},
		[inputSelect, entityId],
	);

	return (
		<Card className={`animate-fade-pop ${className ?? ""}`}>
			<CardHeader className="pb-3">
				<CardTitle className="text-white text-base font-semibold">
					{entity.attributes.friendly_name || "Select"}
				</CardTitle>
			</CardHeader>
			<CardContent className="p-5 pt-0">
				<Select value={value} onValueChange={setOption}>
					<SelectTrigger className="bg-white/10 border-white/20 text-white">
						<SelectValue placeholder="Choose…" />
					</SelectTrigger>
					<SelectContent className="bg-slate-900 text-white border-white/20">
						{options.map((opt) => (
							<SelectItem key={opt} value={opt}>
								{opt}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</CardContent>
		</Card>
	);
}
