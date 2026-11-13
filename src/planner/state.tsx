import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import {
  fetchRooster,
  loadRoosterCache,
  mergeHistory,
  RoosterError,
  saveRoosterCache,
  type Lesson,
  type RoosterFile,
} from "@/lib/rooster";
import {
  DATA_KEY,
  loadData,
  newId,
  saveData,
  validateData,
  type LessonMeta,
  type PlannerData,
  type SaveResult,
  type Task,
} from "@/lib/planner-storage";
import type { DayKey } from "@/lib/dates";

export type RoosterStatus = "loading" | "ready" | "error";

export type ResolvedLesson = Lesson & { missing: boolean };

export type SheetTab = "voorbereiding" | "aantekeningen";

type PlannerContextValue = {
  roosterStatus: RoosterStatus;
  roosterFile: RoosterFile | null;
  roosterError: string | null;
  /** True when the shown lessons come from this browser's cache, not a fresh fetch. */
  fromCache: boolean;
  fetchedAt: string | null;
  reloadRooster: () => Promise<void>;
  lessons: Lesson[];
  resolveLesson: (id: string) => ResolvedLesson | null;

  data: PlannerData;
  storageWarning: string | null;
  saveError: string | null;
  addTask: (lesson: Lesson, text: string, dueDate: DayKey | null) => SaveResult;
  updateTask: (id: string, patch: Partial<Pick<Task, "text" | "done" | "dueDate">>) => SaveResult;
  deleteTask: (id: string) => SaveResult;
  setNote: (lesson: Lesson, text: string) => SaveResult;
  replaceData: (data: PlannerData) => SaveResult;

  openLesson: (id: string, tab?: SheetTab) => void;
  closeLesson: () => void;
  selected: { id: string; tab: SheetTab } | null;
};

const PlannerContext = createContext<PlannerContextValue | null>(null);

const getStorage = (): Storage | undefined => {
  try {
    return typeof window !== "undefined" ? window.localStorage : undefined;
  } catch {
    return undefined;
  }
};

const metaOf = (l: Lesson): LessonMeta => ({
  id: l.id,
  title: l.title,
  start: l.start,
  end: l.end,
  location: l.location,
});

export function PlannerProvider({ children }: { children: ReactNode }) {
  const storage = getStorage();

  // ---- Rooster ------------------------------------------------------------------------------
  const [initialCache] = useState(() => loadRoosterCache(storage));
  const [roosterFile, setRoosterFile] = useState<RoosterFile | null>(initialCache?.file ?? null);
  const [fetchedAt, setFetchedAt] = useState<string | null>(initialCache?.fetchedAt ?? null);
  const [fromCache, setFromCache] = useState(initialCache !== null);
  const [roosterStatus, setRoosterStatus] = useState<RoosterStatus>("loading");
  const [roosterError, setRoosterError] = useState<string | null>(null);
  const roosterRef = useRef(roosterFile);
  roosterRef.current = roosterFile;

  const reloadRooster = useCallback(async () => {
    setRoosterStatus("loading");
    setRoosterError(null);
    try {
      const fresh = await fetchRooster();
      const previous = roosterRef.current?.events ?? [];
      const merged: RoosterFile = { ...fresh, events: mergeHistory(previous, fresh.events, Date.now()) };
      const now = new Date().toISOString();
      setRoosterFile(merged);
      setFetchedAt(now);
      setFromCache(false);
      setRoosterStatus("ready");
      if (merged.updatedAt) saveRoosterCache(storage, { version: 1, fetchedAt: now, file: merged });
    } catch (e) {
      setRoosterError(e instanceof RoosterError ? e.message : "Het rooster kon niet worden geladen.");
      setFromCache(roosterRef.current !== null);
      setRoosterStatus("error");
    }
  }, [storage]);

  useEffect(() => {
    void reloadRooster();
  }, [reloadRooster]);

  const lessons = roosterFile?.events ?? [];
  const lessonMap = useMemo(() => new Map(lessons.map((l) => [l.id, l])), [lessons]);

  // ---- Planner data -------------------------------------------------------------------------
  const [initialLoad] = useState(() => loadData(storage));
  const [data, setData] = useState<PlannerData>(initialLoad.data);
  const [storageWarning] = useState<string | null>(initialLoad.warning);
  const [saveError, setSaveError] = useState<string | null>(null);
  const dataRef = useRef(data);

  const commit = useCallback(
    (next: PlannerData): SaveResult => {
      dataRef.current = next;
      setData(next);
      const result = saveData(storage, next);
      setSaveError(result.ok ? null : result.error);
      return result;
    },
    [storage],
  );

  // Keep stored lesson metadata in sync with the live rooster for lessons that hold data.
  useEffect(() => {
    const cur = dataRef.current;
    const ids = new Set([...cur.tasks.map((t) => t.lessonId), ...Object.keys(cur.notes)]);
    let changed = false;
    const lessonsMeta = { ...cur.lessons };
    for (const id of ids) {
      const live = lessonMap.get(id);
      if (!live) continue;
      const m = metaOf(live);
      const old = lessonsMeta[id];
      if (!old || old.title !== m.title || old.start !== m.start || old.end !== m.end || old.location !== m.location) {
        lessonsMeta[id] = m;
        changed = true;
      }
    }
    if (changed) commit({ ...cur, lessons: lessonsMeta });
  }, [lessonMap, commit]);

  // Other tabs editing the same planner.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== DATA_KEY || e.newValue === null) return;
      try {
        const result = validateData(JSON.parse(e.newValue));
        if (result.ok) {
          dataRef.current = result.value;
          setData(result.value);
        }
      } catch {
        /* ignore unreadable values from other tabs */
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const withMeta = (cur: PlannerData, lesson: Lesson): PlannerData["lessons"] => ({
    ...cur.lessons,
    [lesson.id]: metaOf(lesson),
  });

  const addTask = useCallback(
    (lesson: Lesson, text: string, dueDate: DayKey | null) => {
      const cur = dataRef.current;
      const task: Task = {
        id: newId(),
        lessonId: lesson.id,
        text: text.trim(),
        done: false,
        createdAt: new Date().toISOString(),
        completedAt: null,
        dueDate,
      };
      return commit({ ...cur, tasks: [...cur.tasks, task], lessons: withMeta(cur, lesson) });
    },
    [commit],
  );

  const updateTask = useCallback(
    (id: string, patch: Partial<Pick<Task, "text" | "done" | "dueDate">>) => {
      const cur = dataRef.current;
      return commit({
        ...cur,
        tasks: cur.tasks.map((t) => {
          if (t.id !== id) return t;
          const next = { ...t, ...patch };
          if (patch.done !== undefined && patch.done !== t.done) {
            next.completedAt = patch.done ? new Date().toISOString() : null;
          }
          return next;
        }),
      });
    },
    [commit],
  );

  const deleteTask = useCallback(
    (id: string) => {
      const cur = dataRef.current;
      return commit({ ...cur, tasks: cur.tasks.filter((t) => t.id !== id) });
    },
    [commit],
  );

  const setNote = useCallback(
    (lesson: Lesson, text: string) => {
      const cur = dataRef.current;
      const notes = { ...cur.notes };
      if (text.trim() === "") delete notes[lesson.id];
      else notes[lesson.id] = { lessonId: lesson.id, text, updatedAt: new Date().toISOString() };
      return commit({ ...cur, notes, lessons: withMeta(cur, lesson) });
    },
    [commit],
  );

  const replaceData = useCallback((next: PlannerData) => commit(next), [commit]);

  const resolveLesson = useCallback(
    (id: string): ResolvedLesson | null => {
      const live = lessonMap.get(id);
      if (live) return { ...live, missing: false };
      const meta = data.lessons[id];
      if (!meta) return null;
      return {
        ...meta,
        allDay: false,
        description: "",
        teachers: [],
        missing: true,
      };
    },
    [lessonMap, data.lessons],
  );

  // ---- Sheet --------------------------------------------------------------------------------
  const [selected, setSelected] = useState<{ id: string; tab: SheetTab } | null>(null);
  const openLesson = useCallback(
    (id: string, tab: SheetTab = "voorbereiding") => setSelected({ id, tab }),
    [],
  );
  const closeLesson = useCallback(() => setSelected(null), []);

  const value: PlannerContextValue = {
    roosterStatus,
    roosterFile,
    roosterError,
    fromCache,
    fetchedAt,
    reloadRooster,
    lessons,
    resolveLesson,
    data,
    storageWarning,
    saveError,
    addTask,
    updateTask,
    deleteTask,
    setNote,
    replaceData,
    openLesson,
    closeLesson,
    selected,
  };

  return <PlannerContext.Provider value={value}>{children}</PlannerContext.Provider>;
}

export function usePlanner(): PlannerContextValue {
  const ctx = useContext(PlannerContext);
  if (!ctx) throw new Error("usePlanner must be used inside <PlannerProvider>");
  return ctx;
}

/** Re-render every minute so "now", "today" and overdue states stay current. */
export function useNow(intervalMs = 60_000): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = window.setInterval(() => setNow(new Date()), intervalMs);
    return () => window.clearInterval(t);
  }, [intervalMs]);
  return now;
}

