/* demo-core-overrides
 * Wrapper around @hakit/core that overrides selective hooks in demo mode.
 */
export * from "@hakit/core";
import React from "react";
import {
	useHass as coreUseHass,
	useService as coreUseService,
	useEntity as coreUseEntity,
} from "@hakit/core";

interface DemoApiEntity {
	entity_id: string;
	state: string;
	attributes: Record<string, unknown>;
	last_changed: string;
	last_updated: string;
	history?: Array<[number, number]>;
}

interface DemoApi {
	getEntity: (id: string) => DemoApiEntity | undefined;
	subscribe: (id: string, cb: (e: DemoApiEntity) => void) => () => void;
	callService: (
		domain: string,
		service: string,
		payload: { target?: string | string[]; [k: string]: unknown },
	) => void;
}

function getDemoApi(): DemoApi | undefined {
	if (typeof window === "undefined") return undefined;
	return (window as unknown as { __AURORA_DEMO__?: DemoApi }).__AURORA_DEMO__;
}

export function useHass() {
	const core = coreUseHass();
	const api = getDemoApi();
	if (!api) return core;
	return {
		...core,
		callService: ({
			domain,
			service,
			target,
			serviceData,
		}: {
			domain: string;
			service: string;
			target?: string | string[];
			serviceData?: Record<string, unknown>;
		}) =>
			api.callService(domain, service, {
				target: Array.isArray(target) ? target[0] : target,
				...(serviceData || {}),
			}),
	};
}

export function useService(domain?: string, rootTarget?: string | string[]) {
	// Always call original hook first (React rules)
	const core = coreUseService(
		domain as unknown as any,
		rootTarget as unknown as any,
	);
	const api = getDemoApi();
	if (!api) return core;
	const hass = useHass();
	if (!domain) return (d: string) => useService(d);
	type ServiceArgs = {
		target?: string | string[];
		serviceData?: Record<string, unknown>;
	};
	return new Proxy(
		{},
		{
			get:
				(_: unknown, svc: string) =>
				(args: ServiceArgs = {}) =>
					hass.callService({
						domain,
						service: svc,
						target: args.target ?? rootTarget,
						serviceData: args.serviceData,
					}),
		},
	);
}

export function useEntity(entityId: string) {
	const core = coreUseEntity(entityId as unknown as any) as unknown as {
		history?: Array<[number, number]>;
	} & Record<string, unknown>;
	const api = getDemoApi();
	const [entity, setEntity] = React.useState<DemoApiEntity | undefined>(() =>
		api?.getEntity(entityId),
	);
	React.useEffect(
		() => (api ? api.subscribe(entityId, setEntity) : undefined),
		[entityId, api],
	);
	if (!api) return core;
	if (!entity) return core;
	return { ...core, ...entity, history: entity.history ?? core.history ?? [] };
}
