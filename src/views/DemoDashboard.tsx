import { AuroraLightCard } from "../components/aurora/AuroraLightCard";
import { AuroraClimateCard } from "../components/aurora/AuroraClimateCard";
import { AuroraMediaPlayerCard } from "../components/aurora/AuroraMediaPlayerCard";
import { AuroraFanCard } from "../components/aurora/AuroraFanCard";
import { AuroraSwitchCard } from "../components/aurora/AuroraSwitchCard";
import { AuroraSceneCard } from "../components/aurora/AuroraSceneCard";
import { AuroraSensor } from "../components/aurora/AuroraSensorCard";
import { AuroraTimeCard } from "../components/aurora/AuroraTimeCard";
import { AuroraLockCard } from "../components/aurora/AuroraLockCard";
import { AuroraWeatherCard } from "../components/aurora/AuroraWeatherCard";
import { AuroraFabCard } from "../components/aurora/AuroraFabCard";
import { AuroraAlarmCard } from "../components/aurora/AuroraAlarmCard";
import { AuroraBinarySensorCard } from "../components/aurora/AuroraBinarySensorCard";
import { AuroraButtonCard } from "../components/aurora/AuroraButtonCard";
import { AuroraCalendarCard } from "../components/aurora/AuroraCalendarCard";
import { AuroraCameraCard } from "../components/aurora/AuroraCameraCard";
import { AuroraCoverCard } from "../components/aurora/AuroraCoverCard";
import { AuroraGaugeCard } from "../components/aurora/AuroraGaugeCard";
import { AuroraNumberCard } from "../components/aurora/AuroraNumberCard";
import { AuroraPictureCard } from "../components/aurora/AuroraPictureCard";
import { AuroraSelectCard } from "../components/aurora/AuroraSelectCard";
import { AuroraTimerCard } from "../components/aurora/AuroraTimerCard";
import { AuroraTriggerCard } from "../components/aurora/AuroraTriggerCard";
import { AuroraVacuumCard } from "../components/aurora/AuroraVacuumCard";
import { Sparkline } from "../components/charts/Sparkline";
import {
  Home,
  Settings,
  Save,
  RotateCcw,
  CarFront,
  Sofa,
  Utensils,
  BedDouble,
  Briefcase,
  Calendar,
  X,
  Cloud,
  CloudRain,
  Sun,
  Droplets,
  Wind,
  Eye,
  Gauge as GaugeIcon,
  ArrowUp,
  ArrowDown,
  CloudSnow,
  CloudLightning,
  CloudDrizzle,
} from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { AuroraCarView } from "../components/aurora/AuroraCarView";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../components/ui/dialog";
import ReactECharts from "echarts-for-react";

// React Grid Layout
import GridLayout, { useContainerWidth } from "react-grid-layout";
import type { Layout, LayoutItem } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
const STORAGE_KEY = "aurora-demo-layout-v5-variants";

type CardSize = "button" | "control" | "widget" | "feature" | "bigsquare";

const CARD_SIZES: Record<CardSize, { w: number; h: number; minW: number; minH: number }> = {
  button: { w: 1, h: 1, minW: 1, minH: 1 },
  control: { w: 1, h: 1, minW: 1, minH: 1 },
  widget: { w: 1, h: 1, minW: 1, minH: 1 },
  bigsquare: { w: 2, h: 2, minW: 2, minH: 2 },
  feature: { w: 2, h: 1, minW: 2, minH: 1 },
};

// --- Auto-Layout Generator ---
const generateAutoLayout = (
  cards: { id: string; type: CardSize }[],
  cols = 8,
): Layout => {
  const colHeights = new Array(cols).fill(0);
  const layout: LayoutItem[] = [];

  cards.forEach((card) => {
    const size = CARD_SIZES[card.type];
    let bestCol = 0;
    let minH = Infinity;

    // Find the "lowest" available spot that fits the card width
    for (let i = 0; i <= cols - size.w; i++) {
      const heightInSpan = Math.max(
        ...colHeights.slice(i, i + size.w),
      );
      if (heightInSpan < minH) {
        minH = heightInSpan;
        bestCol = i;
      }
    }

    layout.push({
      i: card.id,
      x: bestCol,
      y: minH,
      ...size,
    });

    // Update column heights
    for (let i = bestCol; i < bestCol + size.w; i++) {
      colHeights[i] = minH + size.h;
    }
  });

  return layout;
};

// Mock entities
const ent = {
  light1: "light.demo_lamp",
  light2: "light.demo_ceiling",
  light3: "light.demo_warm_white",
  light4: "light.demo_rgb_temp",
  hvac: "climate.demo_hvac",
  media: "media_player.demo_player",
  mediaTV: "media_player.tv_living_room",
  mediaMovie: "media_player.bedroom_tv",
  mediaIdle: "media_player.kitchen_display",
  fan: "fan.demo_fan",
  outlet: "switch.demo_outlet",
  door: "binary_sensor.demo_door",
  lock: "lock.demo_front_door",
  cover: "cover.demo_shades",
  vac: "vacuum.demo_cleaner",
  alarm: "alarm_control_panel.demo_alarm",
  weather: "weather.demo_home",
  temp: "sensor.demo_temperature",
  energy: "sensor.demo_energy_load",
  number: "number.demo_brightness",
  select: "select.demo_mode",
  scene: "scene.demo_evening",
  timer: "timer.demo_countdown",
  personA: "person.demo_alex",
  personB: "person.demo_sam",
  calendar: "calendar.demo_calendar",
  camera: "camera.demo_front_camera",
  garbage: "sensor.demo_garbage_collection",
  picture: "image.demo_picture",
  targetTemp: "input_number.target_temperature",
  humidityTarget: "input_number.humidity_target",
  powerLimit: "input_number.power_limit",
  tvSource: "select.tv_source",
  acPreset: "select.ac_preset",
  radioStation: "select.radio_station",
  // NEW VARIANTS
  gate: "lock.demo_gate",
  garage: "lock.demo_garage",
  carLock: "lock.demo_car",
  childLock: "lock.demo_child_safety",
  ceilingFan: "fan.demo_ceiling",
  ventFan: "fan.demo_vent",
  purifier: "fan.demo_purifier",
  humidity: "sensor.demo_humidity",
  power: "sensor.demo_power",
  battery: "sensor.demo_battery",
  aqi: "sensor.demo_aqi",

  // NEW ENTITY TYPES
  alarmHome: "alarm_control_panel.demo_home_alarm",
  binaryDoor: "binary_sensor.demo_front_door",
  binaryWindow: "binary_sensor.demo_office_window",
  binaryMotion: "binary_sensor.demo_hallway_motion",
  buttonPress: "button.demo_restart",
  cameraEntry: "camera.demo_entry_feed",
  coverBlinds: "cover.demo_living_blinds",
  coverCurtains: "cover.demo_bedroom_curtains",
  gaugePower: "sensor.demo_power_draw",
  gaugeWater: "sensor.demo_water_pressure",
  numberThreshold: "number.demo_temperature_threshold",
  selectSource: "select.demo_av_source",
  selectMode: "select.demo_operation_mode",
  timerKitchen: "timer.demo_kitchen_timer",
  triggerScript: "script.demo_goodnight",
  vacuumRobot: "vacuum.demo_roborock",
} as const;

const rooms = [
  { id: "Home", icon: Home, label: "Home" },
  { id: "Living Room", icon: Sofa, label: "Living Room" },
  { id: "Kitchen", icon: Utensils, label: "Kitchen" },
  { id: "Bedroom", icon: BedDouble, label: "Bedroom" },
  { id: "Office", icon: Briefcase, label: "Office" },
  { id: "Car", icon: CarFront, label: "My Car" },
];

export function DemoDashboard() {
  const [activeRoom, setActiveRoom] = useState("Home");
  const [isEditMode, setIsEditMode] = useState(false);
  const [view, setView] = useState<"dashboard" | "car">(
    "dashboard",
  );
  const [weatherDialogOpen, setWeatherDialogOpen] =
    useState(false);
  const [weatherDialogTab, setWeatherDialogTab] = useState<
    "details" | "forecast"
  >("details");
  const [selectedForecastDay, setSelectedForecastDay] =
    useState<number | null>(null);

  const {
    width,
    containerRef,
  } = useContainerWidth();

  // Mock weather data for header widget
  const currentTemp = 28;
  const weatherCondition = "partly cloudy";
  const humidity = 65;
  const wind = 12;
  const pressure = 1013;
  const visibility = 10;

  // Helper to get weather icon for header
  const getWeatherIconForHeader = (condition: string) => {
    const c = condition.toLowerCase();
    if (c.includes("rain"))
      return <CloudRain className="w-4 h-4 text-blue-400" />;
    if (c.includes("cloud"))
      return <Cloud className="w-4 h-4 text-slate-400" />;
    return <Sun className="w-4 h-4 text-amber-400" />;
  };

  // Mock 7-day forecast data
  const weeklyForecast = [
    {
      day: "Mon",
      shortDay: "M",
      icon: "cloud",
      high: 30,
      low: 22,
      condition: "Partly Cloudy",
    },
    {
      day: "Tue",
      shortDay: "T",
      icon: "rain",
      high: 28,
      low: 20,
      condition: "Light Rain",
    },
    {
      day: "Wed",
      shortDay: "W",
      icon: "cloud",
      high: 31,
      low: 23,
      condition: "Cloudy",
    },
    {
      day: "Thu",
      shortDay: "T",
      icon: "rain",
      high: 29,
      low: 19,
      condition: "Rain",
    },
    {
      day: "Fri",
      shortDay: "F",
      icon: "sun",
      high: 32,
      low: 24,
      condition: "Sunny",
    },
    {
      day: "Sat",
      shortDay: "S",
      icon: "cloud",
      high: 30,
      low: 22,
      condition: "Partly Cloudy",
    },
    {
      day: "Sun",
      shortDay: "S",
      icon: "sun",
      high: 33,
      low: 25,
      condition: "Clear",
    },
  ];

  // Mock hourly forecast data (24 hours)
  const getHourlyForecast = (dayIndex: number) => {
    const baseTemp = weeklyForecast[dayIndex].high;
    return Array.from({ length: 24 }, (_, i) => {
      const variation =
        Math.sin(((i - 6) / 24) * Math.PI * 2) * 5;
      return {
        hour: `${i}:00`,
        temp: Math.round(baseTemp - 5 + variation),
        condition:
          i >= 6 && i <= 18
            ? weeklyForecast[dayIndex].icon
            : "cloud",
        precipitation:
          i >= 12 &&
            i <= 16 &&
            weeklyForecast[dayIndex].icon === "rain"
            ? 60
            : 10,
      };
    });
  };

  const getWeatherIcon = (
    icon: string,
    size: string = "w-6 h-6",
  ) => {
    if (icon === "rain")
      return <CloudRain className={`${size} text-blue-400`} />;
    if (icon === "cloud")
      return <Cloud className={`${size} text-slate-400`} />;
    if (icon === "sun")
      return <Sun className={`${size} text-amber-400`} />;
    if (icon === "snow")
      return <CloudSnow className={`${size} text-cyan-400`} />;
    return <Cloud className={`${size} text-slate-400`} />;
  };

  // --- 1. Define your cards list here (No X/Y needed!) ---
  const defaultCardsConfig = [
    { id: "time-card", type: "feature" as CardSize },
    { id: "weather-card", type: "bigsquare" as CardSize },

    // --- LOCK VARIANTS ---
    { id: "lock-card", type: "button" as CardSize },
    { id: "gate-card", type: "button" as CardSize },
    { id: "garage-card", type: "button" as CardSize },
    { id: "car-lock-card", type: "button" as CardSize },
    { id: "child-lock-card", type: "button" as CardSize },

    // --- FAN VARIANTS ---
    { id: "fan-card-default", type: "control" as CardSize },
    { id: "fan-card-ceiling", type: "control" as CardSize },
    { id: "fan-card-vent", type: "control" as CardSize },
    { id: "fan-card-purifier", type: "control" as CardSize },

    // --- CLIMATE VARIANTS ---
    { id: "climate-card-simple", type: "control" as CardSize },
    { id: "climate-card-control", type: "feature" as CardSize },

    // --- SENSOR VARIANTS ---
    { id: "temp-sensor", type: "button" as CardSize },
    { id: "humidity-sensor", type: "button" as CardSize },
    { id: "power-sensor", type: "button" as CardSize },
    { id: "battery-sensor", type: "button" as CardSize },
    { id: "aqi-sensor", type: "button" as CardSize },

    // --- MEDIA ---
    { id: "media-card", type: "feature" as CardSize },
    { id: "media-movie-card", type: "feature" as CardSize },

    // --- ALARM & SECURITY ---
    { id: "alarm-card", type: "control" as CardSize },
    { id: "camera-card", type: "feature" as CardSize },

    // --- COVERS (BLINDS) ---
    { id: "cover-blinds-card", type: "control" as CardSize },
    { id: "cover-curtains-card", type: "control" as CardSize },

    // --- VACUUM ---
    { id: "vacuum-card", type: "bigsquare" as CardSize },

    // --- CALENDAR & TIME ---
    { id: "calendar-card", type: "feature" as CardSize },
    { id: "timer-card", type: "button" as CardSize },

    // --- GAUGES & NUMBERS ---
    { id: "gauge-power-card", type: "button" as CardSize },
    { id: "gauge-water-card", type: "bigsquare" as CardSize },
    { id: "number-card", type: "control" as CardSize },

    // --- SELECTS ---
    { id: "select-source-card", type: "button" as CardSize },
    { id: "select-mode-card", type: "button" as CardSize },

    // --- BINARY SENSORS ---
    { id: "binary-door-card", type: "button" as CardSize },
    { id: "binary-window-card", type: "button" as CardSize },
    { id: "binary-motion-card", type: "button" as CardSize },

    // --- PICTURES & TRIGGERS ---
    { id: "picture-card", type: "widget" as CardSize },
    { id: "trigger-card", type: "button" as CardSize },
    { id: "button-card", type: "button" as CardSize },

    // --- LIGHTS & SWITCHES ---
    { id: "switch-card", type: "button" as CardSize },
    { id: "scene-card", type: "button" as CardSize },
    { id: "light1-card", type: "control" as CardSize },
    { id: "light2-card", type: "control" as CardSize },
    { id: "light3-card", type: "control" as CardSize },
    { id: "light4-card", type: "control" as CardSize },

    // --- WIDGETS ---
    { id: "sparkline-card", type: "widget" as CardSize },
  ];

  // --- 2. Map config to Components ---
  const initialCards = useMemo(() => {
    return defaultCardsConfig.map((c) => {
      let component;
      const commonClasses = "w-full h-full";
      switch (c.id) {
        case "time-card":
          component = (
            <AuroraTimeCard className={commonClasses} />
          );
          break;
        case "weather-card":
          component = (
            <AuroraWeatherCard
              entityId={ent.weather}
              variant="dashboard"
              className={commonClasses}
            />
          );
          break;

        // --- LOCKS ---
        case "lock-card":
          component = (
            <AuroraLockCard
              entityId={ent.lock}
              variant="default"
              className={commonClasses}
            />
          );
          break;
        case "gate-card":
          component = (
            <AuroraLockCard
              entityId={ent.gate}
              variant="gate"
              className={commonClasses}
            />
          );
          break;
        case "garage-card":
          component = (
            <AuroraLockCard
              entityId={ent.garage}
              variant="garage"
              className={commonClasses}
            />
          );
          break;
        case "car-lock-card":
          component = (
            <AuroraLockCard
              entityId={ent.carLock}
              variant="car"
              className={commonClasses}
            />
          );
          break;
        case "child-lock-card":
          component = (
            <AuroraLockCard
              entityId={ent.childLock}
              variant="child"
              className={commonClasses}
            />
          );
          break;

        // --- FANS ---
        case "fan-card-default":
          component = (
            <AuroraFanCard
              entityId={ent.fan}
              variant="default"
              className={commonClasses}
            />
          );
          break;
        case "fan-card-ceiling":
          component = (
            <AuroraFanCard
              entityId={ent.ceilingFan}
              variant="ceiling"
              className={commonClasses}
            />
          );
          break;
        case "fan-card-vent":
          component = (
            <AuroraFanCard
              entityId={ent.ventFan}
              variant="vent"
              className={commonClasses}
            />
          );
          break;
        case "fan-card-purifier":
          component = (
            <AuroraFanCard
              entityId={ent.purifier}
              variant="purifier"
              className={commonClasses}
            />
          );
          break;

        // --- CLIMATE ---
        case "climate-card-simple":
          component = (
            <AuroraClimateCard
              entityId={ent.hvac}
              variant="simple"
              className={commonClasses}
            />
          );
          break;
        case "climate-card-control":
          component = (
            <AuroraClimateCard
              entityId={ent.hvac}
              variant="control"
              className={commonClasses}
            />
          );
          break;

        // --- SENSORS ---
        case "temp-sensor":
          component = (
            <AuroraSensor
              entityId={ent.temp}
              className={commonClasses}
            />
          );
          break;
        case "humidity-sensor":
          component = (
            <AuroraSensor
              entityId={ent.humidity}
              className={commonClasses}
            />
          );
          break;
        case "power-sensor":
          component = (
            <AuroraSensor
              entityId={ent.power}
              className={commonClasses}
            />
          );
          break;
        case "battery-sensor":
          component = (
            <AuroraSensor
              entityId={ent.battery}
              className={commonClasses}
            />
          );
          break;
        case "aqi-sensor":
          component = (
            <AuroraSensor
              entityId={ent.aqi}
              className={commonClasses}
            />
          );
          break;

        // --- MEDIA ---
        case "media-card":
          component = (
            <AuroraMediaPlayerCard
              entityId={ent.media}
              variant="wide"
              className={commonClasses}
            />
          );
          break;
        case "media-movie-card":
          component = (
            <AuroraMediaPlayerCard
              entityId={ent.mediaMovie}
              variant="immersive"
              className={commonClasses}
            />
          );
          break;

        // --- ALARM & SECURITY ---
        case "alarm-card":
          component = (
            <AuroraAlarmCard
              entityId={ent.alarmHome}
              className={commonClasses}
            />
          );
          break;
        case "camera-card":
          component = (
            <AuroraCameraCard
              entityId={ent.cameraEntry}
              className={commonClasses}
            />
          );
          break;

        // --- COVERS ---
        case "cover-blinds-card":
          component = (
            <AuroraCoverCard
              entityId={ent.coverBlinds}
              titleOverride="Living Blinds"
              className={commonClasses}
            />
          );
          break;
        case "cover-curtains-card":
          component = (
            <AuroraCoverCard
              entityId={ent.coverCurtains}
              titleOverride="Bedroom Curtains"
              className={commonClasses}
            />
          );
          break;

        // --- VACUUM ---
        case "vacuum-card":
          component = (
            <AuroraVacuumCard
              entityId={ent.vacuumRobot}
              className={commonClasses}
            />
          );
          break;

        // --- CALENDAR & TIMER ---
        case "calendar-card":
          component = (
            <AuroraCalendarCard
              entity={ent.calendar}
              className={commonClasses}
            />
          );
          break;
        case "timer-card":
          component = (
            <AuroraTimerCard
              entityId={ent.timerKitchen}
              className={commonClasses}
            />
          );
          break;

        // --- GAUGES & NUMBERS ---
        case "gauge-power-card":
          component = (
            <AuroraGaugeCard
              entityId={ent.gaugePower}
              unit="W"
              min={0}
              max={5000}
              titleOverride="Power Draw"
              className={commonClasses}
            />
          );
          break;
        case "gauge-water-card":
          component = (
            <AuroraGaugeCard
              entityId={ent.gaugeWater}
              unit="bar"
              min={0}
              max={10}
              titleOverride="Water Pressure"
              className={commonClasses}
            />
          );
          break;
        case "number-card":
          component = (
            <AuroraNumberCard
              entityId={ent.numberThreshold}
              titleOverride="Threshold"
              className={commonClasses}
            />
          );
          break;

        // --- SELECTS ---
        case "select-source-card":
          component = (
            <AuroraSelectCard
              entityId={ent.selectSource}
              titleOverride="AV Source"
              className={commonClasses}
            />
          );
          break;
        case "select-mode-card":
          component = (
            <AuroraSelectCard
              entityId={ent.selectMode}
              titleOverride="House Mode"
              className={commonClasses}
            />
          );
          break;

        // --- BINARY SENSORS ---
        case "binary-door-card":
          component = (
            <AuroraBinarySensorCard
              entityId={ent.binaryDoor}
              titleOverride="Front Door"
              className={commonClasses}
            />
          );
          break;
        case "binary-window-card":
          component = (
            <AuroraBinarySensorCard
              entityId={ent.binaryWindow}
              titleOverride="Office Window"
              className={commonClasses}
            />
          );
          break;
        case "binary-motion-card":
          component = (
            <AuroraBinarySensorCard
              entityId={ent.binaryMotion}
              titleOverride="Hallway Motion"
              className={commonClasses}
            />
          );
          break;

        // --- PICTURES & TRIGGERS ---
        case "picture-card":
          component = (
            <AuroraPictureCard
              entityId={ent.light1}
              backgroundImage="https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=400&auto=format&fit=crop"
              title="Living Ambience"
              className={commonClasses}
            />
          );
          break;
        case "trigger-card":
          component = (
            <AuroraTriggerCard
              domain="script"
              target={ent.triggerScript}
              title="Goodnight"
              className={commonClasses}
            />
          );
          break;
        case "button-card":
          component = (
            <AuroraButtonCard
              entityId={ent.buttonPress}
              title="Restart Server"
              className={commonClasses}
            />
          );
          break;

        case "switch-card":
          component = (
            <AuroraSwitchCard
              entityId={ent.outlet}
              className={commonClasses}
            />
          );
          break;
        case "light1-card":
          component = (
            <AuroraLightCard
              entityId={ent.light1}
              className={commonClasses}
            />
          );
          break;
        case "light2-card":
          component = (
            <AuroraLightCard
              entityId={ent.light2}
              className={commonClasses}
            />
          );
          break;
        case "light3-card":
          component = (
            <AuroraLightCard
              entityId={ent.light3}
              titleOverride="Warm White"
              className={commonClasses}
            />
          );
          break;
        case "light4-card":
          component = (
            <AuroraLightCard
              entityId={ent.light4}
              titleOverride="RGB Temp"
              className={commonClasses}
            />
          );
          break;
        case "scene-card":
          component = (
            <AuroraSceneCard
              entityId={ent.scene}
              className={commonClasses}
            />
          );
          break;
        case "sparkline-card":
          component = (
            <div
              className={cn(
                "p-5 rounded-3xl backdrop-blur-xl bg-[var(--aurora-glass-bg)] border border-[var(--aurora-glass-border)] shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] flex flex-col justify-between",
                commonClasses,
              )}
            >
              <h3 className="text-sm text-white/70 mb-3 font-medium">
                Energy Consumption
              </h3>
              <Sparkline
                data={Array.from({ length: 40 }, (_, i) => ({
                  t: i,
                  v: 350 + Math.sin(i / 6) * 40 + (i % 5),
                }))}
                height={80}
              />
            </div>
          );
          break;
        default:
          component = null;
      }
      return { id: c.id, component };
    });
  }, []);

  // State for RGL Layout
  const [layout, setLayout] = useState<Layout>(() => {
    // Auto-generate every time for this demo update so new cards appear
    // Force layout refresh for new cards
    return generateAutoLayout(defaultCardsConfig);
  });

  const onLayoutChange = (newLayout: Layout) => {
    if (!isEditMode) return;
    setLayout(newLayout);
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(newLayout),
    );
  };

  const handleResetLayout = () => {
    // Reset to auto-generated layout
    const def = generateAutoLayout(defaultCardsConfig);
    setLayout(def);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(def));
    toast.success("Layout reset!");
  };

  const handleSaveLayout = () => {
    toast.success("Layout saved!");
    setIsEditMode(false);
  };

  const toggleEditMode = () => {
    if (isEditMode) {
      handleSaveLayout();
    } else {
      setIsEditMode(true);
      toast.info("Edit mode enabled - Drag cards");
    }
  };

  const removeCard = (cardId: string) => {
    setLayout((prev) =>
      prev.filter((item) => item.i !== cardId),
    );
    toast.success("Card removed");
  };

  const vibrate = (pattern: number) => {
    if (typeof navigator !== "undefined" && navigator.vibrate)
      navigator.vibrate(pattern);
  };

  return (
    <div className="min-h-screen bg-zinc-950 relative overflow-hidden selection:bg-pink-500/30">
      <div className="fixed inset-0 bg-gradient-to-br from-stone-950 via-amber-950/20 to-stone-900 -z-10 pointer-events-none" />

      {/* Navigation Rail */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="fixed left-6 top-1/2 -translate-y-1/2 w-[80px] py-8 flex flex-col items-center gap-8 rounded-[40px] z-50 border border-white/10"
        style={{
          backgroundColor: "rgba(24, 24, 27, 0.6)",
          backdropFilter: "blur(50px)",
          boxShadow: "0 10px 20px rgba(0,0,0,0.3)",
        }}
      >
        {rooms.map((room) => {
          const isActive =
            room.id === "Car"
              ? view === "car"
              : view === "dashboard" && activeRoom === room.id;

          return (
            <button
              key={room.id}
              onClick={() => {
                vibrate(10);
                if (room.id === "Car") {
                  setView("car");
                } else {
                  setActiveRoom(room.id);
                  setView("dashboard");
                }
              }}
              className={cn(
                "w-[56px] h-[56px] rounded-full flex items-center justify-center transition-all duration-300 relative group",
                isActive
                  ? "text-white"
                  : "text-white/40 hover:text-white/60",
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="activeRail"
                  className="absolute inset-0 bg-white/10 rounded-full blur-md"
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 30,
                  }}
                />
              )}
              <room.icon
                className="w-7 h-7 relative z-10"
                strokeWidth={1.5}
              />
              <div className="absolute left-full ml-4 px-3 py-1.5 bg-zinc-900/90 text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap border border-white/10 backdrop-blur-md">
                {room.label}
              </div>
            </button>
          );
        })}

        <div className="w-8 h-[1px] bg-white/10" />

        <button
          onClick={() => {
            toggleEditMode();
            vibrate(10);
          }}
          className={cn(
            "w-[56px] h-[56px] rounded-full flex items-center justify-center transition-all duration-300",
            isEditMode
              ? "text-white bg-blue-500/20 ring-1 ring-blue-500/50"
              : "text-white/30 hover:text-white/50",
          )}
        >
          <Settings className="w-6 h-6" />
        </button>
      </motion.div>

      {/* Status Header */}
      <div className="fixed top-6 right-6 flex items-center gap-4 z-50">
        {/* Weather Widget */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            setWeatherDialogOpen(true);
            vibrate(10);
          }}
          className="flex items-center gap-3 px-4 py-2 rounded-full bg-white/5 border border-white/5 backdrop-blur-md hover:bg-white/10 transition-colors cursor-pointer"
        >
          <div className="p-1.5 bg-orange-500/10 rounded-full">
            {getWeatherIconForHeader(weatherCondition)}
          </div>
          <div className="flex flex-col leading-none gap-0.5">
            <span className="text-sm font-medium text-white/90">
              {typeof currentTemp === "number"
                ? `${Math.round(currentTemp)}°C`
                : "--°"}
            </span>
            <span className="text-[10px] text-white/50 capitalize">
              {weatherCondition || "Unknown"}
            </span>
          </div>
        </motion.button>

        <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-white/5 border border-white/5 backdrop-blur-md">
          <div className="p-1.5 bg-green-500/20 rounded-full">
            <CarFront className="w-4 h-4 text-green-400" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-sm font-medium text-white/90">
              12 min to Work
            </span>
            <span className="text-[10px] text-white/50">
              Light Traffic
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-white/5 border border-white/5 backdrop-blur-md">
          <div className="p-1.5 bg-blue-500/20 rounded-full">
            <Calendar className="w-4 h-4 text-blue-400" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-sm font-medium text-white/90">
              14:00 Meeting
            </span>
            <span className="text-[10px] text-white/50">
              Design Review
            </span>
          </div>
        </div>
        {isEditMode && (
          <div className="flex gap-2 ml-4">
            <button
              onClick={handleResetLayout}
              className="p-2 rounded-full bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={handleSaveLayout}
              className="p-2 rounded-full bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30"
            >
              <Save className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      <AnimatePresence>
        {view === "car" && (
          <AuroraCarView onClose={() => setView("dashboard")} />
        )}
      </AnimatePresence>

      <div className="ml-[120px] px-8 py-8 pt-24 max-w-[1800px]">
        <div className="mb-8">
          <h1 className="text-4xl font-light text-white tracking-tight">
            Good Afternoon,{" "}
            <span className="font-semibold">Tanya</span>
          </h1>
          <p className="text-white/40 text-lg mt-1 font-medium">
            {activeRoom}
          </p>
        </div>

        {isEditMode && (
          <div className="mb-6 p-4 rounded-2xl bg-blue-500/10 backdrop-blur-md border border-blue-500/30 flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            <p className="text-white/80 text-sm">
              <strong>Edit Mode Active:</strong> Drag cards to
              rearrange
            </p>
          </div>
        )}

        <div
          ref={containerRef as any}
          className={cn(
            "pb-24 transition-all duration-500 rounded-[2rem]",
            isEditMode && "bg-white/5 ring-1 ring-white/10 p-4",
          )}
          style={{
            backgroundImage: isEditMode
              ? "radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)"
              : "none",
            backgroundSize: "24px 24px",
          }}
        >
          <GridLayout
            className="layout"
            layout={layout}
            gridConfig={{
              cols: 8,
              rowHeight: 170, // 190px Square Base
              margin: [20, 20],
              containerPadding: [0, 0],
            }}
            width={width}
            dragConfig={{
              enabled: isEditMode,
              handle: ".drag-handle",
            }}
            resizeConfig={{
              enabled: false,
            }}
            compactor={{
              type: "vertical",
              preventCollision: false,
            } as any} // Temporary cast until we fix types or confirm API
            onLayoutChange={onLayoutChange as any}
          >
            {initialCards.map((card) => (
              <div
                key={card.id}
                className={cn(
                  "relative",
                  "hover:z-[100] z-0",
                  isEditMode &&
                  "hover:ring-2 hover:ring-blue-400/50",
                )}
              >
                <div className="h-full w-full relative">
                  {isEditMode && (
                    <div
                      className="drag-handle absolute top-2 left-2 w-8 h-8 bg-white/10 backdrop-blur-md
                      rounded-lg flex items-center justify-center cursor-grab active:cursor-grabbing z-50 hover:bg-white/20 transition-all"
                    >
                      <svg
                        className="w-4 h-4 text-white/60"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <circle
                          cx="9"
                          cy="7"
                          r="1.5"
                          fill="currentColor"
                        />
                        <circle
                          cx="15"
                          cy="7"
                          r="1.5"
                          fill="currentColor"
                        />
                        <circle
                          cx="9"
                          cy="12"
                          r="1.5"
                          fill="currentColor"
                        />
                        <circle
                          cx="15"
                          cy="12"
                          r="1.5"
                          fill="currentColor"
                        />
                        <circle
                          cx="9"
                          cy="17"
                          r="1.5"
                          fill="currentColor"
                        />
                        <circle
                          cx="15"
                          cy="17"
                          r="1.5"
                          fill="currentColor"
                        />
                      </svg>
                    </div>
                  )}

                  <div
                    className={cn(
                      "h-full w-full",
                      isEditMode && "pointer-events-none",
                    )}
                    style={{ boxSizing: "border-box" }}
                  >
                    {card.component}
                  </div>

                  {isEditMode && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeCard(card.id);
                      }}
                      className="nodrag absolute -top-2 -right-2 w-7 h-7 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center shadow-lg z-50 transition-all active:scale-90"
                    >
                      <X className="w-4 h-4 text-white" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </GridLayout>
        </div>
      </div>
      <AuroraFabCard
        domain="script"
        target="script.fake_demo"
      />

      {/* Weather Dialog */}
      <Dialog
        open={weatherDialogOpen}
        onOpenChange={setWeatherDialogOpen}
      >
        <DialogContent className="bg-zinc-900/95 backdrop-blur-3xl ring-1 ring-white/10 ring-inset border border-white/5 shadow-2xl sm:max-w-[500px] sm:rounded-[28px] p-0 overflow-hidden gap-0">
          <DialogHeader className="sr-only">
            <DialogTitle>Weather Details</DialogTitle>
            <DialogDescription>
              Detailed weather information and forecast
            </DialogDescription>
          </DialogHeader>

          {/* Header */}
          <div className="relative pt-8 pb-6 px-6 flex flex-col items-center justify-center border-b border-white/5 bg-gradient-to-br from-blue-500/10 to-transparent">
            <div className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center mb-4 shadow-lg border border-white/10">
              {getWeatherIconForHeader(weatherCondition)}
            </div>
            <h2 className="text-lg font-medium text-white/80 mb-1">
              Home Weather
            </h2>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-extralight tracking-tighter text-white">
                {typeof currentTemp === "number"
                  ? Math.round(currentTemp)
                  : "--"}
                °
              </span>
            </div>
            <span className="text-sm text-white/60 font-medium capitalize mt-1">
              {weatherCondition}
            </span>
          </div>

          {/* Tabs */}
          <div className="flex p-1 mx-6 my-4 bg-zinc-800/50 rounded-xl border border-white/5">
            <button
              onClick={() => setWeatherDialogTab("details")}
              className={cn(
                "flex-1 py-2 text-xs font-medium rounded-lg transition-all",
                weatherDialogTab === "details"
                  ? "bg-zinc-700 text-white shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200",
              )}
            >
              Details
            </button>
            <button
              onClick={() => setWeatherDialogTab("forecast")}
              className={cn(
                "flex-1 py-2 text-xs font-medium rounded-lg transition-all",
                weatherDialogTab === "forecast"
                  ? "bg-zinc-700 text-white shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200",
              )}
            >
              Forecast
            </button>
          </div>

          {/* Tab Content */}
          <div className="px-6 pb-8 min-h-[350px]">
            <AnimatePresence mode="wait">
              {weatherDialogTab === "details" && (
                <motion.div
                  key="details"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex flex-col gap-6"
                >
                  {/* Current Conditions Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 rounded-xl bg-white/5 border border-white/5 flex flex-col gap-2">
                      <div className="flex items-center gap-2 text-zinc-400">
                        <Droplets className="w-4 h-4 text-blue-400" />
                        <span className="text-xs font-medium">
                          Humidity
                        </span>
                      </div>
                      <span className="text-2xl font-light text-white">
                        {humidity ?? "--"}%
                      </span>
                    </div>

                    <div className="p-4 rounded-xl bg-white/5 border border-white/5 flex flex-col gap-2">
                      <div className="flex items-center gap-2 text-zinc-400">
                        <Wind className="w-4 h-4 text-teal-400" />
                        <span className="text-xs font-medium">
                          Wind
                        </span>
                      </div>
                      <span className="text-2xl font-light text-white">
                        {wind ?? "--"}{" "}
                        <span className="text-sm text-zinc-500">
                          km/h
                        </span>
                      </span>
                    </div>

                    <div className="p-4 rounded-xl bg-white/5 border border-white/5 flex flex-col gap-2">
                      <div className="flex items-center gap-2 text-zinc-400">
                        <GaugeIcon className="w-4 h-4 text-purple-400" />
                        <span className="text-xs font-medium">
                          Pressure
                        </span>
                      </div>
                      <span className="text-2xl font-light text-white">
                        {pressure ?? "--"}{" "}
                        <span className="text-sm text-zinc-500">
                          hPa
                        </span>
                      </span>
                    </div>

                    <div className="p-4 rounded-xl bg-white/5 border border-white/5 flex flex-col gap-2">
                      <div className="flex items-center gap-2 text-zinc-400">
                        <Eye className="w-4 h-4 text-indigo-400" />
                        <span className="text-xs font-medium">
                          Visibility
                        </span>
                      </div>
                      <span className="text-2xl font-light text-white">
                        {visibility ?? "--"}{" "}
                        <span className="text-sm text-zinc-500">
                          km
                        </span>
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}

              {weatherDialogTab === "forecast" && (
                <motion.div
                  key="forecast"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex flex-col gap-4"
                >
                  {selectedForecastDay === null ? (
                    <>
                      {/* Weekly forecast - wrap grid */}
                      <h3 className="text-xs font-medium text-zinc-400">
                        7-Day Forecast
                      </h3>
                      <div className="flex flex-wrap gap-2 justify-center">
                        {weeklyForecast.map((day, index) => (
                          <motion.button
                            key={index}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                              setSelectedForecastDay(index);
                              vibrate(5);
                            }}
                            className="w-[80px] p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all flex flex-col items-center gap-3 cursor-pointer"
                          >
                            <span className="text-xs font-medium text-zinc-400">
                              {day.day}
                            </span>
                            <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center">
                              {getWeatherIcon(
                                day.icon,
                                "w-6 h-6",
                              )}
                            </div>
                            <div className="flex flex-col gap-0.5 items-center">
                              <span className="text-sm font-medium text-white">
                                {day.high}°
                              </span>
                              <span className="text-xs text-zinc-500">
                                {day.low}°
                              </span>
                            </div>
                          </motion.button>
                        ))}
                      </div>
                      <p className="text-xs text-center text-zinc-500 mt-2">
                        Tap a day to see hourly forecast
                      </p>
                    </>
                  ) : (
                    <>
                      {/* Hourly forecast for selected day */}
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h3 className="text-xs font-medium text-zinc-400">
                            Hourly Forecast
                          </h3>
                          <p className="text-sm font-medium text-white mt-0.5">
                            {
                              weeklyForecast[
                                selectedForecastDay
                              ].day
                            }{" "}
                            -{" "}
                            {
                              weeklyForecast[
                                selectedForecastDay
                              ].condition
                            }
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedForecastDay(null);
                            vibrate(5);
                          }}
                          className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                        >
                          <X className="w-4 h-4 text-white/70" />
                        </button>
                      </div>

                      {/* Temperature chart */}
                      <div className="mb-4">
                        <ReactECharts
                          option={{
                            backgroundColor: "transparent",
                            grid: {
                              left: 40,
                              right: 20,
                              top: 30,
                              bottom: 30,
                            },
                            xAxis: {
                              type: "category",
                              data: Array.from(
                                { length: 24 },
                                (_, i) => `${i}:00`,
                              ),
                              axisLine: {
                                lineStyle: {
                                  color:
                                    "rgba(255,255,255,0.1)",
                                },
                              },
                              axisLabel: {
                                color: "rgba(255,255,255,0.4)",
                                fontSize: 10,
                                interval: 2,
                              },
                              axisTick: { show: false },
                            },
                            yAxis: {
                              type: "value",
                              axisLine: { show: false },
                              axisLabel: {
                                color: "rgba(255,255,255,0.4)",
                                fontSize: 10,
                                formatter: "{value}°",
                              },
                              splitLine: {
                                lineStyle: {
                                  color:
                                    "rgba(255,255,255,0.05)",
                                  type: "dashed",
                                },
                              },
                            },
                            series: [
                              {
                                type: "line",
                                data: getHourlyForecast(
                                  selectedForecastDay,
                                ).map((h) => h.temp),
                                smooth: true,
                                symbol: "circle",
                                symbolSize: 6,
                                itemStyle: {
                                  color: "#3b82f6",
                                },
                                lineStyle: {
                                  width: 3,
                                  color: {
                                    type: "linear",
                                    x: 0,
                                    y: 0,
                                    x2: 1,
                                    y2: 0,
                                    colorStops: [
                                      {
                                        offset: 0,
                                        color: "#60a5fa",
                                      },
                                      {
                                        offset: 0.5,
                                        color: "#3b82f6",
                                      },
                                      {
                                        offset: 1,
                                        color: "#2563eb",
                                      },
                                    ],
                                  },
                                },
                                areaStyle: {
                                  color: {
                                    type: "linear",
                                    x: 0,
                                    y: 0,
                                    x2: 0,
                                    y2: 1,
                                    colorStops: [
                                      {
                                        offset: 0,
                                        color:
                                          "rgba(59, 130, 246, 0.3)",
                                      },
                                      {
                                        offset: 1,
                                        color:
                                          "rgba(59, 130, 246, 0.0)",
                                      },
                                    ],
                                  },
                                },
                              },
                            ],
                            tooltip: {
                              trigger: "axis",
                              backgroundColor:
                                "rgba(0, 0, 0, 0.8)",
                              borderColor:
                                "rgba(255, 255, 255, 0.1)",
                              textStyle: {
                                color: "#fff",
                                fontSize: 12,
                              },
                              formatter: "{b}<br/>{c}°C",
                            },
                          }}
                          style={{ height: "180px" }}
                          opts={{ renderer: "svg" }}
                        />
                      </div>

                      {/* Hourly strip - horizontal scroll */}
                      <div className="flex gap-2 overflow-x-auto pb-2 -mx-6 px-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                        {getHourlyForecast(
                          selectedForecastDay,
                        ).map((hour, idx) => (
                          <div
                            key={idx}
                            className="flex-shrink-0 w-[70px] p-3 rounded-xl bg-white/5 border border-white/5 flex flex-col items-center gap-2"
                          >
                            <span className="text-[10px] font-medium text-zinc-400">
                              {hour.hour.replace(":00", "")}
                            </span>
                            <div className="w-8 h-8 flex items-center justify-center">
                              {getWeatherIcon(
                                hour.condition,
                                "w-5 h-5",
                              )}
                            </div>
                            <span className="text-sm font-medium text-white">
                              {hour.temp}°
                            </span>
                            <div className="flex items-center gap-1">
                              <Droplets className="w-3 h-3 text-blue-400" />
                              <span className="text-[10px] text-zinc-500">
                                {hour.precipitation}%
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}