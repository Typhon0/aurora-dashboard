/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
	darkMode: ["class"],
	theme: {
		container: {
			center: true,
			padding: "2rem",
			screens: {
				"2xl": "1400px",
			},
		},
		extend: {
			fontFamily: {
				sans: [
					"-apple-system",
					"BlinkMacSystemFont",
					"SF Pro Display",
					"system-ui",
					"sans-serif",
				],
			},
			colors: {
				// Shadcn/UI variables
				border: "hsl(var(--border))",
				input: "hsl(var(--input))",
				ring: "hsl(var(--ring))",
				background: "hsl(var(--background))",
				foreground: "hsl(var(--foreground))",
				primary: {
					DEFAULT: "hsl(var(--primary))",
					foreground: "hsl(var(--primary-foreground))",
				},
				secondary: {
					DEFAULT: "hsl(var(--secondary))",
					foreground: "hsl(var(--secondary-foreground))",
				},
				destructive: {
					DEFAULT: "hsl(var(--destructive))",
					foreground: "hsl(var(--destructive-foreground))",
				},
				muted: {
					DEFAULT: "hsl(var(--muted))",
					foreground: "hsl(var(--muted-foreground))",
				},
				accent: {
					DEFAULT: "hsl(var(--accent))",
					foreground: "hsl(var(--accent-foreground))",
				},
				popover: {
					DEFAULT: "hsl(var(--popover))",
					foreground: "hsl(var(--popover-foreground))",
				},
				card: {
					DEFAULT: "hsl(var(--card))",
					foreground: "hsl(var(--card-foreground))",
				},

				// Aurora custom colors
				aurora: {
					50: "#f0f9ff",
					100: "#e0f2fe",
					200: "#bae6fd",
					300: "#7dd3fc",
					400: "#38bdf8",
					500: "#007AFF",
					600: "#0284c7",
					700: "#0369a1",
					800: "#075985",
					900: "#0c4a6e",
				},
				glass: {
					light: "rgba(255, 255, 255, 0.1)",
					medium: "rgba(255, 255, 255, 0.15)",
					heavy: "rgba(255, 255, 255, 0.2)",
				},
			},
			borderRadius: {
				lg: "var(--radius)",
				md: "calc(var(--radius) - 2px)",
				sm: "calc(var(--radius) - 4px)",
				aurora: "20px",
				"aurora-xl": "28px",
			},
			backdropBlur: {
				aurora: "20px",
				"aurora-heavy": "40px",
			},
			boxShadow: {
				aurora: "0 20px 40px rgba(0, 122, 255, 0.15)",
				glass: "0 8px 32px rgba(0, 0, 0, 0.1)",
				"glass-hover": "0 20px 40px rgba(0, 0, 0, 0.25)",
			},
			animation: {
				"aurora-pulse": "aurora-pulse 2s ease-in-out infinite",
				"accordion-down": "accordion-down 0.2s ease-out",
				"accordion-up": "accordion-up 0.2s ease-out",
			},
			keyframes: {
				"aurora-pulse": {
					"0%, 100%": { opacity: "0.8" },
					"50%": { opacity: "1" },
				},
				"accordion-down": {
					from: { height: "0" },
					to: { height: "var(--radix-accordion-content-height)" },
				},
				"accordion-up": {
					from: { height: "var(--radix-accordion-content-height)" },
					to: { height: "0" },
				},
			},
		},
	},
	plugins: [require("tailwindcss-animate"), require("@tailwindcss/forms")],
};
