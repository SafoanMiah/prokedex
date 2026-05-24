import { NextResponse } from "next/server";
import { readStore, writeStore } from "@/lib/jsonbin";
import { isValidCode, isValidPin, verifyPin } from "@/lib/auth";
import { getClientIp, rateLimit, LIMITS } from "@/lib/rate-limit";
import {
  POKEMON_TYPES,
  type Collection,
  type CollectionPublic,
  type CollectionSettings,
  type PokemonEntry,
  type PokemonType,
} from "@/lib/types";
import { POKEMON_BY_SLUG } from "@/lib/pokemon-index.generated";

export const runtime = "nodejs";

function stripPrivate(c: Collection): CollectionPublic {
  const { pinHash: _ph, salt: _s, ...rest } = c;
  return rest;
}

export async function GET(
  req: Request,
  ctx: { params: Promise<{ code: string }> }
) {
  const { code } = await ctx.params;
  const ip = getClientIp(req, req.headers);
  const limit = rateLimit(`read:${ip}`, LIMITS.read.count, LIMITS.read.windowMs);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } }
    );
  }

  if (!isValidCode(code)) return NextResponse.json({ error: "Invalid code" }, { status: 400 });

  const store = await readStore();
  const coll = store.collections[code];
  if (!coll) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ slug: code, collection: stripPrivate(coll) });
}

interface PatchBody {
  pin?: unknown;
  name?: unknown;
  settings?: Partial<CollectionSettings>;
  pokemonUpserts?: Record<string, Partial<PokemonEntry>>;
  pokemonDeletes?: string[];
  bumpGuess?: { correct: boolean } | null;
}

function clampStat(n: unknown): number {
  const v = typeof n === "number" ? n : Number(n);
  if (!Number.isFinite(v)) return 50;
  return Math.max(1, Math.min(255, Math.round(v)));
}

function validateTypes(arr: unknown): PokemonType[] {
  if (!Array.isArray(arr)) return [];
  const seen = new Set<PokemonType>();
  for (const t of arr) {
    if (typeof t === "string" && (POKEMON_TYPES as readonly string[]).includes(t)) {
      seen.add(t as PokemonType);
      if (seen.size >= 2) break;
    }
  }
  return [...seen];
}

function sanitizeUpsert(prev: PokemonEntry | undefined, patch: Partial<PokemonEntry>): PokemonEntry {
  const now = new Date().toISOString();
  const base: PokemonEntry =
    prev ?? {
      name: "",
      types: [],
      description: "",
      favorite: false,
      shiny: false,
      stats: { hp: 50, atk: 50, def: 50, spd: 50 },
      claimedAt: now,
    };
  const next: PokemonEntry = {
    ...base,
    name: typeof patch.name === "string" ? patch.name.trim().slice(0, 24) : base.name,
    types: patch.types !== undefined ? validateTypes(patch.types) : base.types,
    description:
      typeof patch.description === "string" ? patch.description.slice(0, 280) : base.description,
    favorite: typeof patch.favorite === "boolean" ? patch.favorite : base.favorite,
    shiny: typeof patch.shiny === "boolean" ? patch.shiny : base.shiny,
    stats: patch.stats
      ? {
          hp: clampStat(patch.stats.hp ?? base.stats.hp),
          atk: clampStat(patch.stats.atk ?? base.stats.atk),
          def: clampStat(patch.stats.def ?? base.stats.def),
          spd: clampStat(patch.stats.spd ?? base.stats.spd),
        }
      : base.stats,
    claimedAt: base.claimedAt,
    guessedTypeCorrect:
      patch.guessedTypeCorrect === undefined ? base.guessedTypeCorrect : patch.guessedTypeCorrect,
  };
  return next;
}

function sanitizeSettings(prev: CollectionSettings, patch: Partial<CollectionSettings>): CollectionSettings {
  const next = { ...prev };
  if (typeof patch.silhouette === "boolean") next.silhouette = patch.silhouette;
  if (typeof patch.showNames === "boolean") next.showNames = patch.showNames;
  if (typeof patch.guessMode === "boolean") next.guessMode = patch.guessMode;
  if (patch.sort && ["dex", "alpha", "claimed-first", "claimed-recent", "type", "shuffle"].includes(patch.sort)) {
    next.sort = patch.sort;
  }
  if (patch.filter && ["all", "claimed", "unclaimed", "favorites"].includes(patch.filter)) {
    next.filter = patch.filter;
  }
  if (patch.filterType === null || (typeof patch.filterType === "string" && (POKEMON_TYPES as readonly string[]).includes(patch.filterType))) {
    next.filterType = patch.filterType as PokemonType | null;
  }
  if (patch.density && ["cozy", "compact"].includes(patch.density)) {
    next.density = patch.density;
  }
  return next;
}

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ code: string }> }
) {
  const { code } = await ctx.params;
  const ip = getClientIp(req, req.headers);
  const limit = rateLimit(`write:${ip}`, LIMITS.write.count, LIMITS.write.windowMs);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Slow down" },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } }
    );
  }

  if (!isValidCode(code)) return NextResponse.json({ error: "Invalid code" }, { status: 400 });

  const body = (await req.json().catch(() => null)) as PatchBody | null;
  if (!body) return NextResponse.json({ error: "Bad JSON" }, { status: 400 });

  if (!isValidPin(body.pin)) return NextResponse.json({ error: "PIN required" }, { status: 401 });

  const store = await readStore({ fresh: true });
  const coll = store.collections[code];
  if (!coll) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (!verifyPin(body.pin, coll.salt, coll.pinHash)) {
    return NextResponse.json({ error: "Wrong PIN" }, { status: 401 });
  }

  if (typeof body.name === "string") {
    const n = body.name.trim().slice(0, 32);
    if (n) coll.name = n;
  }

  if (body.settings) {
    coll.settings = sanitizeSettings(coll.settings, body.settings);
  }

  if (body.pokemonUpserts) {
    for (const [slug, patch] of Object.entries(body.pokemonUpserts)) {
      if (!POKEMON_BY_SLUG[slug]) continue;
      const wasClaimed = !!coll.pokemon[slug];
      coll.pokemon[slug] = sanitizeUpsert(coll.pokemon[slug], patch);
      if (!wasClaimed) coll.stats.claimed += 1;
    }
  }

  if (body.pokemonDeletes) {
    for (const slug of body.pokemonDeletes) {
      if (coll.pokemon[slug]) {
        delete coll.pokemon[slug];
        coll.stats.claimed = Math.max(0, coll.stats.claimed - 1);
      }
    }
  }

  if (body.bumpGuess) {
    coll.stats.guessAttempts += 1;
    if (body.bumpGuess.correct) coll.stats.guessCorrect += 1;
  }

  coll.updatedAt = new Date().toISOString();
  await writeStore(store);

  return NextResponse.json({ ok: true, collection: stripPrivate(coll) });
}
