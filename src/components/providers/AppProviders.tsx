import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Toaster } from "sonner";

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 5 * 60 * 1000,
			gcTime: 10 * 60 * 1000,
			retry: 2,
		},
	},
});

interface AppProvidersProps {
	children: React.ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
	return (
		<QueryClientProvider client={queryClient}>
			{children}

			<Toaster
				position="top-right"
				expand={false}
				richColors
				theme="dark"
				toastOptions={{
					style: {
						background: "rgba(0, 0, 0, 0.8)",
						backdropFilter: "blur(20px)",
						border: "1px solid rgba(255, 255, 255, 0.2)",
						borderRadius: "12px",
						color: "white",
					},
				}}
			/>

			{import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
		</QueryClientProvider>
	);
}
