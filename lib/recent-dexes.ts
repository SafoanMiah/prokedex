export interface RecentDex {
  slug: string;
  name: string;
  lastVisitedAt: string;
}

const KEY = "prokedeck:recent";
const MAX = 20;

export function getRecent(): RecentDex[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr.filter(
      (x): x is RecentDex =>
        x &&
        typeof x.slug === "string" &&
        typeof x.name === "string" &&
        typeof x.lastVisitedAt === "string"
    );
  } catch {
    return [];
  }
}

export function rememberDex(slug: string, name: string) {
  if (typeof window === "undefined") return;
  const list = getRecent().filter((d) => d.slug !== slug);
  list.unshift({ slug, name, lastVisitedAt: new Date().toISOString() });
  localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX)));
}

export function forgetDex(slug: string) {
  if (typeof window === "undefined") return;
  const list = getRecent().filter((d) => d.slug !== slug);
  localStorage.setItem(KEY, JSON.stringify(list));
}
