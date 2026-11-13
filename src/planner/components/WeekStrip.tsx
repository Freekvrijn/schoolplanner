import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  addDays,
  dayOfMonth,
  formatDayLong,
  formatRange,
  formatWeekdayShort,
  isoWeekNumber,
  weekKeys,
  type DayKey,
} from "@/lib/dates";
import { cn } from "@/lib/utils";

export function WeekStrip({
  selected,
  today,
  onSelect,
  lessonDays,
}: {
  selected: DayKey;
  today: DayKey;
  onSelect: (k: DayKey) => void;
  lessonDays: Set<DayKey>;
}) {
  const days = weekKeys(selected);
  const first = days[0] ?? selected;
  const last = days[6] ?? selected;
  return (
    <div className="surface p-2 sm:p-3">
      <div className="mb-1 flex items-center justify-between gap-2 px-1">
        <Button
          variant="quiet"
          size="tap-icon"
          aria-label="Vorige week"
          onClick={() => onSelect(addDays(selected, -7))}
        >
          <ChevronLeft aria-hidden />
        </Button>
        <div className="text-center">
          <p className="label-mono text-muted-foreground">Week {isoWeekNumber(selected)}</p>
          <p className="text-sm font-medium">{formatRange(first, last)}</p>
        </div>
        <Button
          variant="quiet"
          size="tap-icon"
          aria-label="Volgende week"
          onClick={() => onSelect(addDays(selected, 7))}
        >
          <ChevronRight aria-hidden />
        </Button>
      </div>
      <div className="grid grid-cols-7 gap-1" role="group" aria-label="Kies een dag">
        {days.map((k) => {
          const isSel = k === selected;
          const isToday = k === today;
          return (
            <button
              key={k}
              type="button"
              onClick={() => onSelect(k)}
              aria-pressed={isSel}
              aria-label={`${formatDayLong(k)}${isToday ? " (vandaag)" : ""}${lessonDays.has(k) ? ", heeft lessen" : ""}`}
              className={cn(
                "flex min-h-[60px] flex-col items-center justify-center gap-1 rounded-lg text-sm transition-colors",
                isSel ? "bg-primary text-primary-foreground" : "hover:bg-accent",
              )}
            >
              <span
                className={cn(
                  "label-mono text-[10px]",
                  isSel ? "text-primary-foreground/70" : "text-muted-foreground",
                )}
              >
                {formatWeekdayShort(k)}
              </span>
              <span className={cn("font-semibold tabular-nums", isToday && !isSel && "text-azure")}>
                {dayOfMonth(k)}
              </span>
              <span
                className={cn(
                  "size-1.5 rounded-full",
                  lessonDays.has(k) ? (isSel ? "bg-lime" : "bg-violet") : "bg-transparent",
                )}
                aria-hidden
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}

