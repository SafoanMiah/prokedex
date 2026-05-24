"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { slugify, SLUG_MAX, SLUG_MIN } from "@/lib/auth-shared";
import { forgetDex, getRecent, rememberDex, type RecentDex } from "@/lib/recent-dexes";

type Mode = "menu" | "create" | "load";

export function LandingClient({ spriteCount }: { spriteCount: number }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("menu");
  const [recent, setRecent] = useState<RecentDex[]>([]);

  useEffect(() => {
    setRecent(getRecent());
  }, []);

  function navigate(slug: string, name: string) {
    rememberDex(slug, name);
    router.push(`/c/${slug}`);
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
      <div className="absolute inset-0 opacity-20 pointer-events-none scanline" />

      <div className="w-full max-w-2xl flex flex-col items-center gap-8 relative z-10">
        <Logo />

        <p className="font-display text-pixel-base text-ink-dim text-center max-w-md">
          claim, name, and customize a personal pokedex.
          <br />
          <span className="text-accent-yellow">{spriteCount}</span> sprites.{" "}
          <span className="text-accent-red">1</span> dex per name.
        </p>

        <div className="w-full max-w-md mt-4 flex flex-col gap-5">
          {mode === "menu" && (
            <>
              <Menu setMode={setMode} hasRecent={recent.length > 0} />
              {recent.length > 0 && (
                <RecentList
                  recent={recent}
                  onOpen={(d) => navigate(d.slug, d.name)}
                  onForget={(slug) => {
                    forgetDex(slug);
                    setRecent(getRecent());
                  }}
                />
              )}
            </>
          )}
          {mode === "create" && (
            <CreateForm
              onBack={() => setMode("menu")}
              onCreated={(slug, name) => navigate(slug, name)}
            />
          )}
          {mode === "load" && (
            <LoadForm
              recent={recent}
              onBack={() => setMode("menu")}
              onLoad={(slug, name) => navigate(slug, name)}
              onForget={(slug) => {
                forgetDex(slug);
                setRecent(getRecent());
              }}
            />
          )}
        </div>

        <Footer />
      </div>
    </main>
  );
}

function Logo() {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="dex-bezel px-6 py-4 inline-flex items-center gap-4">
        <h1 className="font-display text-pixel-2xl tracking-widest text-ink text-stroke">
          prokedeck
        </h1>
        <div className="flex gap-1">
          <div className="w-2 h-2 bg-accent-yellow shadow-pixel-sm" />
          <div className="w-2 h-2 bg-accent-green shadow-pixel-sm" />
        </div>
      </div>
    </div>
  );
}

function Menu({ setMode, hasRecent }: { setMode: (m: Mode) => void; hasRecent: boolean }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <button
        onClick={() => setMode("create")}
        className="pixel-btn pixel-btn-primary flex-col gap-2 h-32"
      >
        <span className="text-pixel-xl">+</span>
        <span>NEW DEX</span>
      </button>
      <button onClick={() => setMode("load")} className="pixel-btn flex-col gap-2 h-32">
        <span className="text-pixel-xl">↓</span>
        <span>{hasRecent ? "OPEN MINE" : "LOAD DEX"}</span>
      </button>
    </div>
  );
}

function RecentList({
  recent,
  onOpen,
  onForget,
}: {
  recent: RecentDex[];
  onOpen: (d: RecentDex) => void;
  onForget: (slug: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="font-display text-pixel-xs uppercase tracking-wider text-ink-dim px-1">
        on this device
      </div>
      <ul className="flex flex-col gap-2">
        {recent.slice(0, 5).map((d) => (
          <li key={d.slug} className="pixel-card flex items-center gap-3 p-3">
            <button
              onClick={() => onOpen(d)}
              className="flex-1 text-left flex flex-col gap-1"
            >
              <span className="font-display text-pixel-sm text-ink truncate">{d.name}</span>
              <span className="font-body text-pixel-base text-ink-mute truncate">
                /c/{d.slug}
              </span>
            </button>
            <button
              onClick={() => onForget(d.slug)}
              className="font-display text-pixel-xs text-ink-mute hover:text-accent-red px-2"
              title="forget this dex"
            >
              ✕
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function CreateForm({
  onBack,
  onCreated,
}: {
  onBack: () => void;
  onCreated: (slug: string, name: string) => void;
}) {
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const slug = slugify(name);
  const slugValid = slug.length >= SLUG_MIN && slug.length <= SLUG_MAX;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!name.trim()) return setErr("pick a name");
    if (!slugValid) return setErr(`name must produce a ${SLUG_MIN}-${SLUG_MAX} char url`);
    if (!/^\d{4}$/.test(pin)) return setErr("pin must be 4 digits");
    if (pin !== confirm) return setErr("pins don't match");
    setBusy(true);
    try {
      const res = await fetch("/api/collection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), pin }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "something went wrong");
      sessionStorage.setItem(`pin:${data.slug}`, pin);
      onCreated(data.slug, data.name);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "failed");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-5 pixel-card p-6">
      <h2 className="font-display text-pixel-lg text-accent-red">NEW DEX</h2>

      <Field label="dex name" help={name && (slugValid ? `→ /c/${slug}` : "too short or all symbols")}>
        <input
          autoFocus
          maxLength={32}
          placeholder="my collection"
          className="pixel-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </Field>

      <Field label="4-digit pin">
        <input
          type="text"
          inputMode="numeric"
          pattern="\d*"
          maxLength={4}
          placeholder="• • • •"
          className="pixel-input tracking-[0.5em] text-center"
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
        />
      </Field>

      <Field label="confirm pin">
        <input
          type="text"
          inputMode="numeric"
          pattern="\d*"
          maxLength={4}
          placeholder="• • • •"
          className="pixel-input tracking-[0.5em] text-center"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value.replace(/\D/g, "").slice(0, 4))}
        />
      </Field>

      {err && <p className="font-display text-pixel-xs text-accent-red text-stroke-sm">{err}</p>}

      <div className="flex gap-3 mt-2">
        <button type="button" onClick={onBack} className="pixel-btn flex-1">
          BACK
        </button>
        <button type="submit" disabled={busy} className="pixel-btn pixel-btn-yellow flex-1">
          {busy ? "..." : "CREATE"}
        </button>
      </div>
    </form>
  );
}

function LoadForm({
  recent,
  onBack,
  onLoad,
  onForget,
}: {
  recent: RecentDex[];
  onBack: () => void;
  onLoad: (slug: string, name: string) => void;
  onForget: (slug: string) => void;
}) {
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const slug = slugify(name);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!name.trim()) return setErr("enter the dex name");
    if (!/^\d{4}$/.test(pin)) return setErr("id must be 4 digits");
    setBusy(true);
    try {
      const res = await fetch(`/api/collection/${slug}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 404) {
        setErr("no dex by that name");
        setBusy(false);
        return;
      }
      if (!res.ok || !data.ok) {
        setErr(data.error || "wrong id");
        setBusy(false);
        return;
      }
      const readRes = await fetch(`/api/collection/${slug}`);
      const readData = await readRes.json().catch(() => ({}));
      const display = readData?.collection?.name ?? name.trim();
      sessionStorage.setItem(`pin:${slug}`, pin);
      onLoad(slug, display);
    } catch {
      setErr("network error");
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {recent.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="font-display text-pixel-xs uppercase tracking-wider text-ink-dim px-1">
            recent
          </div>
          <ul className="flex flex-col gap-2">
            {recent.slice(0, 5).map((d) => (
              <li key={d.slug} className="pixel-card flex items-center gap-3 p-3">
                <button
                  onClick={() => onLoad(d.slug, d.name)}
                  className="flex-1 text-left flex flex-col gap-1"
                >
                  <span className="font-display text-pixel-sm text-ink truncate">{d.name}</span>
                  <span className="font-body text-pixel-base text-ink-mute truncate">
                    /c/{d.slug}
                  </span>
                </button>
                <button
                  onClick={() => onForget(d.slug)}
                  className="font-display text-pixel-xs text-ink-mute hover:text-accent-red px-2"
                  title="forget"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <form onSubmit={submit} className="flex flex-col gap-5 pixel-card p-6">
        <h2 className="font-display text-pixel-lg text-accent-yellow">
          {recent.length > 0 ? "OR ENTER MANUALLY" : "LOAD DEX"}
        </h2>

        <Field label="dex name" help={name && slug ? `→ /c/${slug}` : undefined}>
          <input
            autoFocus
            maxLength={32}
            placeholder="my collection"
            className="pixel-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </Field>

        <Field label="4-digit id">
          <input
            type="text"
            inputMode="numeric"
            pattern="\d*"
            maxLength={4}
            placeholder="• • • •"
            className="pixel-input tracking-[0.5em] text-center"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
          />
        </Field>

        {err && <p className="font-display text-pixel-xs text-accent-red text-stroke-sm">{err}</p>}

        <div className="flex gap-3 mt-2">
          <button type="button" onClick={onBack} className="pixel-btn flex-1">
            BACK
          </button>
          <button type="submit" disabled={busy} className="pixel-btn pixel-btn-yellow flex-1">
            {busy ? "..." : "OPEN"}
          </button>
        </div>

        <p className="font-body text-pixel-base text-ink-mute text-center">
          anyone can view a dex by its url.
          <br />
          editing needs the 4-digit id.
        </p>
      </form>
    </div>
  );
}

function Field({
  label,
  help,
  children,
}: {
  label: string;
  help?: string | false | null;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="flex items-baseline justify-between gap-2">
        <span className="font-display text-pixel-xs uppercase tracking-wider text-ink-dim">
          {label}
        </span>
        {help && (
          <span className="font-body text-pixel-base text-ink-mute truncate">{help}</span>
        )}
      </span>
      {children}
    </label>
  );
}

function Footer() {
  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <div className="flex gap-1">
        {Array.from({ length: 18 }).map((_, i) => (
          <div
            key={i}
            className="w-1.5 h-1.5"
            style={{
              backgroundColor: [
                "#A8A77A","#EE8130","#6390F0","#F7D02C","#7AC74C","#96D9D6",
                "#C22E28","#A33EA1","#E2BF65","#A98FF3","#F95587","#A6B91A",
                "#B6A136","#735797","#6F35FC","#705746","#B7B7CE","#D685AD",
              ][i],
            }}
          />
        ))}
      </div>
    </div>
  );
}
