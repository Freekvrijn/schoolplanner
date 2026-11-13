import { describe, expect, it } from "vitest";
import type { Lesson } from "@/lib/rooster";
import { layoutWeekDay, WEEK_START_MINUTE, WEEK_END_MINUTE } from "@/lib/week-layout";

const lesson = (id: string, start: string, end: string): Lesson => ({
  id, title: "AI Skillslab", start: `2026-11-13T${start}:00+01:00`, end: `2026-11-13T${end}:00+01:00`,
  allDay: false, location: "OL131a", description: "", teachers: [],
});

describe("Weekraster 08:00–18:00", () => {
  it("gebruikt het gecorrigeerde tijdvak en de echte lestijden", () => {
    expect(WEEK_START_MINUTE).toBe(480);
    expect(WEEK_END_MINUTE).toBe(1080);
    const [item] = layoutWeekDay([lesson("a", "09:30", "11:00")], "2026-11-13");
    expect(item).toMatchObject({ startMinute: 570, endMinute: 660, column: 0, columns: 1 });
    expect(item!.lesson.id).toBe("a");
  });
  it("zet overlappende lessen naast elkaar en opeenvolgende lessen in dezelfde kolom", () => {
    const placed = layoutWeekDay([lesson("a", "09:00", "11:00"), lesson("b", "10:00", "12:00"), lesson("c", "12:00", "13:00")], "2026-11-13");
    expect(placed[0]).toMatchObject({ column: 0, columns: 2 });
    expect(placed[1]).toMatchObject({ column: 1, columns: 2 });
    expect(placed[2]).toMatchObject({ column: 0, columns: 1 });
  });
  it("tekent alleen het zichtbare gedeelte, met behoud van de volledige originele les", () => {
    const source = lesson("lang", "07:30", "19:00");
    const [item] = layoutWeekDay([source], "2026-11-13");
    expect(item).toMatchObject({ startMinute: 480, endMinute: 1080, clippedStart: true, clippedEnd: true });
    expect(item!.lesson).toBe(source);
  });
  it("plaatst geen les in de verkeerde dag of volledig buiten het tijdvak", () => {
    expect(layoutWeekDay([lesson("a", "09:00", "11:00")], "2026-11-14")).toEqual([]);
    expect(layoutWeekDay([lesson("vroeg", "06:00", "08:00"), lesson("laat", "18:00", "19:00")], "2026-11-13")).toEqual([]);
  });
});
