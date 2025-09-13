// src/components/aurora/base/AuroraCard.tsx
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { auroraCard, type AuroraCardVariants } from "@/lib/aurora-variants";
import { cn } from "@/lib/utils";

interface Props
	extends React.HTMLAttributes<HTMLDivElement>,
		AuroraCardVariants {
	title?: string;
	icon?: React.ReactNode;
	actions?: React.ReactNode;
}

export const AuroraCard = React.forwardRef<HTMLDivElement, Props>(
	(
		{ className, size, state, title, icon, actions, children, ...props },
		ref,
	) => (
		<Card
			ref={ref}
			className={cn(auroraCard({ size, state }), className)}
			{...props}
		>
			{(title || icon || actions) && (
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
					<div className="flex items-center gap-2">
						{icon}
						{title && (
							<CardTitle className="text-white text-base font-semibold">
								{title}
							</CardTitle>
						)}
					</div>
					{actions}
				</CardHeader>
			)}
			<CardContent className="p-0 px-5 pb-5">{children}</CardContent>
		</Card>
	),
);
AuroraCard.displayName = "AuroraCard";
