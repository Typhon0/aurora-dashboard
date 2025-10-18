import { AuroraLightCard } from "@/components/aurora/AuroraLightCard";
import { AuroraClimateCard } from "@/components/aurora/AuroraClimateCard";
import { AuroraMediaPlayerCard } from "@/components/aurora/AuroraMediaPlayerCard";
import { AuroraFanCard } from "@/components/aurora/AuroraFanCard";
import { AuroraSwitchCard } from "@/components/aurora/AuroraSwitchCard";
import { AuroraBinarySensorCard } from "@/components/aurora/AuroraBinarySensorCard";
import { AuroraGaugeCard } from "@/components/aurora/AuroraGaugeCard";
import { AuroraButtonCard } from "@/components/aurora/AuroraButtonCard";
import { AuroraSelectCard } from "@/components/aurora/AuroraSelectCard";
import { AuroraNumberCard } from "@/components/aurora/AuroraNumberCard";
import { AuroraSceneCard } from "@/components/aurora/AuroraSceneCard";
import { AuroraSensor } from "@/components/aurora/AuroraSensorCard";
import { AuroraTimeCard } from "@/components/aurora/AuroraTimeCard";
import { AuroraTimerCard } from "@/components/aurora/AuroraTimerCard";
import { AuroraLockCard } from "@/components/aurora/AuroraLockCard";
import { AuroraCover } from "@/components/aurora/AuroraCoverCard";
import { AuroraVacuumCard } from "@/components/aurora/AuroraVacuumCard";
import { AuroraAlarmCard } from "@/components/aurora/AuroraAlarmCard";
import { AuroraWeatherCard } from "@/components/aurora/AuroraWeatherCard";
import { AuroraTriggerCard } from "@/components/aurora/AuroraTriggerCard";
import { AuroraEntitiesCard } from "@/components/aurora/AuroraEntitiesCard";
import { AuroraFamilyCard } from "@/components/aurora/AuroraFamilyCard";
import { Sparkline } from "@/components/charts/Sparkline";
// Demo mode uses hass-connect-fake via Vite alias; no custom provider needed.

// Mapping to the existing offline mock entity ids from `createMockEntities`.
// Using provided demo_* entities prevents `entity_not_found` errors in offline mode.
// If you add new cards, prefer reusing or extending mockEntities instead of hardcoding new IDs here.
const ent = {
	light1: "light.demo_lamp",
	light2: "light.demo_ceiling",
	hvac: "climate.demo_hvac",
	media: "media_player.demo_player",
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
} as const;

export function DemoDashboard() {
	return (
		<div className="min-h-screen p-8 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white space-y-10">
			<header className="space-y-2">
				<h1 className="text-4xl font-bold bg-gradient-to-r from-white via-cyan-200 to-cyan-400 bg-clip-text text-transparent">
					Aurora Demo (Offline)
				</h1>
				<p className="text-white/60 text-sm">
					All cards rendered using an in-browser mock Home Assistant layer.
					States drift to simulate activity.
				</p>
			</header>

			<section>
				<h2 className="text-lg font-semibold mb-3">Core Entities</h2>
				<div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
					<AuroraLightCard entityId={ent.light1} />
					<AuroraLightCard entityId={ent.light2} />
					<AuroraClimateCard entityId={ent.hvac} />
					<AuroraMediaPlayerCard entityId={ent.media} />
					<AuroraFanCard entityId={ent.fan} />
				</div>
			</section>

			<section>
				<h2 className="text-lg font-semibold mb-3">Controls & States</h2>
				<div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
					<AuroraSwitchCard entityId={ent.outlet} />
					<AuroraBinarySensorCard entityId={ent.door} />
					<AuroraLockCard entityId={ent.lock} />
					<AuroraCover entityId={ent.cover} />
					<AuroraVacuumCard entityId={ent.vac} />
					<AuroraAlarmCard entityId={ent.alarm} />
				</div>
			</section>

			<section>
				<h2 className="text-lg font-semibold mb-3">Data & Metrics</h2>
				<div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
					<AuroraSensor entityId={ent.temp} />
					<AuroraGaugeCard entityId={ent.energy} min={200} max={600} />
					<AuroraNumberCard entityId={ent.number} />
					<AuroraSelectCard entityId={ent.select} />
					<AuroraTimeCard />
					<AuroraTimerCard entityId={ent.timer} />
				</div>
			</section>

			<section>
				<h2 className="text-lg font-semibold mb-3">Scenes & Actions</h2>
				<div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
					<AuroraSceneCard entityId={ent.scene} />
					<AuroraButtonCard entityId={ent.outlet} />
					<AuroraTriggerCard
						domain="script"
						target="script.fake_demo"
						title="Trigger"
					/>
					<AuroraEntitiesCard
						title="Energy Group"
						entities={[
							{
								id: ent.energy,
								state: "420",
								attributes: { friendly_name: "Energy Load" },
							},
							{
								id: ent.temp,
								state: "22.3",
								attributes: { friendly_name: "Temperature" },
							},
						]}
					/>
					<AuroraWeatherCard entityId={ent.weather} />
				</div>
			</section>

			<section>
				<h2 className="text-lg font-semibold mb-3">People & Aggregates</h2>
				<div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-4 xl:grid-cols-6">
					<AuroraFamilyCard people={[ent.personA, ent.personB]} />
					<div className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm flex flex-col justify-between">
						<h3 className="text-sm font-medium mb-2 text-white/70">
							Energy Sparkline
						</h3>
						<Sparkline
							data={Array.from({ length: 40 }, (_, i) => ({
								t: i,
								v: 350 + Math.sin(i / 6) * 40 + (i % 5),
							}))}
							height={60}
						/>
					</div>
				</div>
			</section>

			<footer className="text-center text-xs text-white/40 pt-8 pb-4">
				Demo mode – powered by hass-connect-fake (no real Home Assistant
				connection).
			</footer>
		</div>
	);
}
