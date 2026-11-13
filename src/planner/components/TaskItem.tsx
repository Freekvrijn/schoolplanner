import { useEffect, useRef, useState } from "react";
import { Check, Pencil, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatDayShort, type DayKey } from "@/lib/dates";
import type { Task } from "@/lib/planner-storage";
import type { TaskStatus } from "@/lib/tasks";
import { cn } from "@/lib/utils";

export function TaskCheck({
  checked,
  onToggle,
  label,
}: {
  checked: boolean;
  onToggle: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      onClick={onToggle}
      className="tap -m-2 grid shrink-0 place-items-center rounded-lg"
    >
      <span
        className={cn(
          "grid size-[22px] place-items-center rounded-md border-2 transition-colors",
          checked ? "border-success bg-success text-primary-foreground" : "border-input bg-card",
        )}
      >
        {checked && <Check className="size-3.5" strokeWidth={3} aria-hidden />}
      </span>
    </button>
  );
}

const statusText: Record<TaskStatus, string> = {
  done: "Afgerond",
  overdue: "Achterstallig",
  today: "Vandaag",
  upcoming: "",
};

export function TaskItem({
  task,
  deadline,
  status,
  isLessonDay,
  onToggle,
  onSave,
  onDelete,
  context,
  editable = true,
}: {
  task: Task;
  deadline: DayKey;
  status: TaskStatus;
  isLessonDay: boolean;
  onToggle: () => void;
  onSave?: (text: string) => void;
  onDelete?: () => void;
  context?: React.ReactNode;
  editable?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(task.text);
  const inputRef = useRef<HTMLInputElement>(null);
  const editBtn = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const finish = (save: boolean) => {
    if (save && draft.trim() && draft.trim() !== task.text) onSave?.(draft.trim());
    if (!save) setDraft(task.text);
    setEditing(false);
    requestAnimationFrame(() => editBtn.current?.focus());
  };

  return (
    <li
      className={cn(
        "flex items-start gap-3 rounded-xl border bg-card px-3 py-2.5",
        status === "overdue" ? "border-destructive/30 bg-destructive-soft" : "border-border",
      )}
    >
      <div className="pt-0.5">
        <TaskCheck
          checked={task.done}
          onToggle={onToggle}
          label={`${task.done ? "Markeer als niet gedaan" : "Markeer als gedaan"}: ${task.text}`}
        />
      </div>
      <div className="min-w-0 flex-1 py-1">
        {editing ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              finish(true);
            }}
            className="flex gap-2"
          >
            <label className="sr-only" htmlFor={`edit-${task.id}`}>
              Taak bewerken
            </label>
            <input
              id={`edit-${task.id}`}
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  e.preventDefault();
                  e.stopPropagation();
                  finish(false);
                }
              }}
              className="h-11 min-w-0 flex-1 rounded-lg border border-input bg-card px-3 text-base"
            />
            <Button type="submit" size="tap-icon" aria-label="Opslaan">
              <Check aria-hidden />
            </Button>
            <Button
              type="button"
              variant="soft"
              size="tap-icon"
              aria-label="Annuleren"
              onClick={() => finish(false)}
            >
              <X aria-hidden />
            </Button>
          </form>
        ) : (
          <>
            <p className={cn("break-words leading-snug", task.done && "text-muted-foreground line-through")}>
              {task.text}
            </p>
            <p className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
              {statusText[status] && (
                <span
                  className={cn(
                    "label-mono text-[10px]",
                    status === "overdue" && "text-destructive",
                    status === "today" && "text-azure",
                    status === "done" && "text-success",
                  )}
                >
                  {statusText[status]}
                </span>
              )}
              <span>
                {isLessonDay ? "Voor de les van" : "Eerder klaar:"} {formatDayShort(deadline)}
              </span>
              {context}
            </p>
          </>
        )}
      </div>
      {!editing && editable && (
        <div className="flex shrink-0 -my-0.5 -mr-1">
          <Button
            ref={editBtn}
            variant="quiet"
            size="tap-icon"
            aria-label={`Bewerk taak: ${task.text}`}
            onClick={() => {
              setDraft(task.text);
              setEditing(true);
            }}
          >
            <Pencil aria-hidden />
          </Button>
          <Button
            variant="quiet"
            size="tap-icon"
            aria-label={`Verwijder taak: ${task.text}`}
            onClick={onDelete}
            className="hover:text-destructive"
          >
            <Trash2 aria-hidden />
          </Button>
        </div>
      )}
    </li>
  );
}

