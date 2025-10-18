import type { CSSProperties, HTMLAttributes } from "react";

export interface RowProps extends HTMLAttributes<HTMLDivElement> {
	alignItems?: CSSProperties["alignItems"];
	justifyContent?: CSSProperties["justifyContent"];
	wrap?: CSSProperties["flexWrap"];
	gap?: CSSProperties["gap"];
	fullHeight?: boolean;
	fullWidth?: boolean;
}

export function Row({
	alignItems = "center",
	justifyContent = "center",
	wrap = "wrap",
	gap,
	fullHeight,
	fullWidth,
	className,
	style,
	children,
	...rest
}: RowProps) {
	const gapStyle: CSSProperties = gap ? { gap } : {};
	const merged: CSSProperties = {
		flexWrap: wrap,
		alignItems,
		justifyContent,
		...gapStyle,
		...style,
	};
	return (
		<div
			className={`flex flex-row ${fullHeight ? "h-full" : ""} ${fullWidth ? "w-full" : ""} ${className ?? ""}`}
			style={merged}
			{...rest}
		>
			{children}
		</div>
	);
}
