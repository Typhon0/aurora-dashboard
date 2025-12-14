import type { ReactNode } from "react";
import {
	Dialog,
	DialogTrigger,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
} from "../ui/dialog";

export interface ModalProps {
	trigger: ReactNode;
	title?: ReactNode;
	description?: ReactNode;
	children?: ReactNode;
	footer?: ReactNode;
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
	size?: "sm" | "md" | "lg" | "xl";
	className?: string;
}

const sizeMap: Record<NonNullable<ModalProps["size"]>, string> = {
	sm: "max-w-sm",
	md: "max-w-md",
	lg: "max-w-lg",
	xl: "max-w-2xl",
};

export function Modal({
	trigger,
	title,
	description,
	children,
	footer,
	open,
	onOpenChange,
	size = "lg",
	className,
}: ModalProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogTrigger asChild>{trigger}</DialogTrigger>
			<DialogContent className={`${sizeMap[size]} ${className ?? ""}`}>
				{(title || description) && (
					<DialogHeader>
						{title && <DialogTitle>{title}</DialogTitle>}
						{description && (
							<DialogDescription>{description}</DialogDescription>
						)}
					</DialogHeader>
				)}
				{children}
				{footer && <DialogFooter>{footer}</DialogFooter>}
			</DialogContent>
		</Dialog>
	);
}
