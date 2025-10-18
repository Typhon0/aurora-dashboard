import { HassConnect } from "@hakit/core";
import { Toaster } from "sonner";
import "./index.css";
import { Dashboard } from "./views/Dashboard";
import { DemoDashboard } from "./views/DemoDashboard";
import { HassConnectFake } from "./demo/HassConnectFake";

const isDemo = import.meta.env.VITE_DEMO === "1";

function App() {
	return (
		<>
			{isDemo ? (
				<HassConnectFake>
					<DemoDashboard />
				</HassConnectFake>
			) : (
				<HassConnect
					hassUrl={import.meta.env.VITE_HA_URL}
					hassToken={import.meta.env.VITE_HA_TOKEN}
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
		</>
	);
}

export default App;
