// src/components/aurora/AuroraSidebarCard.tsx
import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";

interface NavItem {
	label: string;
	onClick?: () => void;
	right?: React.ReactNode;
}
interface Props {
	title?: string;
	items: NavItem[];
	className?: string;
}

export function AuroraSidebarCard({
	title = "Sidebar",
	items,
	className,
}: Props) {
	return (
		<Card className={`${className ?? ""}`}>
			<CardHeader className="pb-3">
				<CardTitle className="text-white text-base font-semibold">
					{title}
				</CardTitle>
			</CardHeader>
			<CardContent className="p-0">
				<ul className="divide-y divide-white/10">
					{items.map((it, idx) => (
						<li
							key={idx}
							className="px-5 py-3 flex items-center justify-between hover:bg-white/10 cursor-pointer"
							onClick={it.onClick}
						>
							<span className="text-white/90">{it.label}</span>
							{it.right}
						</li>
					))}
				</ul>
			</CardContent>
		</Card>
	);
}
