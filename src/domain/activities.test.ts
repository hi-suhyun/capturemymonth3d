import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { EXTRA_ACTIVITIES, extraPose, matchExtraActivity } from './activities';
import { classify, parseCalendar } from './calendar';
import { actionForEvent, createJourney } from './journey';
import { journeyProgress } from './progress';

const calendar = parseCalendar(readFileSync(new URL('../../public/demo-activities-2026.ics', import.meta.url), 'utf8'), '2026-11', 'America/Los_Angeles');
describe('extended activity library', () => {
  it('loads fifteen distinct activities from real ICS and uses their specific actions instead of category fallbacks', () => {
    expect(calendar.events).toHaveLength(15);
    const journey = createJourney(calendar);
    expect(journey.chapters.map(c => c.action)).toEqual(EXTRA_ACTIVITIES.map(a => a.action));
    expect(new Set(journey.chapters.map(c => c.action)).size).toBe(15);
    EXTRA_ACTIVITIES.forEach((activity, i) => {
      expect(classify(activity.title)).toBe(activity.category);
      expect(actionForEvent({...calendar.events[i], category:'social'})).toBe(activity.action);
      const c = journey.chapters[i];
      expect(c.end - c.arrival).toBeGreaterThan(1.5);
    });
    const highlights = createJourney(calendar, 'highlights');
    expect(highlights.chapters).toHaveLength(15);
    expect(journeyProgress(highlights, highlights.duration).categories.reduce((sum,c) => sum+c.completed,0)).toBe(15);
  });
  it('recognizes Korean titles and respects explicit user categories', () => {
    const titles=['요리 수업','수채화','기타 레슨','피아노','자전거','농구','축구','테니스','수영','텃밭','출사','강아지 산책','명상','발표','봉사'];
    titles.forEach((title,i) => {
      expect(matchExtraActivity(title)?.action).toBe(EXTRA_ACTIVITIES[i].action);
      expect(classify(title,['social'])).toBe('social');
    });
  });
  it('does not remap existing demo activities or generic words accidentally', () => {
    for(const title of ['KBBQ Night with Friends','Campus Run','Chicago Thanksgiving Trip','Joshua Tree Stargazing','One-Year Friendship Anniversary Dinner','Computer Systems Lab Report']) {
      expect(matchExtraActivity(title)).toBeUndefined();
    }
    expect(matchExtraActivity('Guitarist concert')).toBeUndefined();
    expect(matchExtraActivity('Basketballoon')).toBeUndefined();
  });
  it('produces distinct moving poses and deterministic results for pause and rewind', () => {
    for(const {action} of EXTRA_ACTIVITIES) {
      const before=extraPose(action,.3), after=extraPose(action,.8);
      expect(before).not.toEqual(after);
      expect(extraPose(action,.3)).toEqual(before);
      for(const t of [0,.5,1,10,100]) {
        const pose=extraPose(action,t);
        expect(Object.values(pose).flat().every(Number.isFinite)).toBe(true);
      }
    }
  });
});
