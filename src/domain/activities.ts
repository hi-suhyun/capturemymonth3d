import type { Category } from './types';

/** Data-driven registry shared by classification, animation selection and the sample file. */
export const EXTRA_ACTIVITIES = [
  { action: 'cooking', title: 'Cooking Class', label: 'Something homemade', category: 'other', pattern: /\b(cooking|baking|meal prep)\b|요리|베이킹/i },
  { action: 'painting', title: 'Watercolor Painting', label: 'A little color', category: 'other', pattern: /\b(painting|watercolor|art workshop)\b|수채화|그림 그리기|미술/i },
  { action: 'guitar', title: 'Guitar Practice', label: 'Finding your rhythm', category: 'other', pattern: /\bguitar\b|기타 연습|기타 레슨/i },
  { action: 'piano', title: 'Piano Lesson', label: 'One note at a time', category: 'other', pattern: /\bpiano\b|피아노/i },
  { action: 'cycling', title: 'Cycling by the Lake', label: 'A different pace', category: 'fitness', pattern: /\b(cycling|biking|bike ride)\b|자전거|사이클링/i },
  { action: 'basketball', title: 'Basketball Practice', label: 'Taking your shot', category: 'fitness', pattern: /\bbasketball\b|농구/i },
  { action: 'soccer', title: 'Soccer Match', label: 'A little teamwork', category: 'fitness', pattern: /\b(soccer|football)\b|축구/i },
  { action: 'tennis', title: 'Tennis Lesson', label: 'Back across the net', category: 'fitness', pattern: /\btennis\b|테니스/i },
  { action: 'swimming', title: 'Swimming Practice', label: 'Finding your flow', category: 'fitness', pattern: /\b(swimming|swim practice|lap swim)\b|수영/i },
  { action: 'gardening', title: 'Community Gardening', label: 'Growing something good', category: 'other', pattern: /\b(gardening|planting|repotting)\b|원예|분갈이|텃밭/i },
  { action: 'photography', title: 'Photography Walk', label: 'Through your lens', category: 'other', pattern: /\b(photography|photo walk|photoshoot)\b|사진 촬영|출사/i },
  { action: 'dogwalking', title: 'Walk the Dog', label: 'A walk with a friend', category: 'other', pattern: /\b(dog walk|dog walking|walk the dog|walk my dog)\b|강아지 산책|반려견 산책/i },
  { action: 'meditation', title: 'Mindfulness Meditation', label: 'A moment to breathe', category: 'other', pattern: /\b(meditation|mindfulness|breathwork)\b|명상|마음챙김/i },
  { action: 'presenting', title: 'Project Presentation', label: 'Sharing your ideas', category: 'assignment', pattern: /\b(presentation|public speaking|thesis defense)\b|발표|논문 심사/i },
  { action: 'volunteering', title: 'Food Bank Volunteering', label: 'Giving a little back', category: 'other', pattern: /\b(volunteering|volunteer|food bank|community service)\b|봉사|푸드뱅크/i },
] as const satisfies readonly { action: string; title: string; label: string; category: Category; pattern: RegExp }[];
export type ExtraAction = (typeof EXTRA_ACTIVITIES)[number]['action'];
export function matchExtraActivity(title: string) {
  return EXTRA_ACTIVITIES.find(activity => activity.pattern.test(title));
}
export function isExtraAction(action: string): action is ExtraAction {
  return EXTRA_ACTIVITIES.some(activity => activity.action === action);
}

/** All movement depends on playback time, so pause and seek also apply to props. */
export function extraPose(action: ExtraAction, t: number) {
  const wave = Math.sin(t * 5), slow = Math.sin(t * 2);
  const pose = { arms: [0, 0], spread: [0, 0], legs: [0, 0], knees: [0, 0], bodyY: 0, lean: 0, sway: 0, head: 0 };
  switch (action) {
    case 'cooking': pose.arms = [-1.1 + wave * .12, -.9]; break;
    case 'painting': pose.arms = [-.7, -1.15 + slow * .3]; pose.head = .12; break;
    case 'guitar': pose.arms = [-.9, -.8 + wave * .17]; pose.spread = [-.55, .25]; pose.sway = slow * .04; break;
    case 'piano': pose.arms = [-1 + wave * .07, -1 - wave * .07]; break;
    case 'cycling': pose.arms = [-1.25, -1.25]; pose.legs = [-.9 + wave * .45, -.9 - wave * .45]; pose.knees = [.9 - wave * .45, .9 + wave * .45]; pose.bodyY = .12; pose.lean = .18; break;
    case 'basketball': pose.arms = [-.3, -.7 + wave * .5]; pose.bodyY = Math.max(0, slow) * .08; break;
    case 'soccer': pose.legs = [0, -.5 - wave * .55]; pose.spread = [-.25, .25]; break;
    case 'tennis': pose.arms = [-.3, -1.2 + wave * .8]; pose.sway = wave * .1; break;
    case 'swimming': pose.arms = [t * 4, t * 4 + Math.PI]; pose.bodyY = .32; pose.lean = -Math.PI / 2; pose.legs = [-Math.PI / 2 + wave * .2, -Math.PI / 2 - wave * .2]; break;
    case 'gardening': pose.arms = [-.8, -1.2 + slow * .2]; pose.bodyY = -.12; pose.lean = .3; pose.legs = [-.4, -.6]; pose.knees = [.6, .8]; break;
    case 'photography': pose.arms = [-1.9, -1.9]; pose.head = .08 + slow * .025; break;
    case 'dogwalking': pose.arms = [wave * .3, -.6]; pose.legs = [-wave * .35, wave * .35]; pose.bodyY = Math.abs(wave) * .02; break;
    case 'meditation': pose.arms = [-.45, -.45]; pose.spread = [-.5, .5]; pose.legs = [-1.3, -1.3]; pose.knees = [1.4, 1.4]; pose.bodyY = -.24 + slow * .012; break;
    case 'presenting': pose.arms = [-.6, -1.8 + slow * .18]; pose.spread = [0, .4]; break;
    case 'volunteering': pose.arms = [-1.1 + slow * .25, -1.1 + slow * .25]; pose.lean = .08; break;
  }
  return pose;
}
