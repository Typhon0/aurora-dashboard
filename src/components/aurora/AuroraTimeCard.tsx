// src/components/aurora/AuroraTimeCard.tsx
import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface Props {
	format?: Intl.DateTimeFormatOptions;
	className?: string;
}

export function AuroraTimeCard({ format, className }: Props) {
	const [now, setNow] = useState(new Date());
	useEffect(() => {
		const t = setInterval(() => setNow(new Date()), 1000);
		return () => clearInterval(t);
	}, []);
	const opts: Intl.DateTimeFormatOptions = format || {
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
	};

	return (
		<Card className={`animate-fade-pop ${className ?? ""}`}>
			<CardHeader className="pb-3">
				<CardTitle className="text-white text-base font-semibold">
					Time
				</CardTitle>
			</CardHeader>
			<CardContent className="p-5 pt-0">
				<div className="text-4xl font-bold text-white">
					{now.toLocaleTimeString("fr-FR", opts)}
				</div>
				<div className="text-sm text-white/60">
					{now.toLocaleDateString("fr-FR", {
						weekday: "long",
						day: "2-digit",
						month: "long",
					})}
				</div>
			</CardContent>
		</Card>
	);
}
