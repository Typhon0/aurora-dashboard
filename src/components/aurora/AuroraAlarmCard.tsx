// src/components/aurora/AuroraAlarmCard.tsx
import React, { useCallback } from "react";
import { useEntity, useService, type EntityName } from "@hakit/core";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, ShieldAlert, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

interface Props {
	entityId: EntityName;
	className?: string;
	code?: string;
}

export function AuroraAlarmCard({ entityId, className, code }: Props) {
	const entity = useEntity(entityId);
	const alarm = useService("alarm_control_panel");

	const state = (entity.state || "disarmed") as string;

	const call = useCallback(
		async (service: "alarmArmHome" | "alarmArmAway" | "alarmDisarm") => {
			try {
				toast.loading("Updating alarm…", { id: entityId });
				const serviceData: Record<string, any> = {};
				if (code) serviceData.code = code;
				if (service === "alarmArmHome") {
					await alarm.alarmArmHome({ target: entityId, serviceData });
				} else if (service === "alarmArmAway") {
					await alarm.alarmArmAway({ target: entityId, serviceData });
				} else {
					await alarm.alarmDisarm({ target: entityId, serviceData });
				}
				toast.success("Alarm updated", { id: entityId });
			} catch (e: any) {
				toast.error(e?.message ?? "Failed", { id: entityId });
			}
		},
		[alarm, entityId, code],
	);

	const icon = state.includes("armed") ? (
		<ShieldCheck className="w-5 h-5 text-green-400" />
	) : state.includes("pending") || state.includes("triggered") ? (
		<ShieldAlert className="w-5 h-5 text-orange-400" />
	) : (
		<Shield className="w-5 h-5 text-white/60" />
	);

	return (
		<Card
			className={`backdrop-blur-md bg-white/10 border border-white/20 hover:bg-white/15 transition-all duration-300 ${className || ""}`}
		>
			<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
				<div className="flex items-center gap-2">
					{icon}
					<CardTitle className="text-white text-base font-semibold">
						{entity.attributes.friendly_name || "Alarm"}
					</CardTitle>
				</div>
				<Badge className="bg-white/20 text-white/80">
					{state.toUpperCase()}
				</Badge>
			</CardHeader>
			<CardContent className="p-5 pt-0">
				<div className="flex items-center justify-center gap-3">
					<Button
						className="bg-white/10 hover:bg-white/20 border border-white/20"
						onClick={() => call("alarmArmHome")}
					>
						Arm Home
					</Button>
					<Button
						className="bg-white/10 hover:bg-white/20 border border-white/20"
						onClick={() => call("alarmArmAway")}
					>
						Arm Away
					</Button>
					<Button
						className="bg-white/10 hover:bg-white/20 border border-white/20"
						onClick={() => call("alarmDisarm")}
					>
						Disarm
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}
