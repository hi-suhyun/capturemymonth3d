CaptureMyMonth3D
A month worth walking through.

QUICK START
Node.js 22.12+ (Node 24 was used for this demo).
  npm ci
  npm run dev
Open the Local URL printed by Vite. Do not open index.html as a file:// URL.

PRODUCTION
  npm run build
  npm run preview
The deployable web app is dist/. It is a static, browser-first app.

OPTIONAL LOCAL HTTP API
  npm run api
POST http://127.0.0.1:8787/api/journeys
Content-Type: application/json
Body: { "calendar": "BEGIN:VCALENDAR...", "month": "2026-11", "timezone": "America/Los_Angeles", "mode": "full" }
GET http://127.0.0.1:8787/health
This loopback-only adapter uses the same calendar, classification, journey, and collection engine as the browser worker. The hosted static demo does not call this API. Public deployment would require authentication, rate limiting, a worker queue for large imports, and a defined data-retention policy.

TESTS
  npm test
The suite covers the complete November fixture, explicit classification, recurrence exclusions and moved/cancelled instances, DST, exclusive all-day end dates, hidden records, malformed input, and the HTTP adapter.

FIVE-STEP EXPERIENCE
1. Import: upload .ics locally or choose Explore November.
2. Choose month: English month/year controls and display timezone.
3. Make it yours: edit titles/categories, star events, hide records, select full or highlight playback.
4. Walk your month: overview, camera zoom, traveler, activity animation, chronological sidebar, timeline, speed, and map image export.
5. Field guide: a monthly category breakdown, Travel, Achievement, and People journals, real 3D miniatures, event details, JSON export, and next-month upload.
The 10-second preview holds the first activity from 6.8 seconds through the end of the shot. Continuing preserves that timeline; a regular replay uses the fast full-month pacing.

SOURCE MAP
src/domain/types.ts             Shared event, chapter, and collection contracts.
src/domain/calendar.ts          iCalendar parsing, bounded recurrence, timezone normalization, classification.
src/domain/calendar.worker.ts   Isolated browser worker entry.
src/domain/client.ts            Worker lifecycle, timeout, and error handling.
src/domain/journey.ts           Deterministic chapter timing, event-specific action selection, stats, collection selection.
src/scene/landscape.ts          Island geometry and arc-length traversal route.
src/scene/Props.tsx             Reusable procedural 3D asset library for the environment and activities.
src/scene/Avatar.tsx            Character rig, activity animations, and world placement.
src/scene/World.tsx             Lighting, camera choreography, static geometry batching, effects.
src/scene/MemoryMiniature.tsx   Real 3D field-guide card scenes.
src/App.tsx                    Product flow and English interface.
server/handler.ts               Portable HTTP request/response adapter.
server/index.ts                 Optional loopback Node.js server.
public/demo-november-2026.ics    Fictional, self-contained demo calendar.

DEMO DATA
79 calendar events in November 2026:
33 classes, 21 study assignments, 5 exams, 9 social plans, 7 workouts,
2 trips, 1 hackathon, and 1 friendship anniversary.
Chicago is Nov 25–29; Joshua Tree is Nov 15; the hackathon is Nov 21–22;
the anniversary is Nov 10.
All event names and people are fictional sample data.

PRIVACY AND TRUTHFUL LABELS
The browser reads .ics locally and does not transmit its contents.
No login, tracking, or external AI request is used.
Google Fonts is currently a visual dependency; the system-font fallback remains usable offline.
Statistics describe recorded calendar entries, not verified attendance or outcomes.
No prize, exam score, relationship sentiment, or completed workout is inferred.
The browser session is temporary. Save my field guide exports JSON; it is not cloud sync.

WHAT EXISTS TODAY
- Real WebGL 3D, not a background image or pre-rendered video.
- Procedural diorama, live camera travel, character poses, water, light, and fire motion.
- Event-specific jogging, weightlifting, and yoga animations with reusable procedural props.
- English five-step product flow and real .ics parsing.
- Editable mapping from calendar events to animation actions.
- Three collection types with real 3D card miniatures and source-event IDs.
- Optional tested HTTP adapter sharing the browser's domain modules.

KNOWN LIMITS / NEXT PASSES
- The reference is the art-direction target. Current procedural assets are a demo prototype, not a pixel-identical reproduction of that image.
- Walk/pose transitions and scenery can be replaced with authored Blender GLB models and richer clips.
- Custom VTIMEZONE definitions and common IANA names work; unusual legacy provider identifiers may be skipped with a warning. Complex RANGE=THISANDFUTURE exceptions need a dedicated compatibility pass before a general calendar launch.
- Timezone-free wall times use the chosen display timezone. Ambiguous DST wall times should receive an explicit user-choice UI in production.
- Recurrence expansion and file size are bounded. Large/old calendars should be exported for a smaller range.
- The mobile layout is responsive; low-end GPU quality remains device dependent.
- Field-guide export is JSON and map export is PNG. MP4 export, cloud persistence, account integration, and automatic future-month import are not implemented.
- Artwork is one winter palette. Seasons should be theme packs sharing the same route and action interfaces.

No Blender installation is needed to run this prototype.
