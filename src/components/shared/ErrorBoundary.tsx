import type { ReactNode, ErrorInfo } from "react";
import {
	ErrorBoundary as ReactErrorBoundary,
	type FallbackProps,
} from "react-error-boundary";
import { Alert } from "./Alert";

export interface AuroraErrorBoundaryProps {
	children: ReactNode;
	label?: string;
	onReset?: () => void;
	onError?: (error: Error, info: ErrorInfo) => void;
}

function Fallback({
	error,
	resetErrorBoundary,
	label,
}: FallbackProps & { label?: string }) {
	return (
		<Alert
			variant="error"
			tone="outline"
			title={label ? `${label} Error` : "Unexpected Error"}
			description={error.message}
			onDismiss={resetErrorBoundary}
			className="animate-fade-pop"
		/>
	);
}

export function ErrorBoundary({
	children,
	label,
	onReset,
	onError,
}: AuroraErrorBoundaryProps) {
	return (
		<ReactErrorBoundary
			fallbackRender={(props) => <Fallback {...props} label={label} />}
			onReset={onReset}
			onError={onError}
		>
			{children}
		</ReactErrorBoundary>
	);
}
