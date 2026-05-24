import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const ENV_LOCAL = join(ROOT, ".env.local");

if (!existsSync(ENV_LOCAL)) {
  console.error("[init-jsonbin] .env.local missing — create it with JSONBIN_MASTER_KEY first.");
  process.exit(1);
}

const env = Object.fromEntries(
  readFileSync(ENV_LOCAL, "utf-8")
    .split("\n")
    .filter((l) => l.trim() && !l.startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      let v = l.slice(i + 1).trim();
      // Strip outer quotes if present
      if ((v.startsWith("'") && v.endsWith("'")) || (v.startsWith('"') && v.endsWith('"'))) {
        v = v.slice(1, -1);
      }
      // Unescape `\$` to `$` so a re-run after dotenv-escaping still works
      v = v.replace(/\\\$/g, "$");
      return [l.slice(0, i).trim(), v];
    })
);

const MASTER_KEY = env.JSONBIN_MASTER_KEY;
if (!MASTER_KEY) {
  console.error("[init-jsonbin] JSONBIN_MASTER_KEY missing in .env.local");
  process.exit(1);
}

if (env.JSONBIN_BIN_ID) {
  console.log(`[init-jsonbin] BIN_ID already set: ${env.JSONBIN_BIN_ID}`);
  console.log(`[init-jsonbin] If you want a fresh bin, remove the line and re-run.`);
  process.exit(0);
}

const initial = {
  collections: {},
  meta: {
    createdAt: new Date().toISOString(),
    version: 1,
  },
};

console.log("[init-jsonbin] Creating bin...");

const res = await fetch("https://api.jsonbin.io/v3/b", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-Master-Key": MASTER_KEY,
    "X-Bin-Name": "prokedeck",
    "X-Bin-Private": "false",
  },
  body: JSON.stringify(initial),
});

if (!res.ok) {
  const text = await res.text();
  console.error(`[init-jsonbin] Create failed: ${res.status} ${text}`);
  process.exit(1);
}

const data = await res.json();
const binId = data.metadata?.id;

if (!binId) {
  console.error("[init-jsonbin] No bin ID in response:", data);
  process.exit(1);
}

console.log(`[init-jsonbin] Created bin: ${binId}`);

const lines = readFileSync(ENV_LOCAL, "utf-8").split("\n");
const newLines = lines.map((l) =>
  l.startsWith("JSONBIN_BIN_ID=") ? `JSONBIN_BIN_ID=${binId}` : l
);
if (!newLines.some((l) => l.startsWith("JSONBIN_BIN_ID="))) {
  newLines.push(`JSONBIN_BIN_ID=${binId}`);
}
writeFileSync(ENV_LOCAL, newLines.join("\n"), "utf-8");

console.log(`[init-jsonbin] Saved BIN_ID to .env.local`);
console.log(`[init-jsonbin] Remember to add JSONBIN_BIN_ID=${binId} to Vercel env vars too.`);
