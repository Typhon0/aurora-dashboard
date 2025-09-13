// src/components/aurora/AuroraTriggerCard.tsx
import React, { useCallback } from "react";
import { useService } from "@hakit/core";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Props {
	domain: "script" | "scene" | "button";
	target: string;
	title?: string;
	className?: string;
}

export function AuroraTriggerCard({
	domain,
	target,
	title = "Trigger",
	className,
}: Props) {
	const svc = useService(domain as any);

	const run = useCallback(async () => {
		try {
			toast.loading("Running…", { id: target });
			if (domain === "script") await (svc as any).turnOn({ target });
			else if (domain === "scene")
				(await (svc as any).turnOn?.({ target })) ??
					(svc as any).activate?.({ target });
			else await (svc as any).press({ target });
			toast.success("Done", { id: target });
		} catch (e: any) {
			toast.error(e?.message ?? "Failed", { id: target });
		}
	}, [svc, domain, target]);

	return (
		<Card
			className={`backdrop-blur-md bg-white/10 border border-white/20 hover:bg-white/15 transition-all duration-300 ${className || ""}`}
		>
			<CardHeader className="pb-3">
				<CardTitle className="text-white text-base font-semibold">
					{title}
				</CardTitle>
			</CardHeader>
			<CardContent className="p-5 pt-0">
				<Button
					onClick={run}
					className="w-full bg-white/10 hover:bg-white/20 border border-white/20"
				>
					Run
				</Button>
			</CardContent>
		</Card>
	);
}
