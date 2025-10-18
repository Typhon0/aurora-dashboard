import { useEffect, useMemo, useRef, useCallback, type ReactNode } from "react";
import { HassContext } from "@hakit/core";
import { useInternalStore } from "@/../ha-component-kit/packages/core/src/HassConnect/HassContext";
import type { HassEntity, HassEntities } from "home-assistant-js-websocket";
import { createMockEntities, type MockEntity } from "./mockEntities";

// Convert MockEntity -> HassEntity (shape alignment; minimal fields used by cards)
function mockToHass(e: MockEntity): HassEntity {
	return {
		entity_id: e.entity_id,
		state: e.state,
		attributes: e.attributes,
		last_changed: e.last_changed,
		last_updated: e.last_updated,
		context: { id: "", user_id: null, parent_id: null },
	} as HassEntity;
}

interface DemoHassProviderProps {
	children: ReactNode;
	seed?: number;
	intervalMs?: number;
}

export const DemoHassProvider: React.FC<DemoHassProviderProps> = ({
	children,
	seed,
	intervalMs = 1000,
}) => {
	const store = useInternalStore();
	const mockEntitiesRef = useRef(createMockEntities({ seed }));
	const initializedRef = useRef(false);
	if (!initializedRef.current) {
		const entities: Record<string, HassEntity> = {};
		Object.values(mockEntitiesRef.current).forEach((m) => {
			entities[m.entity_id] = mockToHass(m);
		});
		store.setEntities(entities as HassEntities);
		store.setReady(true);
		initializedRef.current = true;
	}

	const mutate = useCallback(
		(id: string, updater: (e: MockEntity) => void) => {
			const ent = mockEntitiesRef.current[id];
			if (!ent) return;
			updater(ent);
			ent.last_updated = new Date().toISOString();
			// reflect into store
			store.setEntities({ [id]: mockToHass(ent) } as HassEntities);
		},
		[store],
	);

	// drift effects similar to original mock provider
	useEffect(() => {
		const id = setInterval(() => {
			mutate("sensor.demo_temperature", (e) => {
				const base = parseFloat(e.state);
				const drift = (Math.random() - 0.5) * 0.2;
				e.state = (base + drift).toFixed(2);
				if (e.history) {
					e.history.push([Date.now(), parseFloat(e.state)]);
					if (e.history.length > 300) e.history.shift();
				}
			});
			mutate("media_player.demo_player", (e) => {
				if (e.state === "playing") {
					const pos = Number(e.attributes.media_position ?? 0) + 1;
					const dur = Number(e.attributes.media_duration ?? 0);
					(
						e.attributes as unknown as { media_position: number }
					).media_position = Math.min(pos, dur);
				}
			});
			mutate("timer.demo_countdown", (e) => {
				if (e.state === "active") {
					const attr = e.attributes as unknown as { remaining: number };
					const rem = Number(attr.remaining ?? 0) - 1;
					attr.remaining = Math.max(rem, 0);
					if (attr.remaining <= 0) e.state = "idle";
				}
			});
		}, intervalMs);
		return () => clearInterval(id);
	}, [intervalMs, mutate]);

	interface CallServiceInput {
		domain: string;
		service: string;
		target?: string | string[];
		serviceData?: Record<string, unknown>;
	}
	const callServiceImpl = useCallback(
		({ domain, service, target }: CallServiceInput) => {
			const id = Array.isArray(target) ? target[0] : target;
			if (!id) return;
			switch (domain) {
				case "light":
					if (service === "toggle") {
						mutate(id, (e) => {
							e.state = e.state === "on" ? "off" : "on";
							const attr = e.attributes as unknown as { brightness?: number };
							if (e.state === "on") attr.brightness = 200;
							else attr.brightness = 0;
							e.last_changed = new Date().toISOString();
						});
					}
					break;
				case "switch":
					if (service === "toggle") {
						mutate(id, (e) => {
							e.state = e.state === "on" ? "off" : "on";
							e.last_changed = new Date().toISOString();
						});
					}
					break;
				case "climate":
					if (service === "set_temperature") {
						// ignore for demo
					}
					break;
				case "media_player":
					if (service === "play" || service === "pause") {
						mutate(id, (e) => {
							e.state = service === "play" ? "playing" : "paused";
						});
					}
					break;
				case "scene":
					// simulate activation
					mutate(id, (e) => {
						e.last_changed = new Date().toISOString();
					});
					break;
				default:
					break;
			}
		},
		[mutate],
	);

	const contextValue = useMemo(() => {
		const demoCallService = ({
			domain,
			service,
			target,
			serviceData,
		}: CallServiceInput) =>
			callServiceImpl({ domain, service, target, serviceData });
		type DemoUseStore = typeof useInternalStore;
		return {
			useStore: useInternalStore as unknown as DemoUseStore,
			logout: () => void 0,
			getStates: async () => Object.values(store.entities) as HassEntity[],
			getServices: async (): Promise<null> => null,
			getConfig: async () => null,
			getUser: async () => null,
			callService: demoCallService,
			addRoute: () => void 0,
			getRoute: () => null,
			getAllEntities: () => store.entities as HassEntities,
			joinHassUrl: (p: string) => p,
			callApi: async () => ({ data: null, status: "success" }) as const,
			windowContext: window,
		} as unknown as Parameters<typeof HassContext.Provider>[0]["value"]; // align with provider expected shape
	}, [callServiceImpl, store.entities]);

	// Expose global demo API for shim if present
	useEffect(() => {
		const api = {
			getEntity: (id: string) => mockEntitiesRef.current[id],
			subscribe: (id: string, cb: (e: MockEntity) => void) => {
				let active = true;
				const interval = setInterval(() => {
					if (!active) return;
					const ent = mockEntitiesRef.current[id];
					if (ent) cb(ent);
				}, 1000);
				return () => {
					active = false;
					clearInterval(interval);
				};
			},
			callService: (
				domain: string,
				service: string,
				payload: { target?: string },
			) => {
				callServiceImpl({ domain, service, target: payload.target });
			},
		};
		(window as unknown as { __AURORA_DEMO__?: typeof api }).__AURORA_DEMO__ =
			api;
	}, [callServiceImpl]);

	return (
		<HassContext.Provider value={contextValue}>{children}</HassContext.Provider>
	);
};
