"use client";

import { useEffect, useState } from "react";
import { POKEMON_TYPES, type PokemonType } from "@/lib/types";
import { TypePill } from "./TypePill";
import { Backdrop } from "./PinGate";

interface Props {
  slug: string;
  file: string;
  displayName: string;
  onContinue: (result: { guess: PokemonType[]; correct: boolean | null; realTypes: PokemonType[] | null }) => void;
  onSkip: () => void;
  onClose: () => void;
}

export function TypeGuessOverlay({ slug, file, displayName, onContinue, onSkip, onClose }: Props) {
  const [guess, setGuess] = useState<PokemonType[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [realTypes, setRealTypes] = useState<PokemonType[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function submit() {
    if (guess.length === 0) return;
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${slug}`);
      if (!res.ok) {
        // PokeAPI doesn't have this exact slug — skip scoring, continue
        setSubmitted(true);
        setLoading(false);
        return;
      }
      const data = await res.json();
      const types: PokemonType[] = (data.types || [])
        .map((t: { type: { name: string } }) => t.type.name)
        .filter((n: string) => (POKEMON_TYPES as readonly string[]).includes(n));
      setRealTypes(types);
      setSubmitted(true);
    } catch {
      setErr("could not check — continuing anyway");
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  }

  function toggleGuess(t: PokemonType) {
    if (submitted) return;
    if (guess.includes(t)) {
      setGuess(guess.filter((x) => x !== t));
    } else if (guess.length < 2) {
      setGuess([...guess, t]);
    } else {
      setGuess([guess[1]!, t]);
    }
  }

  const correct = (() => {
    if (!submitted || realTypes === null) return null;
    if (guess.length === 0) return false;
    const setReal = new Set(realTypes);
    return guess.every((t) => setReal.has(t));
  })();

  function handleContinue() {
    onContinue({ guess, correct, realTypes });
  }

  return (
    <Backdrop onClose={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="pixel-card max-w-xl w-full max-h-[90vh] overflow-y-auto flex flex-col"
      >
        <div className="lcd-screen scanline p-6 flex flex-col items-center gap-2">
          <div className="font-display text-pixel-base text-accent-yellow">WHO'S THAT POKEMON?</div>
          <img
            src={`/sprites/${file}`}
            alt=""
            className={`sprite h-32 ${!submitted ? "silhouette" : ""}`}
            style={{ imageRendering: "pixelated" }}
          />
          <div className="font-display text-pixel-sm text-ink">{submitted ? displayName : "???"}</div>
        </div>

        <div className="p-5 flex flex-col gap-4">
          <p className="font-body text-pixel-lg text-ink-dim text-center">
            {submitted ? "result" : "guess the real type (or two)"}
          </p>

          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {POKEMON_TYPES.map((t) => (
              <TypePill
                key={t}
                type={t}
                size="sm"
                selected={guess.includes(t)}
                onClick={() => toggleGuess(t)}
                disabled={submitted}
              />
            ))}
          </div>

          {submitted && realTypes && (
            <div className="flex flex-col gap-2 items-center pt-2 border-t-2 border-bg-deep">
              <div className="font-display text-pixel-sm" style={{ color: correct ? "#4ade80" : "#ee1515" }}>
                {correct ? "★ NICE GUESS ★" : "NOT QUITE"}
              </div>
              <div className="font-body text-pixel-base text-ink-dim">real type:</div>
              <div className="flex gap-2 flex-wrap justify-center">
                {realTypes.map((t) => (
                  <TypePill key={t} type={t} size="sm" />
                ))}
              </div>
            </div>
          )}

          {submitted && !realTypes && (
            <p className="font-body text-pixel-base text-ink-mute text-center">
              {err ?? "no real-type data for this one. continue?"}
            </p>
          )}

          <div className="flex gap-3 mt-2">
            <button onClick={onSkip} className="pixel-btn flex-1">
              SKIP
            </button>
            {!submitted ? (
              <button
                onClick={submit}
                disabled={guess.length === 0 || loading}
                className="pixel-btn pixel-btn-yellow flex-1"
              >
                {loading ? "..." : "GUESS"}
              </button>
            ) : (
              <button onClick={handleContinue} className="pixel-btn pixel-btn-yellow flex-1">
                CLAIM →
              </button>
            )}
          </div>
        </div>
      </div>
    </Backdrop>
  );
}
