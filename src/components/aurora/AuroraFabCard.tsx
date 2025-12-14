// src/components/aurora/AuroraFabCard.tsx
import React, { useCallback } from "react";
import { useService } from "@hakit/core";
import { Button } from "../ui/button";
import { Plus } from "lucide-react";
import { toast } from "sonner";

interface Props {
	domain: "script" | "scene" | "button";
	target: string;
	className?: string;
}

export function AuroraFabCard({ domain, target, className }: Props) {
	const svc = useService(domain as any);
	const run = useCallback(async () => {
		try {
			toast.loading("Running…", { id: target });
			if (domain === "script") await (svc as any).turnOn({ target });
			else if (domain === "scene") await (svc as any).turnOn({ target });
			else await (svc as any).press({ target });
			toast.success("Done", { id: target });
		} catch (e: any) {
			toast.error(e?.message ?? "Failed", { id: target });
		}
	}, [svc, domain, target]);

	return (
		<div className={`fixed bottom-6 right-6 ${className || ""}`}>
			<Button
				onClick={run}
				className="rounded-full w-16 h-16 bg-blue-500/20 backdrop-blur-xl border border-white/20 hover:bg-blue-500/30 shadow-[0_0_30px_rgba(59,130,246,0.3)] transition-all duration-300 hover:scale-110"
			>
				<Plus className="w-8 h-8 text-white" />
			</Button>
		</div>
	);
}
