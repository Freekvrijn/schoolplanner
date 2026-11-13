import { useMemo, useState } from "react";
import { NotebookPen, Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { courseName } from "@/lib/course";
import { formatDateTime, formatDayShort, formatTime, toDayKey } from "@/lib/dates";
import { EmptyState, PageHeader } from "../components/bits";
import { usePlanner } from "../state";

export function NotesView() {
  const { data, resolveLesson, openLesson } = usePlanner();
  const [query, setQuery] = useState("");

  const notes = useMemo(() => {
    const q = query.trim().toLowerCase();
    return Object.values(data.notes)
      .filter((n) => n.text.trim())
      .map((n) => ({ note: n, lesson: resolveLesson(n.lessonId) }))
      .filter(({ note, lesson }) => {
        if (!q) return true;
        const hay = `${note.text} ${lesson?.title ?? ""} ${lesson?.location ?? ""}`.toLowerCase();
        return q.split(/\s+/).every((p) => hay.includes(p));
      })
      .sort((a, b) => Date.parse(b.lesson?.start ?? b.note.updatedAt) - Date.parse(a.lesson?.start ?? a.note.updatedAt));
  }, [data.notes, resolveLesson, query]);

  const total = Object.values(data.notes).filter((n) => n.text.trim()).length;

  return (
    <>
      <PageHeader eyebrow={`${total} ${total === 1 ? "les" : "lessen"} met notities`} title="Aantekeningen" />

      {total > 0 && (
        <div className="relative mb-6 lg:max-w-xl">
          <label htmlFor="notes-search" className="sr-only">
            Zoek in aantekeningen
          </label>
          <Search
            className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <input
            id="notes-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Zoek in aantekeningen of op vak"
            className="h-12 w-full rounded-xl border border-input bg-card pr-12 pl-10 text-base placeholder:text-muted-foreground"
          />
          {query && (
            <Button
              variant="quiet"
              size="tap-icon"
              aria-label="Zoekopdracht wissen"
              onClick={() => setQuery("")}
              className="absolute top-1/2 right-0.5 -translate-y-1/2"
            >
              <X aria-hidden />
            </Button>
          )}
        </div>
      )}

      {total === 0 ? (
        <EmptyState icon={NotebookPen} title="Nog geen aantekeningen">
          Open een les en kies “Aantekeningen” om tijdens of na de les te typen. Alles wordt
          automatisch opgeslagen.
        </EmptyState>
      ) : notes.length === 0 ? (
        <EmptyState icon={Search} title="Niets gevonden">
          Geen aantekeningen die passen bij “{query}”.
        </EmptyState>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {notes.map(({ note, lesson }) => (
            <li key={note.lessonId}>
              <button
                type="button"
                onClick={() => lesson && openLesson(lesson.id, "aantekeningen")}
                disabled={!lesson}
                className="surface flex h-full w-full flex-col p-4 text-left transition-shadow hover:shadow-raised"
              >
                <span className="label-mono text-muted-foreground">
                  {lesson
                    ? `${formatDayShort(toDayKey(lesson.start))} · ${formatTime(lesson.start)}`
                    : "Onbekende les"}
                  {lesson?.missing && " · niet meer in rooster"}
                </span>
                <span className="mt-1 font-semibold break-words">
                  {lesson ? courseName(lesson.title) : "Les"}
                </span>
                <span className="mt-2 line-clamp-3 text-sm break-words whitespace-pre-line text-muted-foreground">
                  {note.text}
                </span>
                <span className="mt-3 text-xs text-muted-foreground">
                  Bewerkt {formatDateTime(note.updatedAt)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

