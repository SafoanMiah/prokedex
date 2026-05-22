"use client";

import { memo } from "react";
import type { PokemonEntry, PokemonType } from "@/lib/types";
import { TypePill } from "./TypePill";

interface Props {
  slug: string;
  file: string;
  displayName: string;
  idx: number;
  entry: PokemonEntry | undefined;
  silhouette: boolean;
  density: "cozy" | "compact";
  onClick: () => void;
}

function PokemonCardBase({ slug: _slug, file, displayName, idx, entry, silhouette, density, onClick }: Props) {
  const claimed = !!entry;
  const showName = entry?.name || displayName;
  const types: PokemonType[] = entry?.types ?? [];

  const isSilhouette = silhouette && !claimed;
  const isShiny = entry?.shiny;
  const isFav = entry?.favorite;

  const spriteSize = density === "compact" ? "h-20" : "h-28";
  const padding = density === "compact" ? "p-2" : "p-3";

  return (
    <button
      onClick={onClick}
      className={`pixel-card pixel-card-interactive group relative ${padding} flex flex-col items-center gap-1 text-center`}
      aria-label={`${showName}${claimed ? " (claimed)" : ""}`}
    >
      <span className="absolute top-1 left-1 font-display text-pixel-xs text-ink-mute">
        #{String(idx + 1).padStart(3, "0")}
      </span>

      {isFav && (
        <span className="absolute top-1 right-1 text-accent-yellow text-pixel-base leading-none text-stroke-sm">★</span>
      )}

      <div className={`${spriteSize} w-full flex items-center justify-center relative`}>
        <img
          src={`/sprites/${file}`}
          alt=""
          loading="lazy"
          decoding="async"
          className={`sprite max-h-full max-w-full ${isSilhouette ? "silhouette" : claimed ? "" : "silhouette-gray"} ${isShiny ? "drop-shadow-[0_0_6px_rgba(255,204,0,0.6)]" : ""} transition-all`}
          style={{ imageRendering: "pixelated" }}
        />
      </div>

      <div className="w-full min-h-[24px] flex items-center justify-center">
        <h3
          className={`font-display ${density === "compact" ? "text-pixel-xs" : "text-pixel-xs"} uppercase tracking-wider truncate max-w-full ${claimed ? "text-ink" : "text-ink-mute"}`}
        >
          {isSilhouette ? "???" : showName}
        </h3>
      </div>

      {types.length > 0 && !isSilhouette && (
        <div className="flex gap-1 flex-wrap justify-center">
          {types.map((t) => (
            <TypePill key={t} type={t} />
          ))}
        </div>
      )}

      {!claimed && !isSilhouette && (
        <div className="font-display text-pixel-xs text-ink-mute opacity-60">unclaimed</div>
      )}
    </button>
  );
}

export const PokemonCard = memo(PokemonCardBase);
