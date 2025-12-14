import React from "react";
import { Button, type ButtonProps } from "../../ui/button";
import { auroraButtonVariants, type VariantProps } from "../../../lib/aurora-variants";
import { cn } from "../../../lib/utils";

interface AuroraButtonProps
	extends ButtonProps,
		VariantProps<typeof auroraButtonVariants> {}

export const AuroraButton = React.forwardRef<
	HTMLButtonElement,
	AuroraButtonProps
>(({ className, variant, ...props }, ref) => {
	return (
		<Button
			className={cn(auroraButtonVariants({ variant }), className)}
			ref={ref}
			{...props}
		/>
	);
});
