// Import des types natifs Home Assistant
import type { HassEntity, HassEntities } from "home-assistant-js-websocket";

// Interface Aurora compatible avec HassEntity v9.5+
export interface HAEntity {
	entity_id: string;
	state: string;
	attributes: {
		friendly_name: string; // ✅ Toujours string grâce à notre conversion
		device_class?: string;
		unit_of_measurement?: string;
		brightness?: number;
		temperature?: number;
		current_temperature?: number;
		target_temperature?: number;
		hvac_mode?: string;
		hvac_modes?: string[];
		supported_features?: number;
		[key: string]: any;
	};
	last_changed: string;
	last_updated: string;
}

// Utility type pour convertir HassEntity vers HAEntity
export type ConvertedHAEntity = Omit<HassEntity, "attributes"> & {
	attributes: HAEntity["attributes"];
};

// Re-export des types utiles de home-assistant-js-websocket
export type { HassEntity, HassEntities } from "home-assistant-js-websocket";

// Reste des types Aurora...
export type EntityDomain =
	| "light"
	| "switch"
	| "sensor"
	| "binary_sensor"
	| "climate"
	| "cover"
	| "fan"
	| "media_player"
	| "weather"
	| "sun"
	| "person"
	| "device_tracker"
	| "automation"
	| "script"
	| "scene";

export interface AuroraConfig {
	title: string;
	theme: "light" | "dark" | "auto";
	kioskMode: boolean;
	rooms: AuroraRoom[];
	layout: AuroraLayout;
}

export interface AuroraRoom {
	id: string;
	name: string;
	icon: string;
	color?: string;
	entities: string[];
	order: number;
}

export interface AuroraLayout {
	columns: number;
	gap: number;
	cardSizes: Record<CardSize, { width: number; height: number }>;
}

export type CardSize = "small" | "medium" | "large" | "wide";
export type CardVariant =
	| "default"
	| "accent"
	| "success"
	| "warning"
	| "error";

export interface AuroraCardProps {
	entity?: HAEntity;
	size?: CardSize;
	variant?: CardVariant;
	title?: string;
	icon?: React.ReactNode;
	value?: string | number;
	onClick?: () => void;
	className?: string;
	children?: React.ReactNode;
}

export interface EntityControlParams {
	entityId: string;
	domain: string;
	service: string;
	data?: Record<string, any>;
}

export interface ChartDataPoint {
	timestamp: string | number;
	value: number;
	entity_id?: string;
}

export interface EnergyData {
	time: string;
	consumption: number;
	production?: number;
	grid?: number;
}

export interface HAHistoryState {
	entity_id: string;
	state: string;
	attributes: Record<string, any>;
	last_changed: string;
	last_updated: string;
}

export interface ConnectionState {
	isConnected: boolean;
	isConnecting: boolean;
	error: string | null;
	lastConnected?: Date;
	reconnectAttempts: number;
}

export type { ReactNode } from "react";
