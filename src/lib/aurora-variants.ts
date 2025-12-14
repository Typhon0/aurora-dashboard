// src/lib/aurora-variants.ts
import { cva, type VariantProps } from "class-variance-authority";

export const auroraCard = cva(
	"backdrop-blur-xl bg-[var(--aurora-glass-bg)] border-0 relative transition-all duration-300 hover:bg-[var(--aurora-glass-hover)] rounded-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] animate-fade-pop overflow-hidden",
	{
		variants: {
			size: {
				small: "col-span-1 min-h-[120px] p-5",
				medium: "col-span-1 min-h-[160px] p-6",
				large: "col-span-2 min-h-[200px] p-6",
				wide: "col-span-full min-h-[140px] p-6",
			},
			state: {
				default: "",
				active:
					"bg-[var(--aurora-accent-glow)] shadow-[0_0_20px_var(--aurora-accent-glow)]",
				success: "bg-green-500/10",
				warning: "bg-orange-500/10",
			},
		},
		defaultVariants: { size: "medium", state: "default" },
	},
);

export type AuroraCardVariants = VariantProps<typeof auroraCard>;
