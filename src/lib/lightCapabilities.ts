// Minimal shape we need from a Home Assistant entity.
export interface HAEntityLike {
	entity_id: string;
	state: string;
	attributes: Record<string, unknown>;
}

export interface LightCapabilities {
	hasBrightness: boolean;
	hasColor: boolean;
	hasColorTemp: boolean;
	hasEffects: boolean;
	minMireds?: number;
	maxMireds?: number;
	effects?: string[];
}

interface LightAttributeShape {
	supported_color_modes?: string[];
	brightness?: number;
	min_mireds?: number;
	max_mireds?: number;
	effect_list?: string[];
	[key: string]: unknown;
}

export function getLightCapabilities(
	entity: HAEntityLike | undefined,
): LightCapabilities {
	if (!entity) {
		return {
			hasBrightness: false,
			hasColor: false,
			hasColorTemp: false,
			hasEffects: false,
		};
	}
	const attrs = entity.attributes as LightAttributeShape;
	const modes = Array.isArray(attrs.supported_color_modes)
		? attrs.supported_color_modes
		: [];
	const hasBrightness = typeof attrs.brightness === "number";
	const hasColor = modes.some((m) =>
		["rgb", "rgbw", "rgbww", "hs", "xy"].includes(m),
	);
	const hasColorTemp = modes.includes("color_temp");
	const minMireds =
		typeof attrs.min_mireds === "number" ? attrs.min_mireds : undefined;
	const maxMireds =
		typeof attrs.max_mireds === "number" ? attrs.max_mireds : undefined;
	const effects = Array.isArray(attrs.effect_list)
		? attrs.effect_list
		: undefined;
	const hasEffects = (effects?.length ?? 0) > 0;
	return {
		hasBrightness,
		hasColor,
		hasColorTemp,
		hasEffects,
		minMireds,
		maxMireds,
		effects,
	};
}
