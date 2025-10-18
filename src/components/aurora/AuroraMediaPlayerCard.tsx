import { useCallback } from "react";
import { useEntity, useService, type EntityName } from "@hakit/core";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Play, Pause, SkipBack, SkipForward, Volume2 } from "lucide-react";
import { toast } from "sonner";

export function AuroraMediaPlayerCard({
	entityId,
	className,
}: {
	entityId: EntityName;
	className?: string;
}) {
	const entity = useEntity(entityId);
	const mp = useService("media_player");

	const isPlaying = entity.state === "playing";
	const isPaused = entity.state === "paused";
	const volume = entity.attributes.volume_level
		? Math.round(entity.attributes.volume_level * 100)
		: 0;

	const playPause = useCallback(async () => {
		try {
			toast.loading(isPlaying ? "Pausing…" : "Playing…", { id: entityId });
			if (isPlaying) await mp.mediaPause({ target: entityId });
			else await mp.mediaPlay({ target: entityId });
			toast.success(isPlaying ? "Paused" : "Playing", { id: entityId });
		} catch (e: any) {
			toast.error(e?.message ?? "Failed", { id: entityId });
		}
	}, [mp, entityId, isPlaying]);

	const prev = useCallback(async () => {
		try {
			await mp.mediaPreviousTrack({ target: entityId });
		} catch {}
	}, [mp, entityId]);
	const next = useCallback(async () => {
		try {
			await mp.mediaNextTrack({ target: entityId });
		} catch {}
	}, [mp, entityId]);

	return (
		<Card className={`animate-fade-pop ${className ?? ""}`}>
			<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
				<CardTitle className="text-white text-base font-semibold">
					{entity.attributes.friendly_name || "Media"}
				</CardTitle>
				<Badge className={`bg-white/20 text-white/70`}>
					{(entity.state || "idle").toUpperCase()}
				</Badge>
			</CardHeader>
			<CardContent className="p-5 pt-0">
				{(entity.attributes.media_title || entity.attributes.media_artist) && (
					<div className="mb-4">
						<div className="text-white font-medium truncate text-sm">
							{entity.attributes.media_title}
						</div>
						<div className="text-white/60 text-xs truncate">
							{entity.attributes.media_artist}
						</div>
					</div>
				)}

				<div className="flex items-center justify-center gap-3">
					<Button
						onClick={prev}
						className="bg-white/10 hover:bg-white/20 border border-white/20"
					>
						<SkipBack className="w-4 h-4" />
					</Button>
					<Button
						onClick={playPause}
						className="bg-white/10 hover:bg-white/20 border border-white/20"
					>
						{isPlaying ? (
							<Pause className="w-5 h-5" />
						) : (
							<Play className="w-5 h-5" />
						)}
					</Button>
					<Button
						onClick={next}
						className="bg-white/10 hover:bg-white/20 border border-white/20"
					>
						<SkipForward className="w-4 h-4" />
					</Button>
				</div>

				{entity.attributes.volume_level !== undefined && (
					<div className="flex items-center justify-center gap-2 text-xs text-white/60 mt-3">
						<Volume2 className="w-3 h-3" />
						<span>{volume}%</span>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
