import { parseCalendar } from "./calendar";
self.onmessage = (
  event: MessageEvent<{
    id: number;
    text: string;
    month: string;
    timezone: string;
  }>,
) => {
  const { id, text, month, timezone } = event.data;
  try {
    self.postMessage({ id, data: parseCalendar(text, month, timezone) });
  } catch (e) {
    self.postMessage({
      id,
      error: e instanceof Error ? e.message : "Unable to read this calendar.",
    });
  }
};
