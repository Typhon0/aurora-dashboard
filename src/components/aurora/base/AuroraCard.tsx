import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { auroraCard, type AuroraCardVariants } from "../../../lib/aurora-variants";
import { cn } from "../../../lib/utils";

interface Props
	extends React.HTMLAttributes<HTMLDivElement>,
		AuroraCardVariants {
	title?: string;
	icon?: React.ReactNode;
	actions?: React.ReactNode;
    // Explicitly list framer-motion props we want to swallow/ignore if passed
    // Gesture Handlers
    onPan?: any;
    onPanStart?: any;
    onPanEnd?: any;
    onPanSessionStart?: any;
    onTap?: any;
    onTapStart?: any;
    onTapCancel?: any;
    onHoverStart?: any;
    onHoverEnd?: any;
    
    // Drag Handlers
    onDrag?: any;
    onDragStart?: any;
    onDragEnd?: any;
    onDirectionLock?: any;
    onDragTransitionEnd?: any;

    // Animation Props
    whileHover?: any;
    whileTap?: any;
    whileDrag?: any;
    whileFocus?: any;
    whileInView?: any;
    
    // Layout Props
    layout?: any;
    layoutId?: any;
}

export const AuroraCard = React.forwardRef<HTMLDivElement, Props>(
	(
		{ 
            className, 
            size, 
            state, 
            title, 
            icon, 
            actions, 
            children, 
            // Destructure motion props to prevent them from leaking to the DOM
            onPan,
            onPanStart,
            onPanEnd,
            onPanSessionStart,
            onTap,
            onTapStart,
            onTapCancel,
            onHoverStart,
            onHoverEnd,
            onDrag,
            onDragStart,
            onDragEnd,
            onDirectionLock,
            onDragTransitionEnd,
            whileHover,
            whileTap,
            whileDrag,
            whileFocus,
            whileInView,
            layout,
            layoutId,
            ...props 
        },
		ref,
	) => (
		<Card
			ref={ref}
			className={cn(auroraCard({ size, state }), "border-0", className)}
			{...props}
		>
			{(title || icon || actions) && (
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
					<div className="flex items-center gap-3">
						{icon}
						{title && (
							<CardTitle className="text-white">
								{title}
							</CardTitle>
						)}
					</div>
					{actions}
				</CardHeader>
			)}
			<CardContent className="p-0">{children}</CardContent>
		</Card>
	),
);
AuroraCard.displayName = "AuroraCard";