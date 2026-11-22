import { matchExtraActivity, isExtraAction } from "./activities";
import {
  CATEGORY_META,
  type Category,
  type Journey,
  type MonthData,
  type MemoryCard,
  type SceneAction,
} from "./types";

export function actionForEvent(event: MonthData["events"][number]): SceneAction {
  const extra = matchExtraActivity(event.title);
  if (extra) return extra.action;
  const text = `${event.title} ${event.location}`;
  if (/stargaz|astronomy|meteor shower|별\s*보기|천체/i.test(text)) return "stargazing";
  if (event.category === "travel" && /flight|flying|airport|chicago|비행|공항/i.test(text)) return "flying";
  if (event.category === "social") return "sitting";
  if (event.category === "fitness") {
    if (/\byoga\b/i.test(event.title)) return "yoga";
    if (/\b(run(?:ning)?|jog(?:ging)?)\b/i.test(event.title))
      return "jogging";
    if (
      /\b(strength|weight(?:s|lifting)?|gym|lift(?:ing)?)\b/i.test(
        event.title,
      )
    )
      return "lifting";
  }
  return CATEGORY_META[event.category].action;
}

export function createJourney(
  month: MonthData,
  mode: "full" | "highlights" = "full",
  options: { cinematicIntro?: boolean } = {},
): Journey {
  const visible = month.events.filter((e) => !e.hidden);
  const chosen = mode === "full" ? visible : visible.filter((e) => e.highlight);
  const events = chosen.length ? chosen : visible.slice(0, 12);
  let clock = 5;
  const chapters = events.map((event, index) => {
    const action = actionForEvent(event);
    const intro = options.cinematicIntro && index === 0;
    // Preserve every record; allocate enough time to actually perform its activity.
    const special = action === "stargazing" || action === "flying";
    const routine = !isExtraAction(action) && (event.category === "study" || event.category === "assignment" || event.category === "other");
    const length = intro ? 6.5 : special ? 4.2 : mode === "highlights" || event.highlight
      ? 3.2 : routine ? 1.5 : 2.6;
    const walkDuration = intro ? 1.8 : special ? 0.9 : routine && mode === "full" && !event.highlight ? 0.5 : 0.8;
    const sameDay = events.filter((e) => e.day === event.day);
    const offset =
      sameDay.findIndex((e) => e.id === event.id) / Math.max(1, sameDay.length);
    const position = Math.min(
      0.97,
      Math.max(0.025, (event.day - 1 + offset + 0.35) / month.days),
    );
    const chapter = {
      eventId: event.id,
      start: clock,
      end: clock + length,
      arrival: clock + walkDuration,
      pathPosition: position,
      action,
    };
    clock += length;
    return chapter;
  });
  return { duration: clock + 5, chapters, month, mode };
}
export function currentChapter(journey: Journey, time: number) {
  return (
    journey.chapters.find((c) => time >= c.start && time < c.end) ||
    (time >= journey.duration - 5 ? journey.chapters.at(-1) : undefined)
  );
}
export function summarize(month: MonthData) {
  const events = month.events.filter((e) => !e.hidden);
  return {
    count: events.length,
    workouts: events.filter((e) => e.category === "fitness").length,
    exams: events.filter((e) => e.category === "exam").length,
    connections: events.filter((e) =>
      ["social", "anniversary"].includes(e.category),
    ).length,
    days: new Set(events.map((e) => e.day)).size,
  };
}
export function summarizeCategories(month: MonthData) {
  const events = month.events.filter((event) => !event.hidden);
  const counts = new Map<Category, number>();
  for (const event of events) {
    counts.set(event.category, (counts.get(event.category) ?? 0) + 1);
  }
  const labels: Record<Category, string> = {
    study: "Class",
    assignment: "Study",
    exam: "Exam",
    social: "Friends",
    fitness: "Workout",
    travel: "Travel",
    hackathon: "Hackathon",
    anniversary: "Anniversary",
    other: "Other",
  };
  return (Object.keys(CATEGORY_META) as Category[])
    .filter((category) => counts.has(category))
    .flatMap((category) => {
      const count = counts.get(category);
      return count === undefined
        ? []
        : [
            {
              category,
              label: labels[category],
              color: CATEGORY_META[category].color,
              count,
              percentage: (count / events.length) * 100,
            },
          ];
    });
}
export function createCollection(month: MonthData): MemoryCard[] {
  const events = month.events.filter((e) => !e.hidden);
  const cards: MemoryCard[] = [];
  const toCard = (
    event: MonthData["events"][number],
    kind: MemoryCard["kind"],
    scene: MemoryCard["scene"],
    subtitle: string,
    metric: string,
  ): MemoryCard => ({
    id:
      kind === "travel"
        ? `${month.month}-${kind}-${event.id}`
        : `${month.month}-${kind}`,
    kind,
    title: event.title,
    subtitle,
    date: event.dateLabel,
    description:
      event.description
        .replace(/^Fictional demo calendar for CaptureMyMonth3D\.\s*/i, "")
        .replace(/All-day dates preserve.*$/i, "")
        .trim()
        .slice(0, 300) ||
      "A moment recorded in your calendar, preserved in your field guide.",
    eventIds: [event.id],
    photo: event.photo,
    metric,
    scene,
  });
  const travel = events
    .filter((event) => event.category === "travel")
    .sort((a, b) => a.start.localeCompare(b.start));
  for (const event of travel) {
    const stargazing = /stargazing|stars/i.test(event.title);
    cards.push(
      toCard(
        event,
        "travel",
        stargazing
          ? "stargazing"
          : /joshua tree|national park|camping|hike/i.test(event.title)
            ? "mountain"
            : "chicago",
        stargazing
          ? "A night beneath the desert sky"
          : "A little further from ordinary",
        "1 recorded trip",
      ),
    );
  }
  const picks: [MemoryCard["kind"], string[], MemoryCard["scene"]][] = [
    ["achievement", ["hackathon", "exam", "assignment"], "mountain"],
    ["connection", ["anniversary", "social"], "friends"],
  ];
  for (const [kind, categories, scene] of picks) {
    const options = events.filter((e) => categories.includes(e.category));
    const event = [...options].sort(
      (a, b) =>
        Number(b.highlight) - Number(a.highlight) ||
        categories.indexOf(a.category) - categories.indexOf(b.category) ||
        a.start.localeCompare(b.start),
    )[0];
    if (!event) continue;
    const subtitle =
      kind === "achievement"
        ? "A chapter worth keeping"
        : "The people along the way";
    const cardScene =
      kind === "achievement" && event.category === "hackathon"
        ? "hackathon"
        : kind === "connection" &&
            (event.category === "anniversary" ||
              /anniversary|dinner|kbbq/i.test(event.title))
          ? "kbbq"
          : scene;
    const metric =
      kind === "achievement"
        ? `${events.filter((e) => e.category === "exam").length} recorded exams`
        : `${options.length} plans together`;
    cards.push(toCard(event, kind, cardScene, subtitle, metric));
  }
  return cards;
}

/** Activity weight is derived from the playback time, including enter/leave transitions. */
export function activityEnvelope(chapter: Journey["chapters"][number] | undefined, time: number) {
  if (!chapter || time < chapter.arrival || time >= chapter.end) return 0;
  const smooth = (value: number) => { const u = Math.max(0, Math.min(1, value)); return u * u * (3 - 2 * u); };
  const ramp = Math.min(0.45, (chapter.end - chapter.arrival) / 3);
  return smooth((time - chapter.arrival) / ramp) * smooth((chapter.end - time) / ramp);
}
