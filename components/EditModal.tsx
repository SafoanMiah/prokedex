"use client";

import { useEffect, useState } from "react";
import { Backdrop } from "./PinGate";
import { TypePicker } from "./TypePicker";
import { TypePill } from "./TypePill";
import type { PokemonEntry, PokemonType } from "@/lib/types";

interface Props {
  slug: string;
  file: string;
  displayName: string;
  idx: number;
  entry: PokemonEntry | undefined;
  canEdit: boolean;
  initialTypes?: PokemonType[];
  onSave: (patch: Partial<PokemonEntry>) => Promise<void>;
  onRelease: () => Promise<void>;
  onClose: () => void;
}

const STATS_KEYS = ["hp", "atk", "def", "spd"] as const;
const STATS_LABELS: Record<(typeof STATS_KEYS)[number], string> = {
  hp: "HP",
  atk: "ATK",
  def: "DEF",
  spd: "SPD",
};
const STATS_COLORS: Record<(typeof STATS_KEYS)[number], string> = {
  hp: "#ee1515",
  atk: "#ffcc00",
  def: "#6390F0",
  spd: "#7AC74C",
};

export function EditModal({
  slug,
  file,
  displayName,
  idx,
  entry,
  canEdit,
  initialTypes,
  onSave,
  onRelease,
  onClose,
}: Props) {
  const [name, setName] = useState(entry?.name ?? displayName);
  const [types, setTypes] = useState<PokemonType[]>(entry?.types ?? initialTypes ?? []);
  const [description, setDescription] = useState(entry?.description ?? "");
  const [stats, setStats] = useState(entry?.stats ?? { hp: 50, atk: 50, def: 50, spd: 50 });
  const [favorite, setFavorite] = useState(entry?.favorite ?? false);
  const [shiny, setShiny] = useState(entry?.shiny ?? false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const isClaiming = !entry;
  const [showTypes, setShowTypes] = useState(!isClaiming || (initialTypes?.length ?? 0) > 0);
  const [showDescription, setShowDescription] = useState(!isClaiming);
  const [showStats, setShowStats] = useState(!isClaiming);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function handleSave() {
    setErr(null);
    setBusy(true);
    try {
      const patch: Partial<PokemonEntry> = {
        name: name.trim() || displayName,
        favorite,
        shiny,
      };
      if (showTypes || types.length > 0) patch.types = types;
      if (showDescription || description.trim()) patch.description = description;
      if (showStats) patch.stats = stats;
      await onSave(patch);
      onClose();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "failed to save");
      setBusy(false);
    }
  }

  async function handleRelease() {
    if (!confirm("release this pokemon? it'll go back to the wild.")) return;
    setBusy(true);
    try {
      await onRelease();
      onClose();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "failed");
      setBusy(false);
    }
  }

  return (
    <Backdrop onClose={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="pixel-card w-full max-w-4xl max-h-[92vh] flex flex-col lg:grid lg:grid-cols-[280px_1fr] lg:max-h-[88vh] overflow-hidden"
      >
        {/* Sprite hero — left column on lg, top on mobile */}
        <aside className="lcd-screen scanline p-5 flex flex-col items-center justify-center gap-3 relative lg:border-r-4 lg:border-bg-deep min-h-[200px] lg:min-h-0">
          <span className="absolute top-2 left-3 font-display text-pixel-xs text-ink-dim">
            #{String(idx + 1).padStart(3, "0")}
          </span>
          {entry && (
            <span className="absolute top-2 right-3 font-display text-pixel-xs text-accent-green">
              ◉ CLAIMED
            </span>
          )}
          <img
            src={`/sprites/${file}`}
            alt=""
            className={`sprite max-h-32 lg:max-h-44 ${shiny ? "drop-shadow-[0_0_12px_rgba(255,204,0,0.7)]" : ""}`}
            style={{ imageRendering: "pixelated" }}
          />
          <div className="flex flex-col items-center gap-0.5">
            <div className="font-display text-pixel-base text-ink uppercase">{displayName}</div>
            <div className="font-body text-pixel-base text-ink-mute">{slug}</div>
          </div>
        </aside>

        {/* Form column */}
        <div className="overflow-y-auto p-5 flex flex-col gap-5">
          {/* Name */}
          <Field label={isClaiming ? "give it a name" : "name"}>
            {canEdit ? (
              <input
                autoFocus={isClaiming}
                className="pixel-input"
                value={name}
                maxLength={24}
                onChange={(e) => setName(e.target.value)}
                placeholder={displayName}
              />
            ) : (
              <div className="font-display text-pixel-lg text-ink">{entry?.name ?? displayName}</div>
            )}
          </Field>

          {/* Quick toggles row — always visible */}
          <div className="flex gap-2 flex-wrap">
            <SectionToggle
              label="types"
              count={types.length}
              active={showTypes}
              onToggle={() => setShowTypes(!showTypes)}
              disabled={!canEdit}
            />
            <SectionToggle
              label="entry"
              count={description ? 1 : 0}
              active={showDescription}
              onToggle={() => setShowDescription(!showDescription)}
              disabled={!canEdit}
            />
            <SectionToggle
              label="stats"
              count={0}
              active={showStats}
              onToggle={() => setShowStats(!showStats)}
              disabled={!canEdit}
            />
            <PixelToggle
              label="★ fav"
              active={favorite}
              onClick={() => canEdit && setFavorite(!favorite)}
              disabled={!canEdit}
              color="#ffcc00"
            />
            <PixelToggle
              label="✦ shiny"
              active={shiny}
              onClick={() => canEdit && setShiny(!shiny)}
              disabled={!canEdit}
              color="#F95587"
            />
          </div>

          {/* Types section */}
          {showTypes && (
            <Field label="types (max 2)">
              {canEdit ? (
                <TypePicker selected={types} onChange={setTypes} />
              ) : (
                <div className="flex gap-2 flex-wrap">
                  {(entry?.types ?? []).map((t) => (
                    <TypePill key={t} type={t} size="sm" />
                  ))}
                  {(entry?.types ?? []).length === 0 && (
                    <span className="font-body text-pixel-base text-ink-mute">no types</span>
                  )}
                </div>
              )}
            </Field>
          )}

          {/* Description section */}
          {showDescription && (
            <Field label="dex entry">
              {canEdit ? (
                <textarea
                  rows={3}
                  maxLength={280}
                  className="pixel-input resize-none"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="describe this pokemon..."
                />
              ) : (
                <p className="font-body text-pixel-lg text-ink leading-snug">
                  {entry?.description || <span className="text-ink-mute">no entry</span>}
                </p>
              )}
            </Field>
          )}

          {/* Stats section */}
          {showStats && (
            <Field label="stats">
              <div className="flex flex-col gap-3">
                {STATS_KEYS.map((k) => (
                  <div key={k} className="flex items-center gap-3">
                    <span
                      className="font-display text-pixel-xs w-10 text-stroke-sm"
                      style={{ color: STATS_COLORS[k] }}
                    >
                      {STATS_LABELS[k]}
                    </span>
                    {canEdit ? (
                      <>
                        <input
                          type="range"
                          min={1}
                          max={255}
                          value={stats[k]}
                          onChange={(e) => setStats({ ...stats, [k]: Number(e.target.value) })}
                          className="flex-1 accent-accent-red"
                        />
                        <span className="font-display text-pixel-sm text-ink w-12 text-right">
                          {stats[k]}
                        </span>
                      </>
                    ) : (
                      <div className="flex-1 h-3 bg-bg-deep" style={{ boxShadow: "0 0 0 2px #000" }}>
                        <div
                          className="h-full transition-all"
                          style={{
                            width: `${(stats[k] / 255) * 100}%`,
                            backgroundColor: STATS_COLORS[k],
                          }}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Field>
          )}

          {err && (
            <p className="font-display text-pixel-xs text-accent-red text-stroke-sm">{err}</p>
          )}

          {/* Actions */}
          <div className="flex gap-3 mt-auto pt-3 sticky bottom-0 bg-bg-panel">
            <button onClick={onClose} className="pixel-btn flex-1">
              CLOSE
            </button>
            {canEdit && entry && (
              <button onClick={handleRelease} disabled={busy} className="pixel-btn pixel-btn-primary">
                RELEASE
              </button>
            )}
            {canEdit && (
              <button onClick={handleSave} disabled={busy} className="pixel-btn pixel-btn-yellow flex-1">
                {busy ? "..." : entry ? "SAVE" : "CLAIM"}
              </button>
            )}
          </div>
        </div>
      </div>
    </Backdrop>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="font-display text-pixel-xs uppercase tracking-wider text-ink-dim">
        {label}
      </span>
      {children}
    </div>
  );
}

function SectionToggle({
  label,
  count,
  active,
  onToggle,
  disabled,
}: {
  label: string;
  count: number;
  active: boolean;
  onToggle: () => void;
  disabled: boolean;
}) {
  return (
    <button
      onClick={onToggle}
      disabled={disabled}
      className={`px-3 py-2 font-display text-pixel-xs uppercase tracking-wider transition-colors ${
        active ? "bg-accent-yellow text-bg" : "bg-bg-raised text-ink-dim hover:text-ink"
      }`}
      style={{
        boxShadow: active
          ? "0 0 0 2px #000, 0 2px 0 0 rgba(0,0,0,0.5), inset 0 -2px 0 0 rgba(0,0,0,0.25)"
          : "0 0 0 2px #000, 0 2px 0 0 rgba(0,0,0,0.5)",
      }}
    >
      {active ? "−" : "+"} {label}
      {count > 0 && !active && (
        <span className="ml-1 text-accent-yellow">·{count}</span>
      )}
    </button>
  );
}

function PixelToggle({
  label,
  active,
  onClick,
  disabled,
  color,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  disabled: boolean;
  color: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="px-3 py-2 font-display text-pixel-xs uppercase tracking-wider transition-colors"
      style={{
        backgroundColor: active ? color : "#1a1a2e",
        color: active ? "#000" : "#a8a8a0",
        boxShadow: "0 0 0 2px #000, 0 2px 0 0 rgba(0,0,0,0.5), inset 0 -2px 0 0 rgba(0,0,0,0.25)",
      }}
    >
      {label}
    </button>
  );
}
