import { type ReactNode } from "react";
import {
	ThemeProvider as NextThemesProvider,
	type ThemeProviderProps as NextThemeProps,
} from "next-themes";

export interface ThemeProviderProps extends Partial<NextThemeProps> {
	children: ReactNode;
	attribute?: "class" | "data-theme";
}

export function ThemeProvider({
	children,
	attribute = "class",
	defaultTheme = "dark",
	enableSystem = true,
	themes = ["light", "dark"],
}: ThemeProviderProps) {
	return (
		<NextThemesProvider
			attribute={attribute}
			defaultTheme={defaultTheme}
			enableSystem={enableSystem}
			themes={themes}
		>
			{children}
		</NextThemesProvider>
	);
}
