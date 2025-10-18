import React, { useCallback, useMemo, type ReactNode } from "react";
import { HassContext, useStore } from "@hakit/core";
import type {
	HassEntities,
	HassEntity,
	HassConfig,
	Connection,
} from "home-assistant-js-websocket";
import { createMockEntities } from "@/mocks/mockEntities";
import { useDemoEntityTicker } from "./hooks/useDemoEntityTicker";

// Minimal fake config (only what some helpers might touch)
// Very loose fake config. We intentionally only set fields referenced by the UI
// and coerce to HassConfig for typing purposes.
const fakeConfig = {
	location_name: "Aurora Demo",
	time_zone: "UTC",
	unit_system: {
		temperature: "°C",
		length: "m",
		mass: "kg",
		pressure: "Pa",
		volume: "L",
		wind_speed: "m/s",
	},
	language: "en",
	latitude: 0,
	longitude: 0,
	elevation: 0,
	radius: 100,
	currency: "USD",
	country: "US",
	version: "demo",
	config_dir: "/config",
	components: [],
	services: {},
	time_format: 24,
	state: "RUNNING",
	whitelist_external_dirs: [],
	allowlist_external_dirs: [],
	allowlist_external_urls: [],
	internal_url: "http://demo.internal",
	external_url: "http://demo.external",
	media_dirs: {},
	safe_mode: false,
	debug: false,
	recycle: false,
	development: false,
	version_core: "demo",
	version_supervisor: "demo",
} as unknown as HassConfig;

// Build HassEntities from our mock entities
function buildEntities(): HassEntities {
	const mocks = createMockEntities();
	const entries: [string, HassEntity][] = Object.values(mocks).map((m) => [
		m.entity_id,
		{
			entity_id: m.entity_id,
			state: m.state,
			attributes: m.attributes as HassEntity["attributes"],
			last_changed: m.last_changed,
			last_updated: m.last_updated,
			context: { id: "", user_id: null, parent_id: null },
		} as HassEntity,
	]);
	return Object.fromEntries(entries) as HassEntities;
}

// Very small mock connection object (shape only where accessed)
class MockConnection implements Partial<Connection> {
	// Minimal shape to satisfy truthy checks; extended properties are casted.
	// Cast to expected shape; implements minimal subset
	options = {
		setupRetry: 0,
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		createSocket: async (_auth: unknown) => ({}) as unknown as WebSocket,
	} as unknown as Connection["options"];
	commandId = 0;
	commands = new Map();
	eventListeners = new Map();
	close() {
		/* noop */
	}
	addEventListener() {
		/* noop */
	}
	removeEventListener() {
		/* noop */
	}
	sendMessage() {
		/* noop */
	}
	// Added to satisfy hooks that rely on real Home Assistant Connection API
	// Generic signature mirrors the real Connection#subscribeEvents
	subscribeEvents<EventType>(
		_callback: (ev: EventType) => void,
		_eventType?: string,
	): Promise<() => Promise<void>> {
		// We ignore events in the fake, just return async unsubscribe noop
		return Promise.resolve(async () => Promise.resolve());
	}
	// Casting to Connection where required
}

// Initialize store once (outside component) so first render already has data
let initialized = false;
if (!initialized) {
	const state = useStore.getState();
	const entities = buildEntities();
	useStore.setState({
		entities: { ...state.entities, ...entities },
		config: fakeConfig,
		connection: new MockConnection() as unknown as Connection,
		ready: true,
	});
	initialized = true;
}

// Basic domain service simulation
function applyService(
	domain: string,
	service: string,
	target?: string | string[],
	serviceData?: Record<string, unknown>,
) {
	if (!target) return;
	const id = Array.isArray(target) ? target[0] : target;
	const s = useStore.getState();
	const ent = s.entities[id];
	if (!ent) return;
	const now = new Date().toISOString();
	let next = ent;
	switch (domain) {
		case "light": {
			if (service === "toggle") {
				next = {
					...ent,
					state: ent.state === "on" ? "off" : "on",
					attributes: {
						...ent.attributes,
						brightness: ent.state === "on" ? 0 : 200,
						...(serviceData || {}),
					},
					last_changed: now,
					last_updated: now,
				};
			} else if (service === "turn_on") {
				next = {
					...ent,
					state: "on",
					attributes: { ...ent.attributes, ...(serviceData || {}) },
					last_changed: now,
					last_updated: now,
				};
			} else if (service === "turn_off") {
				next = {
					...ent,
					state: "off",
					last_changed: now,
					last_updated: now,
				};
			}
			break;
		}
		case "switch": {
			if (["toggle", "turn_on", "turn_off"].includes(service)) {
				const on =
					service === "toggle" ? ent.state !== "on" : service !== "turn_off";
				next = {
					...ent,
					state: on ? "on" : "off",
					last_changed: now,
					last_updated: now,
				};
			}
			break;
		}
		case "scene": {
			next = { ...ent, last_changed: now, last_updated: now };
			break;
		}
		case "media_player": {
			if (service === "play")
				next = { ...ent, state: "playing", last_updated: now };
			if (service === "pause")
				next = { ...ent, state: "paused", last_updated: now };
			break;
		}
		default:
			break;
	}
	useStore.setState((prev) => ({
		...prev,
		entities: {
			...prev.entities,
			[id]: next,
		},
	}));
}

export interface HassConnectFakeProps {
	children: ReactNode;
	hassUrl?: string; // kept for API parity
	fallback?: ReactNode;
}

export const HassConnectFake: React.FC<HassConnectFakeProps> = ({
	children,
	fallback,
}) => {
	const ready = useStore((s) => s.ready);
	// Demo ticking updates (temperature, time, pressure)
	useDemoEntityTicker({
		temperatureTickMs: 2000,
		timeTickMs: 2000,
		pressureTickMs: 2000,
	});

	// Provide a permissive typed wrapper compatible enough for consumers; we cast to expected complex signature.
	const callService = useCallback(
		(args: {
			domain: string;
			service: string;
			target?: string | string[];
			serviceData?: Record<string, unknown>;
		}): Promise<unknown> => {
			applyService(args.domain, args.service, args.target, args.serviceData);
			return Promise.resolve({}); // mimic async path returning a response
		},
		[],
	);

	const callApi = useCallback(
		async <T,>(): Promise<{ data: T; status: "success" }> => ({
			data: {} as T,
			status: "success",
		}),
		[],
	);

	const contextValue = useMemo(
		() => ({
			useStore,
			logout: () => {},
			addRoute: () => void 0,
			getRoute: () => null,
			getStates: async () => Object.values(useStore.getState().entities),
			getServices: async () => null,
			getConfig: async () => fakeConfig,
			getUser: async () => null,
			callService: callService as unknown,
			callApi: callApi as unknown,
			getAllEntities: () => useStore.getState().entities,
			joinHassUrl: (p: string) => p,
			windowContext: window,
		}),
		[callService, callApi],
	);

	// Infer the internal context prop type so we can cast without using 'any'
	type LooseHassContext = typeof HassContext extends React.Context<infer P>
		? P
		: never;

	return (
		<HassContext.Provider value={contextValue as unknown as LooseHassContext}>
			{ready ? children : (fallback ?? null)}
		</HassContext.Provider>
	);
};
