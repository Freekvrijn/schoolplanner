import { useMemo, useState } from "react";
import { ArrowRight, CalendarCheck, CheckCircle2, Clock, ListTodo, MapPin } from "lucide-react";

import { Button } from "@/components/ui/button";
import { courseName, lessonType } from "@/lib/course";
import {
  formatDayLong,
  formatDayShort,
  formatTime,
  greeting,
  isoWeekNumber,
  relativeDayLabel,
  toDayKey,
  todayKey,
  weekKeys,
  type DayKey,
} from "@/lib/dates";
import { taskDeadline, taskStatus } from "@/lib/tasks";
import { cn } from "@/lib/utils";
import { EmptyState, PageHeader, SectionHeading } from "../components/bits";
import { LessonRow } from "../components/LessonRow";
import { RoosterEmpty } from "../components/RoosterEmpty";
import { RoosterStatus } from "../components/RoosterStatus";
import { TaskItem } from "../components/TaskItem";
import { WeekStrip } from "../components/WeekStrip";
import type { RouteName } from "../hash-route";
import { groupByDay, nextLesson } from "../lesson-utils";
import { useNow, usePlanner } from "../state";

export function TodayView({ go }: { go: (r: RouteName) => void }) {
  const now = useNow();
  const today = todayKey(now);
  const { lessons, data, openLesson, resolveLesson, updateTask } = usePlanner();
  const [day, setDay] = useState<DayKey>(today);

  const byDay = useMemo(() => groupByDay(lessons), [lessons]);
  const lessonDays = useMemo(() => new Set(byDay.keys()), [byDay]);
  const dayLessons = byDay.get(day) ?? [];
  const next = nextLesson(lessons, now);

  const openTasks = useMemo(() => {
    return data.tasks
      .filter((t) => !t.done)
      .map((t) => {
        const lesson = resolveLesson(t.lessonId);
        const start = lesson?.start ?? t.createdAt;
        const deadline = taskDeadline(t, start);
        return { task: t, lesson, start, deadline, status: taskStatus(t, deadline, today) };
      })
      .sort((a, b) => a.deadline.localeCompare(b.deadline) || Date.parse(a.start) - Date.parse(b.start));
  }, [data.tasks, resolveLesson, today]);

  // Progress for the current week (Mon–Sun), real data only.
  const week = weekKeys(today);
  const weekStart = week[0] ?? today;
  const weekEnd = week[6] ?? today;
  const weekLessons = lessons.filter((l) => {
    const k = toDayKey(l.start);
    return k >= weekStart && k <= weekEnd;
  });
  const weekLessonIds = new Set(weekLessons.map((l) => l.id));
  const weekTasks = data.tasks.filter((t) => weekLessonIds.has(t.lessonId));
  const weekDone = weekTasks.filter((t) => t.done).length;
  const noteCount = Object.values(data.notes).filter((n) => n.text.trim()).length;
  const overdue = openTasks.filter((x) => x.status === "overdue").length;

  const dayTitle = relativeDayLabel(day, today) ?? formatDayLong(day);

  return (
    <>
      <PageHeader
        eyebrow={
          <>
            {formatDayLong(today)} · week {isoWeekNumber(today)}
          </>
        }
        title="Alles klaar voor je volgende les."
      >
        <p className="mt-2 text-muted-foreground">{greeting(now)}, Freek.</p>
        <RoosterStatus className="mt-3" />
      </PageHeader>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)] lg:gap-10">
        <div className="min-w-0 space-y-8">
          <section aria-labelledby="next-heading">
            <SectionHeading id="next-heading">
              {next && Date.parse(next.start) <= now.getTime() ? "Nu bezig" : "Eerstvolgende les"}
            </SectionHeading>
            {next ? (
              <NextLessonCard
                lessonId={next.id}
                title={next.title}
                start={next.start}
                end={next.end}
                location={next.location}
                today={today}
                tasks={data.tasks.filter((t) => t.lessonId === next.id)}
                onOpen={() => openLesson(next.id)}
              />
            ) : lessons.length === 0 ? (
              <RoosterEmpty />
            ) : (
              <EmptyState
                icon={CalendarCheck}
                title="Geen komende lessen"
                action={
                  <Button variant="soft" size="tap" onClick={() => go("agenda")}>
                    Bekijk agenda
                  </Button>
                }
              >
                Er staan geen komende lessen meer in het rooster. Eerdere lessen vind je in de agenda.
              </EmptyState>
            )}
          </section>

          {lessons.length > 0 && (
            <section aria-labelledby="day-heading">
              <WeekStrip selected={day} today={today} onSelect={setDay} lessonDays={lessonDays} />
              <div className="mt-6">
                <SectionHeading
                  id="day-heading"
                  aside={
                    day !== today ? (
                      <Button variant="quiet" size="tap" onClick={() => setDay(today)}>
                        Naar vandaag
                      </Button>
                    ) : undefined
                  }
                >
                  {dayTitle}
                  {relativeDayLabel(day, today) && (
                    <span className="normal-case tracking-normal"> · {formatDayShort(day)}</span>
                  )}
                </SectionHeading>
                {dayLessons.length > 0 ? (
                  <div className="space-y-2">
                    {dayLessons.map((l) => (
                      <LessonRow key={l.id} lesson={l} now={now} />
                    ))}
                  </div>
                ) : (
                  <EmptyState icon={CalendarCheck} title={day === today ? "Vandaag geen lessen" : "Geen lessen op deze dag"}>
                    {next
                      ? `Je eerstvolgende les is ${(relativeDayLabel(toDayKey(next.start), today) ?? formatDayLong(toDayKey(next.start))).toLowerCase()} om ${formatTime(next.start)}.`
                      : "Er staan geen komende lessen in het rooster."}
                  </EmptyState>
                )}
              </div>
            </section>
          )}
        </div>

        <aside className="min-w-0 space-y-8" aria-label="Overzicht">
          <section aria-labelledby="todo-heading">
            <SectionHeading
              id="todo-heading"
              aside={
                openTasks.length > 0 ? (
                  <Button variant="quiet" size="tap" onClick={() => go("taken")}>
                    Alle taken <ArrowRight aria-hidden />
                  </Button>
                ) : undefined
              }
            >
              Nog te doen
            </SectionHeading>
            {openTasks.length === 0 ? (
              <EmptyState icon={ListTodo} title="Niets open">
                Open een les en voeg bij “Voorbereiding” toe wat je vooraf moet doen.
              </EmptyState>
            ) : (
              <ul className="space-y-2">
                {openTasks.slice(0, 5).map(({ task, lesson, deadline, status }) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    deadline={deadline}
                    status={status}
                    isLessonDay={task.dueDate === null}
                    editable={false}
                    onToggle={() => updateTask(task.id, { done: !task.done })}
                    context={
                      lesson && (
                        <button
                          type="button"
                          onClick={() => openLesson(lesson.id)}
                          className="min-h-6 text-left underline decoration-border underline-offset-2 hover:text-foreground"
                        >
                          {courseName(lesson.title)}
                        </button>
                      )
                    }
                  />
                ))}
                {openTasks.length > 5 && (
                  <li className="px-1 text-sm text-muted-foreground">
                    + {openTasks.length - 5} meer
                  </li>
                )}
              </ul>
            )}
          </section>

          <section aria-labelledby="progress-heading" className="surface p-5">
            <SectionHeading id="progress-heading">Deze week</SectionHeading>
            <div className="flex items-end justify-between gap-3">
              <p className="text-3xl font-semibold tabular-nums">
                {weekDone}
                <span className="text-lg text-muted-foreground">/{weekTasks.length}</span>
              </p>
              <p className="pb-1 text-right text-sm text-muted-foreground">
                voorbereidingstaken
                <br />
                afgerond
              </p>
            </div>
            <div
              className="mt-3 h-2 overflow-hidden rounded-full bg-secondary"
              role="progressbar"
              aria-label="Voortgang voorbereiding deze week"
              aria-valuemin={0}
              aria-valuemax={weekTasks.length || 1}
              aria-valuenow={weekDone}
            >
              <div
                className="h-full rounded-full bg-lime transition-[width]"
                style={{ width: `${weekTasks.length ? (weekDone / weekTasks.length) * 100 : 0}%` }}
              />
            </div>
            <dl className="mt-5 grid grid-cols-3 gap-3 border-t border-border pt-4 text-sm">
              <Stat label="Lessen" value={weekLessons.length} />
              <Stat label="Notities" value={noteCount} />
              <Stat label="Te laat" value={overdue} warn={overdue > 0} />
            </dl>
          </section>
        </aside>
      </div>
    </>
  );
}

function Stat({ label, value, warn }: { label: string; value: number; warn?: boolean }) {
  return (
    <div>
      <dt className="label-mono text-[10px] text-muted-foreground">{label}</dt>
      <dd className={cn("mt-0.5 text-lg font-semibold tabular-nums", warn && "text-destructive")}>{value}</dd>
    </div>
  );
}

function NextLessonCard({
  title,
  start,
  end,
  location,
  today,
  tasks,
  onOpen,
}: {
  lessonId: string;
  title: string;
  start: string;
  end: string;
  location: string;
  today: DayKey;
  tasks: { done: boolean }[];
  onOpen: () => void;
}) {
  const day = toDayKey(start);
  const rel = relativeDayLabel(day, today);
  const done = tasks.filter((t) => t.done).length;
  const type = lessonType(title);
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group relative w-full overflow-hidden rounded-2xl bg-primary p-5 text-left text-primary-foreground shadow-raised sm:p-6"
    >
      <span className="absolute -top-16 -right-16 size-48 rounded-full bg-lime/15" aria-hidden />
      <span className="relative flex flex-wrap items-center gap-2">
        <span className="label-mono rounded-full bg-lime px-2.5 py-1 text-lime-foreground">
          {rel ?? formatDayShort(day)}
        </span>
        {type && <span className="label-mono text-primary-foreground/70">{type}</span>}
      </span>
      <span className="relative mt-4 block text-2xl leading-tight font-semibold tracking-tight sm:text-[1.75rem]">
        {courseName(title)}
      </span>
      <span className="relative mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-primary-foreground/80">
        <span className="flex items-center gap-1.5 font-mono tabular-nums">
          <Clock className="size-4" aria-hidden />
          {formatTime(start)}–{formatTime(end)}
        </span>
        {location && (
          <span className="flex items-center gap-1.5">
            <MapPin className="size-4" aria-hidden />
            {location}
          </span>
        )}
      </span>
      <span className="relative mt-5 flex items-center justify-between gap-3 border-t border-primary-foreground/15 pt-4 text-sm">
        <span className="flex items-center gap-1.5 text-primary-foreground/80">
          <CheckCircle2 className="size-4" aria-hidden />
          {tasks.length === 0
            ? "Nog geen voorbereiding"
            : `${done} van ${tasks.length} voorbereid`}
        </span>
        <span className="flex items-center gap-1 font-medium">
          Open les
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
        </span>
      </span>
    </button>
  );
}

