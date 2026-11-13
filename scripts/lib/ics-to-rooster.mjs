// Pure helpers that turn an ICS (VCALENDAR) text into the rooster.json envelope.
// Kept free of network and filesystem access so it can be unit-tested.
import ICAL from "ical.js";

export const DEFAULT_TIMEZONE = "Europe/Amsterdam";

// Windows-style zone names that sometimes show up in TZID parameters.
const WINDOWS_ZONES = {
  "W. Europe Standard Time": "Europe/Amsterdam",
  "Romance Standard Time": "Europe/Brussels",
};

function isValidTimeZone(tz) {
  if (!tz) return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

function resolveTimeZone(name, fallback) {
  if (!name) return fallback;
  const mapped = WINDOWS_ZONES[name] ?? name;
  return isValidTimeZone(mapped) ? mapped : fallback;
}

/** Offset of `timeZone` from UTC at instant `utcMs`, in milliseconds. */
export function zoneOffsetMs(utcMs, timeZone) {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const p = Object.fromEntries(fmt.formatToParts(new Date(utcMs)).map((x) => [x.type, x.value]));
  const asUtc = Date.UTC(
    Number(p.year),
    Number(p.month) - 1,
    Number(p.day),
    Number(p.hour),
    Number(p.minute),
    Number(p.second),
  );
  return asUtc - Math.floor(utcMs / 1000) * 1000;
}

/** Convert a wall-clock time in `timeZone` to a UTC timestamp, independent of process TZ. */
export function wallTimeToUtcMs({ year, month, day, hour = 0, minute = 0, second = 0 }, timeZone) {
  const naive = Date.UTC(year, month - 1, day, hour, minute, second);
  let guess = naive - zoneOffsetMs(naive, timeZone);
  // Second pass handles instants close to a DST switch.
  guess = naive - zoneOffsetMs(guess, timeZone);
  return guess;
}

const pad = (n, len = 2) => String(Math.abs(n)).padStart(len, "0");

/** ISO 8601 string with the zone's offset, e.g. 2026-11-13T09:30:00+01:00. */
export function toZonedIso(utcMs, timeZone) {
  const offset = zoneOffsetMs(utcMs, timeZone);
  const local = new Date(utcMs + offset);
  const sign = offset >= 0 ? "+" : "-";
  const offMin = Math.abs(offset) / 60000;
  return (
    `${local.getUTCFullYear()}-${pad(local.getUTCMonth() + 1)}-${pad(local.getUTCDate())}` +
    `T${pad(local.getUTCHours())}:${pad(local.getUTCMinutes())}:${pad(local.getUTCSeconds())}` +
    `${sign}${pad(Math.floor(offMin / 60))}:${pad(offMin % 60)}`
  );
}

function timeToUtcMs(time, tzid, calendarZone) {
  if (time.zone === ICAL.Timezone.utcTimezone || time.zone?.tzid === "UTC") {
    return Date.UTC(time.year, time.month - 1, time.day, time.hour, time.minute, time.second);
  }
  const zone = resolveTimeZone(tzid, calendarZone);
  return wallTimeToUtcMs(
    {
      year: time.year,
      month: time.month,
      day: time.day,
      hour: time.isDate ? 0 : time.hour,
      minute: time.isDate ? 0 : time.minute,
      second: time.isDate ? 0 : time.second,
    },
    zone,
  );
}

/** Extract "Docent Naam (e-mail: x@y)" entries from an Avans description. */
export function parseTeachers(description) {
  if (!description) return [];
  const seen = new Map();
  const re = /Docent\s+([^,(\n]+?)\s*\(e-mail:\s*([^)\s]+)\s*\)/gi;
  let m;
  while ((m = re.exec(description))) {
    const name = m[1].trim();
    const email = m[2].trim().toLowerCase();
    const key = email || name.toLowerCase();
    if (!seen.has(key)) seen.set(key, { name, email: email || null });
  }
  return [...seen.values()];
}

/** "OL131a, OL131a" -> "OL131a" (keeps original order). */
export function dedupeLocation(location) {
  if (!location) return "";
  const parts = location
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return [...new Set(parts)].join(", ");
}

export function assertVcalendar(text) {
  if (typeof text !== "string" || text.length === 0) {
    throw new Error("Lege respons van de agendabron.");
  }
  const body = text.replace(/^\uFEFF/, "").trim();
  if (!body.startsWith("BEGIN:VCALENDAR") || !/END:VCALENDAR\s*$/.test(body)) {
    throw new Error("De respons is geen geldige VCALENDAR (BEGIN/END:VCALENDAR ontbreekt).");
  }
  return body;
}

/**
 * Parse ICS text into sorted, deduplicated lessons.
 * Returns { events, warnings }.
 */
export function icsToEvents(text) {
  const body = assertVcalendar(text);
  const root = new ICAL.Component(ICAL.parse(body));
  const calendarZone = resolveTimeZone(
    root.getFirstPropertyValue("x-wr-timezone"),
    DEFAULT_TIMEZONE,
  );
  const method = String(root.getFirstPropertyValue("method") ?? "").toUpperCase();
  const warnings = [];
  const byId = new Map();
  let skippedCancelled = 0;
  let recurring = 0;

  for (const vevent of root.getAllSubcomponents("vevent")) {
    const uid = String(vevent.getFirstPropertyValue("uid") ?? "").trim();
    const startProp = vevent.getFirstProperty("dtstart");
    if (!uid || !startProp) {
      warnings.push("Event zonder UID of DTSTART overgeslagen.");
      continue;
    }
    const status = String(vevent.getFirstPropertyValue("status") ?? "").toUpperCase();
    if (status === "CANCELLED" || method === "CANCEL") {
      skippedCancelled++;
      continue;
    }
    if (vevent.hasProperty("rrule")) recurring++;

    const startTime = startProp.getFirstValue();
    const startMs = timeToUtcMs(startTime, startProp.getParameter("tzid"), calendarZone);

    let endMs;
    const endProp = vevent.getFirstProperty("dtend");
    if (endProp) {
      endMs = timeToUtcMs(endProp.getFirstValue(), endProp.getParameter("tzid"), calendarZone);
    } else if (vevent.hasProperty("duration")) {
      endMs = startMs + vevent.getFirstPropertyValue("duration").toSeconds() * 1000;
    } else {
      endMs = startTime.isDate ? startMs + 24 * 3600 * 1000 : startMs;
    }

    const description = String(vevent.getFirstPropertyValue("description") ?? "").trim();
    const sequence = Number(vevent.getFirstPropertyValue("sequence") ?? 0) || 0;
    const event = {
      id: uid,
      title: String(vevent.getFirstPropertyValue("summary") ?? "").trim() || "(zonder titel)",
      start: toZonedIso(startMs, calendarZone),
      end: toZonedIso(endMs, calendarZone),
      allDay: Boolean(startTime.isDate),
      location: dedupeLocation(String(vevent.getFirstPropertyValue("location") ?? "")),
      description,
      teachers: parseTeachers(description),
    };

    const existing = byId.get(uid);
    // Keep the highest SEQUENCE when a UID appears twice.
    if (!existing || sequence >= existing.sequence) byId.set(uid, { sequence, event });
  }

  if (skippedCancelled) warnings.push(`${skippedCancelled} geannuleerde les(sen) overgeslagen.`);
  if (recurring) {
    warnings.push(
      `${recurring} terugkerend(e) event(s) gevonden; alleen de eerste keer is opgenomen.`,
    );
  }

  const events = [...byId.values()]
    .map((x) => x.event)
    .sort((a, b) => Date.parse(a.start) - Date.parse(b.start) || a.id.localeCompare(b.id));

  return { events, warnings, timeZone: calendarZone };
}

/** Is `value` a rooster envelope that came from a real, successful sync? */
export function isRealSnapshot(value) {
  return (
    value !== null &&
    typeof value === "object" &&
    typeof value.updatedAt === "string" &&
    !Number.isNaN(Date.parse(value.updatedAt)) &&
    typeof value.source === "string" &&
    Array.isArray(value.events)
  );
}

/**
 * The Avans feed drops lessons once they are over. Keep lessons from the previous snapshot
 * that already ended (before `nowMs`) and no longer appear in the fresh feed, marked as archived.
 * Future lessons that disappeared are treated as removed from the rooster and are not kept.
 */
export function mergeWithHistory(previousEvents, freshEvents, nowMs) {
  const freshIds = new Set(freshEvents.map((e) => e.id));
  const kept = (Array.isArray(previousEvents) ? previousEvents : []).filter(
    (e) =>
      e &&
      typeof e.id === "string" &&
      !freshIds.has(e.id) &&
      typeof e.end === "string" &&
      Date.parse(e.end) < nowMs,
  );
  return [...kept.map((e) => ({ ...e, archived: true })), ...freshEvents].sort(
    (a, b) => Date.parse(a.start) - Date.parse(b.start) || a.id.localeCompare(b.id),
  );
}

