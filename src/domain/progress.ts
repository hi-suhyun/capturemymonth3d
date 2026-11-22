import type { CalendarEvent, Chapter, Journey } from './types';
import { summarizeCategories } from './journey';

const clamp = (value: number) => Math.max(0, Math.min(1, value));
type ReportEntry = { event: CalendarEvent; start: number; end: number };
type Anchor = { chapter: Chapter; position: number };
type ReportTimeline = {
  entries: ReportEntry[];
  anchors: Anchor[];
  categories: ReturnType<typeof summarizeCategories>;
};
const timelines = new WeakMap<Journey, ReportTimeline>();

/** Playback chooses scenes. Reporting always includes the entire visible month. */
function reportTimeline(journey: Journey): ReportTimeline {
  const cached = timelines.get(journey);
  if (cached) return cached;
  const events = journey.month.events.filter(event => !event.hidden)
    .slice().sort((a, b) => a.start.localeCompare(b.start));
  const chapters = new Map(journey.chapters.map(chapter => [chapter.eventId, chapter]));
  const counts = new Map<number, number>();
  const offsets = new Map<number, number>();
  for (const event of events) counts.set(event.day, (counts.get(event.day) ?? 0) + 1);
  // A stable place within the day preserves event order, including all-day ties.
  const positions = events.map(event => {
    const offset = offsets.get(event.day) ?? 0;
    offsets.set(event.day, offset + 1);
    return event.day + (offset + .5) / counts.get(event.day)!;
  });
  const entries: ReportEntry[] = [];
  const anchors: Anchor[] = [];
  let previous: Anchor | undefined;
  let index = 0;
  while (index < events.length) {
    const event = events[index];
    const chapter = chapters.get(event.id);
    if (chapter) {
      previous = { chapter, position: positions[index] };
      anchors.push(previous);
      entries.push({ event, start: chapter.start, end: chapter.end });
      index++;
      continue;
    }
    // Compress unshown records into the approach to the next scene, or the final walk.
    let nextIndex = index + 1;
    while (nextIndex < events.length && !chapters.has(events[nextIndex].id)) nextIndex++;
    const next = nextIndex < events.length ? chapters.get(events[nextIndex].id) : undefined;
    const fromTime = previous?.chapter.end ?? 5;
    const toTime = next?.arrival ?? journey.duration;
    const fromPosition = previous?.position ?? 1;
    const toPosition = next ? positions[nextIndex] : journey.month.days + 1;
    let priorEnd = fromTime;
    while (index < nextIndex) {
      const fraction = clamp((positions[index] - fromPosition) / Math.max(.001, toPosition - fromPosition));
      const end = fromTime + (toTime - fromTime) * fraction;
      entries.push({ event: events[index], start: Math.max(priorEnd, end - .3), end });
      priorEnd = end;
      index++;
    }
  }
  const timeline = { entries, anchors, categories: summarizeCategories(journey.month) };
  timelines.set(journey, timeline);
  return timeline;
}

/** Clock-derived reporting also makes pause, seek and restart reversible. */
export function journeyProgress(journey: Journey, time: number) {
  const { entries, anchors, categories } = reportTimeline(journey);
  let position = 1;
  for (let index = 0; index < anchors.length; index++) {
    const { chapter, position: target } = anchors[index];
    if (time < chapter.start) break;
    const previousPosition = index ? anchors[index - 1].position : 1;
    const approach = clamp((time - chapter.start) / Math.max(.001, chapter.arrival - chapter.start));
    position = previousPosition + (target - previousPosition) * approach;
  }
  const last = anchors.at(-1);
  if (last && time >= last.chapter.end) {
    position = last.position + (journey.month.days + 1 - last.position)
      * clamp((time - last.chapter.end) / Math.max(.001, journey.duration - last.chapter.end));
  }
  return {
    day: Math.min(journey.month.days, Math.max(1, Math.floor(position))),
    categories: categories.map(category => {
      const records = entries.filter(entry => entry.event.category === category.category);
      const amount = records.reduce((sum, entry) => sum + (time >= entry.end ? 1
        : clamp((time - entry.start) / Math.max(.001, entry.end - entry.start))), 0);
      const completed = records.filter(entry => time >= entry.end).length;
      return { ...category, completed, fraction: amount / category.count };
    }),
  };
}
