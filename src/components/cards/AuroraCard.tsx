import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { AuroraCardProps } from "@/types";

const sizeClasses = {
	small: "col-span-1 min-h-[140px] p-4",
	medium: "col-span-1 min-h-[200px] p-6",
	large: "col-span-2 min-h-[280px] p-8",
	wide: "col-span-full min-h-[160px] p-6",
};

const variantClasses = {
	default: "bg-white/10 border-white/20 backdrop-blur-md",
	accent: "bg-white/10 border-blue-500/40 shadow-blue-500/20 backdrop-blur-md",
	success: "bg-white/10 border-green-500/40 backdrop-blur-md",
	warning: "bg-white/10 border-orange-500/40 backdrop-blur-md",
	error: "bg-white/10 border-red-500/40 backdrop-blur-md",
};

export function AuroraCard({
	size = "medium",
	variant = "default",
	title,
	icon,
	value,
	onClick,
	className,
	children,
	...props
}: AuroraCardProps) {
	return (
		<motion.div
			initial={{ opacity: 0, y: 20, scale: 0.95 }}
			animate={{ opacity: 1, y: 0, scale: 1 }}
			whileHover={{
				y: -4,
				scale: 1.02,
				transition: { type: "spring", stiffness: 400, damping: 25 },
			}}
			whileTap={{ scale: 0.98 }}
			onClick={onClick}
			className={cn(
				"relative overflow-hidden rounded-xl border transition-all duration-300 cursor-pointer",
				"hover:shadow-lg hover:bg-white/15",
				sizeClasses[size],
				variantClasses[variant],
				className,
			)}
			{...props}
		>
			{/* Gradient highlight */}
			<div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />

			{(title || icon) && (
				<div className="flex items-center justify-between mb-4">
					{title && (
						<h3 className="text-lg font-semibold text-white truncate">
							{title}
						</h3>
					)}
					{icon && (
						<div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-lg">
							{icon}
						</div>
					)}
				</div>
			)}

			{value && (
				<div className="text-2xl font-bold text-white mb-2">{value}</div>
			)}

			<div className="text-white/70">{children}</div>
		</motion.div>
	);
}
