"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  code: string;
  onSuccess: (pin: string) => void;
  onClose: () => void;
}

export function PinGate({ code, onSuccess, onClose }: Props) {
  const [pin, setPin] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    ref.current?.focus();
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\d{4}$/.test(pin)) {
      setErr("4 digits");
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch(`/api/collection/${code}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        setErr(data.error || "wrong pin");
        setPin("");
        setBusy(false);
        return;
      }
      sessionStorage.setItem(`pin:${code}`, pin);
      onSuccess(pin);
    } catch {
      setErr("network error");
      setBusy(false);
    }
  }

  return (
    <Backdrop onClose={onClose}>
      <form onSubmit={submit} onClick={(e) => e.stopPropagation()} className="pixel-card p-8 max-w-sm w-full flex flex-col gap-5">
        <div className="text-center flex flex-col gap-1">
          <div className="font-display text-pixel-lg text-accent-yellow">UNLOCK</div>
          <p className="font-body text-pixel-base text-ink-dim">enter pin to edit this dex</p>
        </div>

        <input
          ref={ref}
          type="text"
          inputMode="numeric"
          pattern="\d*"
          maxLength={4}
          placeholder="• • • •"
          className="pixel-input tracking-[0.5em] text-center font-display text-pixel-xl"
          value={pin}
          onChange={(e) => {
            setErr(null);
            setPin(e.target.value.replace(/\D/g, "").slice(0, 4));
          }}
        />

        {err && (
          <p className="font-display text-pixel-xs text-accent-red text-stroke-sm text-center">{err}</p>
        )}

        <div className="flex gap-3">
          <button type="button" onClick={onClose} className="pixel-btn flex-1">CLOSE</button>
          <button type="submit" disabled={busy || pin.length !== 4} className="pixel-btn pixel-btn-yellow flex-1">
            {busy ? "..." : "UNLOCK"}
          </button>
        </div>
      </form>
    </Backdrop>
  );
}

export function Backdrop({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-bg-deep/90 backdrop-blur-sm flex items-center justify-center p-4"
      style={{ backgroundImage: "repeating-linear-gradient(0deg, transparent 0, transparent 3px, rgba(0,0,0,0.2) 3px, rgba(0,0,0,0.2) 4px)" }}
    >
      {children}
    </div>
  );
}
