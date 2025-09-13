// src/lib/aurora-variants.ts
import { cva, type VariantProps } from "class-variance-authority";

export const auroraCard = cva(
	"backdrop-blur-md bg-white/10 border border-white/20 relative transition-all duration-300 hover:scale-105 hover:bg-white/15",
	{
		variants: {
			size: {
				small: "col-span-1 min-h-[120px] p-4",
				medium: "col-span-1 min-h-[160px] p-5",
				large: "col-span-2 min-h-[200px] p-6",
				wide: "col-span-full min-h-[140px] p-5",
			},
			state: {
				default: "",
				active:
					"bg-blue-500/10 border-blue-500/40 shadow-[0_0_20px_rgba(59,130,246,0.15)]",
				success: "bg-green-500/10 border-green-500/40",
				warning: "bg-orange-500/10 border-orange-500/40",
			},
		},
		defaultVariants: { size: "medium", state: "default" },
	},
);

export type AuroraCardVariants = VariantProps<typeof auroraCard>;
