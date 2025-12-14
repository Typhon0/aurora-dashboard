import { useEntity, type EntityName } from "@hakit/core";
import { AuroraCard } from "./base/AuroraCard";
import {
  Sun,
  Cloud,
  CloudRain,
  CloudSnow,
  CloudLightning,
  CloudDrizzle,
  Wind,
  Droplets,
  ArrowUp,
  ArrowDown,
  Maximize2,
  Minimize2,
  Sunrise,
  Sunset,
  Gauge as GaugeIcon,
  Eye,
  Thermometer,
  Navigation,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";
import { motion, AnimatePresence } from "motion/react";
import ReactECharts from "echarts-for-react";

export type WeatherVariant =
  | "glance"
  | "forecast"
  | "dashboard";
export type WeatherSize = "2x1" | "2x2";

interface Props {
  entityId: EntityName;
  className?: string;
  variant?: WeatherVariant;
}

// Mock forecast data for demo
const mockForecast = [
  {
    day: "Sat",
    icon: "cloud",
    high: 30,
    low: 22,
    time: "12 PM",
    temp: 28,
  },
  {
    day: "Sun",
    icon: "rain",
    high: 28,
    low: 20,
    time: "3 PM",
    temp: 26,
  },
  {
    day: "Mon",
    icon: "cloud",
    high: 31,
    low: 23,
    time: "6 PM",
    temp: 29,
  },
  {
    day: "Tue",
    icon: "rain",
    high: 29,
    low: 19,
    time: "9 PM",
    temp: 24,
  },
];

const mockHourlyForecast = [
  { time: "Now", temp: 27, icon: "cloud" },
  { time: "1h", temp: 28, icon: "cloud" },
  { time: "2h", temp: 29, icon: "cloud" },
  { time: "3h", temp: 28, icon: "rain" },
  { time: "4h", temp: 27, icon: "rain" },
  { time: "5h", temp: 26, icon: "rain" },
  { time: "6h", temp: 25, icon: "cloud" },
];

// Extended daily forecast
const mockExtendedForecast = [
  {
    day: "Today",
    icon: "cloud",
    high: 30,
    low: 22,
    condition: "Partly Cloudy",
  },
  {
    day: "Tomorrow",
    icon: "rain",
    high: 28,
    low: 20,
    condition: "Light Rain",
  },
  {
    day: "Wednesday",
    icon: "cloud",
    high: 31,
    low: 23,
    condition: "Cloudy",
  },
  {
    day: "Thursday",
    icon: "rain",
    high: 29,
    low: 19,
    condition: "Rain",
  },
  {
    day: "Friday",
    icon: "sun",
    high: 32,
    low: 24,
    condition: "Sunny",
  },
  {
    day: "Saturday",
    icon: "cloud",
    high: 30,
    low: 22,
    condition: "Partly Cloudy",
  },
  {
    day: "Sunday",
    icon: "sun",
    high: 33,
    low: 25,
    condition: "Clear",
  },
];

export function AuroraWeatherCard({
  entityId,
  className,
  variant = "dashboard",
}: Props) {
  const entity = useEntity(entityId);
  const temp = entity.attributes.temperature as
    | number
    | undefined;
  const cond = String(entity.state || "");
  const humidity = entity.attributes.humidity as
    | number
    | undefined;
  const wind = entity.attributes.wind_speed as
    | number
    | undefined;
  const pressure = entity.attributes.pressure as
    | number
    | undefined;
  const visibility = entity.attributes.visibility as
    | number
    | undefined;

  // State for dialog, tabs, and size configuration
  const [modalOpen, setModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "details" | "forecast" | "settings"
  >("details");
  const [configuredSize, setConfiguredSize] =
    useState<WeatherSize>("2x2");

  // Determine effective variant based on configured size
  const effectiveVariant =
    variant === "glance"
      ? "glance"
      : configuredSize === "2x1"
        ? "forecast"
        : "dashboard";

  const getWeatherIcon = (
    condition: string,
    className?: string,
  ) => {
    const c = condition.toLowerCase();
    const iconClass = className || "w-6 h-6 text-white";

    if (c.includes("rain"))
      return <CloudRain className={iconClass} />;
    if (c.includes("drizzle"))
      return <CloudDrizzle className={iconClass} />;
    if (c.includes("snow"))
      return <CloudSnow className={iconClass} />;
    if (c.includes("thunder") || c.includes("storm"))
      return <CloudLightning className={iconClass} />;
    if (c.includes("cloud"))
      return <Cloud className={iconClass} />;
    return <Sun className={iconClass} />;
  };

  const getForecastIcon = (
    iconType: string,
    size = "w-5 h-5",
  ) => {
    const iconClass = `${size} text-white`;
    if (iconType === "rain")
      return <CloudRain className={iconClass} />;
    if (iconType === "cloud")
      return <Cloud className={iconClass} />;
    if (iconType === "sun")
      return <Sun className={iconClass} />;
    return <Cloud className={iconClass} />;
  };

  const handleCardClick = () => {
    setModalOpen(true);
    if (navigator.vibrate) navigator.vibrate(10);
  };

  // Temperature Chart for hourly forecast
  const temperatureChartOptions = useMemo(
    () => ({
      grid: { top: 30, right: 20, bottom: 40, left: 40 },
      tooltip: {
        trigger: "axis",
        backgroundColor: "rgba(24, 24, 27, 0.95)",
        borderColor: "rgba(255,255,255,0.1)",
        textStyle: { color: "#fff" },
        formatter: (params: any) => {
          const data = params[0];
          return `${data.name}<br/>${data.value}°C`;
        },
      },
      xAxis: {
        type: "category",
        data: mockHourlyForecast.map((d) => d.time),
        axisLine: {
          lineStyle: { color: "rgba(255,255,255,0.1)" },
        },
        axisLabel: { color: "#71717A", fontSize: 11 },
      },
      yAxis: {
        type: "value",
        splitLine: {
          lineStyle: { color: "rgba(255,255,255,0.05)" },
        },
        axisLabel: { color: "#71717A", formatter: "{value}°" },
      },
      series: [
        {
          data: mockHourlyForecast.map((d) => d.temp),
          type: "line",
          smooth: true,
          symbol: "circle",
          symbolSize: 8,
          lineStyle: { color: "#3B82F6", width: 3 },
          itemStyle: { color: "#3B82F6" },
          areaStyle: {
            color: {
              type: "linear",
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: "rgba(59, 130, 246, 0.3)" },
                {
                  offset: 1,
                  color: "rgba(59, 130, 246, 0.05)",
                },
              ],
            },
          },
        },
      ],
    }),
    [],
  );

  // Detailed Weather Dialog
  const renderDialog = () => (
    <Dialog open={modalOpen} onOpenChange={setModalOpen}>
      <DialogContent className="bg-zinc-900/95 backdrop-blur-3xl ring-1 ring-white/10 ring-inset border border-white/5 shadow-2xl sm:max-w-[500px] sm:rounded-[28px] p-0 overflow-hidden gap-0">
        <DialogHeader className="sr-only">
          <DialogTitle>Weather Details</DialogTitle>
          <DialogDescription>
            Detailed weather information and settings
          </DialogDescription>
        </DialogHeader>

        {/* Header - Current Weather Summary */}
        <div className="relative pt-8 pb-6 px-6 flex flex-col items-center justify-center border-b border-white/5 bg-gradient-to-br from-blue-500/10 to-transparent">
          <div className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center mb-4 shadow-lg border border-white/10">
            {getWeatherIcon(cond, "w-10 h-10 text-white")}
          </div>
          <h2 className="text-lg font-medium text-white/80 mb-1">
            {entity.attributes.friendly_name || "Weather"}
          </h2>
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-extralight tracking-tighter text-white">
              {typeof temp === "number"
                ? Math.round(temp)
                : "--"}
              °
            </span>
          </div>
          <span className="text-sm text-white/60 font-medium capitalize mt-1">
            {cond}
          </span>
        </div>

        {/* Tabs */}
        <div className="flex p-1 mx-6 my-4 bg-zinc-800/50 rounded-xl border border-white/5">
          <button
            onClick={() => setActiveTab("details")}
            className={cn(
              "flex-1 py-2 text-xs font-medium rounded-lg transition-all",
              activeTab === "details"
                ? "bg-zinc-700 text-white shadow-sm"
                : "text-zinc-400 hover:text-zinc-200",
            )}
          >
            Détails
          </button>
          <button
            onClick={() => setActiveTab("forecast")}
            className={cn(
              "flex-1 py-2 text-xs font-medium rounded-lg transition-all",
              activeTab === "forecast"
                ? "bg-zinc-700 text-white shadow-sm"
                : "text-zinc-400 hover:text-zinc-200",
            )}
          >
            Prévisions
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={cn(
              "flex-1 py-2 text-xs font-medium rounded-lg transition-all",
              activeTab === "settings"
                ? "bg-zinc-700 text-white shadow-sm"
                : "text-zinc-400 hover:text-zinc-200",
            )}
          >
            Réglages
          </button>
        </div>

        {/* Tab Content */}
        <div className="px-6 pb-8 min-h-[350px]">
          <AnimatePresence mode="wait">
            {/* Details Tab */}
            {activeTab === "details" && (
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

                {/* Hourly Temperature Chart */}
                <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                  <h3 className="text-xs font-medium text-zinc-400 mb-3">
                    Hourly Temperature
                  </h3>
                  <div className="h-[180px]">
                    <ReactECharts
                      option={temperatureChartOptions}
                      style={{ height: "100%", width: "100%" }}
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Forecast Tab */}
            {activeTab === "forecast" && (
              <motion.div
                key="forecast"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col gap-3"
              >
                <h3 className="text-xs font-medium text-zinc-400 mb-1">
                  7-Day Forecast
                </h3>
                {mockExtendedForecast.map((day, index) => (
                  <div
                    key={index}
                    className="p-4 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                        {getForecastIcon(day.icon, "w-5 h-5")}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-white">
                          {day.day}
                        </span>
                        <span className="text-xs text-zinc-500">
                          {day.condition}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <ArrowUp className="w-3 h-3 text-orange-400" />
                        <span className="text-sm font-medium text-white">
                          {day.high}°
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <ArrowDown className="w-3 h-3 text-blue-400" />
                        <span className="text-sm font-medium text-zinc-400">
                          {day.low}°
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}

            {/* Settings Tab */}
            {activeTab === "settings" && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col gap-6"
              >
                {/* Size Configuration */}
                <div>
                  <label className="text-sm font-medium text-zinc-300 mb-3 block">
                    Card Size
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {/* 2x1 Option */}
                    <motion.button
                      whileTap={{ scale: 0.96 }}
                      onClick={() => {
                        setConfiguredSize("2x1");
                        if (navigator.vibrate)
                          navigator.vibrate(5);
                      }}
                      className={cn(
                        "p-4 rounded-xl border transition-all duration-300",
                        "flex flex-col items-center gap-3",
                        configuredSize === "2x1"
                          ? "bg-blue-500/20 border-blue-500/50 ring-2 ring-blue-500/30"
                          : "bg-white/5 border-white/10 hover:border-white/20",
                      )}
                    >
                      <Minimize2
                        className={cn(
                          "w-6 h-6",
                          configuredSize === "2x1"
                            ? "text-blue-400"
                            : "text-zinc-400",
                        )}
                      />
                      <div className="text-center">
                        <div
                          className={cn(
                            "font-semibold text-sm",
                            configuredSize === "2x1"
                              ? "text-white"
                              : "text-zinc-300",
                          )}
                        >
                          Compact
                        </div>
                        <div className="text-xs text-zinc-500 mt-0.5">
                          2×1 Grid
                        </div>
                      </div>
                    </motion.button>

                    {/* 2x2 Option */}
                    <motion.button
                      whileTap={{ scale: 0.96 }}
                      onClick={() => {
                        setConfiguredSize("2x2");
                        if (navigator.vibrate)
                          navigator.vibrate(5);
                      }}
                      className={cn(
                        "p-4 rounded-xl border transition-all duration-300",
                        "flex flex-col items-center gap-3",
                        configuredSize === "2x2"
                          ? "bg-blue-500/20 border-blue-500/50 ring-2 ring-blue-500/30"
                          : "bg-white/5 border-white/10 hover:border-white/20",
                      )}
                    >
                      <Maximize2
                        className={cn(
                          "w-6 h-6",
                          configuredSize === "2x2"
                            ? "text-blue-400"
                            : "text-zinc-400",
                        )}
                      />
                      <div className="text-center">
                        <div
                          className={cn(
                            "font-semibold text-sm",
                            configuredSize === "2x2"
                              ? "text-white"
                              : "text-zinc-300",
                          )}
                        >
                          Detailed
                        </div>
                        <div className="text-xs text-zinc-500 mt-0.5">
                          2×2 Grid
                        </div>
                      </div>
                    </motion.button>
                  </div>
                </div>

                {/* Preview Description */}
                <div className="p-4 bg-black/20 rounded-xl border border-white/5">
                  <h4 className="text-xs font-medium text-zinc-300 mb-2">
                    Layout Preview
                  </h4>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    {configuredSize === "2x1"
                      ? "Compact layout with current weather and hourly forecast strip at the bottom."
                      : "Full detailed layout with large temperature display, current stats, and 4-day forecast grid."}
                  </p>
                </div>

                {/* Entity Info */}
                <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                  <h4 className="text-xs font-medium text-zinc-300 mb-2">
                    Entity Info
                  </h4>
                  <div className="space-y-1 text-xs text-zinc-500 font-mono">
                    <div>ID: {entityId}</div>
                    <div>State: {entity.state}</div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );

  // 1. Glance (1x1) - Minimal
  if (effectiveVariant === "glance") {
    return (
      <>
        <motion.div
          whileTap={{ scale: 0.96 }}
          onClick={handleCardClick}
        >
          <AuroraCard
            className={cn(
              "relative overflow-hidden flex flex-col items-center justify-center p-4 h-full cursor-pointer",
              className,
            )}
          >
            {/* Background Glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-50" />

            <div className="relative z-10 flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center shadow-lg border border-white/5">
                {getWeatherIcon(cond, "w-6 h-6 text-white")}
              </div>
              <span className="text-4xl font-light text-white tracking-tighter">
                {typeof temp === "number"
                  ? Math.round(temp)
                  : "--"}
                °
              </span>
              <span className="text-xs font-medium text-white/60 uppercase tracking-wider">
                {cond}
              </span>
            </div>
          </AuroraCard>
        </motion.div>
        {renderDialog()}
      </>
    );
  }

  // 2. Forecast (2x1) - Side-by-side or Top/Bottom
  if (effectiveVariant === "forecast") {
    return (
      <>
        <motion.div
          whileTap={{ scale: 0.98 }}
          onClick={handleCardClick}
        >
          <AuroraCard
            className={cn(
              "relative overflow-hidden flex flex-col p-0 h-full cursor-pointer",
              className,
            )}
          >
            <div className="flex-1 p-5 flex items-center justify-between bg-gradient-to-br from-blue-500/5 to-transparent">
              {/* Left: Current */}
              <div className="flex flex-col">
                <div className="flex items-center gap-3 mb-1">
                  {getWeatherIcon(cond, "w-8 h-8 text-white")}
                  <span className="text-4xl font-light text-white tracking-tighter">
                    {typeof temp === "number"
                      ? Math.round(temp)
                      : "--"}
                    °
                  </span>
                </div>
                <span className="text-sm text-white/60 font-medium capitalize">
                  {cond}
                </span>
              </div>

              {/* Right: Min/Max or Humidity */}
              <div className="flex flex-col items-end gap-1">
                {humidity && (
                  <div className="flex items-center gap-1.5 text-xs text-white/70 bg-white/5 px-2 py-1 rounded-md">
                    <Droplets className="w-3 h-3 text-blue-300" />{" "}
                    {humidity}%
                  </div>
                )}
                {wind && (
                  <div className="flex items-center gap-1.5 text-xs text-white/70 bg-white/5 px-2 py-1 rounded-md">
                    <Wind className="w-3 h-3 text-teal-300" />{" "}
                    {wind}
                  </div>
                )}
              </div>
            </div>

            {/* Bottom: Horizontal Hourly Stripe */}
            <div className="h-[70px] bg-black/20 backdrop-blur-sm flex items-center justify-between px-4">
              {mockForecast.map((f, i) => (
                <div
                  key={i}
                  className="flex flex-col items-center gap-1"
                >
                  <span className="text-[10px] text-white/40">
                    {f.time}
                  </span>
                  {getForecastIcon(f.icon, "w-4 h-4")}
                  <span className="text-xs font-medium text-white">
                    {f.high}°
                  </span>
                </div>
              ))}
            </div>
          </AuroraCard>
        </motion.div>
        {renderDialog()}
      </>
    );
  }

  // 3. Dashboard (2x2) - The Full Experience
  return (
    <>
      <motion.div
        whileTap={{ scale: 0.98 }}
        onClick={handleCardClick}
      >
        <AuroraCard
          className={cn(
            "flex flex-col justify-between overflow-hidden relative h-full p-0 cursor-pointer",
            className,
          )}
        >
          {/* Ambient Background Glow */}
          <div className="absolute top-[-20%] right-[-10%] w-[250px] h-full bg-orange-500/20 blur-[80px] rounded-full pointer-events-none opacity-60" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[250px] h-full bg-blue-500/10 blur-[80px] rounded-full pointer-events-none opacity-60" />

          <div className="p-6 pb-2 flex-1 flex flex-col relative z-10">
            {/* Header: Location */}
            <div className="flex justify-between items-start">
              <div className="flex flex-col">
                <h3 className="text-white text-lg font-medium tracking-wide">
                  {entity.attributes.friendly_name ||
                    "My Location"}
                </h3>
                <span className="text-white/60 text-sm font-medium capitalize">
                  {cond}
                </span>
              </div>
              {/* Main Icon - Top Right */}
              <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center shadow-inner border border-white/5">
                {getWeatherIcon(cond, "w-5 h-5 text-white")}
              </div>
            </div>

            {/* Big Temperature Display */}
            <div className="flex-1 flex flex-col justify-center py-4">
              <div className="flex items-baseline gap-2">
                <span className="text-[5rem] leading-none font-extralight tracking-tighter text-white">
                  {typeof temp === "number"
                    ? Math.round(temp)
                    : "--"}
                  °
                </span>
              </div>

              {/* High / Low + Details */}
              <div className="flex items-center gap-4 mt-2">
                <div className="flex items-center gap-3 text-sm text-white/80">
                  <span className="flex items-center">
                    <ArrowUp className="w-3 h-3 mr-1 text-white/60" />{" "}
                    31°
                  </span>
                  <span className="flex items-center">
                    <ArrowDown className="w-3 h-3 mr-1 text-white/60" />{" "}
                    22°
                  </span>
                </div>
              </div>
            </div>

            {/* Secondary Stats (Wind/Humidity) inline pill */}
            <div className="flex items-center gap-2 mt-2">
              {humidity !== undefined && (
                <div className="px-3 py-1.5 rounded-full bg-white/5 border border-white/5 flex items-center gap-2">
                  <Droplets className="w-3 h-3 text-blue-300" />
                  <span className="text-xs text-white/90 font-medium">
                    {humidity}%
                  </span>
                </div>
              )}
              {wind !== undefined && (
                <div className="px-3 py-1.5 rounded-full bg-white/5 border border-white/5 flex items-center gap-2">
                  <Wind className="w-3 h-3 text-teal-300" />
                  <span className="text-xs text-white/90 font-medium">
                    {wind} km/h
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Separator */}
          <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent w-full" />

          {/* Forecast Footer */}
          <div className="bg-black/10 backdrop-blur-sm p-4">
            <div className="grid grid-cols-4 gap-2">
              {mockForecast.map((day, index) => (
                <div
                  key={day.day}
                  className="flex flex-col items-center gap-1.5"
                >
                  <span className="text-[11px] font-semibold text-white/50 uppercase tracking-wider">
                    {day.day}
                  </span>
                  <div className="my-1">
                    {getForecastIcon(day.icon)}
                  </div>
                  <span className="text-sm font-medium text-white">
                    {day.high}°
                  </span>
                </div>
              ))}
            </div>
          </div>
        </AuroraCard>
      </motion.div>
      {renderDialog()}
    </>
  );
}