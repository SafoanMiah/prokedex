import "server-only";
import type { StorageShape } from "./types";

const BASE = "https://api.jsonbin.io/v3";

function env() {
  const masterKey = process.env.JSONBIN_MASTER_KEY;
  const binId = process.env.JSONBIN_BIN_ID;
  if (!masterKey) throw new Error("JSONBIN_MASTER_KEY not set");
  if (!binId) throw new Error("JSONBIN_BIN_ID not set");
  return { masterKey, binId };
}

type CacheSlot = { data: StorageShape; ts: number } | null;
let cache: CacheSlot = null;
const CACHE_MS = 5_000;

export async function readStore(opts: { fresh?: boolean } = {}): Promise<StorageShape> {
  if (!opts.fresh && cache && Date.now() - cache.ts < CACHE_MS) {
    return cache.data;
  }

  const { masterKey, binId } = env();
  const res = await fetch(`${BASE}/b/${binId}/latest`, {
    headers: { "X-Master-Key": masterKey, "X-Bin-Meta": "false" },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`JSONBin read failed: ${res.status} ${await res.text()}`);
  }

  const data = (await res.json()) as StorageShape;
  cache = { data, ts: Date.now() };
  return data;
}

export async function writeStore(next: StorageShape): Promise<void> {
  const { masterKey, binId } = env();
  const res = await fetch(`${BASE}/b/${binId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "X-Master-Key": masterKey,
    },
    body: JSON.stringify(next),
  });

  if (!res.ok) {
    throw new Error(`JSONBin write failed: ${res.status} ${await res.text()}`);
  }

  cache = { data: next, ts: Date.now() };
}

export function invalidateCache() {
  cache = null;
}
