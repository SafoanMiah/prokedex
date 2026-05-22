import { POKEMON_COUNT } from "@/lib/pokemon-index.generated";
import { LandingClient } from "@/components/LandingClient";

export default function Home() {
  return <LandingClient spriteCount={POKEMON_COUNT} />;
}
