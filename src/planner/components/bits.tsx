import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
  className,
}: {
  value: T;
  options: Array<{ value: T; label: string; count?: number }>;
  onChange: (v: T) => void;
  label: string;
  className?: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn("inline-flex rounded-xl border border-border bg-secondary p-1", className)}
      onKeyDown={(e) => {
        if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
        e.preventDefault();
        const i = options.findIndex((o) => o.value === value);
        const next = options[(i + (e.key === "ArrowRight" ? 1 : -1) + options.length) % options.length];
        if (next) {
          onChange(next.value);
          const btn = e.currentTarget.querySelector<HTMLButtonElement>(`[data-value="${next.value}"]`);
          btn?.focus();
        }
      }}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            data-value={o.value}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(o.value)}
            className={cn(
              "flex h-10 min-w-[44px] flex-1 items-center justify-center gap-1.5 rounded-lg px-3 text-sm font-medium transition-colors",
              active
                ? "bg-card text-foreground shadow-card"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {o.label}
            {o.count !== undefined && (
              <span className="font-mono text-xs text-muted-foreground">{o.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  children,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center rounded-xl border border-dashed border-input px-6 py-10 text-center",
        className,
      )}
    >
      <span className="mb-3 grid size-11 place-items-center rounded-full bg-secondary text-muted-foreground">
        <Icon className="size-5" aria-hidden />
      </span>
      <p className="font-semibold">{title}</p>
      {children && <div className="mt-1 max-w-sm text-sm text-muted-foreground">{children}</div>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function SectionHeading({
  children,
  aside,
  id,
}: {
  children: ReactNode;
  aside?: ReactNode;
  id?: string;
}) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 id={id} className="label-mono text-muted-foreground">
        {children}
      </h2>
      {aside}
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  children,
}: {
  eyebrow?: ReactNode;
  title: string;
  children?: ReactNode;
}) {
  return (
    <header className="mb-6 lg:mb-8">
      {eyebrow && <p className="label-mono mb-2 text-muted-foreground">{eyebrow}</p>}
      <h1
        tabIndex={-1}
        data-page-heading
        className="text-[1.75rem] leading-tight font-semibold tracking-tight outline-none lg:text-4xl"
      >
        {title}
      </h1>
      {children}
    </header>
  );
}

