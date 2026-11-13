import { formatTime, toDayKey, type DayKey } from "./dates";
import type { Lesson } from "./rooster";

export const WEEK_START_MINUTE = 8 * 60;
export const WEEK_END_MINUTE = 18 * 60;
export const HOUR_HEIGHT = 88;
export const GRID_HEIGHT = ((WEEK_END_MINUTE - WEEK_START_MINUTE) / 60) * HOUR_HEIGHT;

export function clockMinute(iso: string): number {
  const [hours = 0, minutes = 0] = formatTime(iso).split(":").map(Number);
  return hours * 60 + minutes;
}

export type WeekPlacement = {
  lesson: Lesson; startMinute: number; endMinute: number;
  column: number; columns: number; clippedStart: boolean; clippedEnd: boolean;
};

export function touchesDay(lesson: Lesson, day: DayKey): boolean {
  return toDayKey(lesson.start) <= day && toDayKey(Date.parse(lesson.end) - 1) >= day;
}

/** Simultaneous lessons get separate columns. Only their drawing is clipped to the time window. */
export function layoutWeekDay(lessons: Lesson[], day: DayKey): WeekPlacement[] {
  const placed = lessons.flatMap((lesson): WeekPlacement[] => {
    if (lesson.allDay || !touchesDay(lesson, day)) return [];
    const rawStart = toDayKey(lesson.start) < day ? 0 : clockMinute(lesson.start);
    const rawEnd = toDayKey(lesson.end) > day ? 1440 : clockMinute(lesson.end);
    const startMinute = Math.max(WEEK_START_MINUTE, rawStart);
    const endMinute = Math.min(WEEK_END_MINUTE, rawEnd);
    if (endMinute <= startMinute) return [];
    return [{ lesson, startMinute, endMinute, column: 0, columns: 1,
      clippedStart: rawStart < WEEK_START_MINUTE, clippedEnd: rawEnd > WEEK_END_MINUTE }];
  }).sort((a, b) => a.startMinute - b.startMinute || b.endMinute - a.endMinute || a.lesson.id.localeCompare(b.lesson.id));
  let group: WeekPlacement[] = [];
  let groupEnd = -1;
  const finishGroup = () => {
    const ends: number[] = [];
    for (const item of group) {
      let column = ends.findIndex((end) => end <= item.startMinute);
      if (column === -1) column = ends.length;
      ends[column] = item.endMinute;
      item.column = column;
    }
    for (const item of group) item.columns = ends.length;
  };
  for (const item of placed) {
    if (item.startMinute >= groupEnd) { finishGroup(); group = []; groupEnd = -1; }
    group.push(item);
    groupEnd = Math.max(groupEnd, item.endMinute);
  }
  finishGroup();
  return placed;
}
