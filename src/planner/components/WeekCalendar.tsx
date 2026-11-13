import { useEffect, useRef } from "react";
import { CheckSquare, MapPin, NotebookPen } from "lucide-react";
import { courseName, courseTone, toneClasses } from "@/lib/course";
import { dayOfMonth, formatDayFull, formatTime, formatWeekdayShort, toDayKey, type DayKey } from "@/lib/dates";
import type { Lesson } from "@/lib/rooster";
import { clockMinute, GRID_HEIGHT, HOUR_HEIGHT, layoutWeekDay, touchesDay, WEEK_END_MINUTE, WEEK_START_MINUTE } from "@/lib/week-layout";
import { cn } from "@/lib/utils";
import { usePlanner } from "../state";

const HOURS = Array.from({ length: 11 }, (_, i) => i + 8);
const COLUMNS = "52px repeat(7, minmax(132px, 1fr))";

export function WeekCalendar({ days, lessons, today, now }: {
  days: DayKey[]; lessons: Lesson[]; today: DayKey; now: Date;
}) {
  const { openLesson, data } = usePlanner();
  const scroller = useRef<HTMLDivElement>(null);
  const firstDay = days[0];
  const todayIndex = days.indexOf(today);
  const minuteNow = clockMinute(now.toISOString());
  const showNow = minuteNow >= WEEK_START_MINUTE && minuteNow < WEEK_END_MINUTE;
  const layouts = days.map((day) => layoutWeekDay(lessons, day));
  const allDay = days.map((day) => lessons.filter((l) => l.allDay && touchesDay(l, day)));
  const hasAllDay = allDay.some((list) => list.length > 0);
  const visibleIds = new Set(layouts.flatMap((list) => list.map((p) => p.lesson.id)));
  const outside = lessons.filter((l) => !l.allDay && !visibleIds.has(l.id) && days.some((day) => touchesDay(l, day)));

  useEffect(() => {
    const element = scroller.current;
    if (!element) return;
    element.scrollLeft = window.matchMedia("(max-width: 767px)").matches && todayIndex >= 0
      ? todayIndex * ((element.scrollWidth - 52) / 7) : 0;
    element.scrollTop = 0;
  }, [firstDay, todayIndex]);

  return (
    <section aria-label="Weekagenda van 08:00 tot 18:00">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-1 text-xs text-muted-foreground">
        <span className="font-mono">08:00–18:00 · maandag t/m zondag</span>
        <span className="sm:hidden">Veeg voor de andere dagen ↔</span>
      </div>
      <div ref={scroller} tabIndex={0} role="region" aria-label="Weekraster, horizontaal en verticaal schuifbaar"
        className="relative isolate max-h-[75dvh] overflow-auto rounded-2xl border border-border bg-card overscroll-contain">
        <div className="relative min-w-[976px]">
          <div className="sticky top-0 z-30 grid border-b border-border bg-card" style={{ gridTemplateColumns: COLUMNS }}>
            <div className="sticky left-0 z-40 flex items-end justify-center border-r border-border bg-card pb-3 font-mono text-[10px] text-muted-foreground">TIJD</div>
            {days.map((day, index) => <div key={day} aria-label={formatDayFull(day)} className={cn(
              "flex h-[76px] items-center justify-center gap-2 border-r border-border last:border-r-0",
              index > 4 && "bg-secondary/40", day === today && "bg-lime-soft",
            )}>
              <span className="text-xs font-medium capitalize text-muted-foreground">{formatWeekdayShort(day)}</span>
              <span className={cn("grid size-9 place-items-center rounded-full text-lg font-semibold tabular-nums", day === today && "bg-primary text-primary-foreground")}>{dayOfMonth(day)}</span>
            </div>)}
          </div>
          {hasAllDay && <div className="grid border-b border-border" style={{ gridTemplateColumns: COLUMNS }}>
            <div className="sticky left-0 z-20 border-r border-border bg-card px-1 py-3 text-center text-[10px] text-muted-foreground">Hele dag</div>
            {allDay.map((list, index) => <div key={days[index]} className="space-y-1 border-r border-border p-1">
              {list.map((lesson) => <button key={lesson.id} type="button" onClick={() => openLesson(lesson.id)} className="min-h-11 w-full rounded-md bg-violet-soft px-2 text-left text-xs font-medium text-violet">{courseName(lesson.title)}</button>)}
            </div>)}
          </div>}
          <div className="grid" style={{ gridTemplateColumns: COLUMNS }}>
            <div className="sticky left-0 z-20 border-r border-border bg-card" style={{ height: GRID_HEIGHT + 24 }}>
              {HOURS.map((hour) => <span key={hour} className="absolute inset-x-0 pr-2 text-right font-mono text-[10px] text-muted-foreground" style={{ top: (hour - 8) * HOUR_HEIGHT + 2 }}>{String(hour).padStart(2, "0")}:00</span>)}
            </div>
            {days.map((day, index) => <div key={day} className={cn("relative border-r border-border last:border-r-0", index > 4 && "bg-secondary/30", day === today && "bg-lime-soft/20")} style={{ height: GRID_HEIGHT + 24 }}>
              {HOURS.map((hour) => <div key={hour} aria-hidden className="pointer-events-none absolute inset-x-0 border-t border-border" style={{ top: (hour - 8) * HOUR_HEIGHT }} />)}
              {HOURS.slice(0, -1).map((hour) => <div key={hour} aria-hidden className="pointer-events-none absolute inset-x-0 border-t border-dashed border-border/50" style={{ top: (hour - 8 + 0.5) * HOUR_HEIGHT }} />)}
              {layouts[index]?.map(({ lesson, startMinute, endMinute, column, columns, clippedStart, clippedEnd }) => {
                const name = courseName(lesson.title);
                const tone = toneClasses[courseTone(name)];
                const tasks = data.tasks.filter((t) => t.lessonId === lesson.id);
                const open = tasks.filter((t) => !t.done).length;
                const hasNote = Boolean(data.notes[lesson.id]?.text.trim());
                const height = ((endMinute - startMinute) / 60) * HOUR_HEIGHT;
                const short = height < 76;
                return <button key={lesson.id} type="button" onClick={() => openLesson(lesson.id)}
                  aria-label={`${lesson.title}, ${formatDayFull(day)}, ${formatTime(lesson.start)} tot ${formatTime(lesson.end)}${lesson.location ? `, ${lesson.location}` : ""}`}
                  title={`${lesson.title}\n${formatTime(lesson.start)}–${formatTime(lesson.end)}\n${lesson.location}`}
                  className={cn("absolute z-10 flex flex-col overflow-hidden rounded-lg border border-current/15 border-l-[3px] p-2 text-left text-xs transition-shadow hover:z-20 hover:shadow-raised focus-visible:z-20", tone.soft, tone.text)}
                  style={{ top: ((startMinute - WEEK_START_MINUTE) / 60) * HOUR_HEIGHT + 1, height: Math.max(22, height - 3), left: `calc(${column * 100 / columns}% + 3px)`, width: `calc(${100 / columns}% - 6px)` }}>
                  <span className={cn("font-semibold leading-tight break-words", short ? "line-clamp-1" : "line-clamp-3")}>{name}</span>
                  <span className="mt-1 whitespace-nowrap font-mono text-[10px] tabular-nums">{clippedStart && "↑ "}{formatTime(lesson.start)}–{formatTime(lesson.end)}{clippedEnd && " ↓"}</span>
                  {!short && lesson.location && <span className="mt-1 flex min-w-0 items-start gap-1 leading-tight"><MapPin className="mt-px size-3 shrink-0" aria-hidden /><span className="line-clamp-2 break-words">{lesson.location}</span></span>}
                  {!short && (tasks.length > 0 || hasNote) && <span className="mt-auto flex flex-wrap items-center gap-x-2 gap-y-1 pt-2 text-[10px]">
                    {tasks.length > 0 && <span className="flex items-center gap-1"><CheckSquare className="size-3" aria-hidden />{open > 0 ? `${open} te doen` : "Klaar"}</span>}
                    {hasNote && <NotebookPen className="size-3" aria-label="Heeft aantekeningen" />}
                  </span>}
                </button>;
              })}
              {day === today && showNow && <div aria-label={`Nu ${formatTime(now.toISOString())}`} className="pointer-events-none absolute inset-x-0 z-20 border-t-2 border-destructive" style={{ top: ((minuteNow - WEEK_START_MINUTE) / 60) * HOUR_HEIGHT }}>
                <span className="absolute -top-[5px] -left-1 size-2 rounded-full bg-destructive" />
              </div>}
            </div>)}
          </div>
        </div>
      </div>
      {outside.length > 0 && <div className="mt-3 rounded-xl border border-border bg-card p-3 text-sm">
        <p className="mb-2 font-medium">Buiten 08:00–18:00</p>
        <ul className="space-y-1">{outside.map((lesson) => <li key={lesson.id}><button type="button" onClick={() => openLesson(lesson.id)} className="min-h-11 text-left text-muted-foreground underline underline-offset-2">
          {courseName(lesson.title)} · {formatDayFull(toDayKey(lesson.start))} · {formatTime(lesson.start)}–{formatTime(lesson.end)}
        </button></li>)}</ul>
      </div>}
    </section>
  );
}
