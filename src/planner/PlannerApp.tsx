import { useEffect, useRef, useState } from "react";
import { CalendarDays, Home, ListChecks, NotebookPen, RefreshCw, Settings } from "lucide-react";
import { Toaster } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Logo } from "./components/Logo";
import { LessonSheet } from "./components/LessonSheet";
import { StorageBanner } from "./components/RoosterStatus";
import { useHashRoute, type RouteName } from "./hash-route";
import { PlannerProvider, usePlanner } from "./state";
import { AgendaView } from "./views/AgendaView";
import { NotesView } from "./views/NotesView";
import { SettingsView } from "./views/SettingsView";
import { TasksView } from "./views/TasksView";
import { TodayView } from "./views/TodayView";

const NAV: Array<{ route: RouteName; label: string; icon: typeof Home }> = [
  { route: "vandaag", label: "Vandaag", icon: Home },
  { route: "agenda", label: "Agenda", icon: CalendarDays },
  { route: "taken", label: "Taken", icon: ListChecks },
  { route: "aantekeningen", label: "Aantekeningen", icon: NotebookPen },
  { route: "instellingen", label: "Instellingen", icon: Settings },
];

export function PlannerApp() {
  return (
    <PlannerProvider>
      <Shell />
      <LessonSheet />
      <Toaster
        position="top-center"
        toastOptions={{
          classNames: {
            toast: "!bg-card !text-foreground !border-border !shadow-raised !font-sans",
            description: "!text-muted-foreground",
            actionButton: "!bg-primary !text-primary-foreground !h-9 !px-3",
          },
        }}
      />
    </PlannerProvider>
  );
}

function useTyping(): boolean {
  const [typing, setTyping] = useState(false);
  useEffect(() => {
    const isField = (el: EventTarget | null) =>
      el instanceof HTMLTextAreaElement ||
      (el instanceof HTMLInputElement && !["checkbox", "radio", "button", "file"].includes(el.type));
    const onIn = (e: FocusEvent) => setTyping(isField(e.target));
    const onOut = () => setTyping(false);
    document.addEventListener("focusin", onIn);
    document.addEventListener("focusout", onOut);
    return () => {
      document.removeEventListener("focusin", onIn);
      document.removeEventListener("focusout", onOut);
    };
  }, []);
  return typing;
}

function Shell() {
  const [route, go] = useHashRoute();
  const { roosterStatus, reloadRooster, data } = usePlanner();
  const typing = useTyping();
  const first = useRef(true);
  const openTasks = data.tasks.filter((t) => !t.done).length;

  useEffect(() => {
    document.title = `${NAV.find((n) => n.route === route)?.label ?? "Vandaag"} · Schoolplanner`;
    if (first.current) {
      first.current = false;
      return;
    }
    document.querySelector<HTMLElement>("[data-page-heading]")?.focus({ preventScroll: true });
  }, [route]);

  const current = NAV.find((n) => n.route === route) ?? NAV[0]!;

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[264px_minmax(0,1fr)]">
      <a
        href="#main"
        onClick={(e) => {
          e.preventDefault();
          document.querySelector<HTMLElement>("[data-page-heading]")?.focus();
        }}
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60] focus:rounded-lg focus:bg-card focus:px-4 focus:py-3 focus:shadow-raised"
      >
        Naar inhoud
      </a>

      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-sidebar-border bg-sidebar px-4 py-6 lg:flex">
        <div className="px-2">
          <Logo />
        </div>
        <nav aria-label="Hoofdmenu" className="mt-10">
          <ul className="space-y-1">
            {NAV.map(({ route: r, label, icon: Icon }) => {
              const active = r === route;
              return (
                <li key={r}>
                  <a
                    href={`#/${r}`}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors",
                      active
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground",
                    )}
                  >
                    <Icon className="size-[18px]" aria-hidden />
                    <span className="flex-1">{label}</span>
                    {r === "taken" && openTasks > 0 && (
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 font-mono text-[11px]",
                          active ? "bg-lime text-lime-foreground" : "bg-secondary text-foreground",
                        )}
                      >
                        {openTasks}
                      </span>
                    )}
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>
        <p className="mt-auto px-3 text-xs leading-relaxed text-muted-foreground">
          Je aantekeningen en taken blijven in deze browser.
        </p>
      </aside>

      <div className="min-w-0">
        {/* Mobile header */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-border bg-background/90 px-4 backdrop-blur lg:hidden">
          <div className="flex min-w-0 items-center gap-3">
            <Logo compact />
            <span className="truncate font-semibold tracking-tight">{current.label}</span>
          </div>
          <Button
            variant="quiet"
            size="tap-icon"
            aria-label="Rooster opnieuw laden"
            onClick={() => void reloadRooster()}
            disabled={roosterStatus === "loading"}
            className="-mr-2"
          >
            <RefreshCw className={cn(roosterStatus === "loading" && "animate-spin")} aria-hidden />
          </Button>
        </header>

        <main
          id="main"
          className={cn(
            "mx-auto w-full max-w-6xl px-4 pt-5 sm:px-6 lg:px-10 lg:pt-12 lg:pb-14",
            typing ? "pb-8" : "pb-[calc(6.5rem+env(safe-area-inset-bottom))]",
          )}
        >
          <StorageBanner />
          {route === "vandaag" && <TodayView go={go} />}
          {route === "agenda" && <AgendaView />}
          {route === "taken" && <TasksView />}
          {route === "aantekeningen" && <NotesView />}
          {route === "instellingen" && <SettingsView />}
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <nav
        aria-label="Hoofdmenu"
        className={cn(
          "pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur transition-transform lg:hidden",
          typing && "translate-y-full",
        )}
      >
        <ul className="mx-auto grid max-w-lg grid-cols-5">
          {NAV.map(({ route: r, label, icon: Icon }) => {
            const active = r === route;
            return (
              <li key={r}>
                <a
                  href={`#/${r}`}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium",
                    active ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  <span
                    className={cn(
                      "grid h-7 w-12 place-items-center rounded-full transition-colors",
                      active && "bg-lime",
                    )}
                  >
                    <Icon className="size-[18px]" aria-hidden />
                  </span>
                  <span className="max-w-full truncate px-0.5">
                    {label === "Aantekeningen" ? "Notities" : label}
                  </span>
                  {r === "taken" && openTasks > 0 && (
                    <span className="absolute top-2 left-1/2 ml-3 grid min-w-4 place-items-center rounded-full bg-primary px-1 font-mono text-[10px] leading-4 text-primary-foreground">
                      {openTasks}
                    </span>
                  )}
                </a>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}

