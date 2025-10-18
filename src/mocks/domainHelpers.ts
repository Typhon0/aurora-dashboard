// Helper builders for common Home Assistant domain mock entities.
// These produce objects matching the `MockEntity` shape used in the demo/mock layer.
// They are intentionally small (only attributes actually leveraged by existing Aurora cards)
// but can be safely extended. All timestamps default to now unless overridden.
//
// Usage example:
//   import { createLight, createSensor, entityMap } from "@/mocks/domainHelpers";
//   const entities = entityMap(
//     createLight("light.demo_lamp", { state: "on", attributes: { brightness: 200 } }),
//     createSensor("sensor.outdoor_temp", { state: "17.2", attributes: { unit_of_measurement: "°C" } }),
//   );
//
// You can then merge this map into the store or pass to a mock provider.

import type { MockEntity, EntityMap } from "./mockEntities";

const nowISO = () => new Date().toISOString();

type History = Array<[number, number]>;

interface BaseOverrides<T extends Record<string, unknown>> {
	state?: string;
	attributes?: Partial<T & { friendly_name?: string }>;
	last_changed?: string;
	last_updated?: string;
	history?: History;
}

// ---- Attribute Interfaces (minimal) ----
export interface LightAttributes extends Record<string, unknown> {
	friendly_name?: string;
	brightness?: number;
	supported_color_modes?: string[];
	rgb_color?: [number, number, number];
}
export interface SwitchAttributes extends Record<string, unknown> {
	friendly_name?: string;
}
export interface BinarySensorAttributes extends Record<string, unknown> {
	friendly_name?: string;
	device_class?: string;
}
export interface SensorAttributes extends Record<string, unknown> {
	friendly_name?: string;
	unit_of_measurement?: string;
	device_class?: string;
}
export interface NumberAttributes extends Record<string, unknown> {
	friendly_name?: string;
	min?: number;
	max?: number;
	step?: number;
	unit_of_measurement?: string;
}
export interface SelectAttributes extends Record<string, unknown> {
	friendly_name?: string;
	options?: string[];
}
export interface SceneAttributes extends Record<string, unknown> {
	friendly_name?: string;
}
export interface LockAttributes extends Record<string, unknown> {
	friendly_name?: string;
}
export interface CoverAttributes extends Record<string, unknown> {
	friendly_name?: string;
	current_position?: number;
}
export interface FanAttributes extends Record<string, unknown> {
	friendly_name?: string;
	percentage?: number;
	percentage_step?: number;
}
export interface ClimateAttributes extends Record<string, unknown> {
	friendly_name?: string;
	temperature?: number;
	current_temperature?: number;
	hvac_modes?: string[];
	hvac_action?: string;
	unit_of_measurement?: string;
}
export interface MediaPlayerAttributes extends Record<string, unknown> {
	friendly_name?: string;
	media_title?: string;
	media_artist?: string;
	volume_level?: number;
	media_duration?: number;
	media_position?: number;
	media_position_updated_at?: string;
}
export interface VacuumAttributes extends Record<string, unknown> {
	friendly_name?: string;
	battery_level?: number;
}
export interface AlarmAttributes extends Record<string, unknown> {
	friendly_name?: string;
	supported_features?: number;
}
export interface WeatherAttributes extends Record<string, unknown> {
	friendly_name?: string;
	temperature?: number;
	humidity?: number;
	wind_speed?: number;
}
export interface PersonAttributes extends Record<string, unknown> {
	friendly_name?: string;
	entity_picture?: string;
}
export interface TimerAttributes extends Record<string, unknown> {
	friendly_name?: string;
	remaining?: number;
}
export interface CalendarAttributes extends Record<string, unknown> {
	friendly_name?: string;
}
export interface CameraAttributes extends Record<string, unknown> {
	friendly_name?: string;
	entity_picture?: string;
}
export interface AutomationAttributes extends Record<string, unknown> {
	friendly_name?: string;
}

// ---- Generic builder ----
function buildEntity<T extends Record<string, unknown>>(
	entity_id: string,
	domainDefaults: { state: string; attributes: T & { friendly_name?: string } },
	overrides: BaseOverrides<T> = {},
): MockEntity<T> {
	const ts = nowISO();
	return {
		entity_id,
		state: overrides.state ?? domainDefaults.state,
		attributes: {
			...domainDefaults.attributes,
			...(overrides.attributes || {}),
		},
		last_changed: overrides.last_changed ?? ts,
		last_updated: overrides.last_updated ?? ts,
		history: overrides.history,
	} as MockEntity<T>;
}

// ---- Domain specific factory functions ----
export const createLight = (
	entity_id: string,
	overrides?: BaseOverrides<LightAttributes>,
) =>
	buildEntity<LightAttributes>(
		entity_id,
		{ state: "off", attributes: { friendly_name: entity_id.split(".")[1] } },
		overrides,
	);

export const createSwitch = (
	entity_id: string,
	overrides?: BaseOverrides<SwitchAttributes>,
) =>
	buildEntity<SwitchAttributes>(
		entity_id,
		{ state: "off", attributes: { friendly_name: entity_id.split(".")[1] } },
		overrides,
	);

export const createBinarySensor = (
	entity_id: string,
	overrides?: BaseOverrides<BinarySensorAttributes>,
) =>
	buildEntity<BinarySensorAttributes>(
		entity_id,
		{ state: "off", attributes: { friendly_name: entity_id.split(".")[1] } },
		overrides,
	);

export const createSensor = (
	entity_id: string,
	overrides?: BaseOverrides<SensorAttributes>,
) =>
	buildEntity<SensorAttributes>(
		entity_id,
		{ state: "0", attributes: { friendly_name: entity_id.split(".")[1] } },
		overrides,
	);

export const createNumber = (
	entity_id: string,
	overrides?: BaseOverrides<NumberAttributes>,
) =>
	buildEntity<NumberAttributes>(
		entity_id,
		{
			state: "0",
			attributes: {
				friendly_name: entity_id.split(".")[1],
				min: 0,
				max: 100,
				step: 1,
			},
		},
		overrides,
	);

export const createSelect = (
	entity_id: string,
	overrides?: BaseOverrides<SelectAttributes>,
) =>
	buildEntity<SelectAttributes>(
		entity_id,
		{
			state: "",
			attributes: { friendly_name: entity_id.split(".")[1], options: [] },
		},
		overrides,
	);

export const createScene = (
	entity_id: string,
	overrides?: BaseOverrides<SceneAttributes>,
) =>
	buildEntity<SceneAttributes>(
		entity_id,
		{
			state: "scening",
			attributes: { friendly_name: entity_id.split(".")[1] },
		},
		overrides,
	);

export const createLock = (
	entity_id: string,
	overrides?: BaseOverrides<LockAttributes>,
) =>
	buildEntity<LockAttributes>(
		entity_id,
		{ state: "locked", attributes: { friendly_name: entity_id.split(".")[1] } },
		overrides,
	);

export const createCover = (
	entity_id: string,
	overrides?: BaseOverrides<CoverAttributes>,
) =>
	buildEntity<CoverAttributes>(
		entity_id,
		{
			state: "open",
			attributes: {
				friendly_name: entity_id.split(".")[1],
				current_position: 100,
			},
		},
		overrides,
	);

export const createFan = (
	entity_id: string,
	overrides?: BaseOverrides<FanAttributes>,
) =>
	buildEntity<FanAttributes>(
		entity_id,
		{
			state: "off",
			attributes: {
				friendly_name: entity_id.split(".")[1],
				percentage: 0,
				percentage_step: 10,
			},
		},
		overrides,
	);

export const createClimate = (
	entity_id: string,
	overrides?: BaseOverrides<ClimateAttributes>,
) =>
	buildEntity<ClimateAttributes>(
		entity_id,
		{
			state: "off",
			attributes: {
				friendly_name: entity_id.split(".")[1],
				temperature: 21,
				current_temperature: 20.5,
				hvac_modes: ["off", "heat", "cool", "auto"],
				unit_of_measurement: "°C",
			},
		},
		overrides,
	);

export const createMediaPlayer = (
	entity_id: string,
	overrides?: BaseOverrides<MediaPlayerAttributes>,
) =>
	buildEntity<MediaPlayerAttributes>(
		entity_id,
		{
			state: "idle",
			attributes: {
				friendly_name: entity_id.split(".")[1],
				media_title: "",
				media_artist: "",
				volume_level: 0.5,
				media_duration: 0,
				media_position: 0,
				media_position_updated_at: nowISO(),
			},
		},
		overrides,
	);

export const createVacuum = (
	entity_id: string,
	overrides?: BaseOverrides<VacuumAttributes>,
) =>
	buildEntity<VacuumAttributes>(
		entity_id,
		{
			state: "docked",
			attributes: {
				friendly_name: entity_id.split(".")[1],
				battery_level: 100,
			},
		},
		overrides,
	);

export const createAlarm = (
	entity_id: string,
	overrides?: BaseOverrides<AlarmAttributes>,
) =>
	buildEntity<AlarmAttributes>(
		entity_id,
		{
			state: "disarmed",
			attributes: {
				friendly_name: entity_id.split(".")[1],
				supported_features: 0,
			},
		},
		overrides,
	);

export const createWeather = (
	entity_id: string,
	overrides?: BaseOverrides<WeatherAttributes>,
) =>
	buildEntity<WeatherAttributes>(
		entity_id,
		{
			state: "sunny",
			attributes: {
				friendly_name: entity_id.split(".")[1],
				temperature: 20,
				humidity: 40,
				wind_speed: 5,
			},
		},
		overrides,
	);

export const createPerson = (
	entity_id: string,
	overrides?: BaseOverrides<PersonAttributes>,
) =>
	buildEntity<PersonAttributes>(
		entity_id,
		{ state: "home", attributes: { friendly_name: entity_id.split(".")[1] } },
		overrides,
	);

export const createTimer = (
	entity_id: string,
	overrides?: BaseOverrides<TimerAttributes>,
) =>
	buildEntity<TimerAttributes>(
		entity_id,
		{
			state: "idle",
			attributes: { friendly_name: entity_id.split(".")[1], remaining: 0 },
		},
		overrides,
	);

export const createCalendar = (
	entity_id: string,
	overrides?: BaseOverrides<CalendarAttributes>,
) =>
	buildEntity<CalendarAttributes>(
		entity_id,
		{ state: "on", attributes: { friendly_name: entity_id.split(".")[1] } },
		overrides,
	);

export const createCamera = (
	entity_id: string,
	overrides?: BaseOverrides<CameraAttributes>,
) =>
	buildEntity<CameraAttributes>(
		entity_id,
		{ state: "idle", attributes: { friendly_name: entity_id.split(".")[1] } },
		overrides,
	);

export const createAutomation = (
	entity_id: string,
	overrides?: BaseOverrides<AutomationAttributes>,
) =>
	buildEntity<AutomationAttributes>(
		entity_id,
		{ state: "off", attributes: { friendly_name: entity_id.split(".")[1] } },
		overrides,
	);

// Convenience helper to build an EntityMap from a list of entities
export function entityMap(...entities: MockEntity[]): EntityMap {
	return entities.reduce<EntityMap>((acc, e) => {
		acc[e.entity_id] = e;
		return acc;
	}, {} as EntityMap);
}

// Combine several EntityMaps into one (later maps override earlier ones)
export function mergeEntityMaps(...maps: EntityMap[]): EntityMap {
	return Object.assign({}, ...maps);
}

// Re-export type for convenience
export type { MockEntity };

// ---------------- Seedable Randomized Generator ----------------
// Lightweight mulberry32 PRNG for deterministic pseudo-random values.
function mulberry32(seed: number) {
	let t = seed >>> 0;
	return () => {
		t += 0x6d2b79f5;
		let r = Math.imul(t ^ (t >>> 15), 1 | t);
		r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
		return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
	};
}

interface SeedOptions {
	seed?: number;
	includeHistory?: boolean; // add small numeric history arrays for sensors
	lightCount?: number;
	sensorCount?: number;
	switchCount?: number;
	binarySensorCount?: number;
	fanCount?: number;
}

// Utility to pick an item.
function pick<T>(rand: () => number, arr: readonly T[]): T {
	return arr[Math.floor(rand() * arr.length)];
}

// Generate a deterministic but varied set of entities for demos/tests.
export function generateSeededEntities(options: SeedOptions = {}): EntityMap {
	const {
		seed = 1234,
		includeHistory = true,
		lightCount = 2,
		sensorCount = 3,
		switchCount = 2,
		binarySensorCount = 1,
		fanCount = 1,
	} = options;
	const rand = mulberry32(seed);
	const maps: EntityMap[] = [];

	// Lights
	for (let i = 0; i < lightCount; i++) {
		const brightness = Math.round(rand() * 255);
		const rgb: [number, number, number] = [
			Math.round(rand() * 255),
			Math.round(rand() * 255),
			Math.round(rand() * 255),
		];
		maps.push(
			entityMap(
				createLight(`light.seed_${i + 1}`, {
					state: rand() > 0.5 ? "on" : "off",
					attributes: {
						brightness,
						supported_color_modes: ["rgb"],
						rgb_color: rgb,
						friendly_name: `Seed Light ${i + 1}`,
					},
				}),
			),
		);
	}

	// Sensors
	const sensorTypes = [
		{ key: "temperature", unit: "°C", base: 20, span: 5 },
		{ key: "humidity", unit: "%", base: 40, span: 30 },
		{ key: "energy", unit: "W", base: 300, span: 200 },
		{ key: "pressure", unit: "hPa", base: 1012, span: 20 },
	] as const;
	for (let i = 0; i < sensorCount; i++) {
		const t = pick(rand, sensorTypes);
		const value = (t.base + (rand() - 0.5) * t.span).toFixed(2);
		const history: History | undefined = includeHistory
			? (Array.from({ length: 24 }, (_, h) => [
					Date.now() - (24 - h) * 3600000,
					t.base +
						Math.sin(h / 3) * (t.span / 4) +
						(rand() - 0.5) * (t.span / 6),
				]) as History)
			: undefined;
		maps.push(
			entityMap(
				createSensor(`sensor.seed_${t.key}_${i + 1}`, {
					state: value,
					attributes: {
						unit_of_measurement: t.unit,
						friendly_name: `Seed ${t.key} ${i + 1}`,
						device_class: t.key === "energy" ? "power" : t.key,
					},
					history,
				}),
			),
		);
	}

	// Switches
	for (let i = 0; i < switchCount; i++) {
		maps.push(
			entityMap(
				createSwitch(`switch.seed_${i + 1}`, {
					state: rand() > 0.4 ? "on" : "off",
					attributes: { friendly_name: `Seed Switch ${i + 1}` },
				}),
			),
		);
	}

	// Binary Sensors
	const binClasses = ["motion", "door", "window", "occupancy"] as const;
	for (let i = 0; i < binarySensorCount; i++) {
		const cls = pick(rand, binClasses);
		maps.push(
			entityMap(
				createBinarySensor(`binary_sensor.seed_${cls}_${i + 1}`, {
					state: rand() > 0.5 ? "on" : "off",
					attributes: {
						device_class: cls,
						friendly_name: `Seed ${cls} ${i + 1}`,
					},
				}),
			),
		);
	}

	// Fans
	for (let i = 0; i < fanCount; i++) {
		const pct = Math.round(rand() * 100);
		maps.push(
			entityMap(
				createFan(`fan.seed_${i + 1}`, {
					state: pct > 0 ? "on" : "off",
					attributes: { percentage: pct, friendly_name: `Seed Fan ${i + 1}` },
				}),
			),
		);
	}

	// Always include one climate and media player for variety
	maps.push(
		entityMap(
			createClimate("climate.seed_main", {
				state: pick(rand, ["heat", "cool", "auto", "off"]),
				attributes: {
					temperature: 21 + Math.round(rand() * 3),
					current_temperature: 20 + Math.round(rand() * 3),
					friendly_name: "Seed Climate",
				},
			}),
			createMediaPlayer("media_player.seed_player", {
				state: pick(rand, ["idle", "playing", "paused"]),
				attributes: {
					friendly_name: "Seed Player",
					media_title: pick(rand, ["Lofi Beats", "Chill Mix", "News"]),
					media_artist: pick(rand, ["DJ Random", "Various", "Station"]),
					volume_level: +rand().toFixed(2),
				},
			}),
		),
	);

	return mergeEntityMaps(...maps);
}

export type { SeedOptions };
