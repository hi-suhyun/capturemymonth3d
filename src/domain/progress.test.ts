import { expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { parseCalendar } from './calendar';
import { createCollection, createJourney, summarize, summarizeCategories } from './journey';
import { journeyProgress } from './progress';
import type { CalendarEvent, MonthData } from './types';

const month = parseCalendar(readFileSync(new URL('../../public/demo-november-2026.ics', import.meta.url), 'utf8'), '2026-11');

it('uses identical whole-month totals and category proportions in both playback modes', () => {
  const full = createJourney(month);
  const highlights = createJourney(month, 'highlights');
  expect(highlights.chapters.length).toBeLessThan(full.chapters.length);
  for (const journey of [full, highlights]) {
    const start = journeyProgress(journey, 0);
    expect(start.day).toBe(1);
    expect(start.categories.every(c => c.fraction === 0 && c.completed === 0)).toBe(true);
    expect(start.categories.map(({ completed, fraction, ...category }) => category)).toEqual(summarizeCategories(month));
    const end = journeyProgress(journey, journey.duration);
    expect(end.day).toBe(month.days);
    expect(end.categories.every(c => c.fraction === 1 && c.completed === c.count)).toBe(true);
    expect(end.categories.reduce((sum, c) => sum + c.completed, 0)).toBe(summarize(month).count);
    expect(journeyProgress(journey, 0)).toEqual(start);
  }
  expect(journeyProgress(highlights, highlights.duration)).toEqual(journeyProgress(full, full.duration));
  // Screen 5 receives the unchanged month, so its report and cards also stay mode-independent.
  expect(summarize(highlights.month)).toEqual(summarize(full.month));
  expect(createCollection(highlights.month)).toEqual(createCollection(full.month));
});

const event = (id: string, day: number, highlight = false, hidden = false): CalendarEvent => ({
  ...month.events[0], id, uid: id, title: id, day, endDay: day,
  start: `2026-11-${String(day).padStart(2, '0')}T10:00:00.000Z`,
  end: `2026-11-${String(day).padStart(2, '0')}T11:00:00.000Z`,
  category: highlight ? 'travel' : 'study', highlight, hidden,
});
const sample: MonthData = { ...month, events: [
  event('before', 1), event('first', 5, true),
  event('between', 10), event('same-day-before', 15), event('second', 15, true),
  event('same-day-after', 15), event('after', 29), event('excluded', 30, false, true),
] };
const completed = (journey: ReturnType<typeof createJourney>, time: number, category = 'study') =>
  journeyProgress(journey, time).categories.find(c => c.category === category)?.completed;

it('accumulates skipped events before, between and after highlights in calendar order', () => {
  const journey = createJourney(sample, 'highlights');
  const [first, second] = journey.chapters;
  expect(completed(journey, first.start)).toBe(0);
  expect(completed(journey, first.arrival)).toBe(1);
  expect(completed(journey, first.end)).toBe(1);
  expect(completed(journey, second.arrival)).toBe(3);
  expect(completed(journey, second.end)).toBe(3);
  expect(completed(journey, journey.duration)).toBe(5);
  expect(completed(journey, journey.duration, 'travel')).toBe(2);
  // Rewind restores only the records already passed at that moment.
  expect(completed(journey, first.arrival)).toBe(1);
});

it('keeps dates and counts monotonic and excludes explicitly hidden events', () => {
  const journey = createJourney(sample, 'highlights');
  let previous = journeyProgress(journey, 0);
  for (let time = .1; time <= journey.duration + .1; time += .1) {
    const report = journeyProgress(journey, time);
    expect(report.day).toBeGreaterThanOrEqual(previous.day);
    report.categories.forEach((category, i) => {
      expect(category.completed).toBeGreaterThanOrEqual(previous.categories[i].completed);
      expect(category.fraction).toBeGreaterThanOrEqual(previous.categories[i].fraction);
      expect(category.fraction).toBeLessThanOrEqual(1);
    });
    previous = report;
  }
  expect(previous.categories.reduce((sum, c) => sum + c.count, 0)).toBe(7);
});

it('includes the tail when highlights fall back to the first twelve unstarred events', () => {
  const journey = createJourney({ ...month, events: Array.from({ length: 20 }, (_, i) => event(`event-${i}`, i + 1)) }, 'highlights');
  expect(journey.chapters).toHaveLength(12);
  expect(completed(journey, journey.duration)).toBe(20);
});

it('handles an empty included month without invalid fractions', () => {
  const journey = createJourney({ ...month, events: [event('hidden', 1, true, true)] }, 'highlights');
  expect(journeyProgress(journey, journey.duration).categories).toEqual([]);
});
