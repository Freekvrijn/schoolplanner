// Versioned localStorage schema for tasks and notes, plus backup export/import.
import { isDayKey, type DayKey } from "./dates";

export const DATA_KEY = "schoolplanner:data";
export const SCHEMA_VERSION = 1;

export type Task = {
  id: string;
  lessonId: string;
  text: string;
  done: boolean;
  createdAt: string;
  completedAt: string | null;
  /** Optional deadline earlier than the lesson day. null = the lesson day is the deadline. */
  dueDate: DayKey | null;
};

export type Note = { lessonId: string; text: string; updatedAt: string };

/** Snapshot of lesson details so tasks/notes stay readable if the lesson leaves the rooster. */
export type LessonMeta = { id: string; title: string; start: string; end: string; location: string };

export type PlannerData = {
  version: typeof SCHEMA_VERSION;
  tasks: Task[];
  notes: Record<string, Note>;
  lessons: Record<string, LessonMeta>;
};

export const emptyData = (): PlannerData => ({
  version: SCHEMA_VERSION,
  tasks: [],
  notes: {},
  lessons: {},
});

type Result<T> = { ok: true; value: T } | { ok: false; error: string };

const isObj = (x: unknown): x is Record<string, unknown> =>
  typeof x === "object" && x !== null && !Array.isArray(x);
const isStr = (x: unknown): x is string => typeof x === "string";
const isDate = (x: unknown): x is string => isStr(x) && !Number.isNaN(Date.parse(x));

export function validateData(x: unknown): Result<PlannerData> {
  if (!isObj(x)) return { ok: false, error: "Geen geldig gegevensobject." };
  if (x["version"] !== SCHEMA_VERSION) {
    return { ok: false, error: `Onbekende schemaversie (${String(x["version"])}).` };
  }
  const tasksRaw = x["tasks"];
  const notesRaw = x["notes"];
  const lessonsRaw = x["lessons"];
  if (!Array.isArray(tasksRaw) || !isObj(notesRaw) || !isObj(lessonsRaw)) {
    return { ok: false, error: "Taken, aantekeningen of lesgegevens ontbreken." };
  }

  const tasks: Task[] = [];
  const taskIds = new Set<string>();
  for (const [i, t] of tasksRaw.entries()) {
    if (
      !isObj(t) ||
      !isStr(t["id"]) ||
      !t["id"].trim() ||
      !isStr(t["lessonId"]) ||
      !isStr(t["text"]) ||
      typeof t["done"] !== "boolean" ||
      !isDate(t["createdAt"]) ||
      !(t["completedAt"] === null || isDate(t["completedAt"])) ||
      !(t["dueDate"] === null || isDayKey(t["dueDate"]))
    ) {
      return { ok: false, error: `Taak ${i + 1} is ongeldig.` };
    }
    if (taskIds.has(t["id"])) return { ok: false, error: "De backup bevat dubbele taak-ID's." };
    taskIds.add(t["id"]);
    tasks.push({
      id: t["id"],
      lessonId: t["lessonId"],
      text: t["text"],
      done: t["done"],
      createdAt: t["createdAt"],
      completedAt: t["completedAt"],
      dueDate: t["dueDate"],
    });
  }

  const notes: Record<string, Note> = Object.create(null);
  for (const [key, n] of Object.entries(notesRaw)) {
    if (!isObj(n) || !isStr(n["text"]) || !isDate(n["updatedAt"]) || n["lessonId"] !== key) {
      return { ok: false, error: "Een aantekening is ongeldig." };
    }
    notes[key] = { lessonId: key, text: n["text"], updatedAt: n["updatedAt"] };
  }

  const lessons: Record<string, LessonMeta> = Object.create(null);
  for (const [key, l] of Object.entries(lessonsRaw)) {
    if (
      !isObj(l) ||
      l["id"] !== key ||
      !isStr(l["title"]) ||
      !isDate(l["start"]) ||
      !isDate(l["end"]) ||
      !isStr(l["location"])
    ) {
      return { ok: false, error: "Opgeslagen lesgegevens zijn ongeldig." };
    }
    lessons[key] = { id: key, title: l["title"], start: l["start"], end: l["end"], location: l["location"] };
  }

  if (tasks.some((t) => !Object.hasOwn(lessons, t.lessonId)) ||
      Object.keys(notes).some((id) => !Object.hasOwn(lessons, id))) {
    return { ok: false, error: "De backup mist lesgegevens bij een taak of aantekening." };
  }

  return { ok: true, value: { version: SCHEMA_VERSION, tasks, notes, lessons } };
}

export type LoadResult = { data: PlannerData; warning: string | null };

/**
 * Load stored data. Unreadable data is never silently thrown away: the raw value is copied
 * to a separate key before the app starts with an empty planner.
 */
export function loadData(storage: Storage | undefined, now: Date = new Date()): LoadResult {
  if (!storage) {
    return { data: emptyData(), warning: "Deze browser staat lokaal opslaan niet toe." };
  }
  let raw: string | null;
  try {
    raw = storage.getItem(DATA_KEY);
  } catch {
    return { data: emptyData(), warning: "De lokale opslag van deze browser is niet bereikbaar." };
  }
  if (raw === null) return { data: emptyData(), warning: null };

  let parsed: unknown;
  let problem: string;
  try {
    parsed = JSON.parse(raw);
    const result = validateData(parsed);
    if (result.ok) return { data: result.value, warning: null };
    problem = result.error;
  } catch {
    problem = "De opgeslagen gegevens zijn geen geldige JSON.";
  }

  const rescueKey = `${DATA_KEY}:onleesbaar:${now.toISOString()}`;
  let rescued = false;
  try {
    storage.setItem(rescueKey, raw);
    storage.removeItem(DATA_KEY);
    rescued = true;
  } catch {
    rescued = false;
  }
  return {
    data: emptyData(),
    warning: rescued
      ? `Opgeslagen gegevens konden niet worden gelezen (${problem}). De oude gegevens zijn apart bewaard onder "${rescueKey}".`
      : `Opgeslagen gegevens konden niet worden gelezen (${problem}). Ze zijn niet overschreven; wijzigingen worden pas opgeslagen als je iets aanpast.`,
  };
}

export type SaveResult = { ok: true } | { ok: false; error: string };

function isQuotaError(e: unknown): boolean {
  return (
    e instanceof DOMException &&
    (e.name === "QuotaExceededError" || e.name === "NS_ERROR_DOM_QUOTA_REACHED" || e.code === 22)
  );
}

export function saveData(storage: Storage | undefined, data: PlannerData): SaveResult {
  if (!storage) return { ok: false, error: "Lokaal opslaan is niet beschikbaar in deze browser." };
  try {
    storage.setItem(DATA_KEY, JSON.stringify(data));
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: isQuotaError(e)
        ? "De browseropslag is vol. Maak een backup en verwijder oude aantekeningen."
        : "Opslaan in de browser is mislukt.",
    };
  }
}

// ---- Backup ---------------------------------------------------------------------------------

export const BACKUP_APP = "schoolplanner";

export type Backup = { app: typeof BACKUP_APP; exportedAt: string; data: PlannerData };

export function createBackup(data: PlannerData, now: Date = new Date()): Backup {
  return { app: BACKUP_APP, exportedAt: now.toISOString(), data };
}

export type BackupSummary = { exportedAt: string; tasks: number; notes: number };

export function parseBackup(text: string): Result<{ data: PlannerData; summary: BackupSummary }> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, error: "Dit bestand is geen geldige JSON." };
  }
  if (!isObj(parsed) || parsed["app"] !== BACKUP_APP || !isDate(parsed["exportedAt"])) {
    return { ok: false, error: "Dit is geen Schoolplanner-backup." };
  }
  const result = validateData(parsed["data"]);
  if (!result.ok) return { ok: false, error: `De backup is ongeldig: ${result.error}` };
  return {
    ok: true,
    value: {
      data: result.value,
      summary: {
        exportedAt: parsed["exportedAt"],
        tasks: result.value.tasks.length,
        notes: Object.values(result.value.notes).filter((n) => n.text.trim()).length,
      },
    },
  };
}

export function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `t-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

