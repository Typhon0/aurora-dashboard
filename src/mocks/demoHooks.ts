/* demoHooks: optional wrappers for demo mode (AURORA_DEMO=1) */
import React from "react";
import { useEntity, useService, useHass } from "@hakit/core";

interface DemoApiEntity {
	entity_id: string;
	state: string;
	attributes: Record<string, unknown>;
	last_changed: string;
	last_updated: string;
	history?: Array<[number, number]>;
}
interface DemoApi {
	getEntity(id: string): DemoApiEntity | undefined;
	subscribe(id: string, cb: (e: DemoApiEntity) => void): () => void;
	callService(
		domain: string,
		service: string,
		payload: { target?: string | string[]; [k: string]: unknown },
	): void;
}

function getApi(): DemoApi | undefined {
	if (typeof window === "undefined") return undefined;
	return (window as unknown as { __AURORA_DEMO__?: DemoApi }).__AURORA_DEMO__;
}

export function useDemoHass() {
	const core = useHass();
	const api = getApi();
	const wrapped = React.useMemo(() => {
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
	}, [core, api]);
	return wrapped;
}

export function useDemoService(
	domain?: string,
	rootTarget?: string | string[],
) {
	const core = useService(
		domain as unknown as never,
		rootTarget as unknown as never,
	);
	const api = getApi();
	const hass = useDemoHass();
	return React.useMemo(() => {
		if (!api || !domain) return core;
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
	}, [api, domain, hass, core, rootTarget]);
}

export function useDemoEntity(entityId: string) {
	// prevent throws by requesting null instead of error if entity missing in real store
	const core = useEntity(entityId as unknown as never, {
		returnNullIfNotFound: true,
	}) as unknown as
		| ({ history?: Array<[number, number]> } & Record<string, unknown>)
		| null;
	const api = getApi();
	const [entity, setEntity] = React.useState<DemoApiEntity | undefined>(() =>
		api?.getEntity(entityId),
	);
	React.useEffect(
		() => (api ? api.subscribe(entityId, setEntity) : undefined),
		[entityId, api],
	);
	return React.useMemo(() => {
		if (!api) return core;
		if (!entity) return core;
		// merge mock entity data over core (core may be null if not found in real store)
		const history = entity.history ?? (core ? core.history : []) ?? [];
		return { ...(core ?? {}), ...entity, history };
	}, [api, entity, core]);
}
