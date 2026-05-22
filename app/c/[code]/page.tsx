import { notFound } from "next/navigation";
import { readStore } from "@/lib/jsonbin";
import { isValidCode } from "@/lib/auth";
import { CollectionView } from "@/components/CollectionView";
import { POKEMON_INDEX } from "@/lib/pokemon-index.generated";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  if (!isValidCode(code)) notFound();

  const store = await readStore();
  const coll = store.collections[code];
  if (!coll) notFound();

  const { pinHash: _ph, salt: _s, ...publicColl } = coll;

  return (
    <CollectionView
      code={code}
      initialCollection={publicColl}
      sprites={POKEMON_INDEX as unknown as { slug: string; file: string; displayName: string; idx: number }[]}
    />
  );
}
