import { useRef } from "react";
import type { ReactNode } from "react";
import { HassContext, useStore } from "@hakit/core";
import type {
	HassEntity,
	HassEntities,
	HassConfig,
	Connection,
} from "home-assistant-js-websocket";

export type MockEntityInit = Partial<HassEntity> & {
	entity_id: string;
	state?: string;
};

interface MockHassProviderProps {
	entities?: MockEntityInit[];
	children: ReactNode;
	onCallService?: (args: {
		domain: string;
		service: string;
		target?: string | string[];
		serviceData?: Record<string, unknown>;
	}) => void;
}

function buildEntities(list: MockEntityInit[] = []): HassEntities {
	const now = new Date().toISOString();
	const out: Record<string, HassEntity> = {};
	for (const e of list) {
		out[e.entity_id] = {
			state: e.state ?? "off",
			attributes: e.attributes ?? {},
			last_changed: now,
			last_updated: now,
			context: { id: "", user_id: null, parent_id: null },
			...e,
		} as unknown as HassEntity;
	}
	return out as HassEntities;
}

export const MockHassProvider: React.FC<MockHassProviderProps> = ({
	entities = [],
	children,
	onCallService,
}) => {
	const seeded = useRef(false);
	if (!seeded.current) {
		const current = useStore.getState();
		const fakeConfig = {
			location_name: "Test",
			latitude: 0,
			longitude: 0,
			elevation: 0,
			radius: 1,
			time_zone: "UTC",
			components: [],
			config_dir: "/config",
			allowlist_external_dirs: [],
			allowlist_external_urls: [],
			version: "demo",
			state: "RUNNING",
			currency: "USD",
			country: "US",
			language: "en",
			unit_system: {
				temperature: "°C",
				pressure: "Pa",
				length: "m",
				mass: "kg",
				volume: "L",
				wind_speed: "m/s",
			},
			config_source: "storage",
			recovery_mode: false,
			safe_mode: false,
			external_url: null,
			internal_url: null,
		} as unknown as HassConfig;
		useStore.setState({
			entities: { ...current.entities, ...buildEntities(entities) },
			ready: true,
			config: (current.config ?? fakeConfig) as HassConfig,
			connection: (current.connection ?? ({} as Connection)) as Connection,
		});
		seeded.current = true;
	}

	const callService = async <_R extends object>(
		raw: unknown,
	): Promise<unknown> => {
		const args = raw as {
			domain: string;
			service: string;
			target?: string | string[];
			serviceData?: Record<string, unknown>;
		};
		onCallService?.(args);
		const id = Array.isArray(args.target) ? args.target?.[0] : args.target;
		if (!id) return;
		const st = useStore.getState();
		const ent = st.entities[id];
		if (!ent) return;
		const now = new Date().toISOString();
		let nextState = ent.state;
		switch (args.service) {
			case "toggle":
				nextState = ent.state === "on" ? "off" : "on";
				break;
			case "turn_on":
			case "turnOn":
				nextState = "on";
				break;
			case "turn_off":
			case "turnOff":
				nextState = "off";
				break;
		}
		if (nextState !== ent.state) {
			useStore.setState((prev) => ({
				...prev,
				entities: {
					...prev.entities,
					[id]: {
						...ent,
						state: nextState,
						last_changed: now,
						last_updated: now,
					},
				},
			}));
		}
	};

	const ctxValue = {
		useStore,
		logout: () => {},
		addRoute: () => {},
		getRoute: () => null,
		getStates: async () => Object.values(useStore.getState().entities),
		getServices: async () => null,
		getConfig: async () => null,
		getUser: async () => null,
		getAllEntities: () => useStore.getState().entities,
		joinHassUrl: (p: string) => p,
		callApi: async () => ({ data: {}, status: "success" }) as const,
		callService: callService as unknown,
		windowContext: window,
	};

	type ProviderValue = Parameters<typeof HassContext.Provider>[0]["value"];
	return (
		<HassContext.Provider value={ctxValue as unknown as ProviderValue}>
			{children}
		</HassContext.Provider>
	);
};
