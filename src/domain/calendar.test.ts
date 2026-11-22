import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { parseCalendar, classify, inferMonth } from "./calendar";
import {
  createJourney,
  createCollection,
  summarize,
  summarizeCategories,
} from "./journey";
const wrap = (events: string) =>
  `BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//CMM//TEST//EN\r\n${events}\r\nEND:VCALENDAR`;
const ev = (props: string) => `BEGIN:VEVENT\r\n${props}\r\nEND:VEVENT`;
describe("Calendar ingestion and real demo data", () => {
  it("infers the month from events rather than timezone transition records", () => {
    const text = wrap(
      "BEGIN:VTIMEZONE\r\nTZID:Test/Zone\r\nBEGIN:STANDARD\r\nDTSTART:20300101T020000\r\nTZOFFSETFROM:+0000\r\nTZOFFSETTO:+0000\r\nEND:STANDARD\r\nEND:VTIMEZONE\r\n" +
        ev(
          "UID:old\r\nDTSTART:20260203T170000Z\r\nDTEND:20260203T180000Z\r\nSUMMARY:Class",
        ),
    );
    expect(inferMonth(text)).toBe("2026-02");
  });
  it("loads the exact November story and its 3 memory journals", () => {
    const text = readFileSync(
      new URL("../../public/demo-november-2026.ics", import.meta.url),
      "utf8",
    );
    const m = parseCalendar(text, "2026-11");
    expect(m.events).toHaveLength(79);
    expect(summarize(m)).toMatchObject({
      count: 79,
      exams: 5,
      workouts: 7,
      connections: 10,
    });
    expect(m.warnings).toEqual([]);
    expect(createCollection(m).map((x) => x.kind)).toEqual([
      "travel",
      "travel",
      "achievement",
      "connection",
    ]);
    expect(
      createCollection(m)
        .filter((card) => card.kind === "travel")
        .map((card) => card.title),
    ).toEqual(["Joshua Tree Stargazing", "Chicago Thanksgiving Trip"]);
    expect(
      m.events.find((x) => x.title === "Chicago Thanksgiving Trip"),
    ).toMatchObject({
      day: 25,
      endDay: 29,
      allDay: true,
    });
    expect(
      m.events.find((x) => x.title === "Joshua Tree Stargazing"),
    ).toMatchObject({
      day: 15,
      photo: "/photos/joshua-tree.jpg",
      highlight: true,
    });
    expect(
      m.events.find((x) => x.title === "Hanwave Club Ice Skating"),
    ).toMatchObject({
      day: 7,
      photo: "/photos/hanwave-ice-skating.jpg",
      highlight: true,
    });
    expect(
      m.events.find((x) => x.title === "Chicago Thanksgiving Trip")?.photo,
    ).toBe("/photos/chicago.jpg");
    expect(
      m.events.find((x) => x.title === "KBBQ Night with Friends")?.photo,
    ).toBe("/photos/kbbq-night.jpg");
    expect(
      m.events.find((x) => x.title === "Downtown Riverside Walk")?.photo,
    ).toBe("/photos/riverside-walk.jpg");
    expect(
      m.events.find((x) => x.title === "One-Year Friendship Anniversary Dinner")
        ?.photo,
    ).toBe("/photos/friendship-anniversary-dinner.jpg");
    expect(m.events.find((x) => x.title === "2026 Cutie Hack")).toMatchObject({
      day: 21,
      endDay: 22,
      category: "hackathon",
    });
    expect(
      m.events.find((x) => x.title === "One-Year Friendship Anniversary Dinner")
        ?.day,
    ).toBe(10);
    const categories = summarizeCategories(m);
    expect(
      categories.reduce((total, category) => total + category.count, 0),
    ).toBe(summarize(m).count);
    expect(
      categories.reduce(
        (total, category) => total + category.percentage,
        0,
      ),
    ).toBeCloseTo(100);
    expect(categories.map(({ label }) => label)).toEqual(
      expect.arrayContaining([
        "Class",
        "Study",
        "Exam",
        "Friends",
        "Travel",
        "Workout",
      ]),
    );
  });
  it("applies recurrence exclusions, moved instances, and cancellations", () => {
    const text = wrap(
      [
        ev(
          "UID:weekly\r\nDTSTART:20261026T170000Z\r\nDTEND:20261026T180000Z\r\nRRULE:FREQ=WEEKLY;COUNT=6\r\nEXDATE:20261109T170000Z\r\nSUMMARY:Class",
        ),
        ev(
          "UID:weekly\r\nRECURRENCE-ID:20261116T170000Z\r\nDTSTART:20261117T190000Z\r\nDTEND:20261117T200000Z\r\nSUMMARY:Moved class",
        ),
        ev(
          "UID:weekly\r\nRECURRENCE-ID:20261123T170000Z\r\nDTSTART:20261123T170000Z\r\nDTEND:20261123T180000Z\r\nSTATUS:CANCELLED\r\nSUMMARY:Canceled class",
        ),
      ].join("\r\n"),
    );
    const m = parseCalendar(text, "2026-11", "UTC");
    expect(m.events.map((x) => x.day)).toEqual([2, 17, 30]);
    expect(m.events[1].title).toBe("Moved class");
  });
  it("handles DST in IANA timezones without embedded definitions", () => {
    const text = wrap(
      ev(
        "UID:dst\r\nDTSTART;TZID=America/Los_Angeles:20261030T090000\r\nDTEND;TZID=America/Los_Angeles:20261030T100000\r\nRRULE:FREQ=WEEKLY;COUNT=2\r\nSUMMARY:Class",
      ),
    );
    const oct = parseCalendar(text, "2026-10");
    const nov = parseCalendar(text, "2026-11");
    expect(oct.events[0].start).toBe("2026-10-30T16:00:00.000Z");
    expect(nov.events[0].start).toBe("2026-11-06T17:00:00.000Z");
  });
  it("includes overlapping all-day trips and treats DTEND as exclusive", () => {
    const m = parseCalendar(
      wrap(
        ev(
          "UID:trip\r\nDTSTART;VALUE=DATE:20261030\r\nDTEND;VALUE=DATE:20261103\r\nSUMMARY:Trip",
        ),
      ),
      "2026-11",
    );
    expect(m.events).toHaveLength(1);
    expect(m.events[0]).toMatchObject({ day: 1, endDay: 2 });
    expect(
      parseCalendar(
        wrap(
          ev(
            "UID:gone\r\nDTSTART;VALUE=DATE:20261030\r\nDTEND;VALUE=DATE:20261101\r\nSUMMARY:Trip",
          ),
        ),
        "2026-11",
      ).events,
    ).toHaveLength(0);
  });
  it("does not include hidden events in animation, statistics, or memories", () => {
    const m = parseCalendar(
      wrap(
        ev(
          "UID:hidden\r\nDTSTART:20261103T170000Z\r\nDTEND:20261103T180000Z\r\nSUMMARY:Chicago trip",
        ),
      ),
      "2026-11",
    );
    m.events[0].hidden = true;
    expect(createJourney(m).chapters).toHaveLength(0);
    expect(summarize(m).count).toBe(0);
    expect(createCollection(m)).toHaveLength(0);
  });
  it("uses explicit categories and does not make every event an achievement", () => {
    expect(classify("Algorithms lecture")).toBe("study");
    expect(classify("Exam 5")).toBe("exam");
    expect(classify("KBBQ with friends")).toBe("social");
    expect(classify("Unclear event")).toBe("other");
  });
  it("rejects malformed and oversized input without hanging", () => {
    expect(() => parseCalendar("not a calendar", "2026-11")).toThrow();
    expect(() => parseCalendar("x".repeat(5_000_001), "2026-11")).toThrow(
      "5 MB",
    );
  });
});
