import { HassConnect } from "@hakit/core";
import { Toaster } from "sonner";
import "./index.css";
import { Dashboard } from "./views/Dashboard";

function App() {
	return (
		<HassConnect
			hassUrl={import.meta.env.VITE_HA_URL}
			hassToken={import.meta.env.VITE_HA_TOKEN}
		>
			<Dashboard />

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
		</HassConnect>
	);
}

export default App;
