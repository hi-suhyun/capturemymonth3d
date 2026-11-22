import { EXTRA_ACTIVITIES, type ExtraAction } from "./activities";
export type Category =
  | "study"
  | "assignment"
  | "exam"
  | "social"
  | "fitness"
  | "travel"
  | "hackathon"
  | "anniversary"
  | "other";
export type SceneAction = ExtraAction
  | "sitting"
  | "flying"
  | "stargazing"
  | "reading"
  | "writing"
  | "waving"
  | "stretching"
  | "jogging"
  | "lifting"
  | "yoga"
  | "typing"
  | "celebrating"
  | "looking";
export type CollectionKind = "travel" | "achievement" | "connection";
export interface CalendarEvent {
  id: string;
  uid: string;
  title: string;
  description: string;
  location: string;
  start: string;
  end: string;
  day: number;
  endDay: number;
  dateLabel: string;
  timeLabel: string;
  category: Category;
  allDay: boolean;
  highlight: boolean;
  hidden: boolean;
  people: string[];
  photo?: string;
  collection?: CollectionKind;
}
export interface MonthData {
  month: string;
  timezone: string;
  events: CalendarEvent[];
  warnings: string[];
  days: number;
}
export interface Chapter {
  eventId: string;
  start: number;
  end: number;
  arrival: number;
  pathPosition: number;
  action: SceneAction;
}
export interface Journey {
  duration: number;
  chapters: Chapter[];
  month: MonthData;
  mode: "full" | "highlights";
}
export interface MemoryCard {
  id: string;
  kind: CollectionKind;
  title: string;
  subtitle: string;
  date: string;
  description: string;
  eventIds: string[];
  photo?: string;
  metric: string;
  scene:
    | "chicago"
    | "mountain"
    | "friends"
    | "stargazing"
    | "hackathon"
    | "kbbq";
}
export const CATEGORY_META: Record<
  Category,
  { label: string; color: string; action: SceneAction }
> = {
  study: { label: "Class", color: "#758d78", action: "reading" },
  assignment: { label: "Assignment", color: "#a49b6c", action: "writing" },
  exam: { label: "Exam", color: "#c58a65", action: "writing" },
  social: { label: "With friends", color: "#c28b94", action: "waving" },
  fitness: { label: "Workout", color: "#759d92", action: "stretching" },
  travel: { label: "Travel", color: "#7799b7", action: "looking" },
  hackathon: { label: "Hackathon", color: "#9a86ae", action: "typing" },
  anniversary: {
    label: "Anniversary",
    color: "#c99469",
    action: "celebrating",
  },
  other: { label: "A moment", color: "#8a9590", action: "looking" },
};

export const ACTIVITY_LABEL: Record<SceneAction, string> = {
  ...Object.fromEntries(EXTRA_ACTIVITIES.map(a => [a.action, a.label])) as Record<ExtraAction, string>,
  reading: "A little time to learn",
  writing: "Putting in the work",
  typing: "Building something new",
  sitting: "Time with your people",
  flying: "A little further from home",
  stargazing: "A moment under the stars",
  waving: "A familiar face",
  stretching: "Making time to move",
  jogging: "One stride at a time",
  lifting: "Growing stronger",
  yoga: "Finding your balance",
  celebrating: "A moment worth keeping",
  looking: "Taking it all in",
};
