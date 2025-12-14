import {
	createContext,
	useContext,
	useRef,
	useEffect,
	useCallback,
	useState,
} from "react";
import {
	createMockEntities,
	type EntityMap,
	type MockEntity,
} from "./mockEntities";

interface HassLikeContext {
	getEntity: (id: string) => MockEntity | undefined;
	entities: EntityMap;
	// Subscribe to an entity state changes
	subscribe: (id: string, cb: (e: MockEntity) => void) => () => void;
	// Generic service simulation
	callService: (
		domain: string,
		service: string,
		payload: { target?: string; [k: string]: unknown },
	) => Promise<void>;
}

const MockHassCtx = createContext<HassLikeContext | null>(null);

export const MockHassProvider: React.FC<{
	seed?: number;
	intervalMs?: number;
	children: React.ReactNode;
}> = ({ seed, intervalMs = 1000, children }) => {
	const entitiesRef = useRef<EntityMap>(createMockEntities({ seed }));
	const listeners = useRef<Map<string, Set<(e: MockEntity) => void>>>(
		new Map(),
	);
	// (No global force render needed currently)

	const touch = (id: string) => {
		const set = listeners.current.get(id);
		if (set) {
			const ent = entitiesRef.current[id];
			set.forEach((cb) => {
				cb(ent);
			});
		}
	};

	const getEntity = useCallback((id: string) => entitiesRef.current[id], []);

	const mutateRef =
		useRef<(id: string, updater: (e: MockEntity) => void) => void>();
	mutateRef.current = (id: string, updater: (e: MockEntity) => void) => {
		const ent = entitiesRef.current[id];
		if (!ent) return;
		updater(ent);
		ent.last_updated = new Date().toISOString();
		touch(id);
	};
	const mutate = useCallback((id: string, updater: (e: MockEntity) => void) => {
		mutateRef.current?.(id, updater);
	}, []);

	const subscribe = (id: string, cb: (e: MockEntity) => void) => {
		let set = listeners.current.get(id);
		if (!set) {
			set = new Set();
			listeners.current.set(id, set);
		}
		set.add(cb);
		// fire immediately
		const ent = entitiesRef.current[id];
		if (ent) cb(ent);
		return () => {
			set?.delete(cb);
		};
	};

	const callService = async (
		domain: string,
		service: string,
		payload: { target?: string; [k: string]: unknown },
	) => {
		const target = payload.target;
		if (!target) return;
		// simulate latency
		await new Promise((r) => setTimeout(r, 180));
		switch (domain) {
			case "light":
				if (service === "toggle") {
					mutate(target, (e) => {
						e.state = e.state === "on" ? "off" : "on";
						if (e.state === "on") {
							e.attributes.brightness = 50 + Math.round(Math.random() * 205);
						} else {
							e.attributes.brightness = 0;
						}
						e.last_changed = new Date().toISOString();
					});
				}
				break;
			case "switch":
				if (service === "toggle") {
					mutate(target, (e) => {
						e.state = e.state === "on" ? "off" : "on";
						e.last_changed = new Date().toISOString();
					});
				}
				break;
			case "climate":
				if (service === "set_temperature") {
					const temp = payload["temperature"] as number | undefined;
					mutate(target, (e) => {
						if (temp) e.attributes.temperature = temp;
					});
				}
				break;
			case "media_player":
				if (["play", "pause"].includes(service)) {
					mutate(target, (e) => {
						e.state = service === "play" ? "playing" : "paused";
					});
				}
				break;
			default:
				break;
		}
	};

	// periodic drift updates
	useEffect(() => {
		const id = setInterval(() => {
			// temperature drift
			mutate("sensor.demo_temperature", (e) => {
				const base = parseFloat(e.state);
				const drift = (Math.random() - 0.5) * 0.2;
				e.state = (base + drift).toFixed(2);
				if (e.history) {
					e.history.push([Date.now(), parseFloat(e.state)]);
					if (e.history.length > 300) e.history.shift();
				}
			});
			// media progress
			mutate("media_player.demo_player", (e) => {
				if (e.state === "playing") {
					const pos = Number(e.attributes.media_position ?? 0) + 1;
					const dur = Number(e.attributes.media_duration ?? 0);
					e.attributes.media_position = Math.min(pos, dur);
				}
			});
			// timer countdown
			mutate("timer.demo_countdown", (e) => {
				if (e.state === "active") {
					const rem = Number(e.attributes.remaining ?? 0) - 1;
					const clamped = Math.max(rem, 0);
					e.attributes.remaining = clamped;
					if (clamped <= 0) e.state = "idle";
				}
			});
		}, intervalMs);
		return () => clearInterval(id);
		// mutate stable via useCallback([])
	}, [intervalMs, mutate]);

	const value: HassLikeContext = {
		getEntity,
		entities: entitiesRef.current,
		subscribe,
		callService,
	};

	return <MockHassCtx.Provider value={value}>{children}</MockHassCtx.Provider>;
};

// Hook similar to useEntity from @hakit/core
export function useMockEntity(id: string) {
	const ctx = useContext(MockHassCtx);
	if (!ctx)
		throw new Error("useMockEntity must be used within MockHassProvider");
	const [entity, setEntity] = useState<MockEntity | undefined>(() =>
		ctx.getEntity(id),
	);
	useEffect(() => ctx.subscribe(id, setEntity), [ctx, id]);
	if (!entity) {
		// Provide a minimal placeholder to avoid runtime crashes in demo mode.
		return {
			entity_id: id,
			state: "unavailable",
			attributes: { friendly_name: id },
			last_changed: new Date().toISOString(),
			last_updated: new Date().toISOString(),
		} as MockEntity;
	}
	return entity;
}

// Generic service hook subset
export function useMockService(domain: string) {
	const ctx = useContext(MockHassCtx);
	if (!ctx)
		throw new Error("useMockService must be used within MockHassProvider");
	return {
		toggle: ({ target }: { target: string }) =>
			ctx.callService(domain, "toggle", { target }),
		setTemperature: ({
			target,
			temperature,
		}: {
			target: string;
			temperature: number;
		}) => ctx.callService(domain, "set_temperature", { target, temperature }),
		play: ({ target }: { target: string }) =>
			ctx.callService(domain, "play", { target }),
		pause: ({ target }: { target: string }) =>
			ctx.callService(domain, "pause", { target }),
	};
}
