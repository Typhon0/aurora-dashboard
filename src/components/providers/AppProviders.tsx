import React from "react";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
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
			<ThemeProvider defaultTheme="dark" enableSystem>
				{children}
				<Toaster
					position="top-right"
					expand={false}
					richColors
					toastOptions={{
						style: {
							background: "hsl(var(--card) / 0.85)",
							backdropFilter: "blur(18px) saturate(160%)",
							border: "1px solid hsl(var(--border) / 0.4)",
							borderRadius: "var(--radius)",
							color: "hsl(var(--foreground))",
						},
					}}
				/>
				{import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
			</ThemeProvider>
		</QueryClientProvider>
	);
}
