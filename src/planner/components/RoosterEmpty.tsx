import { AlertTriangle, CalendarX2, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { usePlanner } from "../state";
import { EmptyState } from "./bits";

/** Shown instead of lesson lists when there is no rooster data at all. Returns null otherwise. */
export function RoosterEmpty() {
  const { roosterStatus, roosterFile, roosterError, reloadRooster, lessons } = usePlanner();
  if (lessons.length > 0) return null;

  if (roosterStatus === "loading" && !roosterFile) {
    return (
      <div className="space-y-2" aria-busy="true" aria-label="Rooster laden">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-20 rounded-xl bg-secondary" />
        ))}
      </div>
    );
  }

  const retry = (
    <Button variant="soft" size="tap" onClick={() => void reloadRooster()}>
      <RefreshCw aria-hidden /> Opnieuw proberen
    </Button>
  );

  if (roosterStatus === "error" && !roosterFile) {
    return (
      <EmptyState icon={AlertTriangle} title="Rooster niet beschikbaar" action={retry}>
        {roosterError} Je taken en aantekeningen blijven gewoon bewaard.
      </EmptyState>
    );
  }

  if (!roosterFile?.updatedAt) {
    return (
      <EmptyState icon={CalendarX2} title="Rooster nog niet gesynchroniseerd" action={retry}>
        Er staat nog geen opgehaald rooster op de site. GitHub haalt het rooster periodiek op uit je
        Avans-agenda; lokaal kan dat met <code className="font-mono">npm run sync:calendar</code>.
      </EmptyState>
    );
  }

  return (
    <EmptyState icon={CalendarX2} title="Geen lessen in het rooster" action={retry}>
      De Avans-agenda bevat op dit moment geen lessen.
    </EmptyState>
  );
}

