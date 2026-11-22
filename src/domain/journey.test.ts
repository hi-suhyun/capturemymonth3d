import { describe, expect, it } from "vitest";
import { createJourney } from "./journey";
import type { CalendarEvent, MonthData } from "./types";

const event = (id: string, highlight: boolean): CalendarEvent => ({
  id,
  uid: id,
  title: id,
  description: "",
  location: "",
  start: `2026-11-0${id === "small" ? "2" : "3"}T10:00:00.000Z`,
  end: `2026-11-0${id === "small" ? "2" : "3"}T11:00:00.000Z`,
  day: id === "small" ? 2 : 3,
  endDay: id === "small" ? 2 : 3,
  dateLabel: "",
  timeLabel: "",
  category: "study",
  allDay: false,
  highlight,
  hidden: false,
  people: [],
});

const month: MonthData = {
  month: "2026-11",
  timezone: "UTC",
  events: [event("small", false), event("important", true)],
  warnings: [],
  days: 30,
};

describe("journey pacing", () => {
  it("moves through ordinary and highlighted events at distinct full-journey tempos", () => {
    const chapters = createJourney(month, "full").chapters;

    expect(chapters.map(({ end, start }) => end - start)).toEqual([1, 1.5]);
    expect(chapters.map(({ arrival, start }) => arrival - start)).toEqual([
      1,
      1.125,
    ]);
  });

  it("keeps a two-second pause at highlights after a slower approach", () => {
    const chapter = createJourney(month, "highlights").chapters[0];

    expect(chapter.end - chapter.start).toBeCloseTo(4.4);
    expect(chapter.arrival - chapter.start).toBeCloseTo(2.4);
    expect(chapter.end - chapter.arrival).toBeCloseTo(2);
  });
});
