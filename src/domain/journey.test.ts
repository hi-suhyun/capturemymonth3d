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
  it("holds the opening activity through the ten-second pitch preview", () => {
    const journey = createJourney(month, "full", { cinematicIntro: true });
    const first = journey.chapters[0];
    expect(first.start).toBe(5);
    expect(first.arrival).toBeCloseTo(6.8);
    expect(first.end).toBeCloseTo(11.5);
    expect(journey.chapters[1].end - journey.chapters[1].start).toBe(1.5);
  });
  it("chooses dedicated exercise animations from event titles", () => {
    const activity = (id: string, title: string) => ({
      ...event(id, false),
      title,
      category: "fitness" as const,
    });
    const journey = createJourney({
      ...month,
      events: [
        activity("lift", "Strength Training"),
        activity("yoga", "Morning Yoga Flow"),
        activity("run", "Campus Run"),
      ],
    });

    expect(journey.chapters.map(({ action }) => action)).toEqual([
      "lifting",
      "yoga",
      "jogging",
    ]);
    for (const chapter of journey.chapters) {
      expect(chapter.end - chapter.start).toBe(1);
      expect(chapter.end - chapter.arrival).toBeCloseTo(0.35);
    }
  });

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
