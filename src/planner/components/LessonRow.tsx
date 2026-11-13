import { Archive, CheckSquare, MapPin, NotebookPen } from "lucide-react";

import { courseName, courseTone, lessonType, toneClasses } from "@/lib/course";
import { formatTime } from "@/lib/dates";
import type { Lesson } from "@/lib/rooster";
import { cn } from "@/lib/utils";
import { usePlanner } from "../state";

export function LessonRow({ lesson, now }: { lesson: Lesson; now: Date }) {
  const { openLesson, data } = usePlanner();
  const name = courseName(lesson.title);
  const type = lessonType(lesson.title);
  const tone = toneClasses[courseTone(name)];
  const tasks = data.tasks.filter((t) => t.lessonId === lesson.id);
  const open = tasks.filter((t) => !t.done).length;
  const hasNote = Boolean(data.notes[lesson.id]?.text.trim());
  const t = now.getTime();
  const live = Date.parse(lesson.start) <= t && t < Date.parse(lesson.end);
  const past = Date.parse(lesson.end) <= t;

  return (
    <button
      type="button"
      onClick={() => openLesson(lesson.id)}
      className={cn(
        "group flex w-full items-stretch gap-3 rounded-xl border border-border bg-card p-3 text-left transition-shadow hover:shadow-raised sm:gap-4 sm:p-4",
        past && "bg-card/60",
      )}
      aria-label={`${lesson.title}, ${formatTime(lesson.start)} tot ${formatTime(lesson.end)}${lesson.location ? `, ${lesson.location}` : ""}`}
    >
      <span className="flex w-12 shrink-0 flex-col font-mono text-sm leading-5 tabular-nums">
        <span className={cn("font-medium", past && "text-muted-foreground")}>
          {formatTime(lesson.start)}
        </span>
        <span className="text-muted-foreground">{formatTime(lesson.end)}</span>
      </span>
      <span className={cn("w-1 shrink-0 rounded-full", tone.bar, past && "opacity-40")} aria-hidden />
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
          {live && (
            <span className="label-mono rounded-full bg-lime px-2 py-0.5 text-lime-foreground">Nu</span>
          )}
          {type && <span className={cn("label-mono", tone.text)}>{type}</span>}
          {lesson.archived && (
            <span className="label-mono flex items-center gap-1 text-muted-foreground">
              <Archive className="size-3" aria-hidden /> Archief
            </span>
          )}
        </span>
        <span
          className={cn(
            "mt-0.5 block font-semibold leading-snug break-words",
            past && "text-muted-foreground",
          )}
        >
          {name}
        </span>
        <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
          {lesson.location && (
            <span className="flex min-w-0 items-center gap-1">
              <MapPin className="size-3.5 shrink-0" aria-hidden />
              <span className="truncate">{lesson.location}</span>
            </span>
          )}
          {tasks.length > 0 && (
            <span className={cn("flex items-center gap-1", open > 0 && !past && "text-foreground")}>
              <CheckSquare className="size-3.5" aria-hidden />
              {open > 0 ? `${open} te doen` : "klaar"}
            </span>
          )}
          {hasNote && (
            <span className="flex items-center gap-1">
              <NotebookPen className="size-3.5" aria-hidden />
              notitie
            </span>
          )}
        </span>
      </span>
    </button>
  );
}

