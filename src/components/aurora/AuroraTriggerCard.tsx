// src/components/aurora/AuroraTriggerCard.tsx
import React, { useCallback } from "react";
import { useService } from "@hakit/core";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Props {
	domain: "script" | "scene" | "button";
	target: string; // EntityName, typed looser if multi-domain UI
	service?: "turn_on" | "press" | "activate";
	title?: string;
	className?: string;
}

export function AuroraTriggerCard({
	domain,
	target,
	service,
	title = "Trigger",
	className,
}: Props) {
	const svc = useService(domain as any);

	const run = useCallback(async () => {
		try {
			toast.loading("Running…", { id: target });
			switch (domain) {
				case "script":
					await (svc as any).turnOn({ target });
					break;
				case "scene":
					(await (svc as any).turnOn?.({ target })) ??
						(svc as any).activate?.({ target });
					break;
				case "button":
					await (svc as any).press({ target });
					break;
				default:
					if (service) await (svc as any)[service]({ target });
			}
			toast.success("Done", { id: target });
		} catch (e: any) {
			toast.error(e?.message ?? "Failed", { id: target });
		}
	}, [svc, domain, service, target]);

	return (
		<Card className={`animate-fade-pop ${className ?? ""}`}>
			<CardHeader className="pb-3">
				<CardTitle className="text-white text-base font-semibold">
					{title}
				</CardTitle>
			</CardHeader>
			<CardContent className="p-5 pt-0">
				<Button
					onClick={run}
					className="bg-white/10 hover:bg-white/20 border border-white/20 w-full"
				>
					Run
				</Button>
			</CardContent>
		</Card>
	);
}
