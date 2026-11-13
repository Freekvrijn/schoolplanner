// Date helpers. All calendar logic runs in Europe/Amsterdam, independent of the device zone.
export const TIME_ZONE = "Europe/Amsterdam";

/** Day key: "YYYY-MM-DD" in Europe/Amsterdam. */
export type DayKey = string;

const keyParts = new Intl.DateTimeFormat("en-GB", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const pad = (n: number) => String(n).padStart(2, "0");

export function toDayKey(input: Date | string | number): DayKey {
  const d = input instanceof Date ? input : new Date(input);
  const p = Object.fromEntries(keyParts.formatToParts(d).map((x) => [x.type, x.value]));
  return `${p["year"]}-${p["month"]}-${p["day"]}`;
}

export function todayKey(now: Date = new Date()): DayKey {
  return toDayKey(now);
}

export function isDayKey(value: unknown): value is DayKey {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

/** Noon UTC on the given day: safe anchor for weekday math and day formatting. */
export function keyToDate(key: DayKey): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1, 12));
}

function utcKey(d: Date): DayKey {
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

export function addDays(key: DayKey, n: number): DayKey {
  const d = keyToDate(key);
  d.setUTCDate(d.getUTCDate() + n);
  return utcKey(d);
}

export function daysBetween(from: DayKey, to: DayKey): number {
  return Math.round((keyToDate(to).getTime() - keyToDate(from).getTime()) / 86_400_000);
}

/** Monday of the week containing `key`. */
export function startOfWeek(key: DayKey): DayKey {
  const dow = (keyToDate(key).getUTCDay() + 6) % 7;
  return addDays(key, -dow);
}

export function weekKeys(key: DayKey): DayKey[] {
  const start = startOfWeek(key);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

export function isoWeekNumber(key: DayKey): number {
  const d = keyToDate(key);
  const dow = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - dow + 3); // Thursday of this week
  const firstThursday = new Date(Date.UTC(d.getUTCFullYear(), 0, 4, 12));
  const fdow = (firstThursday.getUTCDay() + 6) % 7;
  firstThursday.setUTCDate(firstThursday.getUTCDate() - fdow + 3);
  return 1 + Math.round((d.getTime() - firstThursday.getTime()) / (7 * 86_400_000));
}

const fmtCache = new Map<string, Intl.DateTimeFormat>();
function fmt(opts: Intl.DateTimeFormatOptions, zone: string): Intl.DateTimeFormat {
  const k = zone + JSON.stringify(opts);
  let f = fmtCache.get(k);
  if (!f) {
    f = new Intl.DateTimeFormat("nl-NL", { timeZone: zone, ...opts });
    fmtCache.set(k, f);
  }
  return f;
}

/** "vrijdag 13 november" */
export function formatDayLong(key: DayKey): string {
  return fmt({ weekday: "long", day: "numeric", month: "long" }, "UTC").format(keyToDate(key));
}

/** "vrijdag 13 november 2026" */
export function formatDayFull(key: DayKey): string {
  return fmt({ weekday: "long", day: "numeric", month: "long", year: "numeric" }, "UTC").format(
    keyToDate(key),
  );
}

/** "vr 13 nov" */
export function formatDayShort(key: DayKey): string {
  return fmt({ weekday: "short", day: "numeric", month: "short" }, "UTC")
    .format(keyToDate(key))
    .replace(/\./g, "");
}

/** "vr" */
export function formatWeekdayShort(key: DayKey): string {
  return fmt({ weekday: "short" }, "UTC").format(keyToDate(key)).replace(/\./g, "");
}

export function dayOfMonth(key: DayKey): number {
  return keyToDate(key).getUTCDate();
}

/** "13 nov – 19 nov" */
export function formatRange(from: DayKey, to: DayKey): string {
  const f = fmt({ day: "numeric", month: "short" }, "UTC");
  return `${f.format(keyToDate(from)).replace(/\./g, "")} – ${f.format(keyToDate(to)).replace(/\./g, "")}`;
}

/** 24-hour "09:30" in Europe/Amsterdam. */
export function formatTime(iso: string): string {
  return fmt({ hour: "2-digit", minute: "2-digit", hourCycle: "h23" }, TIME_ZONE).format(
    new Date(iso),
  );
}

/** "13 nov 2026, 10:52" */
export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "onbekend";
  const date = fmt({ day: "numeric", month: "short", year: "numeric" }, TIME_ZONE)
    .format(d)
    .replace(/\./g, "");
  return `${date}, ${formatTime(iso)}`;
}

export function relativeDayLabel(key: DayKey, today: DayKey): string | null {
  const diff = daysBetween(today, key);
  if (diff === 0) return "Vandaag";
  if (diff === 1) return "Morgen";
  if (diff === -1) return "Gisteren";
  return null;
}

export function greeting(now: Date = new Date()): string {
  const hour = Number(
    fmt({ hour: "2-digit", hourCycle: "h23" }, TIME_ZONE).format(now).replace(/\D/g, ""),
  );
  if (hour < 6) return "Goedenacht";
  if (hour < 12) return "Goedemorgen";
  if (hour < 18) return "Goedemiddag";
  return "Goedenavond";
}

export function durationLabel(startIso: string, endIso: string): string {
  const min = Math.max(0, Math.round((Date.parse(endIso) - Date.parse(startIso)) / 60000));
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h && m) return `${h} u ${m} min`;
  if (h) return `${h} uur`;
  return `${m} min`;
}

