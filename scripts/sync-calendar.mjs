#!/usr/bin/env node
// Fetches the Avans ICS feed server-side (no browser CORS involved) and writes public/rooster.json.
//
// Exit codes:
//   0  fresh sync written, or the source failed but a previous real snapshot was kept
//      (its updatedAt stays untouched and lastFailedAttempt records the failure)
//   1  the source failed and there is no previous real snapshot, or SYNC_STRICT=1
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { icsToEvents, isRealSnapshot, mergeWithHistory } from "./lib/ics-to-rooster.mjs";

const SOURCE_URL =
  process.env.CALENDAR_URL ?? "https://avans.one/api/webcal?value=28026KM12AIA&c=g";
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUTPUT = resolve(ROOT, "public/rooster.json");
const STRICT = process.env.SYNC_STRICT === "1";
const IN_CI = process.env.GITHUB_ACTIONS === "true";

const log = (msg) => console.log(`[sync:calendar] ${msg}`);
const warn = (msg) => console.warn(IN_CI ? `::warning title=Rooster-sync::${msg}` : `[sync:calendar] WAARSCHUWING: ${msg}`);
const fail = (msg) => console.error(IN_CI ? `::error title=Rooster-sync::${msg}` : `[sync:calendar] FOUT: ${msg}`);

async function fetchIcs(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30_000);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "user-agent": "schoolplanner-sync/1.0", accept: "text/calendar, text/plain, */*" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

async function readExisting() {
  try {
    return JSON.parse(await readFile(OUTPUT, "utf8"));
  } catch {
    return null;
  }
}

async function writeJson(data) {
  await mkdir(dirname(OUTPUT), { recursive: true });
  await writeFile(OUTPUT, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

async function main() {
  log(`Bron ophalen: ${SOURCE_URL}`);
  log(`Proces-tijdzone: ${process.env.TZ ?? "(niet gezet)"} — tijden worden expliciet als Europe/Amsterdam berekend.`);
  try {
    const text = await fetchIcs(SOURCE_URL);
    const { events: fresh, warnings, timeZone } = icsToEvents(text);
    for (const w of warnings) warn(w);
    if (fresh.length === 0) warn("De agenda bevat 0 lessen.");
    const existing = await readExisting();
    const events = mergeWithHistory(
      isRealSnapshot(existing) ? existing.events : [],
      fresh,
      Date.now(),
    );
    const archivedCount = events.length - fresh.length;
    const envelope = {
      updatedAt: new Date().toISOString(),
      source: SOURCE_URL,
      timeZone,
      events,
    };
    await writeJson(envelope);
    log(
      `${fresh.length} lessen uit de bron + ${archivedCount} eerdere lessen bewaard -> public/rooster.json (tijdzone ${timeZone}).`,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const existing = await readExisting();
    if (!STRICT && isRealSnapshot(existing)) {
      await writeJson({
        ...existing,
        lastFailedAttempt: { at: new Date().toISOString(), message },
      });
      warn(
        `Synchronisatie mislukt (${message}). Bestaande snapshot van ${existing.updatedAt} blijft staan; updatedAt is niet aangepast.`,
      );
      return;
    }
    fail(`Synchronisatie mislukt en er is geen eerdere echte snapshot: ${message}`);
    process.exitCode = 1;
  }
}

await main();

