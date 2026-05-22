import { NextResponse } from "next/server";
import { readStore, writeStore } from "@/lib/jsonbin";
import {
  generateSalt,
  hashPin,
  isValidPin,
  isValidSlug,
  slugify,
  SLUG_MIN,
  SLUG_MAX,
} from "@/lib/auth";
import { getClientIp, rateLimit, LIMITS } from "@/lib/rate-limit";
import { DEFAULT_SETTINGS, type Collection } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const ip = getClientIp(req, req.headers);
  const limit = rateLimit(`create:${ip}`, LIMITS.create.count, LIMITS.create.windowMs);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "slow down — too many new dexes too fast" },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } }
    );
  }

  const body = (await req.json().catch(() => null)) as { name?: unknown; pin?: unknown } | null;
  if (!body) return NextResponse.json({ error: "bad json" }, { status: 400 });

  const rawName = typeof body.name === "string" ? body.name.trim().slice(0, 32) : "";
  if (!rawName) return NextResponse.json({ error: "name required" }, { status: 400 });

  const slug = slugify(rawName);
  if (!isValidSlug(slug)) {
    return NextResponse.json(
      {
        error: `name must produce ${SLUG_MIN}-${SLUG_MAX} url-safe characters (letters, numbers, spaces)`,
      },
      { status: 400 }
    );
  }

  if (!isValidPin(body.pin)) {
    return NextResponse.json({ error: "pin must be exactly 4 digits" }, { status: 400 });
  }

  const store = await readStore({ fresh: true });

  if (store.collections[slug]) {
    return NextResponse.json(
      { error: "name is taken — try a variation" },
      { status: 409 }
    );
  }

  const salt = generateSalt();
  const pinHash = hashPin(body.pin, salt);
  const now = new Date().toISOString();

  const collection: Collection = {
    name: rawName,
    pinHash,
    salt,
    createdAt: now,
    updatedAt: now,
    pokemon: {},
    settings: { ...DEFAULT_SETTINGS },
    stats: { claimed: 0, guessAttempts: 0, guessCorrect: 0 },
  };

  store.collections[slug] = collection;
  await writeStore(store);

  return NextResponse.json({ slug, name: rawName });
}
