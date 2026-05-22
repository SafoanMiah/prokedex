export const POKEMON_TYPES = [
  "normal",
  "fire",
  "water",
  "electric",
  "grass",
  "ice",
  "fighting",
  "poison",
  "ground",
  "flying",
  "psychic",
  "bug",
  "rock",
  "ghost",
  "dragon",
  "dark",
  "steel",
  "fairy",
] as const;

export type PokemonType = (typeof POKEMON_TYPES)[number];

export interface PokemonEntry {
  name: string;
  types: PokemonType[];
  description: string;
  favorite: boolean;
  shiny: boolean;
  stats: {
    hp: number;
    atk: number;
    def: number;
    spd: number;
  };
  claimedAt: string;
  guessedTypeCorrect?: boolean | null;
}

export interface CollectionSettings {
  silhouette: boolean;
  guessMode: boolean;
  sort: "dex" | "alpha" | "claimed-first" | "claimed-recent" | "type" | "shuffle";
  filter: "all" | "claimed" | "unclaimed" | "favorites";
  filterType: PokemonType | null;
  density: "cozy" | "compact";
  theme: "pixel";
}

export const DEFAULT_SETTINGS: CollectionSettings = {
  silhouette: false,
  guessMode: true,
  sort: "dex",
  filter: "all",
  filterType: null,
  density: "cozy",
  theme: "pixel",
};

export interface Collection {
  name: string;
  pinHash: string;
  salt: string;
  createdAt: string;
  updatedAt: string;
  pokemon: Record<string, PokemonEntry>;
  settings: CollectionSettings;
  stats: {
    claimed: number;
    guessAttempts: number;
    guessCorrect: number;
  };
}

export type CollectionPublic = Omit<Collection, "pinHash" | "salt">;

export interface StorageShape {
  collections: Record<string, Collection>;
  meta: {
    createdAt: string;
    version: number;
  };
}

export const TYPE_LABELS: Record<PokemonType, string> = {
  normal: "Normal",
  fire: "Fire",
  water: "Water",
  electric: "Electric",
  grass: "Grass",
  ice: "Ice",
  fighting: "Fight",
  poison: "Poison",
  ground: "Ground",
  flying: "Flying",
  psychic: "Psychic",
  bug: "Bug",
  rock: "Rock",
  ghost: "Ghost",
  dragon: "Dragon",
  dark: "Dark",
  steel: "Steel",
  fairy: "Fairy",
};

export const TYPE_HEX: Record<PokemonType, string> = {
  normal: "#A8A77A",
  fire: "#EE8130",
  water: "#6390F0",
  electric: "#F7D02C",
  grass: "#7AC74C",
  ice: "#96D9D6",
  fighting: "#C22E28",
  poison: "#A33EA1",
  ground: "#E2BF65",
  flying: "#A98FF3",
  psychic: "#F95587",
  bug: "#A6B91A",
  rock: "#B6A136",
  ghost: "#735797",
  dragon: "#6F35FC",
  dark: "#705746",
  steel: "#B7B7CE",
  fairy: "#D685AD",
};
