"use client";

import { POKEMON_TYPES, type PokemonType } from "@/lib/types";
import { TypePill } from "./TypePill";

interface Props {
  selected: PokemonType[];
  onChange: (next: PokemonType[]) => void;
  max?: number;
}

export function TypePicker({ selected, onChange, max = 2 }: Props) {
  function toggle(t: PokemonType) {
    if (selected.includes(t)) {
      onChange(selected.filter((x) => x !== t));
    } else {
      if (selected.length >= max) {
        // replace the oldest
        onChange([...selected.slice(1), t]);
      } else {
        onChange([...selected, t]);
      }
    }
  }

  return (
    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
      {POKEMON_TYPES.map((t) => (
        <TypePill
          key={t}
          type={t}
          size="sm"
          selected={selected.includes(t)}
          onClick={() => toggle(t)}
        />
      ))}
    </div>
  );
}
