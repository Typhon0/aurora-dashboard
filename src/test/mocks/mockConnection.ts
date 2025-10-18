import React, { useContext, useEffect, type ReactNode } from "react";
import { HassConnectFake } from "@/demo/HassConnectFake";
import { HassContext } from "@hakit/core";
import { render } from "@testing-library/react";
import { vi } from "vitest";

// vitest mock function to track readiness signal
export const onReady = vi.fn();

// mocked.callService needs to capture service invocation arguments for assertions
export const mocked = {
	callService: vi.fn(),
};

// simple sentinel object so tests can assert identity
export const connection =
	{} as unknown as import("home-assistant-js-websocket").Connection;

function Interceptor({ children }: { children: ReactNode }) {
	const ctx = useContext(HassContext) as unknown as Record<
		string,
		unknown
	> | null;
	useEffect(() => {
		if (!ctx) return;
		// fire readiness once (mimic original test harness after provider mounts)
		if (onReady.mock.calls.length === 0) onReady();
		if (ctx && !("__patched" in ctx)) {
			const original = (ctx as Record<string, unknown>).callService as
				| ((a: unknown) => unknown)
				| undefined;
			(ctx as Record<string, unknown>).callService = (args: unknown) => {
				const a = args as {
					domain: string;
					service: string;
					target?: string | string[];
					serviceData?: unknown;
				};
				const target = Array.isArray(a.target) ? a.target[0] : a.target;
				mocked.callService(connection, a.domain, a.service, a.serviceData, {
					entity_id: target,
				});
				return original ? original(args) : undefined;
			};
			(ctx as Record<string, unknown>).__patched = true;
		}
	}, [ctx]);
	return React.createElement(React.Fragment, null, children);
}

export function TestWrapper({ children }: { children: ReactNode }) {
	return React.createElement(
		HassConnectFake,
		null,
		React.createElement(Interceptor, null, children),
	);
}

export function renderWithHass(ui: React.ReactElement) {
	return render(React.createElement(TestWrapper, null, ui));
}
