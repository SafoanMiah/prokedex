"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import type {
  CollectionPublic,
  CollectionSettings,
  PokemonEntry,
  PokemonType,
} from "@/lib/types";
import type { SpriteEntry } from "@/lib/pokemon-index.generated";

import { PokemonCard } from "./PokemonCard";
import { EditModal } from "./EditModal";
import { PinGate } from "./PinGate";
import { SettingsPanel } from "./SettingsPanel";
import { TypeGuessOverlay } from "./TypeGuessOverlay";
import { RandomRoller } from "./RandomRoller";
import { IconCheck, IconDice, IconGear, IconLock } from "./Icons";
import { rememberDex } from "@/lib/recent-dexes";

interface Props {
  code: string;
  initialCollection: CollectionPublic;
  sprites: SpriteEntry[];
}

export function CollectionView({ code, initialCollection, sprites }: Props) {
  const router = useRouter();
  const [collection, setCollection] = useState(initialCollection);
  const [pin, setPin] = useState<string | null>(null);
  const [showPinGate, setShowPinGate] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showRoller, setShowRoller] = useState(false);
  const [openSlug, setOpenSlug] = useState<string | null>(null);
  const [pendingClaim, setPendingClaim] = useState<{
    slug: string;
    guess: PokemonType[];
    correct: boolean | null;
  } | null>(null);
  const [showGuessFor, setShowGuessFor] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(collection.name);
  const [shuffleSeed] = useState(() => Math.floor(Math.random() * 1000));

  useEffect(() => {
    const saved = sessionStorage.getItem(`pin:${code}`);
    if (saved) setPin(saved);
  }, [code]);

  useEffect(() => {
    rememberDex(code, collection.name);
  }, [code, collection.name]);

  const canEdit = !!pin;
  const settings = collection.settings;
  const claimedCount = Object.keys(collection.pokemon).length;
  const total = sprites.length;
  const guessAccuracy =
    collection.stats.guessAttempts > 0
      ? Math.round((collection.stats.guessCorrect / collection.stats.guessAttempts) * 100)
      : null;

  const visible = useMemo(() => {
    const claimedSet = new Set(Object.keys(collection.pokemon));
    let list = sprites.filter((s) => {
      const claimed = claimedSet.has(s.slug);
      const entry = collection.pokemon[s.slug];
      if (settings.filter === "claimed" && !claimed) return false;
      if (settings.filter === "unclaimed" && claimed) return false;
      if (settings.filter === "favorites" && (!claimed || !entry?.favorite)) return false;
      if (settings.filterType) {
        const types = entry?.types ?? [];
        if (!types.includes(settings.filterType)) return false;
      }
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const customName = (entry?.name ?? "").toLowerCase();
        if (
          !s.slug.includes(q) &&
          !s.displayName.toLowerCase().includes(q) &&
          !customName.includes(q)
        ) {
          return false;
        }
      }
      return true;
    });

    if (settings.sort === "alpha") {
      list = list.slice().sort((a, b) => {
        const an = collection.pokemon[a.slug]?.name || a.displayName;
        const bn = collection.pokemon[b.slug]?.name || b.displayName;
        return an.localeCompare(bn);
      });
    } else if (settings.sort === "claimed-first") {
      list = list.slice().sort((a, b) => {
        const ac = !!collection.pokemon[a.slug];
        const bc = !!collection.pokemon[b.slug];
        if (ac !== bc) return ac ? -1 : 1;
        return a.idx - b.idx;
      });
    } else if (settings.sort === "claimed-recent") {
      list = list.slice().sort((a, b) => {
        const ai = collection.pokemon[a.slug]?.claimedAt ?? "";
        const bi = collection.pokemon[b.slug]?.claimedAt ?? "";
        return bi.localeCompare(ai);
      });
    } else if (settings.sort === "type") {
      list = list.slice().sort((a, b) => {
        const at = collection.pokemon[a.slug]?.types[0] ?? "zzz";
        const bt = collection.pokemon[b.slug]?.types[0] ?? "zzz";
        return at.localeCompare(bt) || a.idx - b.idx;
      });
    } else if (settings.sort === "shuffle") {
      list = list.slice().sort((a, b) => {
        const ha = (a.idx * 2654435761 + shuffleSeed) % 100000;
        const hb = (b.idx * 2654435761 + shuffleSeed) % 100000;
        return ha - hb;
      });
    }

    return list;
  }, [collection.pokemon, sprites, settings, search, shuffleSeed]);

  const updateSettingsLocal = useCallback(
    (patch: Partial<CollectionSettings>) => {
      setCollection((c) => ({ ...c, settings: { ...c.settings, ...patch } }));
    },
    []
  );

  const updateSettings = useCallback(
    async (patch: Partial<CollectionSettings>) => {
      updateSettingsLocal(patch);
      if (!pin) return;
      try {
        await fetch(`/api/collection/${code}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pin, settings: patch }),
        });
      } catch (e) {
        console.warn("settings save failed", e);
      }
    },
    [pin, code, updateSettingsLocal]
  );

  const savePokemon = useCallback(
    async (slug: string, patch: Partial<PokemonEntry>, guess?: { correct: boolean | null }) => {
      if (!pin) throw new Error("locked");
      const wasClaimed = !!collection.pokemon[slug];
      const optimistic: PokemonEntry = {
        name: patch.name ?? collection.pokemon[slug]?.name ?? "",
        types: patch.types ?? collection.pokemon[slug]?.types ?? [],
        description: patch.description ?? collection.pokemon[slug]?.description ?? "",
        favorite: patch.favorite ?? collection.pokemon[slug]?.favorite ?? false,
        shiny: patch.shiny ?? collection.pokemon[slug]?.shiny ?? false,
        stats: patch.stats ?? collection.pokemon[slug]?.stats ?? { hp: 50, atk: 50, def: 50, spd: 50 },
        claimedAt: collection.pokemon[slug]?.claimedAt ?? new Date().toISOString(),
        guessedTypeCorrect: guess?.correct ?? collection.pokemon[slug]?.guessedTypeCorrect ?? null,
      };
      setCollection((c) => ({
        ...c,
        pokemon: { ...c.pokemon, [slug]: optimistic },
        stats: {
          ...c.stats,
          claimed: wasClaimed ? c.stats.claimed : c.stats.claimed + 1,
          guessAttempts: guess ? c.stats.guessAttempts + 1 : c.stats.guessAttempts,
          guessCorrect:
            guess && guess.correct ? c.stats.guessCorrect + 1 : c.stats.guessCorrect,
        },
      }));

      const res = await fetch(`/api/collection/${code}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pin,
          pokemonUpserts: { [slug]: { ...patch, guessedTypeCorrect: guess?.correct ?? null } },
          bumpGuess: guess ? { correct: !!guess.correct } : null,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (res.status === 401) {
          sessionStorage.removeItem(`pin:${code}`);
          setPin(null);
        }
        throw new Error(data.error || "save failed");
      }
      const data = await res.json();
      if (data.collection) setCollection(data.collection);
    },
    [pin, code, collection.pokemon]
  );

  const releasePokemon = useCallback(
    async (slug: string) => {
      if (!pin) throw new Error("locked");
      setCollection((c) => {
        const next = { ...c.pokemon };
        delete next[slug];
        return {
          ...c,
          pokemon: next,
          stats: { ...c.stats, claimed: Math.max(0, c.stats.claimed - 1) },
        };
      });
      const res = await fetch(`/api/collection/${code}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin, pokemonDeletes: [slug] }),
      });
      if (!res.ok) throw new Error("release failed");
    },
    [pin, code]
  );

  const saveName = useCallback(async () => {
    const next = nameDraft.trim();
    if (!next || next === collection.name) {
      setEditingName(false);
      setNameDraft(collection.name);
      return;
    }
    setCollection((c) => ({ ...c, name: next }));
    setEditingName(false);
    if (!pin) return;
    try {
      await fetch(`/api/collection/${code}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin, name: next }),
      });
    } catch (e) {
      console.warn("name save failed", e);
    }
  }, [nameDraft, collection.name, pin, code]);

  function onCardClick(slug: string) {
    const isClaimed = !!collection.pokemon[slug];
    if (canEdit && !isClaimed && settings.guessMode) {
      setShowGuessFor(slug);
    } else {
      setOpenSlug(slug);
    }
  }

  function handleGuessContinue(slug: string, result: { guess: PokemonType[]; correct: boolean | null }) {
    setShowGuessFor(null);
    setPendingClaim({ slug, guess: result.guess, correct: result.correct });
    setOpenSlug(slug);
  }

  function handleGuessSkip() {
    if (showGuessFor) {
      setOpenSlug(showGuessFor);
    }
    setShowGuessFor(null);
  }

  function exportJson() {
    const blob = new Blob([JSON.stringify(collection, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `prokedeck-${code}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const openEntry = openSlug ? collection.pokemon[openSlug] : undefined;
  const openSprite = openSlug ? sprites.find((s) => s.slug === openSlug) : undefined;
  const guessSprite = showGuessFor ? sprites.find((s) => s.slug === showGuessFor) : undefined;

  return (
    <main className="min-h-screen pb-24">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-bg-deep/95 backdrop-blur-sm border-b-4 border-ink">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <button
              onClick={() => router.push("/")}
              className="dex-bezel px-3 py-2 flex items-center gap-2"
              aria-label="home"
            >
              <span className="font-display text-pixel-sm text-ink tracking-widest">
                prokedeck
              </span>
            </button>
            <div className="flex items-center min-w-0 gap-2">
              {editingName && canEdit ? (
                <input
                  autoFocus
                  className="pixel-input font-display text-pixel-base !py-1"
                  value={nameDraft}
                  maxLength={32}
                  onChange={(e) => setNameDraft(e.target.value)}
                  onBlur={saveName}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveName();
                    if (e.key === "Escape") {
                      setEditingName(false);
                      setNameDraft(collection.name);
                    }
                  }}
                />
              ) : (
                <h1
                  className={`font-display text-pixel-base text-ink truncate ${canEdit ? "cursor-pointer hover:text-accent-yellow" : ""}`}
                  onClick={() => canEdit && setEditingName(true)}
                  title={canEdit ? "click to rename" : ""}
                >
                  {collection.name}
                </h1>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="lcd-screen h-10 px-3 flex items-center gap-2 shrink-0">
              <span className="font-display text-pixel-sm text-accent-green">
                {claimedCount}
              </span>
              <span className="font-display text-pixel-xs text-ink-dim">/</span>
              <span className="font-display text-pixel-sm text-ink-dim">{total}</span>
              {guessAccuracy !== null && (
                <>
                  <span className="text-ink-mute mx-1">·</span>
                  <span className="font-display text-pixel-sm text-accent-yellow" title="guess accuracy">
                    {guessAccuracy}%
                  </span>
                </>
              )}
            </div>

            <button
              onClick={() => setShowRoller(true)}
              className="pixel-btn !h-10 !w-10 !p-0 inline-flex items-center justify-center"
              title="random"
              aria-label="random"
            >
              <IconDice className="w-5 h-5" />
            </button>

            <button
              onClick={() => setShowSettings(true)}
              className="pixel-btn !h-10 !w-10 !p-0 inline-flex items-center justify-center"
              title="settings"
              aria-label="settings"
            >
              <IconGear className="w-5 h-5" />
            </button>

            {canEdit ? (
              <button
                onClick={() => {
                  sessionStorage.removeItem(`pin:${code}`);
                  setPin(null);
                }}
                className="pixel-btn pixel-btn-yellow !h-10 !py-0 !px-3 inline-flex items-center gap-1.5"
                title="lock editing"
              >
                <IconCheck className="w-3 h-3" /> EDIT
              </button>
            ) : (
              <button
                onClick={() => setShowPinGate(true)}
                className="pixel-btn pixel-btn-primary !h-10 !py-0 !px-3 inline-flex items-center gap-1.5"
              >
                <IconLock className="w-3 h-3.5" /> UNLOCK
              </button>
            )}
          </div>
        </div>

        {/* Search bar */}
        <div className="max-w-7xl mx-auto px-4 pb-3">
          <input
            type="text"
            placeholder="search by name, slug, or custom name..."
            className="pixel-input w-full"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </header>

      {/* Grid */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {visible.length === 0 ? (
          <div className="text-center py-20 flex flex-col items-center gap-4">
            <div className="font-display text-pixel-xl text-ink-mute">EMPTY</div>
            <p className="font-body text-pixel-lg text-ink-dim">
              no pokemon match these filters.
            </p>
            <button
              onClick={() => {
                setSearch("");
                updateSettingsLocal({ filter: "all", filterType: null });
              }}
              className="pixel-btn"
            >
              CLEAR FILTERS
            </button>
          </div>
        ) : (
          <div
            className={`grid gap-3 ${
              settings.density === "compact"
                ? "grid-cols-[repeat(auto-fill,minmax(110px,1fr))]"
                : "grid-cols-[repeat(auto-fill,minmax(150px,1fr))]"
            }`}
          >
            {visible.map((s) => (
              <PokemonCard
                key={s.slug}
                slug={s.slug}
                file={s.file}
                displayName={s.displayName}
                idx={s.idx}
                entry={collection.pokemon[s.slug]}
                silhouette={settings.silhouette}
                density={settings.density}
                onClick={() => onCardClick(s.slug)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {showPinGate && (
        <PinGate
          code={code}
          onSuccess={(p) => {
            setPin(p);
            setShowPinGate(false);
          }}
          onClose={() => setShowPinGate(false)}
        />
      )}

      {showGuessFor && guessSprite && (
        <TypeGuessOverlay
          slug={guessSprite.slug}
          file={guessSprite.file}
          displayName={guessSprite.displayName}
          onContinue={(r) => handleGuessContinue(guessSprite.slug, r)}
          onSkip={handleGuessSkip}
          onClose={() => setShowGuessFor(null)}
        />
      )}

      {openSlug && openSprite && (
        <EditModal
          slug={openSprite.slug}
          file={openSprite.file}
          displayName={openSprite.displayName}
          idx={openSprite.idx}
          entry={openEntry}
          canEdit={canEdit}
          initialTypes={
            pendingClaim && pendingClaim.slug === openSprite.slug ? pendingClaim.guess : undefined
          }
          onSave={async (patch) => {
            const guess =
              pendingClaim && pendingClaim.slug === openSprite.slug
                ? { correct: pendingClaim.correct }
                : undefined;
            await savePokemon(openSprite.slug, patch, guess);
            setPendingClaim(null);
          }}
          onRelease={async () => {
            await releasePokemon(openSprite.slug);
          }}
          onClose={() => {
            setOpenSlug(null);
            setPendingClaim(null);
          }}
        />
      )}

      {showSettings && (
        <SettingsPanel
          settings={settings}
          onChange={updateSettings}
          onExport={exportJson}
          onClose={() => setShowSettings(false)}
          canEdit={canEdit}
        />
      )}

      {showRoller && (
        <RandomRoller
          sprites={sprites}
          pool={sprites.filter((s) => !collection.pokemon[s.slug])}
          onPick={(s) => {
            setShowRoller(false);
            onCardClick(s.slug);
          }}
          onClose={() => setShowRoller(false)}
        />
      )}
    </main>
  );
}
