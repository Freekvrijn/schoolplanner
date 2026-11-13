import { AlertTriangle, CloudOff, Loader2, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { usePlanner } from "../state";

/** Compact line: last sync time + reload. Errors are shown in plain words. */
export function RoosterStatus({ className }: { className?: string }) {
  const { roosterStatus, roosterFile, roosterError, fromCache, reloadRooster } = usePlanner();
  const loading = roosterStatus === "loading";

  return (
    <div className={cn("flex flex-wrap items-center gap-x-3 gap-y-2 text-sm", className)}>
      <span className="flex min-w-0 items-center gap-2 text-muted-foreground" aria-live="polite">
        {loading ? (
          <>
            <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
            Rooster laden…
          </>
        ) : roosterStatus === "error" ? (
          <>
            {fromCache ? (
              <CloudOff className="size-4 shrink-0 text-warning" aria-hidden />
            ) : (
              <AlertTriangle className="size-4 shrink-0 text-destructive" aria-hidden />
            )}
            <span>
              {roosterError}
              {fromCache && " Je ziet de laatst opgeslagen versie."}
            </span>
          </>
        ) : roosterFile?.updatedAt ? (
          <span className="truncate">
            <span className="mr-1.5 inline-block size-2 rounded-full bg-lime align-middle" aria-hidden />
            Rooster bijgewerkt {formatDateTime(roosterFile.updatedAt)}
          </span>
        ) : (
          <span>Rooster is nog niet gesynchroniseerd.</span>
        )}
      </span>
      <Button
        variant="quiet"
        size="tap"
        onClick={() => void reloadRooster()}
        disabled={loading}
        className="-ml-2 px-3"
      >
        <RefreshCw className={cn("size-4", loading && "animate-spin")} aria-hidden />
        Opnieuw laden
      </Button>
    </div>
  );
}

/** Warning banners for storage problems (unreadable data, full storage). */
export function StorageBanner() {
  const { storageWarning, saveError } = usePlanner();
  if (!storageWarning && !saveError) return null;
  return (
    <div className="mb-5 space-y-2" role="alert">
      {[saveError, storageWarning].filter(Boolean).map((msg) => (
        <p
          key={msg}
          className="flex items-start gap-2 rounded-xl border border-warning/30 bg-warning-soft px-4 py-3 text-sm"
        >
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
          {msg}
        </p>
      ))}
    </div>
  );
}

