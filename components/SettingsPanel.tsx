"use client";

import { useEffect, useRef } from "react";
import { POKEMON_TYPES, type CollectionSettings, type PokemonType } from "@/lib/types";
import { TypePill } from "./TypePill";

interface Props {
  settings: CollectionSettings;
  onChange: (patch: Partial<CollectionSettings>) => void;
  onExport: () => void;
  onImport: (file: File) => void;
  onClose: () => void;
  canEdit: boolean;
}

export function SettingsPanel({ settings, onChange, onExport, onImport, onClose, canEdit }: Props) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-40 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-bg-deep/70 backdrop-blur-sm" />
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-sm h-full overflow-y-auto bg-bg-panel border-l-4 border-ink p-5 flex flex-col gap-5"
        style={{ boxShadow: "-4px 0 0 0 #000" }}
      >
        <div className="flex items-center justify-between">
          <h2 className="font-display text-pixel-lg text-accent-yellow">SETTINGS</h2>
          <button onClick={onClose} className="pixel-btn">CLOSE</button>
        </div>

        <Section title="display">
          <ToggleRow
            label="show names"
            help="reveals the name under each sprite (spoils the guess)"
            value={settings.showNames}
            onChange={(v) => onChange({ showNames: v })}
            disabled={!canEdit}
          />
          <ToggleRow
            label="silhouette unclaimed"
            help="hide unclaimed pokemon as shadows"
            value={settings.silhouette}
            onChange={(v) => onChange({ silhouette: v })}
            disabled={!canEdit}
          />
          <ToggleRow
            label="type guess game"
            help="guess the real type before claiming"
            value={settings.guessMode}
            onChange={(v) => onChange({ guessMode: v })}
            disabled={!canEdit}
          />
          <SelectRow
            label="density"
            value={settings.density}
            options={[
              { value: "cozy", label: "cozy" },
              { value: "compact", label: "compact" },
            ]}
            onChange={(v) => onChange({ density: v as CollectionSettings["density"] })}
          />
        </Section>

        <Section title="sort & filter">
          <SelectRow
            label="sort by"
            value={settings.sort}
            options={[
              { value: "dex", label: "dex order" },
              { value: "alpha", label: "alphabetical" },
              { value: "claimed-first", label: "claimed first" },
              { value: "claimed-recent", label: "recently claimed" },
              { value: "type", label: "type" },
              { value: "shuffle", label: "shuffle" },
            ]}
            onChange={(v) => onChange({ sort: v as CollectionSettings["sort"] })}
          />
          <SelectRow
            label="filter"
            value={settings.filter}
            options={[
              { value: "all", label: "all" },
              { value: "claimed", label: "claimed" },
              { value: "unclaimed", label: "unclaimed" },
              { value: "favorites", label: "favorites" },
            ]}
            onChange={(v) => onChange({ filter: v as CollectionSettings["filter"] })}
          />

          <div className="flex flex-col gap-2">
            <span className="font-display text-pixel-xs uppercase tracking-wider text-ink-dim">
              filter type
            </span>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => onChange({ filterType: null })}
                className={`px-2 py-1 font-display text-pixel-xs ${settings.filterType === null ? "bg-accent-yellow text-bg" : "bg-bg-raised text-ink"} shadow-pixel-sm`}
              >
                ALL
              </button>
              {POKEMON_TYPES.map((t) => (
                <TypePill
                  key={t}
                  type={t as PokemonType}
                  selected={settings.filterType === t}
                  onClick={() => onChange({ filterType: settings.filterType === t ? null : (t as PokemonType) })}
                />
              ))}
            </div>
          </div>
        </Section>

        <Section title="data">
          <button onClick={onExport} className="pixel-btn w-full">
            ↓ EXPORT JSON
          </button>
          <ImportButton onPick={onImport} disabled={!canEdit} />
          {!canEdit && (
            <p className="font-body text-pixel-base text-ink-mute">
              unlock with pin to import
            </p>
          )}
        </Section>

        {!canEdit && (
          <p className="font-body text-pixel-base text-ink-mute text-center mt-auto">
            unlock with pin to change display options
          </p>
        )}
      </div>
    </div>
  );
}

function ImportButton({ onPick, disabled }: { onPick: (file: File) => void; disabled: boolean }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <>
      <input
        ref={ref}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onPick(f);
          if (ref.current) ref.current.value = "";
        }}
      />
      <button
        onClick={() => ref.current?.click()}
        disabled={disabled}
        className="pixel-btn w-full"
      >
        ↑ IMPORT JSON
      </button>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3 pb-4 border-b-2 border-bg-deep">
      <h3 className="font-display text-pixel-xs uppercase tracking-wider text-accent-red">{title}</h3>
      {children}
    </section>
  );
}

function ToggleRow({
  label,
  help,
  value,
  onChange,
  disabled,
}: {
  label: string;
  help?: string;
  value: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={() => !disabled && onChange(!value)}
      disabled={disabled}
      className="flex items-start gap-3 text-left disabled:opacity-50"
    >
      <span
        className={`flex-shrink-0 w-10 h-5 ${value ? "bg-accent-green" : "bg-bg-deep"} relative transition-colors`}
        style={{ boxShadow: "0 0 0 2px #000, inset 0 -2px 0 0 rgba(0,0,0,0.3)" }}
      >
        <span
          className="absolute top-0 w-5 h-5 bg-ink transition-transform"
          style={{
            boxShadow: "0 0 0 2px #000",
            transform: value ? "translateX(20px)" : "translateX(0)",
          }}
        />
      </span>
      <span className="flex-1 flex flex-col gap-0.5">
        <span className="font-display text-pixel-xs uppercase text-ink">{label}</span>
        {help && <span className="font-body text-pixel-base text-ink-mute">{help}</span>}
      </span>
    </button>
  );
}

function SelectRow({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="font-display text-pixel-xs uppercase tracking-wider text-ink-dim">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pixel-input cursor-pointer"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-bg-deep">
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
