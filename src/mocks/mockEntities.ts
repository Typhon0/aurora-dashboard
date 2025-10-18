// Mock entity generator for offline demo mode.
// Provides a deterministic set of Home Assistant-like entities with light drift updates.
// Extended coverage includes legacy demo IDs that some cards historically referenced.
// If you add new components needing entities, prefer adding here rather than hardcoding IDs in UI code.
// Currently provided domains/ids:
// light: demo_lamp, demo_ceiling, fake_light_1, fake_light_2
// climate: demo_hvac, air_conditioner
// media_player: demo_player, fake_speaker
// fan: demo_fan
// switch: demo_outlet, fake_switch
// binary_sensor: demo_door, vehicle
// lock: demo_front_door
// cover: demo_shades, cover_with_tilt
// vacuum: demo_cleaner, robot_vacuum
// alarm_control_panel: demo_alarm, home_alarm
// weather: demo_home, openweathermap
// sensor: demo_temperature, demo_energy_load, air_conditioner_inside_temperature, openweathermap_pressure, time
// number: demo_brightness
// select: demo_mode
// scene: demo_evening, good_morning
// timer: demo_countdown
// person: demo_alex, demo_sam, john_doe, jane_doe
// script: fake_demo

export interface MockEntity<
	TAttr extends Record<string, unknown> = Record<string, unknown>,
> {
	entity_id: string;
	state: string;
	attributes: TAttr & { friendly_name?: string };
	last_changed: string;
	last_updated: string;
	history?: Array<[number, number]>; // timestamp, numeric value
}

export type EntityMap = Record<string, MockEntity>;

const nowISO = () => new Date().toISOString();

interface GenerateOptions {
	seed?: number;
}

// Simple seeded RNG (mulberry32)
function rng(seed: number) {
	let t = seed >>> 0;
	return () => {
		t += 0x6d2b79f5;
		let r = Math.imul(t ^ (t >>> 15), 1 | t);
		r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
		return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
	};
}

export function createMockEntities({
	seed = 1234,
}: GenerateOptions = {}): EntityMap {
	const rand = rng(seed);
	const ts = nowISO();

	const num = (min: number, max: number) =>
		Math.round(min + (max - min) * rand());

	const entities: EntityMap = {};

	const add = (e: MockEntity) => {
		entities[e.entity_id] = e;
	};

	// Lights
	add({
		entity_id: "light.demo_lamp",
		state: "on",
		attributes: {
			friendly_name: "Demo Lamp",
			brightness: 200,
			supported_color_modes: ["rgb"],
			rgb_color: [255, 180, 90],
		},
		last_changed: ts,
		last_updated: ts,
	});
	add({
		entity_id: "light.demo_ceiling",
		state: "off",
		attributes: {
			friendly_name: "Ceiling",
			brightness: 0,
			supported_color_modes: ["brightness"],
		},
		last_changed: ts,
		last_updated: ts,
	});
	// Legacy fake IDs (for backward compat with older demos)
	add({
		entity_id: "light.fake_light_1",
		state: "on",
		attributes: {
			friendly_name: "Fake Light 1",
			brightness: 180,
			supported_color_modes: ["brightness"],
		},
		last_changed: ts,
		last_updated: ts,
	});
	add({
		entity_id: "light.fake_light_2",
		state: "off",
		attributes: {
			friendly_name: "Fake Light 2",
			brightness: 0,
			supported_color_modes: ["brightness"],
		},
		last_changed: ts,
		last_updated: ts,
	});

	// Climate
	add({
		entity_id: "climate.demo_hvac",
		state: "heat",
		attributes: {
			friendly_name: "HVAC",
			temperature: 21,
			hvac_modes: ["off", "heat", "cool", "auto"],
			current_temperature: 20.5,
		},
		last_changed: ts,
		last_updated: ts,
	});
	add({
		entity_id: "climate.air_conditioner",
		state: "cool",
		attributes: {
			friendly_name: "Air Conditioner",
			hvac_modes: ["off", "cool", "heat", "dry"],
			current_temperature: 23.2,
			temperature: 22,
		},
		last_changed: ts,
		last_updated: ts,
	});

	// Media player
	add({
		entity_id: "media_player.demo_player",
		state: "playing",
		attributes: {
			friendly_name: "Media Player",
			media_title: "Lofi Beats",
			volume_level: 0.55,
			media_duration: 300,
			media_position: 120,
		},
		last_changed: ts,
		last_updated: ts,
	});
	add({
		entity_id: "media_player.fake_speaker",
		state: "paused",
		attributes: {
			friendly_name: "Fake Speaker",
			media_title: "Ambient Track",
			volume_level: 0.35,
			media_duration: 600,
			media_position: 0,
		},
		last_changed: ts,
		last_updated: ts,
	});

	// Fan
	add({
		entity_id: "fan.demo_fan",
		state: "on",
		attributes: { friendly_name: "Room Fan", percentage: 50 },
		last_changed: ts,
		last_updated: ts,
	});

	// Switch
	add({
		entity_id: "switch.demo_outlet",
		state: "off",
		attributes: { friendly_name: "Outlet" },
		last_changed: ts,
		last_updated: ts,
	});
	add({
		entity_id: "switch.fake_switch",
		state: "on",
		attributes: { friendly_name: "Fake Switch" },
		last_changed: ts,
		last_updated: ts,
	});

	// Binary sensor
	add({
		entity_id: "binary_sensor.demo_door",
		state: "off",
		attributes: { friendly_name: "Front Door", device_class: "door" },
		last_changed: ts,
		last_updated: ts,
	});
	add({
		entity_id: "binary_sensor.vehicle",
		state: "home",
		attributes: { friendly_name: "Vehicle", device_class: "presence" },
		last_changed: ts,
		last_updated: ts,
	});

	// Lock
	add({
		entity_id: "lock.demo_front_door",
		state: "locked",
		attributes: { friendly_name: "Front Door Lock" },
		last_changed: ts,
		last_updated: ts,
	});

	// Cover
	add({
		entity_id: "cover.demo_shades",
		state: "open",
		attributes: { friendly_name: "Shades", current_position: 75 },
		last_changed: ts,
		last_updated: ts,
	});
	add({
		entity_id: "cover.cover_with_tilt",
		state: "open",
		attributes: {
			friendly_name: "Tilt Cover",
			current_position: 40,
			current_tilt_position: 15,
		},
		last_changed: ts,
		last_updated: ts,
	});

	// Vacuum
	add({
		entity_id: "vacuum.demo_cleaner",
		state: "docked",
		attributes: { friendly_name: "RoboVac", battery_level: 88 },
		last_changed: ts,
		last_updated: ts,
	});
	add({
		entity_id: "vacuum.robot_vacuum",
		state: "cleaning",
		attributes: { friendly_name: "Robot Vacuum", battery_level: 65 },
		last_changed: ts,
		last_updated: ts,
	});

	// Alarm
	add({
		entity_id: "alarm_control_panel.demo_alarm",
		state: "disarmed",
		attributes: { friendly_name: "Security System", supported_features: 15 },
		last_changed: ts,
		last_updated: ts,
	});
	add({
		entity_id: "alarm_control_panel.home_alarm",
		state: "armed_away",
		attributes: { friendly_name: "Home Alarm", supported_features: 31 },
		last_changed: ts,
		last_updated: ts,
	});

	// Weather
	add({
		entity_id: "weather.demo_home",
		state: "sunny",
		attributes: {
			friendly_name: "Weather",
			temperature: 24,
			humidity: 45,
			wind_speed: 8,
		},
		last_changed: ts,
		last_updated: ts,
	});
	add({
		entity_id: "weather.openweathermap",
		state: "cloudy",
		attributes: {
			friendly_name: "OpenWeather",
			temperature: 19,
			humidity: 60,
			wind_speed: 12,
		},
		last_changed: ts,
		last_updated: ts,
	});

	// Sensor (temp, energy)
	add({
		entity_id: "sensor.demo_temperature",
		state: "22.3",
		attributes: { friendly_name: "Temperature", unit_of_measurement: "°C" },
		last_changed: ts,
		last_updated: ts,
		history: Array.from({ length: 48 }, (_, i) => [
			Date.now() - (48 - i) * 3600000,
			20 + Math.sin(i / 5) * 2,
		]),
	});
	add({
		entity_id: "sensor.demo_energy_load",
		state: "420",
		attributes: { friendly_name: "Energy Load", unit_of_measurement: "W" },
		last_changed: ts,
		last_updated: ts,
		history: Array.from({ length: 96 }, (_, i) => [
			Date.now() - (96 - i) * 900000,
			350 + Math.sin(i / 8) * 80 + num(-10, 10),
		]),
	});
	add({
		entity_id: "sensor.air_conditioner_inside_temperature",
		state: "21.7",
		attributes: { friendly_name: "Inside Temp", unit_of_measurement: "°C" },
		last_changed: ts,
		last_updated: ts,
	});
	add({
		entity_id: "sensor.openweathermap_pressure",
		state: "1014",
		attributes: { friendly_name: "Pressure", unit_of_measurement: "hPa" },
		last_changed: ts,
		last_updated: ts,
	});
	add({
		entity_id: "sensor.time",
		state: new Date().toLocaleTimeString("en-US", {
			hour12: false,
			hour: "2-digit",
			minute: "2-digit",
		}),
		attributes: { friendly_name: "Time", device_class: "timestamp" },
		last_changed: ts,
		last_updated: ts,
	});

	// Number
	add({
		entity_id: "number.demo_brightness",
		state: "50",
		attributes: { friendly_name: "Brightness", min: 0, max: 100, step: 1 },
		last_changed: ts,
		last_updated: ts,
	});

	// Select
	add({
		entity_id: "select.demo_mode",
		state: "eco",
		attributes: { friendly_name: "Mode", options: ["eco", "comfort", "boost"] },
		last_changed: ts,
		last_updated: ts,
	});

	// Scene
	add({
		entity_id: "scene.demo_evening",
		state: "scening",
		attributes: { friendly_name: "Evening Scene" },
		last_changed: ts,
		last_updated: ts,
	});
	add({
		entity_id: "scene.good_morning",
		state: "scening",
		attributes: { friendly_name: "Good Morning" },
		last_changed: ts,
		last_updated: ts,
	});

	// Timer
	add({
		entity_id: "timer.demo_countdown",
		state: "active",
		attributes: { friendly_name: "Countdown", remaining: 300 },
		last_changed: ts,
		last_updated: ts,
	});

	// People for family card
	add({
		entity_id: "person.demo_alex",
		state: "home",
		attributes: { friendly_name: "Alex" },
		last_changed: ts,
		last_updated: ts,
	});
	add({
		entity_id: "person.demo_sam",
		state: "not_home",
		attributes: { friendly_name: "Sam" },
		last_changed: ts,
		last_updated: ts,
	});
	add({
		entity_id: "person.john_doe",
		state: "home",
		attributes: { friendly_name: "John Doe" },
		last_changed: ts,
		last_updated: ts,
	});
	add({
		entity_id: "person.jane_doe",
		state: "not_home",
		attributes: { friendly_name: "Jane Doe" },
		last_changed: ts,
		last_updated: ts,
	});

	// Script entity used by trigger card
	add({
		entity_id: "script.fake_demo",
		state: "off",
		attributes: { friendly_name: "Demo Script" },
		last_changed: ts,
		last_updated: ts,
	});

	return entities;
}
