import type { MonthData } from "./types";
export function readCalendar(
  text: string,
  month: string,
  timezone: string,
): Promise<MonthData> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(
      new URL("./calendar.worker.ts", import.meta.url),
      { type: "module" },
    );
    const timer = setTimeout(() => {
      worker.terminate();
      reject(
        new Error("Calendar processing took too long. Try a smaller export."),
      );
    }, 12000);
    worker.onmessage = (e) => {
      clearTimeout(timer);
      worker.terminate();
      e.data.error ? reject(new Error(e.data.error)) : resolve(e.data.data);
    };
    worker.onerror = () => {
      clearTimeout(timer);
      worker.terminate();
      reject(
        new Error(
          "Could not start the calendar reader. Please reload and try again.",
        ),
      );
    };
    worker.postMessage({ id: 1, text, month, timezone });
  });
}
