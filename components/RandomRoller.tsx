"use client";

import { useEffect, useRef, useState } from "react";
import { Backdrop } from "./PinGate";
import type { SpriteEntry } from "@/lib/pokemon-index.generated";

interface Props {
  sprites: SpriteEntry[];
  pool: SpriteEntry[];
  onPick: (sprite: SpriteEntry) => void;
  onClose: () => void;
}

export function RandomRoller({ sprites, pool, onPick, onClose }: Props) {
  const [current, setCurrent] = useState<SpriteEntry | null>(null);
  const [stopped, setStopped] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const drawPool = pool.length > 0 ? pool : sprites;

  useEffect(() => {
    let delay = 50;
    let elapsed = 0;
    const stopAt = 2000;

    function tick() {
      const pick = drawPool[Math.floor(Math.random() * drawPool.length)]!;
      setCurrent(pick);
      elapsed += delay;
      if (elapsed >= stopAt) {
        setStopped(true);
        return;
      }
      delay = Math.min(400, delay * 1.18);
      timerRef.current = setTimeout(tick, delay);
    }

    tick();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [drawPool]);

  function reroll() {
    setStopped(false);
    setCurrent(null);
    let delay = 50;
    let elapsed = 0;
    const stopAt = 1500;
    function tick() {
      const pick = drawPool[Math.floor(Math.random() * drawPool.length)]!;
      setCurrent(pick);
      elapsed += delay;
      if (elapsed >= stopAt) {
        setStopped(true);
        return;
      }
      delay = Math.min(400, delay * 1.2);
      timerRef.current = setTimeout(tick, delay);
    }
    tick();
  }

  return (
    <Backdrop onClose={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="pixel-card max-w-md w-full flex flex-col"
      >
        <div className="lcd-screen scanline p-8 flex flex-col items-center gap-4 relative min-h-[280px] justify-center">
          <div className="font-display text-pixel-base text-accent-yellow absolute top-3">
            {stopped ? "★ YOUR PICK ★" : "ROLLING..."}
          </div>
          {current && (
            <img
              src={`/sprites/${current.file}`}
              alt=""
              className={`sprite h-32 ${!stopped ? "animate-pixel-bounce" : ""}`}
              style={{ imageRendering: "pixelated" }}
            />
          )}
          {stopped && current && (
            <div className="font-display text-pixel-lg text-ink uppercase">
              {current.displayName}
            </div>
          )}
        </div>

        <div className="p-4 flex gap-3">
          <button onClick={onClose} className="pixel-btn flex-1" disabled={!stopped}>
            CLOSE
          </button>
          <button onClick={reroll} disabled={!stopped} className="pixel-btn flex-1">
            REROLL
          </button>
          <button
            onClick={() => current && onPick(current)}
            disabled={!stopped || !current}
            className="pixel-btn pixel-btn-yellow flex-1"
          >
            OPEN →
          </button>
        </div>
      </div>
    </Backdrop>
  );
}
