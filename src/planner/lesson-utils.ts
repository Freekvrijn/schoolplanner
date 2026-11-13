import { courseName } from "@/lib/course";
import { toDayKey, type DayKey } from "@/lib/dates";
import type { Lesson } from "@/lib/rooster";

export function groupByDay(lessons: Lesson[]): Map<DayKey, Lesson[]> {
  const map = new Map<DayKey, Lesson[]>();
  for (const l of lessons) {
    const k = toDayKey(l.start);
    const list = map.get(k);
    if (list) list.push(l);
    else map.set(k, [l]);
  }
  return map;
}

export function matchesQuery(lesson: Lesson, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const hay = [lesson.title, lesson.location, ...lesson.teachers.map((t) => t.name)]
    .join(" ")
    .toLowerCase();
  return q.split(/\s+/).every((part) => hay.includes(part));
}

export function distinctCourses(lessons: Lesson[]): string[] {
  return [...new Set(lessons.map((l) => courseName(l.title)))].sort((a, b) =>
    a.localeCompare(b, "nl"),
  );
}

/** Ongoing lesson, otherwise the next one to start. */
export function nextLesson(lessons: Lesson[], now: Date): Lesson | null {
  const t = now.getTime();
  return lessons.find((l) => Date.parse(l.end) > t) ?? null;
}

