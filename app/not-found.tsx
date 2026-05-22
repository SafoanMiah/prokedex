import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 gap-6 text-center">
      <div className="font-display text-pixel-2xl text-accent-red text-stroke">404</div>
      <p className="font-body text-pixel-lg text-ink-dim max-w-sm">
        no dex by that name, trainer.
        <br />
        try a different code.
      </p>
      <Link href="/" className="pixel-btn pixel-btn-primary">
        ← HOME
      </Link>
    </main>
  );
}
