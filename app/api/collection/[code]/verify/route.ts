import { NextResponse } from "next/server";
import { readStore } from "@/lib/jsonbin";
import { isValidCode, isValidPin, verifyPin } from "@/lib/auth";
import { getClientIp, rateLimit, LIMITS } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(
  req: Request,
  ctx: { params: Promise<{ code: string }> }
) {
  const { code } = await ctx.params;
  const ip = getClientIp(req, req.headers);

  const limit = rateLimit(`verify:${ip}:${code}`, LIMITS.verify.count, LIMITS.verify.windowMs);
  if (!limit.ok) {
    return NextResponse.json(
      { error: `Too many tries. Wait ${limit.retryAfterSec}s.` },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } }
    );
  }

  if (!isValidCode(code)) return NextResponse.json({ error: "Invalid code" }, { status: 400 });

  const body = (await req.json().catch(() => null)) as { pin?: unknown } | null;
  if (!body || !isValidPin(body.pin)) {
    return NextResponse.json({ error: "PIN must be 4 digits" }, { status: 400 });
  }

  const store = await readStore();
  const coll = store.collections[code];
  if (!coll) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const ok = verifyPin(body.pin, coll.salt, coll.pinHash);
  return NextResponse.json({ ok }, { status: ok ? 200 : 401 });
}
