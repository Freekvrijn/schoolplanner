import { BookOpenCheck } from "lucide-react";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <span className="relative grid size-9 place-items-center rounded-lg bg-primary text-primary-foreground">
        <BookOpenCheck className="size-[18px]" aria-hidden />
        <span className="absolute -top-0.5 -right-0.5 size-2.5 rounded-full border-2 border-background bg-lime" />
      </span>
      {!compact && (
        <span className="flex flex-col leading-none">
          <span className="text-[15px] font-semibold tracking-tight">Schoolplanner</span>
          <span className="label-mono mt-1 text-[10px] text-muted-foreground">Avans · 2026</span>
        </span>
      )}
    </span>
  );
}

