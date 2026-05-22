import "server-only";
import { createHash, randomBytes } from "node:crypto";

export {
  isValidPin,
  isValidCode,
  isValidSlug,
  normalizeCode,
  slugify,
  SLUG_MIN,
  SLUG_MAX,
} from "./auth-shared";

export function generateSalt(): string {
  return randomBytes(16).toString("hex");
}

export function hashPin(pin: string, salt: string): string {
  return createHash("sha256").update(`${salt}:${pin}`).digest("hex");
}

export function verifyPin(pin: string, salt: string, expectedHash: string): boolean {
  if (!/^\d{4}$/.test(pin)) return false;
  const candidate = hashPin(pin, salt);
  if (candidate.length !== expectedHash.length) return false;
  let diff = 0;
  for (let i = 0; i < candidate.length; i++) {
    diff |= candidate.charCodeAt(i) ^ expectedHash.charCodeAt(i);
  }
  return diff === 0;
}
