import { act, cleanup, fireEvent, render, renderHook, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PlannerApp } from "@/planner/PlannerApp";
import { PlannerProvider, usePlanner } from "@/planner/state";
import { DATA_KEY, emptyData } from "@/lib/planner-storage";
import type { Lesson } from "@/lib/rooster";

const lesson: Lesson = { id: "test-les", title: "J34KM AI Skillslab ws", start: "2026-11-13T09:30:00+01:00", end: "2026-11-13T11:00:00+01:00", allDay: false, location: "OL131a", description: "", teachers: [] };
const roster = { updatedAt: "2026-11-13T07:00:00Z", source: "testfixture", events: [lesson] };

beforeEach(() => {
  localStorage.clear();
  window.history.replaceState(null, "", "/#/vandaag");
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-11-13T08:00:00Z"));
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => roster }));
  Element.prototype.scrollIntoView = vi.fn();
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.useRealTimers(); });

describe("Lesgegevens bewaren", () => {
  it("houdt bestaande taken en opslag intact wanneer een backup door quota niet kan worden opgeslagen", async () => {
    const { result } = renderHook(() => usePlanner(), { wrapper: PlannerProvider });
    await waitFor(() => expect(result.current.roosterStatus).toBe("ready"));
    act(() => { result.current.addTask(lesson, "Voorbereiding bewaren", null); });
    const original = localStorage.getItem(DATA_KEY);
    const realSet = Storage.prototype.setItem;
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(function (this: Storage, key, value) {
      if (key === DATA_KEY) throw new DOMException("vol", "QuotaExceededError");
      realSet.call(this, key, value);
    });
    act(() => { expect(result.current.replaceData(emptyData()).ok).toBe(false); });
    expect(result.current.data.tasks[0]!.text).toBe("Voorbereiding bewaren");
    expect(localStorage.getItem(DATA_KEY)).toBe(original);
  });

  it("slaat taken en notities op, ook bij direct sluiten, en leest ze na opnieuw openen terug", async () => {
    const first = render(<PlannerApp />);
    fireEvent.click(await screen.findByRole("button", { name: /J34KM AI Skillslab ws, 09:30/ }));
    fireEvent.change(screen.getByLabelText("Wat moet je voor deze les gedaan hebben?"), { target: { value: "Hoofdstuk 3 lezen" } });
    fireEvent.click(screen.getByRole("button", { name: "Taak toevoegen" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Markeer als gedaan: Hoofdstuk 3 lezen" }));
    fireEvent.mouseDown(screen.getByRole("tab", { name: "Aantekeningen" }), { button: 0, ctrlKey: false });
    fireEvent.change(screen.getByLabelText("Aantekeningen bij deze les"), { target: { value: "Dit is mijn eigen notitie." } });
    // Unmount before the debounce expires: this must flush the latest text.
    first.unmount();
    const saved = JSON.parse(localStorage.getItem(DATA_KEY)!);
    expect(saved.tasks[0].done).toBe(true);
    expect(saved.notes[lesson.id].text).toBe("Dit is mijn eigen notitie.");
    render(<PlannerApp />);
    fireEvent.click(await screen.findByRole("button", { name: /J34KM AI Skillslab ws, 09:30/ }));
    fireEvent.mouseDown(screen.getByRole("tab", { name: "Aantekeningen" }), { button: 0, ctrlKey: false });
    expect(screen.getByLabelText("Aantekeningen bij deze les")).toHaveValue("Dit is mijn eigen notitie.");
  });
});
