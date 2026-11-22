import { describe, expect, it } from 'vitest';
import { activityEnvelope, createJourney } from './journey';
import type { CalendarEvent, MonthData } from './types';
import { journeyPose } from '../scene/Avatar';

const event = (id: string, overrides: Partial<CalendarEvent> = {}): CalendarEvent => ({
  id, uid: id, title: id, description: '', location: '',
  start: '2026-11-02T10:00:00.000Z', end: '2026-11-02T11:00:00.000Z',
  day: 2, endDay: 2, dateLabel: '', timeLabel: '', category: 'study',
  allDay: false, highlight: false, hidden: false, people: [], ...overrides,
});
const month: MonthData = {
  month: '2026-11', timezone: 'UTC',
  events: [event('class'), event('exam', {category: 'exam', highlight: true})], warnings: [], days: 30,
};

describe('record-based activity playback', () => {
  it('preserves every visible original event and gives every activity time after arrival', () => {
    const input = {...month, events: [...month.events, event('hidden', {hidden: true})]};
    const journey = createJourney(input);
    expect(journey.chapters.map(c => c.eventId)).toEqual(['class', 'exam']);
    for (const chapter of journey.chapters) {
      expect(chapter.end - chapter.arrival).toBeGreaterThanOrEqual(.99);
      const pose = journeyPose(journey, (chapter.arrival + chapter.end) / 2);
      expect(pose.walking).toBe(false);
      expect(pose.action).toBe(chapter.action);
      expect(pose.position).toBe(chapter.pathPosition);
    }
    expect(journey.chapters[1].end - journey.chapters[1].start).toBeGreaterThan(journey.chapters[0].end - journey.chapters[0].start);
  });
  it('preserves the ten-second opening preview', () => {
    const first = createJourney(month, 'full', {cinematicIntro: true}).chapters[0];
    expect(first.start).toBe(5);
    expect(first.arrival).toBeCloseTo(6.8);
    expect(first.end).toBeCloseTo(11.5);
    expect(activityEnvelope(first, 10)).toBe(1);
  });
  it('chooses activities without confusing park travel, coffee after a trip, or workouts with flights', () => {
    const input = {...month, events: [
      event('stars', {title: 'Joshua Tree Stargazing', category: 'travel'}),
      event('trip', {title: 'Chicago Thanksgiving Trip', category: 'travel'}),
      event('coffee', {title: 'Back-from-Chicago Coffee', category: 'social'}),
      event('park', {title: 'National Park Hike', category: 'travel'}),
      event('lift', {title: 'Strength Training', category: 'fitness'}),
      event('yoga', {title: 'Morning Yoga Flow', category: 'fitness'}),
      event('run', {title: 'Campus Run', category: 'fitness'}),
    ]};
    const chapters = createJourney(input).chapters;
    expect(chapters.map(c => c.action)).toEqual(['stargazing', 'flying', 'sitting', 'looking', 'lifting', 'yoga', 'jogging']);
    expect(chapters[0].end - chapters[0].arrival).toBeGreaterThan(3);
  });
  it('resets activity and night effects on departure and rewind, including after the last chapter', () => {
    const chapter = createJourney(month).chapters[0];
    expect(activityEnvelope(chapter, chapter.start)).toBe(0);
    expect(activityEnvelope(chapter, chapter.arrival)).toBe(0);
    expect(activityEnvelope(chapter, chapter.arrival + .2)).toBeGreaterThan(0);
    expect(activityEnvelope(chapter, (chapter.arrival + chapter.end) / 2)).toBe(1);
    expect(activityEnvelope(chapter, chapter.end)).toBe(0);
    expect(activityEnvelope(chapter, chapter.end + 10)).toBe(0);
    expect(activityEnvelope(chapter, 0)).toBe(0);
    expect(activityEnvelope(undefined, 10)).toBe(0);
  });
});
