/* hakit-shim (simplified)
 * In demo mode vite aliases '@hakit/core' -> this file.
 * We statically re-export every symbol from the built ESM bundle, then override the few hooks
 * we need to point at the mock demo API provided by DemoHassProvider.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
// @ts-ignore deep path import for real library (types still from root package)
export * from "../../node_modules/@hakit/core/dist/es/index.js";
// @ts-ignore deep path import
import {
	useHass as realUseHass,
	useService as realUseService,
	useEntity as realUseEntity,
} from "../../node_modules/@hakit/core/dist/es/index.js";
import React from "react";
type EntityName = string; // widen for demo convenience

export interface DemoAPIEntity {
	entity_id: string;
	state: string;
	attributes: { friendly_name?: string; [k: string]: unknown };
	last_changed: string;
	last_updated: string;
	history?: Array<[number, number]>;
}

export interface DemoAPIServicePayload {
	target?: string | string[];
	[k: string]: unknown;
}

export interface DemoAPI {
	getEntity: (id: string) => DemoAPIEntity | undefined;
	subscribe: (id: string, cb: (e: DemoAPIEntity) => void) => () => void;
	callService: (
		domain: string,
		service: string,
		payload: DemoAPIServicePayload,
	) => Promise<void> | void;
}

declare global {
	interface Window {
		__AURORA_DEMO__?: DemoAPI;
	}
}

const isDemo = typeof window !== "undefined" && Boolean(window.__AURORA_DEMO__);

// Hook: useHass
export function useHass(): {
	callService: (args: {
		domain: string;
		service: string;
		target?: string | string[];
		serviceData?: Record<string, unknown>;
	}) => Promise<void> | void;
	getAllEntities: () => void;
} {
	const core = realUseHass();
	if (!isDemo) return core;
	const api = window.__AURORA_DEMO__;
	return {
		callService: ({ domain, service, target, serviceData }) =>
			api?.callService(domain, service, {
				target: Array.isArray(target) ? target[0] : target,
				...(serviceData || {}),
			}),
		getAllEntities: () => undefined,
	};
}

// Hook: useService
export function useService(domain?: string, rootTarget?: string | string[]) {
	// Cast through unknown/any to bypass strict domain typing in demo context
	const core = realUseService(domain as any, rootTarget as any);
	if (!isDemo) return core;
	const hass = useHass();
	if (!domain) {
		return (d: string) => useService(d);
	}
	type ServiceInvoker = (args?: {
		target?: string | string[];
		serviceData?: Record<string, unknown>;
	}) => void | Promise<void>;
	return new Proxy(
		{},
		{
			get:
				(_: unknown, svc: string): ServiceInvoker =>
				(args = {}) =>
					hass.callService({
						domain,
						service: svc,
						target: args.target ?? rootTarget,
						serviceData: args.serviceData,
					}),
		},
	) as Record<string, ServiceInvoker>;
}

// Hook: useEntity
export interface UseEntityResult extends DemoAPIEntity {
	service: Record<string, unknown>;
	history: Array<[number, number]>;
}

export function useEntity(entityId: string): UseEntityResult {
	const core = realUseEntity(entityId as any) as unknown as UseEntityResult;
	// Prepare demo hooks regardless (safe no-op if not demo)
	const api = isDemo ? window.__AURORA_DEMO__ : undefined;
	const [entity, setEntity] = React.useState<DemoAPIEntity | undefined>(() =>
		api?.getEntity(entityId),
	);
	React.useEffect(() => {
		if (!api) return undefined;
		return api.subscribe(entityId, setEntity);
	}, [entityId, api]);

	if (!isDemo) return core;
	if (!entity) {
		return {
			entity_id: entityId,
			state: "unavailable",
			attributes: { friendly_name: entityId },
			last_changed: new Date().toISOString(),
			last_updated: new Date().toISOString(),
			service: {},
			history: [],
		};
	}
	return { ...entity, service: {}, history: entity.history ?? [] };
}
