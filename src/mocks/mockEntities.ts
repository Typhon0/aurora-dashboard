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
// sensor: demo_temperature, demo_energy_load, air_conditioner_inside_temperature, openweathermap_pressure, time, demo_garbage_collection
// number: demo_brightness
// select: demo_mode
// scene: demo_evening, good_morning
// timer: demo_countdown
// person: demo_alex, demo_sam, john_doe, jane_doe
// script: fake_demo
// calendar: demo_calendar
// camera: demo_front_camera
// image: demo_picture

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
	add({
		entity_id: "light.demo_warm_white",
		state: "on",
		attributes: {
			friendly_name: "Warm White",
			brightness: 180,
			supported_color_modes: ["color_temp"],
			color_temp: 370,
			min_mireds: 153,
			max_mireds: 500,
		},
		last_changed: ts,
		last_updated: ts,
	});
	add({
		entity_id: "light.demo_rgb_temp",
		state: "on",
		attributes: {
			friendly_name: "RGB+Temp",
			brightness: 200,
			supported_color_modes: ["rgb", "color_temp"],
			rgb_color: [100, 150, 255],
			color_temp: 300,
			min_mireds: 153,
			max_mireds: 500,
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
			friendly_name: "Living Room Speaker",
			media_title: "Midnight City",
			media_artist: "M83",
			media_album_name: "Hurry Up, We're Dreaming",
			media_content_type: "music",
			volume_level: 0.55,
			media_duration: 236,
			media_position: 90,
			entity_picture: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400",
		},
		last_changed: ts,
		last_updated: ts,
	});
	add({
		entity_id: "media_player.fake_speaker",
		state: "paused",
		attributes: {
			friendly_name: "Bedroom Speaker",
			media_title: "Ambient Track",
			volume_level: 0.35,
			media_duration: 600,
			media_position: 0,
		},
		last_changed: ts,
		last_updated: ts,
	});
	add({
		entity_id: "media_player.tv_living_room",
		state: "playing",
		attributes: {
			friendly_name: "Living Room TV",
			media_title: "The Long Night",
			media_series_title: "Game of Thrones",
			media_season: 8,
			media_episode: 3,
			media_content_type: "tvshow",
			app_name: "Netflix",
			volume_level: 0.45,
			entity_picture: "https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?w=400",
		},
		last_changed: ts,
		last_updated: ts,
	});
	add({
		entity_id: "media_player.bedroom_tv",
		state: "paused",
		attributes: {
			friendly_name: "Bedroom TV",
			media_title: "Inception",
			media_content_type: "movie",
			app_name: "Disney+",
			volume_level: 0.60,
			entity_picture: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400",
		},
		last_changed: ts,
		last_updated: ts,
	});
	add({
		entity_id: "media_player.kitchen_display",
		state: "idle",
		attributes: {
			friendly_name: "Kitchen Display",
			volume_level: 0.30,
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
	add({
		entity_id: "lock.demo_gate",
		state: "locked",
		attributes: { friendly_name: "Gate Lock" },
		last_changed: ts,
		last_updated: ts,
	});
	add({
		entity_id: "lock.demo_garage",
		state: "unlocked",
		attributes: { friendly_name: "Garage Lock" },
		last_changed: ts,
		last_updated: ts,
	});
	add({
		entity_id: "lock.demo_car",
		state: "locked",
		attributes: { friendly_name: "Car Lock" },
		last_changed: ts,
		last_updated: ts,
	});
	add({
		entity_id: "lock.demo_child_safety",
		state: "locked",
		attributes: { friendly_name: "Child Safety Lock" },
		last_changed: ts,
		last_updated: ts,
	});

	// Additional Fans
	add({
		entity_id: "fan.demo_ceiling",
		state: "on",
		attributes: { friendly_name: "Ceiling Fan", percentage: 75 },
		last_changed: ts,
		last_updated: ts,
	});
	add({
		entity_id: "fan.demo_vent",
		state: "off",
		attributes: { friendly_name: "Vent Fan", percentage: 0 },
		last_changed: ts,
		last_updated: ts,
	});
	add({
		entity_id: "fan.demo_purifier",
		state: "on",
		attributes: { friendly_name: "Air Purifier", percentage: 50 },
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
	add({
		entity_id: "alarm_control_panel.demo_home_alarm",
		state: "disarmed",
		attributes: { friendly_name: "Home Alarm", code_format: "number", supported_features: 3 },
		last_changed: ts,
		last_updated: ts,
	});

	// Binary Sensor - Demo
	add({
		entity_id: "binary_sensor.demo_front_door",
		state: "off",
		attributes: { friendly_name: "Front Door", device_class: "door" },
		last_changed: ts,
		last_updated: ts,
	});
	add({
		entity_id: "binary_sensor.demo_office_window",
		state: "on",
		attributes: { friendly_name: "Office Window", device_class: "window" },
		last_changed: ts,
		last_updated: ts,
	});
	add({
		entity_id: "binary_sensor.demo_hallway_motion",
		state: "on",
		attributes: { friendly_name: "Hallway Motion", device_class: "motion" },
		last_changed: ts,
		last_updated: ts,
	});

	// Buttons
	add({
		entity_id: "button.demo_restart",
		state: "unknown",
		attributes: { friendly_name: "Restart Server" },
		last_changed: ts,
		last_updated: ts,
	});

	// Camera
	add({
		entity_id: "camera.demo_entry_feed",
		state: "idle",
		attributes: {
			friendly_name: "Entry Feed",
			entity_picture: "https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=400&auto=format&fit=crop"
		},
		last_changed: ts,
		last_updated: ts,
	});

	// Covers
	add({
		entity_id: "cover.demo_living_blinds",
		state: "open",
		attributes: { friendly_name: "Living Blinds", current_position: 100, device_class: "blind" },
		last_changed: ts,
		last_updated: ts,
	});
	add({
		entity_id: "cover.demo_bedroom_curtains",
		state: "closed",
		attributes: { friendly_name: "Bedroom Curtains", current_position: 0, device_class: "curtain" },
		last_changed: ts,
		last_updated: ts,
	});

	// Sensors (Specific Demo IDs)
	add({
		entity_id: "sensor.demo_power_draw",
		state: "2450",
		attributes: { friendly_name: "Power Draw", unit_of_measurement: "W", device_class: "power" },
		last_changed: ts,
		last_updated: ts,
	});
	add({
		entity_id: "sensor.demo_water_pressure",
		state: "3.2",
		attributes: { friendly_name: "Water Pressure", unit_of_measurement: "bar", device_class: "pressure" },
		last_changed: ts,
		last_updated: ts,
	});

	// Numbers
	add({
		entity_id: "number.demo_temperature_threshold",
		state: "21.5",
		attributes: { friendly_name: "Temperature Threshold", min: 15, max: 30, step: 0.5, unit_of_measurement: "°C" },
		last_changed: ts,
		last_updated: ts,
	});

	// Selects
	add({
		entity_id: "select.demo_av_source",
		state: "Apple TV",
		attributes: { friendly_name: "AV Source", options: ["TV", "Apple TV", "PlayStation", "Sonos"] },
		last_changed: ts,
		last_updated: ts,
	});
	add({
		entity_id: "select.demo_operation_mode",
		state: "Comfort",
		attributes: { friendly_name: "House Mode", options: ["Home", "Away", "Night", "Comfort", "Eco"] },
		last_changed: ts,
		last_updated: ts,
	});

	// Timers
	add({
		entity_id: "timer.demo_kitchen_timer",
		state: "active",
		attributes: { friendly_name: "Kitchen Timer", duration: "00:15:00", remaining: "00:08:30" },
		last_changed: ts,
		last_updated: ts,
	});

	// Scripts
	add({
		entity_id: "script.demo_goodnight",
		state: "off",
		attributes: { friendly_name: "Goodnight Scene" },
		last_changed: ts,
		last_updated: ts,
	});

	// Vacuums
	add({
		entity_id: "vacuum.demo_roborock",
		state: "docked",
		attributes: { friendly_name: "Roborock S7", battery_level: 100, fan_speed: "Standard" },
		last_changed: ts,
		last_updated: ts,
	});
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

	// Additional sensor types for demo
	add({
		entity_id: "sensor.demo_humidity",
		state: "45",
		attributes: {
			friendly_name: "Humidity",
			unit_of_measurement: "%",
			device_class: "humidity"
		},
		last_changed: ts,
		last_updated: ts,
	});
	add({
		entity_id: "sensor.demo_battery",
		state: "78",
		attributes: {
			friendly_name: "Device Battery",
			unit_of_measurement: "%",
			device_class: "battery"
		},
		last_changed: ts,
		last_updated: ts,
	});
	add({
		entity_id: "sensor.demo_illuminance",
		state: "2450",
		attributes: {
			friendly_name: "Light Level",
			unit_of_measurement: "lx",
			device_class: "illuminance"
		},
		last_changed: ts,
		last_updated: ts,
	});
	add({
		entity_id: "sensor.demo_co2",
		state: "650",
		attributes: {
			friendly_name: "CO₂ Level",
			unit_of_measurement: "ppm"
		},
		last_changed: ts,
		last_updated: ts,
	});
	add({
		entity_id: "sensor.demo_aqi",
		state: "32",
		attributes: {
			friendly_name: "Air Quality",
			unit_of_measurement: "AQI",
			device_class: "aqi"
		},
		last_changed: ts,
		last_updated: ts,
	});
	add({
		entity_id: "sensor.demo_power",
		state: "1250",
		attributes: {
			friendly_name: "Power Consumption",
			unit_of_measurement: "W",
			device_class: "power"
		},
		last_changed: ts,
		last_updated: ts,
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

	// Input Numbers (Variants)
	add({
		entity_id: "input_number.target_temperature",
		state: "21.5",
		attributes: {
			friendly_name: "Target Temp",
			min: 16,
			max: 30,
			step: 0.5,
			unit_of_measurement: "°C",
			device_class: "temperature"
		},
		last_changed: ts,
		last_updated: ts,
	});
	add({
		entity_id: "input_number.humidity_target",
		state: "45",
		attributes: {
			friendly_name: "Target Humidity",
			min: 30,
			max: 80,
			step: 1,
			unit_of_measurement: "%",
			device_class: "humidity"
		},
		last_changed: ts,
		last_updated: ts,
	});
	add({
		entity_id: "input_number.power_limit",
		state: "2500",
		attributes: {
			friendly_name: "Power Limit",
			min: 0,
			max: 5000,
			step: 100,
			unit_of_measurement: "W",
			device_class: "power"
		},
		last_changed: ts,
		last_updated: ts,
	});
	add({
		entity_id: "input_number.pressure_bias",
		state: "1013",
		attributes: {
			friendly_name: "Pressure Bias",
			min: 950,
			max: 1050,
			step: 1,
			unit_of_measurement: "hPa",
			device_class: "pressure"
		},
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

	add({
		entity_id: "select.tv_source",
		state: "Netflix",
		attributes: {
			friendly_name: "TV Source",
			options: ["HDMI 1", "HDMI 2", "Netflix", "YouTube", "Spotify", "AirPlay"],
			icon: "mdi:television"
		},
		last_changed: ts,
		last_updated: ts,
	});

	add({
		entity_id: "select.ac_preset",
		state: "Sleep",
		attributes: {
			friendly_name: "AC Preset",
			options: ["Eco", "Standard", "Boost", "Sleep", "Away"],
			icon: "mdi:fan"
		},
		last_changed: ts,
		last_updated: ts,
	});

	add({
		entity_id: "select.radio_station",
		state: "Lo-Fi Beats",
		attributes: {
			friendly_name: "Radio Station",
			options: [
				"Top 40", "Jazz Classics", "Classic Rock", "BBC News",
				"Lo-Fi Beats", "Pop Hits", "Country Roads", "Hip Hop",
				"Blues", "Tech Talk", "Sports Radio", "NPR", "Classical"
			],
			icon: "mdi:radio"
		},
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
		attributes: {
			friendly_name: "Kitchen Timer",
			duration: "00:05:00",
			remaining: "00:02:30", // Used when paused
			finishes_at: new Date(Date.now() + 150000).toISOString(), // 2m 30s from now
			icon: "mdi:timer-outline"
		},
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

	// Calendar entity
	add({
		entity_id: "calendar.demo_calendar",
		state: "off",
		attributes: {
			friendly_name: "My Calendar",
			events: [
				{
					id: 1,
					summary: "Team Meeting",
					start: new Date(Date.now() + 3600000 * 2).toISOString(),
				},
				{
					id: 2,
					summary: "Doctor Appointment",
					start: new Date(Date.now() + 86400000).toISOString(),
				},
				{
					id: 3,
					summary: "Birthday Party",
					start: new Date(Date.now() + 86400000 * 3).toISOString(),
				},
			],
		},
		last_changed: ts,
		last_updated: ts,
	});

	// Camera entity
	add({
		entity_id: "camera.demo_front_camera",
		state: "idle",
		attributes: {
			friendly_name: "Front Door Camera",
			entity_picture: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400",
		},
		last_changed: ts,
		last_updated: ts,
	});

	// Garbage collection sensor
	add({
		entity_id: "sensor.demo_garbage_collection",
		state: "scheduled",
		attributes: {
			friendly_name: "Recycling",
			type: "Recycling",
			next_date: new Date(Date.now() + 86400000 * 2).toISOString(),
		},
		last_changed: ts,
		last_updated: ts,
	});

	// Image/Picture entity
	add({
		entity_id: "image.demo_picture",
		state: "idle",
		attributes: {
			friendly_name: "Family Photo",
			entity_picture: "https://images.unsplash.com/photo-1511895426328-dc8714191300?w=400",
		},
		last_changed: ts,
		last_updated: ts,
	});

	return entities;
}