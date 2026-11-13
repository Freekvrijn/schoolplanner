import { describe, expect, it } from "vitest";
import { icsToEvents, mergeWithHistory } from "../../scripts/lib/ics-to-rooster.mjs";
import { isDayKey, formatTime, startOfWeek } from "@/lib/dates";
import { createBackup, emptyData, loadData, parseBackup, validateData, DATA_KEY } from "@/lib/planner-storage";

const calendar = (events: string) => `BEGIN:VCALENDAR\r\nVERSION:2.0\r\nX-WR-TIMEZONE:Europe/Amsterdam\r\n${events}\r\nEND:VCALENDAR`;
const event = (date = "20261113", extra = "", uid = "les-1") => `BEGIN:VEVENT\r\nUID:${uid}\r\nDTSTART:${date}T093000\r\nDTEND:${date}T110000\r\nSUMMARY:AI Skillslab\r\nLOCATION:OL131a, OL131a\r\n${extra}\r\nEND:VEVENT`;

describe("Avans-agenda", () => {
  it.each([["20261113", "2026-11-13T08:30:00.000Z"], ["20260713", "2026-07-13T07:30:00.000Z"]])(
    "houdt de Amsterdamse lestijd 09:30 correct op %s", (date, expected) => {
      const lesson = icsToEvents(calendar(event(date))).events[0]!;
      expect(new Date(lesson.start).toISOString()).toBe(expected);
      expect(formatTime(lesson.start)).toBe("09:30");
      expect(lesson.location).toBe("OL131a");
    },
  );
  it("slaat annuleringen over en kiest de hoogste SEQUENCE per UID", () => {
    const result = icsToEvents(calendar([event("20261113", "SEQUENCE:0"), event("20261114", "SEQUENCE:2"), event("20261115", "STATUS:CANCELLED", "geannuleerd")].join("\r\n")));
    expect(result.events).toHaveLength(1);
    expect(result.events[0]!.start).toContain("2026-11-14T09:30");
  });
  it("weigert een HTML-foutpagina en een lege respons", () => {
    expect(() => icsToEvents("<html>error</html>")).toThrow();
    expect(() => icsToEvents("")).toThrow();
    expect(icsToEvents(calendar("")).events).toEqual([]);
  });
  it("bewaart verdwenen historische lessen, maar geen verwijderde toekomstige lessen", () => {
    const old = icsToEvents(calendar(event("20261112"))).events;
    const future = icsToEvents(calendar(event("20261118", "", "toekomst"))).events;
    const merged = mergeWithHistory([...old, ...future], [], Date.parse("2026-11-13T12:00:00Z"));
    expect(merged.map((l) => l.id)).toEqual(["les-1"]);
    expect(merged[0]!.archived).toBe(true);
  });
});

describe("Datums en backups", () => {
  it("accepteert echte datums en weigert onmogelijke kalenderdatums", () => {
    expect(isDayKey("2028-02-29")).toBe(true);
    for (const day of ["2026-02-29", "2026-02-30", "2026-99-99", "2026-11-31", "13-11-2026"]) expect(isDayKey(day)).toBe(false);
    expect(startOfWeek("2026-11-13")).toBe("2026-11-09");
  });
  it("kan een volledige backup exporteren en weer lezen", () => {
    const data = emptyData();
    data.lessons["les"] = { id: "les", title: "Skillslab", start: "2026-11-13T09:30:00+01:00", end: "2026-11-13T11:00:00+01:00", location: "OL131a" };
    data.notes["les"] = { lessonId: "les", text: "Mijn lesnotities", updatedAt: new Date().toISOString() };
    const parsed = parseBackup(JSON.stringify(createBackup(data)));
    expect(parsed.ok).toBe(true);
    if (parsed.ok) expect(parsed.value.data).toEqual(data);
  });
  it("weigert dubbele taak-IDs en ontbrekende lesmetadata", () => {
    const data = emptyData();
    const task = { id: "taak", lessonId: "les", text: "Lezen", done: false, createdAt: new Date().toISOString(), completedAt: null, dueDate: null };
    data.tasks = [task];
    expect(validateData(data).ok).toBe(false);
    data.lessons["les"] = { id: "les", title: "Skillslab", start: "2026-11-13T09:30:00+01:00", end: "2026-11-13T11:00:00+01:00", location: "OL131a" };
    data.tasks.push({ ...task });
    expect(validateData(data).ok).toBe(false);
  });
  it("laat huidige gegevens ongemoeid bij een ongeldige import", () => {
    const original = JSON.stringify(emptyData());
    localStorage.setItem(DATA_KEY, original);
    for (const invalid of ["{", "{}", JSON.stringify({ app: "anders" })]) expect(parseBackup(invalid).ok).toBe(false);
    expect(localStorage.getItem(DATA_KEY)).toBe(original);
  });
  it("bewaart onleesbare opgeslagen gegevens als herstelkopie", () => {
    localStorage.setItem(DATA_KEY, "beschadigde json");
    const result = loadData(localStorage, new Date("2026-11-13T12:00:00Z"));
    expect(result.warning).toContain("apart bewaard");
    expect(localStorage.getItem(`${DATA_KEY}:onleesbaar:2026-11-13T12:00:00.000Z`)).toBe("beschadigde json");
  });
});
