import { TYPE_HEX, TYPE_LABELS, type PokemonType } from "@/lib/types";

interface Props {
  type: PokemonType;
  size?: "xs" | "sm";
  selected?: boolean;
  onClick?: () => void;
  disabled?: boolean;
}

export function TypePill({ type, size = "xs", selected, onClick, disabled }: Props) {
  const base =
    size === "sm"
      ? "px-2.5 py-2 text-pixel-xs"
      : "px-1.5 py-1 text-pixel-xs";

  const Tag = onClick ? "button" : "span";

  return (
    <Tag
      onClick={onClick}
      disabled={disabled}
      className={`type-pill ${base} ${onClick && !disabled ? "cursor-pointer hover:translate-y-[-1px] active:translate-y-[1px]" : ""} ${selected ? "ring-2 ring-accent-yellow ring-offset-2 ring-offset-bg-panel" : ""} ${disabled ? "opacity-30 cursor-not-allowed" : ""} transition-transform`}
      style={{ backgroundColor: TYPE_HEX[type] }}
    >
      {TYPE_LABELS[type]}
    </Tag>
  );
}
