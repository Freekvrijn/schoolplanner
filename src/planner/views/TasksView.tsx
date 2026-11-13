import { useMemo, useState } from "react";
import { CheckCircle2, ListTodo } from "lucide-react";
import { toast } from "sonner";

import { courseName } from "@/lib/course";
import { formatDayShort, formatTime, toDayKey, todayKey } from "@/lib/dates";
import { taskDeadline, taskStatus, type TaskStatus } from "@/lib/tasks";
import { EmptyState, PageHeader, Segmented, SectionHeading } from "../components/bits";
import { TaskItem } from "../components/TaskItem";
import { useNow, usePlanner } from "../state";

type Tab = "open" | "afgerond";

const GROUPS: Array<{ status: TaskStatus; title: string }> = [
  { status: "overdue", title: "Achterstallig" },
  { status: "today", title: "Vandaag" },
  { status: "upcoming", title: "Komend" },
];

export function TasksView() {
  const now = useNow();
  const today = todayKey(now);
  const { data, resolveLesson, updateTask, deleteTask, openLesson, replaceData } = usePlanner();
  const [tab, setTab] = useState<Tab>("open");

  const items = useMemo(
    () =>
      data.tasks.map((task) => {
        const lesson = resolveLesson(task.lessonId);
        const start = lesson?.start ?? task.createdAt;
        const deadline = taskDeadline(task, start);
        return { task, lesson, start, deadline, status: taskStatus(task, deadline, today) };
      }),
    [data.tasks, resolveLesson, today],
  );

  const open = items
    .filter((x) => !x.task.done)
    .sort((a, b) => Date.parse(a.start) - Date.parse(b.start) || a.deadline.localeCompare(b.deadline));
  const done = items
    .filter((x) => x.task.done)
    .sort((a, b) => Date.parse(b.start) - Date.parse(a.start));

  const remove = (id: string) => {
    const snapshot = data;
    const task = data.tasks.find((t) => t.id === id);
    deleteTask(id);
    toast("Taak verwijderd", {
      description: task?.text,
      action: { label: "Ongedaan maken", onClick: () => replaceData(snapshot) },
    });
  };

  const render = (list: typeof items) => (
    <ul className="space-y-2">
      {list.map(({ task, lesson, deadline, status }) => (
        <TaskItem
          key={task.id}
          task={task}
          deadline={deadline}
          status={status}
          isLessonDay={task.dueDate === null}
          onToggle={() => updateTask(task.id, { done: !task.done })}
          onSave={(text) => updateTask(task.id, { text })}
          onDelete={() => remove(task.id)}
          context={
            lesson ? (
              <button
                type="button"
                onClick={() => openLesson(lesson.id)}
                className="min-h-6 text-left underline decoration-border underline-offset-2 hover:text-foreground"
              >
                {courseName(lesson.title)} · {formatDayShort(toDayKey(lesson.start))} {formatTime(lesson.start)}
                {lesson.missing && " · niet meer in rooster"}
              </button>
            ) : (
              <span>Onbekende les</span>
            )
          }
        />
      ))}
    </ul>
  );

  return (
    <>
      <PageHeader eyebrow="Voorbereiding" title="Taken" />
      <Segmented<Tab>
        label="Taken filteren"
        value={tab}
        onChange={setTab}
        options={[
          { value: "open", label: "Open", count: open.length },
          { value: "afgerond", label: "Afgerond", count: done.length },
        ]}
        className="mb-6 w-full sm:w-auto"
      />

      {tab === "open" ? (
        open.length === 0 ? (
          <EmptyState icon={ListTodo} title={data.tasks.length ? "Alles gedaan" : "Nog geen taken"}>
            {data.tasks.length
              ? "Je hebt geen openstaande voorbereiding."
              : "Open een les in de agenda en voeg bij “Voorbereiding” toe wat je vooraf moet doen."}
          </EmptyState>
        ) : (
          <div className="space-y-8 lg:max-w-3xl">
            {GROUPS.map(({ status, title }) => {
              const list = open.filter((x) => x.status === status);
              if (!list.length) return null;
              return (
                <section key={status} aria-label={title}>
                  <SectionHeading>
                    <span className={status === "overdue" ? "text-destructive" : undefined}>
                      {title} · {list.length}
                    </span>
                  </SectionHeading>
                  {render(list)}
                </section>
              );
            })}
          </div>
        )
      ) : done.length === 0 ? (
        <EmptyState icon={CheckCircle2} title="Nog niets afgerond">
          Vink een taak af zodra je hem gedaan hebt.
        </EmptyState>
      ) : (
        <div className="lg:max-w-3xl">{render(done)}</div>
      )}
    </>
  );
}

