import { expect, it } from "vitest";
import { handleRequest } from "./handler";
import { readFileSync } from "node:fs";
it("compiles the complete calendar through the HTTP boundary", async () => {
  const calendar = readFileSync(
    new URL("../public/demo-november-2026.ics", import.meta.url),
    "utf8",
  );
  const response = await handleRequest(
    new Request("http://localhost/api/journeys", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        calendar,
        month: "2026-11",
        timezone: "America/Los_Angeles",
      }),
    }),
  );
  const data = await response.json();
  expect(response.status).toBe(200);
  expect(data.summary.count).toBe(79);
  expect(data.journey.chapters).toHaveLength(79);
  expect(data.collections).toHaveLength(4);
  expect(response.headers.get("cache-control")).toBe("no-store");
});
it("rejects invalid API input clearly", async () => {
  const r = await handleRequest(
    new Request("http://localhost/api/journeys", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{}",
    }),
  );
  expect(r.status).toBe(400);
  expect((await r.json()).error).toContain("required");
});
