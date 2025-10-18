import { useMemo } from "react";

// UI shadcn
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ui/theme-toggle";

// Aurora cards (adaptées shadcn + @hakit/core v5)
import { AuroraClimateCard } from "@/components/aurora/AuroraClimateCard";
import { AuroraWeatherCard } from "@/components/aurora/AuroraWeatherCard";
import { AuroraMediaPlayerCard } from "@/components/aurora/AuroraMediaPlayerCard";
import { AuroraLightCard } from "@/components/aurora/AuroraLightCard";
import { AuroraSensor } from "@/components/aurora/AuroraSensorCard";
import { AuroraButtonCard } from "@/components/aurora/AuroraButtonCard";
import { AuroraTriggerCard } from "@/components/aurora/AuroraTriggerCard";
import { AuroraEntitiesCard } from "@/components/aurora/AuroraEntitiesCard";
import { AuroraFamilyCard } from "@/components/aurora/AuroraFamilyCard";
import { AuroraFabCard } from "@/components/aurora/AuroraFabCard";
import { AuroraFanCard } from "@/components/aurora/AuroraFanCard";
import { useHass, type EntityName } from "@hakit/core";

// Mapping direct depuis le YAML
const cfg = {
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
		water: "water_heater.vitrocrossal_300_cu3a_domestic_hot_water",
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

export function Dashboard() {
	// Safe existence check without throwing. We can't call hooks conditionally,
	// so we rely on the hass helper (getEntity) if present, else a cached map.
	const hass = useHass() as any;
	const exists = (id?: string) => {
		if (!id) return false;
		// Try direct getter first
		if (hass?.getEntity) {
			const got = hass.getEntity(id);
			if (got) return true;
		}
		// Bulk containers (naming can vary across versions)
		const containers = [
			hass?.getAllEntities?.(),
			hass?.entities,
			hass?.states,
			hass?.__ENTITIES__,
		];
		for (const c of containers) {
			if (c && typeof c === "object" && id in c) return true;
		}
		return false;
	};
	// Famille pour la section "Maison"
	const family = useMemo(
		() => [cfg.maison.loic, cfg.maison.emma].filter(Boolean),
		[],
	);

	return (
		<div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white">
			{/* BG aurora */}
			<div className="fixed inset-0 bg-gradient-to-br from-blue-900/10 via-transparent to-purple-900/10 pointer-events-none" />
			<div className="fixed top-20 left-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
			<div className="fixed bottom-20 right-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

			<div className="relative z-10 p-6 lg:p-8 max-w-7xl mx-auto">
				{/* Header */}
				<header className="mb-6">
					<div className="flex items-center justify-between gap-4">
						<h1 className="text-4xl lg:text-5xl font-black bg-gradient-to-r from-white via-blue-200 to-blue-400 bg-clip-text text-transparent">
							Aurora Dashboard (from ui-lovelace.yaml)
						</h1>
						<div className="flex items-center gap-3">
							<Badge className="bg-white/15 text-white/80">shadcn + @hakit</Badge>
							<ThemeToggle />
						</div>
					</div>
					<Separator className="mt-4 bg-white/20" />
				</header>

				{/* Grille principale (mêmes zones que le YAML) */}
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
					{/* SIDEBAR */}
					<div className="lg:col-span-1 space-y-4">
						{/* Bannière sidebar (texte/sensor) */}
						{exists(cfg.sidebarBanner) && (
							<AuroraSensor entityId={cfg.sidebarBanner as EntityName} />
						)}
						{/* Météo */}
						{exists(cfg.weather) && (
							<AuroraWeatherCard entityId={cfg.weather as EntityName} />
						)}
					</div>

					{/* COL 2-5: zones */}
					<div className="lg:col-span-4 space-y-8">
						{/* Salon */}
						<section>
							<h2 className="text-xl font-semibold mb-3">Salon</h2>
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
								{exists(cfg.salon.light) && (
									<AuroraLightCard entityId={cfg.salon.light as EntityName} />
								)}
								{exists(cfg.salon.buffet) && (
									<AuroraButtonCard entityId={cfg.salon.buffet as EntityName} />
								)}
								{exists(cfg.salon.climate) && (
									<AuroraClimateCard
										entityId={cfg.salon.climate as EntityName}
									/>
								)}
								{exists(cfg.salon.tv) && (
									<AuroraMediaPlayerCard
										entityId={cfg.salon.tv as EntityName}
									/>
								)}
							</div>
						</section>

						{/* Cuisine */}
						<section>
							<h2 className="text-xl font-semibold mb-3">Cuisine</h2>
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
								{exists(cfg.cuisine.light) && (
									<AuroraLightCard entityId={cfg.cuisine.light as EntityName} />
								)}
								{exists(cfg.cuisine.temp) && (
									<AuroraSensor entityId={cfg.cuisine.temp as EntityName} />
								)}
								{exists(cfg.cuisine.media) && (
									<AuroraMediaPlayerCard
										entityId={cfg.cuisine.media as EntityName}
									/>
								)}
							</div>
						</section>

						{/* Bureau */}
						<section>
							<h2 className="text-xl font-semibold mb-3">Bureau</h2>
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
								{exists(cfg.bureau.strip) && (
									<AuroraLightCard entityId={cfg.bureau.strip as EntityName} />
								)}
								{exists(cfg.bureau.lamp) && (
									<AuroraLightCard entityId={cfg.bureau.lamp as EntityName} />
								)}
								{exists(cfg.bureau.pc) && (
									<AuroraSensor entityId={cfg.bureau.pc as EntityName} />
								)}
								{exists(cfg.bureau.climate) && (
									<AuroraClimateCard
										entityId={cfg.bureau.climate as EntityName}
									/>
								)}
							</div>
						</section>

						{/* Chambre */}
						<section>
							<h2 className="text-xl font-semibold mb-3">Chambre</h2>
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
								{exists(cfg.chambre.bedside) && (
									<AuroraLightCard
										entityId={cfg.chambre.bedside as EntityName}
									/>
								)}
								{exists(cfg.chambre.temp) && (
									<AuroraSensor entityId={cfg.chambre.temp as EntityName} />
								)}
								{exists(cfg.chambre.climate) && (
									<AuroraClimateCard
										entityId={cfg.chambre.climate as EntityName}
									/>
								)}
								{exists(cfg.chambre.fan) && (
									<AuroraFanCard entityId={cfg.chambre.fan as EntityName} />
								)}
							</div>
						</section>

						{/* Media */}
						<section>
							<h2 className="text-xl font-semibold mb-3">Media</h2>
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
								{exists(cfg.media.jellyfin) && (
									<AuroraSensor entityId={cfg.media.jellyfin as EntityName} />
								)}
								{exists(cfg.media.salon) && (
									<AuroraMediaPlayerCard
										entityId={cfg.media.salon as EntityName}
									/>
								)}
								{exists(cfg.media.cuisine) && (
									<AuroraMediaPlayerCard
										entityId={cfg.media.cuisine as EntityName}
									/>
								)}
								{exists(cfg.media.spotify) && (
									<AuroraMediaPlayerCard
										entityId={cfg.media.spotify as EntityName}
									/>
								)}
								{exists(cfg.media.kok) && (
									<AuroraMediaPlayerCard
										entityId={cfg.media.kok as EntityName}
									/>
								)}
								{exists(cfg.media.tv) && (
									<AuroraMediaPlayerCard
										entityId={cfg.media.tv as EntityName}
									/>
								)}
							</div>
						</section>

						{/* Buanderie */}
						<section>
							<h2 className="text-xl font-semibold mb-3">Buanderie</h2>
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
								{exists(cfg.buanderie.spot) && (
									<AuroraLightCard
										entityId={cfg.buanderie.spot as EntityName}
									/>
								)}
								{exists(cfg.buanderie.trv) && (
									<AuroraClimateCard
										entityId={cfg.buanderie.trv as EntityName}
									/>
								)}
								{exists(cfg.buanderie.boilerHeat) && (
									<AuroraClimateCard
										entityId={cfg.buanderie.boilerHeat as EntityName}
									/>
								)}
								{exists(cfg.buanderie.water) && (
									<AuroraSensor entityId={cfg.buanderie.water as EntityName} />
								)}
							</div>
						</section>

						{/* Maison */}
						<section>
							<h2 className="text-xl font-semibold mb-3">Maison</h2>
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
								<AuroraFamilyCard people={family as EntityName[]} />
								<AuroraEntitiesCard
									title="Wallbox"
									entityIds={[
										cfg.maison.chargerStatus as EntityName,
										cfg.maison.chargerPower as EntityName,
									]}
								/>
								<AuroraTriggerCard
									domain="script"
									target={cfg.maison.arrive}
									title="Maison"
								/>
								<AuroraTriggerCard
									domain="script"
									target={cfg.maison.leave}
									title="Fermez tout"
								/>
							</div>
						</section>

						{/* Footer */}
						<section>
							<h2 className="text-xl font-semibold mb-3">Footer</h2>
							{/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
								<AuroraEntitiesCard
									title="NAS"
									entityIds={[
										cfg.footer.nasUpdate as EntityName,
										cfg.footer.nasVol as EntityName,
										cfg.footer.nasSec as EntityName,
										cfg.footer.nasDisk as EntityName,
									]}
								/>
								{exists(cfg.footer.updates) && (
									<AuroraSensor entityId={cfg.footer.updates as EntityName} />
								)}
								{exists(cfg.footer.today) && (
									<AuroraSensor entityId={cfg.footer.today as EntityName} />
								)}
								{exists(cfg.footer.lastVacuumEnd) && (
									<AuroraSensor
										entityId={cfg.footer.lastVacuumEnd as EntityName}
									/>
								)}
								<AuroraEntitiesCard
									title="UDM"
									entityIds={[
										cfg.footer.udmUpdate as EntityName,
										cfg.footer.udmInternet as EntityName,
									]}
								/>
							</div> */}
						</section>
					</div>
				</div>

				{/* Action flottante (optionnelle) */}
				<AuroraFabCard domain="script" target={cfg.maison.arrive} />
			</div>
		</div>
	);
}
