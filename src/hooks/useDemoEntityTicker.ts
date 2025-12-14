import { useEffect, useRef } from "react";
import { useStore } from "@hakit/core";
import type { HassEntity } from "home-assistant-js-websocket";

/**
 * useDemoEntityTicker
 * Centralized ticking updates for demo entities.
 * It performs lightweight state mutations without mimicking the full HA event bus.
 */
export interface UseDemoEntityTickerOptions {
	/** How often to update temperature sensor (ms) */
	temperatureTickMs?: number;
	/** How often to update time sensor (ms) */
	timeTickMs?: number;
	/** How often to update pressure sensor (ms) */
	pressureTickMs?: number;
}

export const useDemoEntityTicker = ({
	temperatureTickMs = 2000,
	timeTickMs = 2000,
	pressureTickMs = 2000,
}: UseDemoEntityTickerOptions = {}) => {
	const intervalRef = useRef<NodeJS.Timeout | null>(null);
	useEffect(() => {
		if (intervalRef.current) return;
		intervalRef.current = setInterval(() => {
			const { entities } = useStore.getState();
			const now = new Date();
			const updates: Record<string, HassEntity> = {};

			// Temperature drift
			if (now.getTime() % temperatureTickMs < 50) {
				const temp = entities["sensor.demo_temperature"];
				if (temp) {
					const base = parseFloat(temp.state) || 20;
					const drift = (Math.random() - 0.5) * 0.2;
					updates[temp.entity_id] = {
						...temp,
						state: (base + drift).toFixed(2),
						last_updated: now.toISOString(),
					};
				}
			}
			// Clock tick
			if (now.getTime() % timeTickMs < 50) {
				const timeEnt = entities["sensor.time"];
				if (timeEnt) {
					updates[timeEnt.entity_id] = {
						...timeEnt,
						state: now.toLocaleTimeString("en-US", {
							hour12: false,
							hour: "2-digit",
							minute: "2-digit",
						}),
						last_updated: now.toISOString(),
					};
				}
			}
			// Pressure drift
			if (now.getTime() % pressureTickMs < 50) {
				const pressure = entities["sensor.openweathermap_pressure"];
				if (pressure) {
					const base = parseFloat(pressure.state) || 1013;
					const drift = (Math.random() - 0.5) * 0.8;
					updates[pressure.entity_id] = {
						...pressure,
						state: (base + drift).toFixed(0),
						last_updated: now.toISOString(),
					};
				}
			}
			if (Object.keys(updates).length) {
				useStore.setState((prev) => ({
					...prev,
					entities: { ...prev.entities, ...updates },
				}));
			}
		}, 200);
		return () => {
			if (intervalRef.current) clearInterval(intervalRef.current);
		};
	}, [temperatureTickMs, timeTickMs, pressureTickMs]);
};
