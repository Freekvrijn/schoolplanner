// Rooster (timetable) types, validation, fetching of the published rooster.json and offline cache.

export type Teacher = { name: string; email: string | null };

export type Lesson = {
  id: string;
  title: string;
  start: string;
  end: string;
  allDay: boolean;
  location: string;
  description: string;
  teachers: Teacher[];
  /** Lesson no longer in the live feed because it is over; kept from an earlier snapshot. */
  archived?: boolean;
};

export type RoosterFile = {
  updatedAt: string | null;
  source: string;
  timeZone?: string;
  events: Lesson[];
  lastFailedAttempt?: { at: string; message: string };
};

export class RoosterError extends Error {}

const isObj = (x: unknown): x is Record<string, unknown> => typeof x === "object" && x !== null;
const isStr = (x: unknown): x is string => typeof x === "string";
const isDateStr = (x: unknown): x is string => isStr(x) && !Number.isNaN(Date.parse(x));

export function parseLesson(x: unknown): Lesson | null {
  if (!isObj(x)) return null;
  const { id, title, start, end } = x;
  if (!isStr(id) || !id || !isStr(title) || !isDateStr(start) || !isDateStr(end)) return null;
  const teachers = Array.isArray(x["teachers"])
    ? x["teachers"].flatMap((t) =>
        isObj(t) && isStr(t["name"])
          ? [{ name: t["name"], email: isStr(t["email"]) ? t["email"] : null }]
          : [],
      )
    : [];
  const lesson: Lesson = {
    id,
    title,
    start,
    end,
    allDay: x["allDay"] === true,
    location: isStr(x["location"]) ? x["location"] : "",
    description: isStr(x["description"]) ? x["description"] : "",
    teachers,
  };
  if (x["archived"] === true) lesson.archived = true;
  return lesson;
}

export function parseRoosterFile(x: unknown): RoosterFile {
  if (!isObj(x) || !Array.isArray(x["events"])) {
    throw new RoosterError("Het roosterbestand heeft een onverwachte opbouw.");
  }
  const updatedAt = x["updatedAt"];
  if (updatedAt !== null && !isDateStr(updatedAt)) {
    throw new RoosterError("Het roosterbestand heeft geen geldige bijwerkdatum.");
  }
  const byId = new Map<string, Lesson>();
  for (const raw of x["events"]) {
    const lesson = parseLesson(raw);
    if (lesson) byId.set(lesson.id, lesson);
  }
  const file: RoosterFile = {
    updatedAt,
    source: isStr(x["source"]) ? x["source"] : "",
    events: sortLessons([...byId.values()]),
  };
  if (isStr(x["timeZone"])) file.timeZone = x["timeZone"];
  const lfa = x["lastFailedAttempt"];
  if (isObj(lfa) && isDateStr(lfa["at"]) && isStr(lfa["message"])) {
    file.lastFailedAttempt = { at: lfa["at"], message: lfa["message"] };
  }
  return file;
}

export function sortLessons(list: Lesson[]): Lesson[] {
  return [...list].sort(
    (a, b) => Date.parse(a.start) - Date.parse(b.start) || a.id.localeCompare(b.id),
  );
}

/**
 * Keep lessons we saw earlier that are over and no longer in the fresh list (the Avans
 * feed drops past lessons). Future lessons that vanished are considered removed.
 */
export function mergeHistory(previous: Lesson[], fresh: Lesson[], nowMs: number): Lesson[] {
  const freshIds = new Set(fresh.map((l) => l.id));
  const kept = previous
    .filter((l) => !freshIds.has(l.id) && Date.parse(l.end) < nowMs)
    .map((l) => ({ ...l, archived: true }));
  return sortLessons([...kept, ...fresh]);
}

export function roosterUrl(): string {
  return `${import.meta.env.BASE_URL}rooster.json`;
}

export async function fetchRooster(signal?: AbortSignal): Promise<RoosterFile> {
  let res: Response;
  try {
    res = await fetch(`${roosterUrl()}?t=${Date.now()}`, {
      cache: "no-store",
      headers: { accept: "application/json" },
      ...(signal ? { signal } : {}),
    });
  } catch {
    throw new RoosterError("Geen verbinding: het rooster kon niet worden opgehaald.");
  }
  if (res.status === 404) {
    throw new RoosterError("Het roosterbestand staat (nog) niet op de site.");
  }
  if (!res.ok) {
    throw new RoosterError(`De site gaf een fout bij het ophalen van het rooster (HTTP ${res.status}).`);
  }
  let json: unknown;
  try {
    json = await res.json();
  } catch {
    throw new RoosterError("Het roosterbestand is geen geldige JSON.");
  }
  return parseRoosterFile(json);
}

// ---- Offline cache --------------------------------------------------------------------------

export const ROOSTER_CACHE_KEY = "schoolplanner:rooster-cache";

export type RoosterCache = { version: 1; fetchedAt: string; file: RoosterFile };

export function loadRoosterCache(storage: Storage | undefined): RoosterCache | null {
  if (!storage) return null;
  try {
    const raw = storage.getItem(ROOSTER_CACHE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isObj(parsed) || parsed["version"] !== 1 || !isDateStr(parsed["fetchedAt"])) return null;
    return { version: 1, fetchedAt: parsed["fetchedAt"], file: parseRoosterFile(parsed["file"]) };
  } catch {
    return null;
  }
}

export function saveRoosterCache(storage: Storage | undefined, cache: RoosterCache): boolean {
  if (!storage) return false;
  try {
    storage.setItem(ROOSTER_CACHE_KEY, JSON.stringify(cache));
    return true;
  } catch {
    return false;
  }
}

