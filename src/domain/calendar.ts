import ICAL from "ical.js";
import type { CalendarEvent, Category, MonthData } from "./types";

export function classify(title: string, categories: string[] = []): Category {
  const known: Category[] = [
    "study",
    "assignment",
    "exam",
    "social",
    "fitness",
    "travel",
    "hackathon",
    "anniversary",
    "other",
  ];
  const explicit = categories
    .map((c) => c.toLowerCase())
    .find((c) => known.includes(c as Category));
  if (explicit) return explicit as Category;
  const text = title.toLowerCase();
  const rules: [Category, RegExp][] = [
    ["anniversary", /anniversary|birthday|기념일|생일/],
    ["hackathon", /hackathon|해커톤/],
    ["exam", /exam|midterm|final exam|시험/],
    ["travel", /travel|trip|flight|여행/],
    ["fitness", /fitness|workout|gym|run\b|yoga|운동/],
    ["social", /social|kbbq|dinner|friends|shopping|coffee|친구/],
    ["assignment", /assignment|homework|problem set|essay|과제/],
    ["study", /study|class|lecture|seminar|수업/],
  ];
  return rules.find(([, pattern]) => pattern.test(text))?.[0] ?? "other";
}
export function inferMonth(text: string) {
  const root = new ICAL.Component(ICAL.parse(text));
  const starts = root
    .getAllSubcomponents("vevent")
    .map(
      (component) =>
        component.getFirstPropertyValue("dtstart") as ICAL.Time | null,
    )
    .filter((time): time is ICAL.Time => !!time && time.year >= 2000);
  const now = new Date();
  const current = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const values = starts.map(
    (time) => `${time.year}-${String(time.month).padStart(2, "0")}`,
  );
  return values.includes(current) ? current : (values.sort().at(-1) ?? current);
}
function value(component: any, key: string) {
  return component.getFirstPropertyValue(key);
}
function wallToUTC(t: any, zone: string): number {
  if (t.zone?.tzid === "UTC") return t.toJSDate().getTime();
  if (t.zone?.component) return t.toJSDate().getTime();
  const base = Date.UTC(
    t.year,
    t.month - 1,
    t.day,
    t.hour || 0,
    t.minute || 0,
    t.second || 0,
  );
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: zone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  let result = base;
  for (let i = 0; i < 4; i++) {
    const parts = Object.fromEntries(
      fmt.formatToParts(new Date(result)).map((p) => [p.type, Number(p.value)]),
    );
    const observed = Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minute,
      parts.second,
    );
    const next = result + (base - observed);
    if (next === result) break;
    result = next;
  }
  return result;
}
function dayKey(t: number, zone: string) {
  const p = new Intl.DateTimeFormat("en-CA", {
    timeZone: zone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(t);
  const get = (k: string) => p.find((x) => x.type === k)?.value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}
export function parseCalendar(
  text: string,
  month: string,
  timezone = "America/Los_Angeles",
): MonthData {
  if (text.length > 5_000_000)
    throw new Error(
      "This demo supports calendar files up to 5 MB. Please export a smaller date range.",
    );
  if (
    !/^\d{4}-\d{2}$/.test(month) ||
    Number(month.slice(5)) < 1 ||
    Number(month.slice(5)) > 12 ||
    Number(month.slice(0, 4)) < 2000 ||
    Number(month.slice(0, 4)) > 2100
  )
    throw new Error("Choose a month between 2000 and 2100.");
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: timezone }).format();
  } catch {
    throw new Error(
      "Choose a valid IANA timezone, such as America/Los_Angeles.",
    );
  }
  if (!text.includes("BEGIN:VCALENDAR"))
    throw new Error(
      "This does not look like an .ics calendar. Please choose an iCalendar export.",
    );
  ICAL.TimezoneService.reset();
  const root = new ICAL.Component(ICAL.parse(text));
  root.getAllSubcomponents("vtimezone").forEach((c: any) => {
    const tz = new ICAL.Timezone(c);
    ICAL.TimezoneService.register(tz, tz.tzid);
  });
  const [year, mo] = month.split("-").map(Number);
  const days = new Date(Date.UTC(year, mo, 0)).getUTCDate();
  const nextMonth =
    mo === 12 ? `${year + 1}-01` : `${year}-${String(mo + 1).padStart(2, "0")}`;
  const warnings: string[] = [];
  const output = new Map<string, CalendarEvent>();
  const components = root.getAllSubcomponents("vevent");
  if (components.length > 10_000)
    throw new Error(
      "This file has more than 10,000 event records. Please export a smaller calendar.",
    );
  const groups = new Map<string, any[]>();
  for (const c of components) {
    const uid = String(value(c, "uid") || `missing-${groups.size}`);
    groups.set(uid, [...(groups.get(uid) || []), c]);
  }
  let steps = 0;
  function add(
    component: any,
    start: any,
    end: any,
    uid: string,
    occurrence: string,
  ) {
    if (String(value(component, "status")).toUpperCase() === "CANCELLED")
      return;
    const allDay = start.isDate;
    const tzid =
      component.getFirstProperty("dtstart")?.getParameter("tzid") || timezone;
    let startMs: number, endMs: number;
    try {
      startMs = wallToUTC(start, tzid);
      endMs = wallToUTC(end, tzid);
    } catch {
      warnings.push(`Skipped an event with unsupported timezone: ${tzid}.`);
      return;
    }
    const key = allDay
      ? start.toString().slice(0, 10)
      : dayKey(startMs, timezone);
    const endKey = allDay
      ? end.toString().slice(0, 10)
      : dayKey(Math.max(startMs, endMs - 1), timezone);
    if (
      key >= `${nextMonth}-01` ||
      (allDay ? endKey <= `${month}-01` : endKey < `${month}-01`)
    )
      return;
    const categories = value(component, "categories") || [];
    const title = String(value(component, "summary") || "Untitled moment");
    const category = classify(
      title,
      Array.isArray(categories) ? categories : [String(categories)],
    );
    const rawPeople = String(value(component, "x-cmm-people") || "");
    const dateLabel = allDay
      ? new Intl.DateTimeFormat("en-US", {
          month: "short",
          day: "numeric",
          timeZone: "UTC",
        }).format(new Date(`${key}T12:00:00Z`))
      : new Intl.DateTimeFormat("en-US", {
          month: "short",
          day: "numeric",
          timeZone: timezone,
        }).format(startMs);
    const formatTime = (ms: number) =>
      new Intl.DateTimeFormat("en-US", {
        hour: "numeric",
        minute: "2-digit",
        timeZone: timezone,
      }).format(ms);
    output.set(`${uid}::${occurrence}`, {
      id: `${uid}::${occurrence}`,
      uid,
      title,
      description: String(value(component, "description") || ""),
      location: String(value(component, "location") || ""),
      start: new Date(startMs).toISOString(),
      end: new Date(endMs).toISOString(),
      day: key < `${month}-01` ? 1 : Number(key.slice(8)),
      endDay:
        endKey >= `${nextMonth}-01`
          ? days
          : Math.min(days, Number(endKey.slice(8)) - (allDay ? 1 : 0)),
      dateLabel,
      timeLabel: allDay
        ? "All day"
        : `${formatTime(startMs)} – ${formatTime(endMs)}`,
      category,
      allDay,
      highlight:
        String(value(component, "x-cmm-highlight")).toUpperCase() === "TRUE" ||
        ["travel", "hackathon", "anniversary"].includes(category),
      hidden: false,
      people: rawPeople
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean),
      photo: String(value(component, "x-cmm-photo") || "") || undefined,
      collection: value(component, "x-cmm-collection") || undefined,
    });
  }
  for (const [uid, list] of groups) {
    const masters = list
      .filter((c) => !value(c, "recurrence-id"))
      .sort(
        (a, b) =>
          Number(value(b, "sequence") || 0) - Number(value(a, "sequence") || 0),
      );
    const exceptions = list.filter((c) => value(c, "recurrence-id"));
    const master = masters[0];
    if (!master) {
      for (const c of exceptions) {
        const e = new ICAL.Event(c);
        if (e.startDate)
          add(
            c,
            e.startDate,
            e.endDate,
            uid,
            String(value(c, "recurrence-id")),
          );
      }
      continue;
    }
    if (String(value(master, "status")).toUpperCase() === "CANCELLED") continue;
    try {
      const e = new ICAL.Event(master);
      if (!e.startDate) {
        warnings.push("Skipped an event without a start date.");
        continue;
      }
      if (e.isRecurring()) {
        const replaced = new Set(
          exceptions.map((c) => String(value(c, "recurrence-id"))),
        );
        const iterator = e.iterator();
        let occurrence: any;
        while ((occurrence = iterator.next())) {
          if (++steps > 100_000)
            throw new Error(
              "Recurrence expansion limit reached. Please export a shorter date range.",
            );
          if (
            occurrence.year > year + 1 ||
            `${occurrence.year}-${String(occurrence.month).padStart(2, "0")}` >
              nextMonth
          )
            break;
          if (replaced.has(occurrence.toString())) continue;
          const end = occurrence.clone();
          end.addDuration(e.duration);
          add(master, occurrence, end, uid, occurrence.toString());
        }
        for (const c of exceptions) {
          const ex = new ICAL.Event(c);
          if (ex.startDate)
            add(
              c,
              ex.startDate,
              ex.endDate,
              uid,
              String(value(c, "recurrence-id")),
            );
        }
      } else add(master, e.startDate, e.endDate, uid, e.startDate.toString());
    } catch (error) {
      if (error instanceof Error && error.message.includes("limit reached"))
        throw error;
      warnings.push(
        `Could not fully read: ${String(value(master, "summary") || "an event")}.`,
      );
    }
  }
  return {
    month,
    timezone,
    days,
    events: [...output.values()].sort(
      (a, b) => a.start.localeCompare(b.start) || a.id.localeCompare(b.id),
    ),
    warnings: [...new Set(warnings)],
  };
}
