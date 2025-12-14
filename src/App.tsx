import { HassConnect } from "@hakit/core";
import { Toaster } from "sonner";
import "./index.css";
import { Dashboard } from "./views/Dashboard";
import { DemoDashboard } from "./views/DemoDashboard";
import { HassConnectFake } from "./demo/HassConnectFake";
import { ThemeProvider } from "./components/providers/ThemeProvider";

// Safely access environment variables with fallbacks
const env = typeof import.meta.env !== 'undefined' ? import.meta.env : {};
const isDemo = true;
const hassUrl = env.VITE_HA_URL || "";
const hassToken = env.VITE_HA_TOKEN || "";

function App() {
	return (
		<ThemeProvider defaultTheme="dark" enableSystem>
			{isDemo ? (
				<HassConnectFake>
					<DemoDashboard />
				</HassConnectFake>
			) : (
				<HassConnect
					hassUrl={hassUrl}
					hassToken={hassToken}
				>
					<Dashboard />
				</HassConnect>
			)}
			<Toaster
				position="top-right"
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
		</ThemeProvider>
	);
}

export default App;
