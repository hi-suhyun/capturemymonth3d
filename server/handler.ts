/** Optional HTTP adapter. The browser demo uses the same engine inside a Web Worker.
 * Deploy behind authentication/rate limits before accepting private public uploads.
 * No raw calendar or personal event data is persisted or logged here.
 */
import { parseCalendar } from "../src/domain/calendar";
import {
  createJourney,
  createCollection,
  summarize,
} from "../src/domain/journey";
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
export async function handleRequest(request: Request): Promise<Response> {
  const url = new URL(request.url);
  if (url.pathname === "/health")
    return json({
      status: "ok",
      service: "capture-my-month-domain-api",
      version: 1,
    });
  if (url.pathname !== "/api/journeys")
    return json({ error: "Not found" }, 404);
  if (request.method !== "POST")
    return json({ error: "Use POST /api/journeys" }, 405);
  if (!request.headers.get("content-type")?.includes("application/json"))
    return json({ error: "Send application/json" }, 415);
  try {
    const reader = request.body?.getReader();
    let bytes = 0;
    const chunks: Uint8Array[] = [];
    if (!reader) return json({ error: "Request body is required" }, 400);
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > 5_500_000) {
        await reader.cancel();
        return json({ error: "Request is too large" }, 413);
      }
      chunks.push(value);
    }
    const payload = JSON.parse(await new Blob(chunks as BlobPart[]).text());
    if (
      typeof payload.calendar !== "string" ||
      typeof payload.month !== "string"
    )
      return json({ error: "calendar and month are required strings" }, 400);
    if (payload.timezone !== undefined && typeof payload.timezone !== "string")
      return json({ error: "timezone must be an IANA timezone string" }, 400);
    if (
      payload.mode !== undefined &&
      !["full", "highlights"].includes(payload.mode)
    )
      return json({ error: "mode must be full or highlights" }, 400);
    const month = parseCalendar(
      payload.calendar,
      payload.month,
      payload.timezone || "UTC",
    );
    return json({
      version: 1,
      month,
      journey: createJourney(month, payload.mode || "full"),
      summary: summarize(month),
      collections: createCollection(month),
    });
  } catch (error) {
    return json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to compile the journey",
      },
      400,
    );
  }
}
