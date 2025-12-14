import { useCallback } from "react";
import {
  useEntity,
  useService,
  type EntityName,
} from "@hakit/core";
import { Card } from "../ui/card";
import * as SliderPrimitive from "@radix-ui/react-slider";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Music,
  Film,
  Tv,
  Heart,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "../../lib/utils";

export type MediaPlayerVariant = "compact" | "wide" | "immersive";

interface AuroraMediaPlayerCardProps {
  entityId: EntityName;
  className?: string;
  variant?: MediaPlayerVariant;
}

export function AuroraMediaPlayerCard({
  entityId,
  className,
  variant = "wide",
}: AuroraMediaPlayerCardProps) {
  const entity = useEntity(entityId);
  const mp = useService("media_player");

  const isPlaying = entity.state === "playing";
  const isPaused = entity.state === "paused";
  const isIdle = entity.state === "idle" || entity.state === "off";

  // Media information
  const mediaTitle = entity.attributes.media_title || "Not Playing";
  const mediaArtist = entity.attributes.media_artist || "";
  const mediaSeries = entity.attributes.media_series_title || "";
  const mediaSeason = entity.attributes.media_season;
  const mediaEpisode = entity.attributes.media_episode;
  const mediaContentType = entity.attributes.media_content_type || "";
  const entityPicture = entity.attributes.entity_picture;
  const appName = entity.attributes.app_name || "";

  // Determine media type
  const isMusic = mediaContentType.includes("music") || mediaArtist;
  const isTvShow = mediaContentType.includes("tvshow") || mediaSeries;
  const isMovie =
    mediaContentType.includes("movie") ||
    (!isMusic && !isTvShow && mediaContentType.includes("video"));

  // Get appropriate icon
  const MediaIcon = isMusic ? Music : isTvShow ? Tv : isMovie ? Film : Music;

  // Get display subtitle
  const getSubtitle = () => {
    if (isIdle) return entity.attributes.friendly_name;
    if (isMusic && mediaArtist) return mediaArtist;
    if (isTvShow && mediaSeries) {
      const episodeInfo =
        mediaSeason && mediaEpisode
          ? ` • S${mediaSeason}E${mediaEpisode}`
          : "";
      return mediaSeries + episodeInfo;
    }
    if (isMovie && appName) return appName;
    return entity.attributes.friendly_name;
  };

  const playPause = useCallback(async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      if (isPlaying) await mp.mediaPause({ target: entityId });
      else await mp.mediaPlay({ target: entityId });
    } catch (e: any) {
      toast.error(e?.message ?? "Failed", { id: entityId });
    }
  }, [mp, entityId, isPlaying]);

  const prev = useCallback(async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      await mp.mediaPreviousTrack({ target: entityId });
    } catch { }
  }, [mp, entityId]);

  const next = useCallback(async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      await mp.mediaNextTrack({ target: entityId });
    } catch { }
  }, [mp, entityId]);

  // --- Layouts ---

  // 1. Compact (1x1)
  if (variant === "compact") {
    return (
      <Card className={cn("relative overflow-hidden border-0 group cursor-pointer h-full", className)} onClick={playPause}>
        {/* Background (Blurred) */}
        <div className="absolute inset-0">
          {entityPicture ? (
            <img src={entityPicture} alt="Cover" className="w-full h-full object-cover blur-md scale-110 opacity-60" />
          ) : (
            <div className="w-full h-full bg-zinc-800" />
          )}
          <div className="absolute inset-0 bg-black/20" />
        </div>

        {/* Content */}
        <div className="relative h-full flex flex-col items-center justify-center p-4">
          {/* Small Cover Icon */}
          <div className="w-10 h-10 rounded-lg overflow-hidden shadow-lg mb-3 bg-zinc-800">
            {entityPicture ? (
              <img src={entityPicture} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <MediaIcon className="w-5 h-5 text-white/50" />
              </div>
            )}
          </div>

          {/* Play Button (Centered) */}
          <button
            className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center hover:scale-105 transition-transform active:scale-95 shadow-xl border border-white/10"
            onClick={playPause}
          >
            {isPlaying ? <Pause className="w-5 h-5 text-white" fill="currentColor" /> : <Play className="w-5 h-5 text-white ml-0.5" fill="currentColor" />}
          </button>
        </div>
      </Card>
    );
  }

  // 2. Wide (2x1) - Side-by-side
  if (variant === "wide") {
    return (
      <Card className={cn("relative overflow-hidden border-0 h-full flex", className)}>
        {/* Left: Cover Art (Square) */}
        <div className="aspect-square h-full relative shrink-0">
          {entityPicture ? (
            <img src={entityPicture} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
              <MediaIcon className="w-10 h-10 text-white/20" />
            </div>
          )}
          {/* Play Overlay on Cover */}
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer" onClick={playPause}>
            {isPlaying ? <Pause className="w-8 h-8 text-white" /> : <Play className="w-8 h-8 text-white" />}
          </div>
        </div>

        {/* Right: Info & Controls */}
        <div className="flex-1 flex flex-col justify-center p-4 bg-zinc-900/60 backdrop-blur-xl">
          <div className="mb-3">
            <div className="text-base font-medium text-white truncate">{mediaTitle}</div>
            <div className="text-sm text-white/50 truncate">{getSubtitle()}</div>
          </div>

          <div className="flex items-center gap-4">
            <button onClick={prev} className="text-white/70 hover:text-white"><SkipBack className="w-5 h-5" fill="currentColor" /></button>
            <button onClick={playPause} className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform">
              {isPlaying ? <Pause className="w-5 h-5" fill="currentColor" /> : <Play className="w-5 h-5 ml-0.5" fill="currentColor" />}
            </button>
            <button onClick={next} className="text-white/70 hover:text-white"><SkipForward className="w-5 h-5" fill="currentColor" /></button>
          </div>
        </div>
      </Card>
    );
  }

  // 3. Immersive (2x2) - Full Cover Layout
  return (
    <Card
      className={cn(
        "animate-fade-pop overflow-hidden flex flex-col border-0 relative h-full",
        className,
      )}
    >
      {/* Full Artwork Background */}
      <div className="absolute inset-0 bg-zinc-900">
        {entityPicture ? (
          <>
            <img
              src={entityPicture}
              alt={mediaTitle}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-900 to-purple-900">
            <MediaIcon className="w-24 h-24 text-white/10" />
          </div>
        )}
      </div>

      {/* Top Bar: App Icon/Name */}
      <div className="absolute top-0 left-0 right-0 p-5 flex justify-between items-start z-10">
        <div className="px-2 py-1 rounded-md bg-black/30 backdrop-blur-md text-[10px] uppercase tracking-wider font-bold text-white/70 border border-white/5">
          {appName || "Media"}
        </div>
        {/* Like/Heart Button (Mock) */}
        <button className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-colors backdrop-blur-md">
          <Heart className="w-4 h-4" />
        </button>
      </div>

      {/* Bottom Controls */}
      <div className="absolute bottom-0 left-0 right-0 p-6 z-10">
        {/* Info */}
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-white leading-tight mb-1 line-clamp-2">{mediaTitle}</h2>
          <p className="text-lg text-white/60 font-medium truncate">{getSubtitle()}</p>
        </div>

        {/* Progress Scrubber */}
        <div className="mb-6 group/slider">
          <SliderPrimitive.Root
            value={[0]} // Mock value
            max={100}
            step={1}
            className="relative flex w-full touch-none items-center select-none"
          >
            <SliderPrimitive.Track className="bg-white/20 relative h-1.5 grow overflow-hidden rounded-full group-hover/slider:h-2 transition-all">
              <SliderPrimitive.Range className="bg-white absolute h-full" />
            </SliderPrimitive.Track>
            <SliderPrimitive.Thumb className="block size-0 group-hover/slider:size-4 rounded-full bg-white shadow-lg transition-all focus-visible:outline-none disabled:pointer-events-none" />
          </SliderPrimitive.Root>
          <div className="flex justify-between text-xs text-white/40 mt-2 font-medium">
            <span>1:24</span>
            <span>-3:45</span>
          </div>
        </div>

        {/* Main Controls */}
        <div className="flex items-center justify-between">
          <button className="text-white/50 hover:text-white transition-colors"><SkipBack className="w-8 h-8" fill="currentColor" /></button>

          <button
            onClick={playPause}
            className="w-16 h-16 rounded-full bg-white hover:scale-105 active:scale-95 transition-all flex items-center justify-center text-black shadow-[0_0_30px_rgba(255,255,255,0.3)]"
          >
            {isPlaying ? <Pause className="w-8 h-8" fill="currentColor" /> : <Play className="w-8 h-8 ml-1" fill="currentColor" />}
          </button>

          <button className="text-white/50 hover:text-white transition-colors"><SkipForward className="w-8 h-8" fill="currentColor" /></button>
        </div>
      </div>
    </Card>
  );
}
