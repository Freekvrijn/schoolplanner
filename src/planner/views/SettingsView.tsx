import { useRef, useState } from "react";
import { AlertTriangle, Download, HardDrive, RefreshCw, Upload } from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/dates";
import {
  createBackup,
  parseBackup,
  type BackupSummary,
  type PlannerData,
} from "@/lib/planner-storage";
import { PageHeader, SectionHeading } from "../components/bits";
import { RoosterStatus } from "../components/RoosterStatus";
import { usePlanner } from "../state";

export function SettingsView() {
  const { roosterFile, fetchedAt, fromCache, roosterStatus, data, replaceData, lessons, reloadRooster } =
    usePlanner();
  const fileInput = useRef<HTMLInputElement>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [pending, setPending] = useState<{ data: PlannerData; summary: BackupSummary } | null>(null);

  const noteCount = Object.values(data.notes).filter((n) => n.text.trim()).length;
  const archived = lessons.filter((l) => l.archived).length;

  const download = () => {
    const backup = createBackup(data);
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `schoolplanner-backup-${backup.exportedAt.slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast.success("Backup gedownload");
  };

  const onFile = async (file: File | undefined) => {
    setImportError(null);
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setImportError("Dit bestand is te groot voor een Schoolplanner-backup.");
      return;
    }
    let text: string;
    try {
      text = await file.text();
    } catch {
      setImportError("Het bestand kon niet worden gelezen.");
      return;
    }
    const result = parseBackup(text);
    if (!result.ok) {
      setImportError(`${result.error} Je huidige gegevens zijn niet aangepast.`);
      return;
    }
    setPending(result.value);
  };

  const confirmImport = () => {
    if (!pending) return;
    const r = replaceData(pending.data);
    setPending(null);
    if (r.ok) toast.success("Backup teruggezet");
    else setImportError(r.error);
  };

  return (
    <>
      <PageHeader eyebrow="Schoolplanner" title="Instellingen" />

      <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
        <section className="surface p-5" aria-labelledby="rooster-heading">
          <SectionHeading id="rooster-heading">Rooster</SectionHeading>
          <dl className="space-y-3 text-sm">
            <Row label="Bron">
              <span className="font-mono text-xs break-all">
                {roosterFile?.source || "https://avans.one/api/webcal?value=28026KM12AIA&c=g"}
              </span>
            </Row>
            <Row label="Laatst gesynchroniseerd">
              {roosterFile?.updatedAt ? formatDateTime(roosterFile.updatedAt) : "Nog nooit"}
            </Row>
            <Row label="Opgehaald in deze browser">
              {fetchedAt ? formatDateTime(fetchedAt) : "Nog niet"}
              {fromCache && roosterStatus === "error" && " (offline kopie)"}
            </Row>
            <Row label="Lessen">
              {lessons.length}
              {archived > 0 && ` (waarvan ${archived} voorbij, uit archief)`}
            </Row>
          </dl>
          {roosterFile?.lastFailedAttempt && (
            <p className="mt-4 flex items-start gap-2 rounded-lg bg-warning-soft px-3 py-2 text-sm">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
              <span>
                De laatste automatische sync op {formatDateTime(roosterFile.lastFailedAttempt.at)} is
                mislukt ({roosterFile.lastFailedAttempt.message}). Je ziet de versie van{" "}
                {roosterFile.updatedAt ? formatDateTime(roosterFile.updatedAt) : "eerder"}.
              </span>
            </p>
          )}
          <p className="mt-4 text-sm text-muted-foreground">
            GitHub haalt je Avans-agenda ongeveer elke 3 uur opnieuw op en publiceert het rooster op
            deze site. “Opnieuw laden” haalt de laatst gepubliceerde versie op; nieuwe wijzigingen
            in Avans kunnen dus even op zich laten wachten.
          </p>
          <div className="mt-2">
            <RoosterStatus />
          </div>
        </section>

        <section className="surface p-5" aria-labelledby="storage-heading">
          <SectionHeading id="storage-heading">Opslag</SectionHeading>
          <p className="flex items-start gap-2.5 font-medium">
            <HardDrive className="mt-0.5 size-4 shrink-0" aria-hidden />
            Je aantekeningen en taken blijven in deze browser.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Er is geen account en niets wordt tussen apparaten gesynchroniseerd. Wis je je
            browsergegevens, dan ben je ze kwijt — maak daarom af en toe een backup.
          </p>
          <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-4 text-sm">
            <div>
              <dt className="label-mono text-[10px] text-muted-foreground">Taken</dt>
              <dd className="text-lg font-semibold tabular-nums">{data.tasks.length}</dd>
            </div>
            <div>
              <dt className="label-mono text-[10px] text-muted-foreground">Aantekeningen</dt>
              <dd className="text-lg font-semibold tabular-nums">{noteCount}</dd>
            </div>
          </dl>
        </section>

        <section className="surface p-5 lg:col-span-2" aria-labelledby="backup-heading">
          <SectionHeading id="backup-heading">Backup</SectionHeading>
          <p className="text-sm text-muted-foreground">
            Download al je taken en aantekeningen als JSON-bestand, of zet een eerdere backup terug.
            Bij terugzetten wordt alles in deze browser vervangen — je krijgt eerst een
            bevestiging.
          </p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <Button size="tap" onClick={download}>
              <Download aria-hidden /> Backup downloaden
            </Button>
            <Button variant="soft" size="tap" onClick={() => fileInput.current?.click()}>
              <Upload aria-hidden /> Backup importeren
            </Button>
            <input
              ref={fileInput}
              type="file"
              accept="application/json,.json"
              className="sr-only"
              tabIndex={-1}
              aria-hidden
              onChange={(e) => {
                void onFile(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
          </div>
          {importError && (
            <p role="alert" className="mt-3 flex items-start gap-2 text-sm text-destructive">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
              {importError}
            </p>
          )}
        </section>
      </div>

      <p className="mt-8 text-center text-xs text-muted-foreground">
        Schoolplanner · lessen uit Avans One ·{" "}
        <button
          type="button"
          className="underline underline-offset-2"
          onClick={() => void reloadRooster()}
        >
          rooster vernieuwen
        </button>
      </p>

      <AlertDialog open={pending !== null} onOpenChange={(o) => !o && setPending(null)}>
        <AlertDialogContent className="bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle>Huidige gegevens vervangen?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p>
                  De backup van {pending ? formatDateTime(pending.summary.exportedAt) : ""} bevat{" "}
                  {pending?.summary.tasks} taken en {pending?.summary.notes} aantekeningen.
                </p>
                <p>
                  Al je huidige taken ({data.tasks.length}) en aantekeningen ({noteCount}) in deze
                  browser worden vervangen. Dit kun je niet ongedaan maken.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-11">Annuleren</AlertDialogCancel>
            <AlertDialogAction className="h-11" onClick={confirmImport}>
              Vervangen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-0.5 sm:grid-cols-[180px_1fr] sm:gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0">{children}</dd>
    </div>
  );
}


