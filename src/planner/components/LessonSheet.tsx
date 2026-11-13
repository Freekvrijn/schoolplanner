import { useCallback, useEffect, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import * as Tabs from "@radix-ui/react-tabs";
import {
  AlertTriangle,
  Archive,
  CalendarDays,
  ListTodo,
  Clock,
  MapPin,
  Plus,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { courseName, courseTone, lessonType, toneClasses } from "@/lib/course";
import {
  durationLabel,
  formatDayFull,
  formatDayShort,
  formatTime,
  isDayKey,
  toDayKey,
  todayKey,
} from "@/lib/dates";
import { isValidDueDate, taskDeadline, taskStatus } from "@/lib/tasks";
import { cn } from "@/lib/utils";
import { usePlanner, type ResolvedLesson, type SheetTab } from "../state";
import { EmptyState } from "./bits";
import { TaskItem } from "./TaskItem";


export function LessonSheet() {
  const { selected, closeLesson, resolveLesson } = usePlanner();
  const lesson = selected ? resolveLesson(selected.id) : null;
  const [tab, setTab] = useState<SheetTab>("voorbereiding");

  useEffect(() => {
    if (selected) setTab(selected.tab);
  }, [selected]);

  return (
    <Dialog.Root open={Boolean(selected && lesson)} onOpenChange={(o) => !o && closeLesson()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-overlay data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <Dialog.Content
          onEscapeKeyDown={(e) => {
            const target = e.target as HTMLElement | null;
            if (target?.closest?.("[data-escape-local]")) e.preventDefault();
          }}
          className={cn(
            "fixed z-50 flex flex-col bg-background shadow-sheet outline-none",
            "inset-x-0 bottom-0 max-h-[92dvh] rounded-t-2xl",
            "lg:inset-y-0 lg:right-0 lg:left-auto lg:max-h-none lg:w-[520px] lg:rounded-none lg:rounded-l-2xl",
            "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom lg:data-[state=open]:slide-in-from-right lg:data-[state=closed]:slide-out-to-right data-[state=open]:duration-300",
          )}
        >
          {lesson && <SheetBody key={lesson.id} lesson={lesson} tab={tab} onTab={setTab} />}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function SheetBody({
  lesson,
  tab,
  onTab,
}: {
  lesson: ResolvedLesson;
  tab: SheetTab;
  onTab: (t: SheetTab) => void;
}) {
  const { data } = usePlanner();
  const name = courseName(lesson.title);
  const type = lessonType(lesson.title);
  const tone = toneClasses[courseTone(name)];
  const day = toDayKey(lesson.start);
  const openTasks = data.tasks.filter((t) => t.lessonId === lesson.id && !t.done).length;

  return (
    <>
      <div className="shrink-0 border-b border-border px-5 pt-3 pb-4 lg:px-7 lg:pt-7">
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-input lg:hidden" aria-hidden />
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="flex flex-wrap items-center gap-2">
              <span className={cn("size-2 rounded-full", tone.bar)} aria-hidden />
              <span className={cn("label-mono", tone.text)}>{type ?? "Les"}</span>
            </p>
            <Dialog.Title className="mt-1.5 text-xl leading-snug font-semibold tracking-tight lg:text-2xl">
              {name}
            </Dialog.Title>
            <p className="mt-0.5 font-mono text-xs break-words text-muted-foreground">{lesson.title}</p>
          </div>
          <Dialog.Close asChild>
            <Button variant="soft" size="tap-icon" aria-label="Sluiten" className="-mr-1 shrink-0 rounded-full">
              <X aria-hidden />
            </Button>
          </Dialog.Close>
        </div>
        <Dialog.Description className="sr-only">
          {formatDayFull(day)}, {formatTime(lesson.start)} tot {formatTime(lesson.end)}
        </Dialog.Description>

        <dl className="mt-4 grid gap-2 text-sm">
          <InfoRow icon={CalendarDays} label="Datum">
            <span className="first-letter:uppercase">{formatDayFull(day)}</span>
          </InfoRow>
          <InfoRow icon={Clock} label="Tijd">
            <span className="font-mono tabular-nums">
              {formatTime(lesson.start)}–{formatTime(lesson.end)}
            </span>
            <span className="text-muted-foreground"> · {durationLabel(lesson.start, lesson.end)}</span>
          </InfoRow>
          <InfoRow icon={MapPin} label="Lokaal">
            {lesson.location || <span className="text-muted-foreground">Geen lokaal vermeld</span>}
          </InfoRow>
          {lesson.teachers.length > 0 && (
            <InfoRow icon={Users} label="Docenten">
              {lesson.teachers.map((t) => t.name).join(", ")}
            </InfoRow>
          )}
        </dl>

        {lesson.missing && (
          <p className="mt-3 flex items-start gap-2 rounded-lg bg-warning-soft px-3 py-2 text-sm">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
            Deze les staat niet meer in het rooster. Je taken en aantekeningen zijn bewaard.
          </p>
        )}
        {lesson.archived && !lesson.missing && (
          <p className="mt-3 flex items-start gap-2 rounded-lg bg-secondary px-3 py-2 text-sm text-muted-foreground">
            <Archive className="mt-0.5 size-4 shrink-0" aria-hidden />
            Voorbije les uit een eerdere roosterversie.
          </p>
        )}
      </div>

      <Tabs.Root
        value={tab}
        onValueChange={(v) => onTab(v as SheetTab)}
        className="flex min-h-0 flex-1 flex-col"
      >
        <Tabs.List
          aria-label="Lesonderdelen"
          className="flex shrink-0 gap-1 border-b border-border px-5 lg:px-7"
        >
          {(
            [
              ["voorbereiding", `Voorbereiding${openTasks ? ` · ${openTasks}` : ""}`],
              ["aantekeningen", "Aantekeningen"],
            ] as const
          ).map(([value, label]) => (
            <Tabs.Trigger
              key={value}
              value={value}
              className="relative h-12 px-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground data-[state=active]:text-foreground data-[state=active]:after:absolute data-[state=active]:after:inset-x-2 data-[state=active]:after:-bottom-px data-[state=active]:after:h-0.5 data-[state=active]:after:rounded-full data-[state=active]:after:bg-primary"
            >
              {label}
            </Tabs.Trigger>
          ))}
        </Tabs.List>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] lg:px-7">
          <Tabs.Content value="voorbereiding" className="outline-none">
            <Preparation lesson={lesson} />
          </Tabs.Content>
          <Tabs.Content value="aantekeningen" className="outline-none">
            <NotesEditor lesson={lesson} />
          </Tabs.Content>
          {lesson.description && (
            <details className="group mt-8 rounded-xl border border-border bg-card">
              <summary className="flex min-h-11 cursor-pointer items-center px-4 text-sm font-medium">
                Beschrijving uit rooster
              </summary>
              <p className="border-t border-border px-4 py-3 text-sm whitespace-pre-line break-words text-muted-foreground">
                {lesson.description}
              </p>
            </details>
          )}
        </div>
      </Tabs.Root>
    </>
  );
}

function InfoRow({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof Clock;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <dt className="mt-0.5 shrink-0 text-muted-foreground">
        <Icon className="size-4" aria-hidden />
        <span className="sr-only">{label}</span>
      </dt>
      <dd className="min-w-0 break-words">{children}</dd>
    </div>
  );
}

function Preparation({ lesson }: { lesson: ResolvedLesson }) {
  const { data, addTask, updateTask, deleteTask } = usePlanner();
  const tasks = data.tasks.filter((t) => t.lessonId === lesson.id);
  const lessonDay = toDayKey(lesson.start);
  const today = todayKey();
  const [text, setText] = useState("");
  const [withDue, setWithDue] = useState(false);
  const [due, setDue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) {
      setError("Typ eerst wat je voor deze les moet doen.");
      inputRef.current?.focus();
      return;
    }
    let dueDate: string | null = null;
    if (withDue && due) {
      if (!isDayKey(due) || !isValidDueDate(due, lessonDay)) {
        setError("Kies een deadline vóór of op de lesdag.");
        return;
      }
      dueDate = due === lessonDay ? null : due;
    }
    const r = addTask(lesson, text, dueDate);
    if (!r.ok) {
      setError(r.error);
      return;
    }
    setText("");
    setDue("");
    setWithDue(false);
    setError(null);
    inputRef.current?.focus();
  };

  const remove = (id: string) => {
    const task = data.tasks.find((t) => t.id === id);
    deleteTask(id);
    if (task) {
      toast("Taak verwijderd", {
        description: task.text,
        action: {
          label: "Ongedaan maken",
          onClick: () => addTask(lesson, task.text, task.dueDate),
        },
      });
    }
  };

  const done = tasks.filter((t) => t.done).length;

  return (
    <div>
      <form onSubmit={submit} className="surface p-3" noValidate>
        <label htmlFor="new-task" className="mb-2 block text-sm font-medium">
          Wat moet je voor deze les gedaan hebben?
        </label>
        <div className="flex gap-2">
          <input
            id="new-task"
            ref={inputRef}
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              if (error) setError(null);
            }}
            placeholder="Bijv. hoofdstuk 3 lezen"
            autoComplete="off"
            enterKeyHint="done"
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "new-task-error" : undefined}
            className="h-11 min-w-0 flex-1 rounded-lg border border-input bg-card px-3 text-base placeholder:text-muted-foreground"
          />
          <Button type="submit" size="tap" aria-label="Taak toevoegen" className="px-3 sm:px-4">
            <Plus aria-hidden />
            <span className="hidden sm:inline">Toevoegen</span>
          </Button>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2">
          <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={withDue}
              onChange={(e) => setWithDue(e.target.checked)}
              className="size-4 accent-primary"
            />
            Eerdere deadline
          </label>
          {withDue && (
            <>
              <label htmlFor="new-task-due" className="sr-only">
                Deadline
              </label>
              <input
                id="new-task-due"
                type="date"
                value={due}
                max={lessonDay}
                onChange={(e) => setDue(e.target.value)}
                className="h-11 rounded-lg border border-input bg-card px-3 text-base"
              />
            </>
          )}
        </div>
        {!withDue && (
          <p className="text-xs text-muted-foreground">Deadline: de les op {formatDayShort(lessonDay)}.</p>
        )}
        {error && (
          <p id="new-task-error" role="alert" className="mt-2 text-sm text-destructive">
            {error}
          </p>
        )}
      </form>

      {tasks.length === 0 ? (
        <EmptyState icon={ListTodo} title="Nog niets voorbereid" className="mt-4">
          Voeg toe wat je vóór deze les af moet hebben.
        </EmptyState>
      ) : (
        <>
          <p className="label-mono mt-6 mb-2 text-muted-foreground" aria-live="polite">
            {done} van {tasks.length} gedaan
          </p>
          <ul className="space-y-2">
            {tasks.map((t) => {
              const deadline = taskDeadline(t, lesson.start);
              return (
                <TaskItem
                  key={t.id}
                  task={t}
                  deadline={deadline}
                  status={taskStatus(t, deadline, today)}
                  isLessonDay={t.dueDate === null}
                  onToggle={() => updateTask(t.id, { done: !t.done })}
                  onSave={(v) => updateTask(t.id, { text: v })}
                  onDelete={() => remove(t.id)}
                />
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}

type SaveState =
  | { kind: "idle" }
  | { kind: "pending" }
  | { kind: "saved"; at: string }
  | { kind: "error"; error: string };

function NotesEditor({ lesson }: { lesson: ResolvedLesson }) {
  const { data, setNote } = usePlanner();
  const saved = data.notes[lesson.id];
  const [text, setText] = useState(saved?.text ?? "");
  const [state, setState] = useState<SaveState>(
    saved ? { kind: "saved", at: saved.updatedAt } : { kind: "idle" },
  );
  const pending = useRef<string | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const lessonRef = useRef(lesson);
  lessonRef.current = lesson;

  const flush = useCallback(() => {
    window.clearTimeout(timer.current);
    if (pending.current === null) return;
    const value = pending.current;
    pending.current = null;
    const r = setNote(lessonRef.current, value);
    setState(r.ok ? { kind: "saved", at: new Date().toISOString() } : { kind: "error", error: r.error });
  }, [setNote]);

  useEffect(() => {
    const onHide = () => flush();
    window.addEventListener("pagehide", onHide);
    document.addEventListener("visibilitychange", onHide);
    return () => {
      window.removeEventListener("pagehide", onHide);
      document.removeEventListener("visibilitychange", onHide);
      flush();
    };
  }, [flush]);

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <label htmlFor="lesson-note" className="text-sm font-medium">
          Aantekeningen bij deze les
        </label>
        <span
          className={cn(
            "label-mono text-[10px]",
            state.kind === "error" ? "text-destructive" : "text-muted-foreground",
          )}
          aria-live="polite"
        >
          {state.kind === "idle" && "Wordt automatisch opgeslagen"}
          {state.kind === "pending" && "Opslaan…"}
          {state.kind === "saved" && `Opgeslagen ${formatTime(state.at)}`}
          {state.kind === "error" && "Niet opgeslagen"}
        </span>
      </div>
      <textarea
        id="lesson-note"
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          pending.current = e.target.value;
          setState({ kind: "pending" });
          window.clearTimeout(timer.current);
          timer.current = window.setTimeout(flush, 600);
        }}
        onBlur={flush}
        onFocus={(e) => {
          const el = e.currentTarget;
          window.setTimeout(() => el.scrollIntoView({ block: "nearest", behavior: "smooth" }), 300);
        }}
        placeholder="Wat werd er besproken? Vragen, inzichten, huiswerk…"
        className="min-h-[45dvh] w-full resize-y rounded-xl border border-input bg-card p-4 text-base leading-relaxed placeholder:text-muted-foreground lg:min-h-[320px]"
      />
      {state.kind === "error" && (
        <p role="alert" className="mt-2 text-sm text-destructive">
          {state.error}
        </p>
      )}
    </div>
  );
}

