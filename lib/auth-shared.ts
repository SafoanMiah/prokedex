export const SLUG_MIN = 2;
export const SLUG_MAX = 24;
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function isValidPin(pin: unknown): pin is string {
  return typeof pin === "string" && /^\d{4}$/.test(pin);
}

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .normalize("NFKD")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, SLUG_MAX);
}

export function isValidSlug(s: unknown): s is string {
  return (
    typeof s === "string" &&
    s.length >= SLUG_MIN &&
    s.length <= SLUG_MAX &&
    SLUG_RE.test(s)
  );
}

export const isValidCode = isValidSlug;
export const normalizeCode = slugify;
