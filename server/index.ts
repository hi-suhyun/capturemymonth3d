import { createServer } from "node:http";
import { handleRequest } from "./handler";
const port = Number(process.env.CMM_API_PORT || 8787);
createServer(async (req, res) => {
  try {
    const base = `http://127.0.0.1:${port}`;
    // Development adapter binds to loopback; the hosted demo never calls this API.
    const request = new Request(new URL(req.url || "/", base), {
      method: req.method,
      headers: req.headers as Record<string, string>,
      ...(!["GET", "HEAD"].includes(req.method || "GET")
        ? { body: req, duplex: "half" }
        : {}),
    } as RequestInit);
    const response = await handleRequest(request);
    res.writeHead(response.status, Object.fromEntries(response.headers));
    res.end(Buffer.from(await response.arrayBuffer()));
  } catch {
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Unable to process the request" }));
  }
}).listen(port, "127.0.0.1", () =>
  console.log(`CaptureMyMonth3D API: http://127.0.0.1:${port}`),
);
