import type { DashboardItem } from "../components/aurora/CardRenderer";

// Configuration Mapping
export const cfg = {
  sidebarBanner: "sensor.template_sidebar",
  weather: "weather.maison",

  salon: {
    light: "light.ampoule_salon",
    buffet: "switch.lumiere_buffet_socket_1",
    climate: "climate.smart_thermostat_salon",
    tv: "media_player.sejour",
  },

  cuisine: {
    light: "light.ampoule_lampadaire_salon",
    temp: "sensor.thermo_cuisine_temperature",
    media: "media_player.cuisine",
  },

  bureau: {
    strip: "light.led_strip_bureau",
    lamp: "light.lampe_bureau",
    pc: "sensor.pc_loic_sessionstate",
    climate: "climate.smart_radiator_thermostat_bureau",
  },

  chambre: {
    bedside: "light.mibedsidelamp2",
    temp: "sensor.thermo_sdb_temperature",
    climate: "climate.forceclima",
    fan: "fan.dyson_purifier_hot_cool",
  },

  media: {
    selector: "select.conditional_media",
    jellyfin: "sensor.jellyfin_playing",
    salon: "media_player.sejour",
    cuisine: "media_player.cuisine",
    spotify: "media_player.spotify",
    kok: "media_player.kok",
    tv: "media_player.samsungtv_qn90a",
  },

  buanderie: {
    spot: "light.spot_buanderie",
    trv: "climate.trv_buanderie",
    boilerHeat: "climate.vitrocrossal_300_cu3a_heating",
    water:
      "water_heater.vitrocrossal_300_cu3a_domestic_hot_water",
  },

  maison: {
    loic: "person.loic",
    loicLast: "sensor.loic_last_changed",
    emma: "person.emma",
    emmaLast: "sensor.emma_last_changed",
    chargerStatus: "sensor.wallbox_portal_status_description",
    chargerPower: "sensor.wallbox_portal_charging_power",
    chargerPauseResume: "switch.wallbox_portal_pause_resume",
    arrive: "script.home_arrive",
    leave: "script.home_leave",
  },
};

export interface RGLItem extends DashboardItem {
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
  i: string;
}

// Helper for Granular Grid
const SIZES = {
  button: { w: 1, h: 1, minW: 1, minH: 1 },
  control: { w: 1, h: 2, minW: 1, minH: 2 },
  widget: { w: 2, h: 1, minW: 2, minH: 1 },
  feature: { w: 2, h: 2, minW: 2, minH: 2 },
  header: { w: 3, h: 1, minW: 3, minH: 1 },
};

// ✅ Helper simplifié - positions en flux automatique
const generateLayout = (): RGLItem[] => {
  const items: RGLItem[] = [];

  // SIDEBAR items (left side, x=0)
  items.push({
    id: "sb-banner",
    i: "sb-banner",
    type: "sensor",
    entityId: cfg.sidebarBanner,
    x: 0,
    y: 0,
    ...SIZES.widget,
  });

  items.push({
    id: "sb-weather",
    i: "sb-weather",
    type: "weather",
    entityId: cfg.weather,
    x: 0,
    y: 1,
    ...SIZES.feature,
  });

  // MAIN CONTENT (right side, x=2)
  // Salon
  items.push({
    id: "h-salon",
    i: "h-salon",
    type: "header",
    title: "Salon",
    x: 2,
    y: 0,
    ...SIZES.header,
  });

  items.push({
    id: "s-light",
    i: "s-light",
    type: "light",
    entityId: cfg.salon.light,
    x: 2,
    y: 1,
    ...SIZES.control,
  });

  items.push({
    id: "s-buffet",
    i: "s-buffet",
    type: "button",
    entityId: cfg.salon.buffet,
    x: 3,
    y: 1,
    ...SIZES.button,
  });

  items.push({
    id: "s-climate",
    i: "s-climate",
    type: "climate",
    entityId: cfg.salon.climate,
    x: 4,
    y: 1,
    ...SIZES.control,
  });

  items.push({
    id: "s-tv",
    i: "s-tv",
    type: "media",
    entityId: cfg.salon.tv,
    x: 2,
    y: 3,
    ...SIZES.feature,
  });

  // Cuisine
  items.push({
    id: "h-cuisine",
    i: "h-cuisine",
    type: "header",
    title: "Cuisine",
    x: 2,
    y: 5,
    ...SIZES.header,
  });

  items.push({
    id: "c-light",
    i: "c-light",
    type: "light",
    entityId: cfg.cuisine.light,
    x: 2,
    y: 6,
    ...SIZES.control,
  });

  items.push({
    id: "c-temp",
    i: "c-temp",
    type: "sensor",
    entityId: cfg.cuisine.temp,
    x: 3,
    y: 6,
    ...SIZES.button,
  });

  items.push({
    id: "c-media",
    i: "c-media",
    type: "media",
    entityId: cfg.cuisine.media,
    x: 4,
    y: 6,
    ...SIZES.feature,
  });

  // Bureau
  items.push({
    id: "h-bureau",
    i: "h-bureau",
    type: "header",
    title: "Bureau",
    x: 2,
    y: 8,
    ...SIZES.header,
  });

  items.push({
    id: "b-strip",
    i: "b-strip",
    type: "light",
    entityId: cfg.bureau.strip,
    x: 2,
    y: 9,
    ...SIZES.control,
  });

  items.push({
    id: "b-lamp",
    i: "b-lamp",
    type: "light",
    entityId: cfg.bureau.lamp,
    x: 3,
    y: 9,
    ...SIZES.control,
  });

  items.push({
    id: "b-pc",
    i: "b-pc",
    type: "sensor",
    entityId: cfg.bureau.pc,
    x: 4,
    y: 9,
    ...SIZES.button,
  });

  items.push({
    id: "b-climate",
    i: "b-climate",
    type: "climate",
    entityId: cfg.bureau.climate,
    x: 2,
    y: 11,
    ...SIZES.control,
  });

  // Chambre
  items.push({
    id: "h-chambre",
    i: "h-chambre",
    type: "header",
    title: "Chambre",
    x: 2,
    y: 13,
    ...SIZES.header,
  });

  items.push({
    id: "ch-bedside",
    i: "ch-bedside",
    type: "light",
    entityId: cfg.chambre.bedside,
    x: 2,
    y: 14,
    ...SIZES.control,
  });

  items.push({
    id: "ch-temp",
    i: "ch-temp",
    type: "sensor",
    entityId: cfg.chambre.temp,
    x: 3,
    y: 14,
    ...SIZES.button,
  });

  items.push({
    id: "ch-climate",
    i: "ch-climate",
    type: "climate",
    entityId: cfg.chambre.climate,
    x: 4,
    y: 14,
    ...SIZES.control,
  });

  items.push({
    id: "ch-fan",
    i: "ch-fan",
    type: "fan",
    entityId: cfg.chambre.fan,
    x: 2,
    y: 16,
    ...SIZES.control,
  });

  // Media
  items.push({
    id: "h-media",
    i: "h-media",
    type: "header",
    title: "Media",
    x: 2,
    y: 18,
    ...SIZES.header,
  });

  items.push({
    id: "m-jellyfin",
    i: "m-jellyfin",
    type: "sensor",
    entityId: cfg.media.jellyfin,
    x: 2,
    y: 19,
    ...SIZES.button,
  });

  items.push({
    id: "m-salon",
    i: "m-salon",
    type: "media",
    entityId: cfg.media.salon,
    x: 3,
    y: 19,
    ...SIZES.feature,
  });

  items.push({
    id: "m-cuisine",
    i: "m-cuisine",
    type: "media",
    entityId: cfg.media.cuisine,
    x: 2,
    y: 21,
    ...SIZES.feature,
  });

  items.push({
    id: "m-spotify",
    i: "m-spotify",
    type: "media",
    entityId: cfg.media.spotify,
    x: 4,
    y: 21,
    ...SIZES.control, // Spotify sometimes fits in control? Or feature. Let's use control for variety
  });

  items.push({
    id: "m-kok",
    i: "m-kok",
    type: "media",
    entityId: cfg.media.kok,
    x: 2,
    y: 23,
    ...SIZES.widget,
  });

  items.push({
    id: "m-tv",
    i: "m-tv",
    type: "media",
    entityId: cfg.media.tv,
    x: 3,
    y: 23,
    ...SIZES.feature,
  });

  // Buanderie
  items.push({
    id: "h-buanderie",
    i: "h-buanderie",
    type: "header",
    title: "Buanderie",
    x: 2,
    y: 25,
    ...SIZES.header,
  });

  items.push({
    id: "bu-spot",
    i: "bu-spot",
    type: "light",
    entityId: cfg.buanderie.spot,
    x: 2,
    y: 26,
    ...SIZES.control,
  });

  items.push({
    id: "bu-trv",
    i: "bu-trv",
    type: "climate",
    entityId: cfg.buanderie.trv,
    x: 3,
    y: 26,
    ...SIZES.control,
  });

  items.push({
    id: "bu-boiler",
    i: "bu-boiler",
    type: "climate",
    entityId: cfg.buanderie.boilerHeat,
    x: 4,
    y: 26,
    ...SIZES.control,
  });

  items.push({
    id: "bu-water",
    i: "bu-water",
    type: "sensor",
    entityId: cfg.buanderie.water,
    x: 2,
    y: 28,
    ...SIZES.button,
  });

  // Maison
  items.push({
    id: "h-maison",
    i: "h-maison",
    type: "header",
    title: "Maison",
    x: 2,
    y: 29,
    ...SIZES.header,
  });

  items.push({
    id: "ma-family",
    i: "ma-family",
    type: "family",
    people: [cfg.maison.loic, cfg.maison.emma],
    x: 2,
    y: 30,
    ...SIZES.widget,
  });

  items.push({
    id: "ma-wallbox",
    i: "ma-wallbox",
    type: "entities",
    title: "Wallbox",
    entityIds: [
      cfg.maison.chargerStatus,
      cfg.maison.chargerPower,
    ],
    x: 4,
    y: 30,
    ...SIZES.control,
  });

  items.push({
    id: "ma-arrive",
    i: "ma-arrive",
    type: "trigger",
    domain: "script",
    target: cfg.maison.arrive,
    title: "Arrivée Maison",
    x: 2,
    y: 32,
    ...SIZES.button,
  });

  items.push({
    id: "ma-leave",
    i: "ma-leave",
    type: "trigger",
    domain: "script",
    target: cfg.maison.leave,
    title: "Départ Maison",
    x: 3,
    y: 32,
    ...SIZES.widget,
  });

  return items;
};

export const initialLayout = generateLayout();
