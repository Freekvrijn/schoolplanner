import { useMemo, useState } from "react";
import { CalendarSearch, ChevronLeft, ChevronRight, History, Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { courseName } from "@/lib/course";
import {
  addDays,
  formatDayLong,
  formatDayShort,
  formatRange,
  isoWeekNumber,
  relativeDayLabel,
  toDayKey,
  todayKey,
  weekKeys,
  type DayKey,
} from "@/lib/dates";
import type { Lesson } from "@/lib/rooster";
import { cn } from "@/lib/utils";
import { EmptyState, PageHeader, Segmented } from "../components/bits";
import { LessonRow } from "../components/LessonRow";
import { WeekCalendar } from "../components/WeekCalendar";
import { RoosterEmpty } from "../components/RoosterEmpty";
import { RoosterStatus } from "../components/RoosterStatus";
import { distinctCourses, groupByDay, matchesQuery } from "../lesson-utils";
import { useNow, usePlanner } from "../state";

type Mode = "dag" | "week" | "lijst" | "komend";

export function AgendaView() {
  const now = useNow();
  const today = todayKey(now);
  const { lessons } = usePlanner();
  const [mode, setMode] = useState<Mode>("week");
  const [anchor, setAnchor] = useState<DayKey>(today);
  const [query, setQuery] = useState("");
  const [course, setCourse] = useState<string | null>(null);
  const [showPast, setShowPast] = useState(false);

  const courses = useMemo(() => distinctCourses(lessons), [lessons]);
  const filtered = useMemo(
    () =>
      lessons.filter(
        (l) => matchesQuery(l, query) && (course === null || courseName(l.title) === course),
      ),
    [lessons, query, course],
  );
  const byDay = useMemo(() => groupByDay(filtered), [filtered]);
  const filtering = query.trim() !== "" || course !== null;

  let days: DayKey[];
  if (mode === "dag") days = [anchor];
  else if (mode === "week" || mode === "lijst") days = weekKeys(anchor);
  else {
    days = [...byDay.keys()].filter((k) => showPast || k >= today);
  }

  const step = mode === "dag" ? 1 : 7;
  const rangeLabel =
    mode === "dag"
      ? (relativeDayLabel(anchor, today) ?? formatDayLong(anchor))
      : `Week ${isoWeekNumber(anchor)} · ${formatRange(days[0] ?? anchor, days[6] ?? anchor)}`;

  const pastCount = [...byDay.keys()].filter((k) => k < today).length;
  const nextDayWithLessons = [...byDay.keys()].find((k) => k > anchor);

  return (
    <>
      <PageHeader eyebrow="Rooster" title="Agenda">
        <RoosterStatus className="mt-3" />
      </PageHeader>

      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Segmented<Mode>
            label="Weergave"
            value={mode}
            onChange={setMode}
            options={[
              { value: "dag", label: "Dag" },
              { value: "week", label: "Week" },
              { value: "lijst", label: "Lijst" },
              { value: "komend", label: "Alles" },
            ]}
            className="w-full sm:w-auto"
          />
          {mode !== "komend" && (
            <div className="flex items-center gap-1">
              <Button
                variant="soft"
                size="tap-icon"
                aria-label={mode === "dag" ? "Vorige dag" : "Vorige week"}
                onClick={() => setAnchor(addDays(anchor, -step))}
              >
                <ChevronLeft aria-hidden />
              </Button>
              <Button
                variant="soft"
                size="tap"
                onClick={() => setAnchor(today)}
                disabled={mode === "dag" ? anchor === today : weekKeys(anchor).includes(today)}
              >
                Vandaag
              </Button>
              <Button
                variant="soft"
                size="tap-icon"
                aria-label={mode === "dag" ? "Volgende dag" : "Volgende week"}
                onClick={() => setAnchor(addDays(anchor, step))}
              >
                <ChevronRight aria-hidden />
              </Button>
            </div>
          )}
        </div>

        <div className="relative">
          <label htmlFor="agenda-search" className="sr-only">
            Zoek op vak, lokaal of docent
          </label>
          <Search
            className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <input
            id="agenda-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Zoek op vak, lokaal of docent"
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

        {courses.length > 1 && (
          <div
            className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0"
            role="group"
            aria-label="Filter op vak"
          >
            {[null, ...courses].map((c) => {
              const active = course === c;
              return (
                <button
                  key={c ?? "__all"}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setCourse(c)}
                  className={cn(
                    "h-11 shrink-0 rounded-full border px-4 text-sm font-medium whitespace-nowrap transition-colors",
                    active
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card hover:bg-accent",
                  )}
                >
                  {c ?? "Alle vakken"}
                </button>
              );
            })}
          </div>
        )}

        {mode !== "komend" && (
          <p className="label-mono pt-2 text-muted-foreground" aria-live="polite">
            {rangeLabel}
          </p>
        )}
      </div>

      <div className="mt-4">
        {lessons.length === 0 ? (
          <RoosterEmpty />
        ) : (
          <>
            {mode === "komend" && pastCount > 0 && (
              <Button
                variant="soft"
                size="tap"
                className="mb-4"
                onClick={() => setShowPast((v) => !v)}
                aria-expanded={showPast}
              >
                <History aria-hidden />
                {showPast ? "Verberg eerdere lessen" : `Toon eerdere lessen (${pastCount} dagen)`}
              </Button>
            )}
            {mode === "week" ? <WeekCalendar days={days} lessons={filtered} today={today} now={now} /> : <DayList
              days={days}
              byDay={byDay}
              today={today}
              now={now}
              showEmptyDays={mode === "lijst"}
            />}
            {days.every((k) => !(byDay.get(k)?.length)) && (
              <EmptyState
                icon={CalendarSearch}
                title={filtering ? "Geen lessen gevonden" : mode === "dag" ? "Geen lessen op deze dag" : "Geen lessen"}
                className={mode === "week" ? "mt-4" : ""}
                action={
                  filtering ? (
                    <Button
                      variant="soft"
                      size="tap"
                      onClick={() => {
                        setQuery("");
                        setCourse(null);
                      }}
                    >
                      Filters wissen
                    </Button>
                  ) : mode !== "komend" && nextDayWithLessons ? (
                    <Button variant="soft" size="tap" onClick={() => setAnchor(nextDayWithLessons)}>
                      Naar {formatDayShort(nextDayWithLessons)}
                    </Button>
                  ) : undefined
                }
              >
                {filtering ? "Pas je zoekopdracht of vakfilter aan." : "Kies een andere periode."}
              </EmptyState>
            )}
          </>
        )}
      </div>
    </>
  );
}

function DayList({
  days,
  byDay,
  today,
  now,
  showEmptyDays,
}: {
  days: DayKey[];
  byDay: Map<DayKey, Lesson[]>;
  today: DayKey;
  now: Date;
  showEmptyDays: boolean;
}) {
  const anyLessons = days.some((k) => byDay.get(k)?.length);
  if (!anyLessons) return null;
  return (
    <div className="space-y-6">
      {days.map((k) => {
        const list = byDay.get(k) ?? [];
        if (!list.length && !showEmptyDays) return null;
        const rel = relativeDayLabel(k, today);
        return (
          <section key={k} aria-label={formatDayLong(k)}>
            <h2
              className={cn(
                "mb-2 flex items-baseline gap-2 text-sm font-semibold first-letter:uppercase",
                k < today && "text-muted-foreground",
              )}
            >
              <span className="first-letter:uppercase">{rel ?? formatDayLong(k)}</span>
              {rel && <span className="font-normal text-muted-foreground">{formatDayShort(k)}</span>}
              {k === today && <span className="size-1.5 rounded-full bg-lime" aria-hidden />}
            </h2>
            {list.length ? (
              <div className="space-y-2">
                {list.map((l) => (
                  <LessonRow key={l.id} lesson={l} now={now} />
                ))}
              </div>
            ) : (
              <p className="rounded-xl border border-dashed border-border px-4 py-3 text-sm text-muted-foreground">
                Geen lessen
              </p>
            )}
          </section>
        );
      })}
    </div>
  );
}


