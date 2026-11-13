import { toDayKey, type DayKey } from "./dates";
import type { Task } from "./planner-storage";

export type TaskStatus = "done" | "overdue" | "today" | "upcoming";

/** The deadline is the optional earlier date, otherwise the lesson day. */
export function taskDeadline(task: Pick<Task, "dueDate">, lessonStart: string): DayKey {
  return task.dueDate ?? toDayKey(lessonStart);
}

export function taskStatus(task: Pick<Task, "done">, deadline: DayKey, today: DayKey): TaskStatus {
  if (task.done) return "done";
  if (deadline < today) return "overdue";
  if (deadline === today) return "today";
  return "upcoming";
}

/** Is an optional earlier deadline allowed for a lesson on `lessonDay`? */
export function isValidDueDate(dueDate: DayKey, lessonDay: DayKey): boolean {
  return dueDate <= lessonDay;
}

