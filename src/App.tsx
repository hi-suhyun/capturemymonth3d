import {
  Component,
  lazy,
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  Footprints,
  Upload,
  Play,
  Pause,
  Map,
  ChevronRight,
  Check,
  X,
  FileText,
  CalendarDays,
  MapPin,
  Sparkles,
  Mountain,
  Users,
  Compass,
  Download,
  RotateCcw,
  Settings2,
  BookOpen,
  Flag,
  ArrowUpRight,
  Maximize2,
  Clock3,
  CheckCircle2,
  Layers3,
  Code2,
  LoaderCircle,
  ImagePlus,
  Trash2,
} from "lucide-react";
import { inferMonth } from "./domain/calendar";
import { readCalendar } from "./domain/client";
import {
  createJourney,
  currentChapter,
  createCollection,
  summarize,
  summarizeCategories,
} from "./domain/journey";
import {
  CATEGORY_META,
  type MonthData,
  type Category,
  type CalendarEvent,
} from "./domain/types";
import type { Playback } from "./scene/Avatar";
import MemoryMiniature from "./scene/MemoryMiniature";
import "./style.css";
const World = lazy(() => import("./scene/World"));
type Stage =
  | "welcome"
  | "import"
  | "select"
  | "review"
  | "journey"
  | "collection";
const STEP_NAMES = [
  "Import",
  "Choose month",
  "Make it yours",
  "Walk your month",
  "Field guide",
];
const stageIndex = (stage: Stage) =>
  ({ welcome: 0, import: 0, select: 1, review: 2, journey: 3, collection: 4 })[
    stage
  ];
const prettyMonth = (month: string) =>
  new Date(`${month}-15T12:00:00`).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
const durationLabel = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(Math.round(seconds % 60)).padStart(2, "0")}`;
class SceneBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <div className="scene-fallback">
        <Mountain size={48} />
        <p>Your browser could not open the 3D scene.</p>
        <span>
          You can still explore and organize your calendar. Try a browser with
          hardware acceleration enabled.
        </span>
      </div>
    ) : (
      this.props.children
    );
  }
}
function CategoryIcon({
  category,
  size = 17,
}: {
  category: Category;
  size?: number;
}) {
  const Icon =
    category === "travel"
      ? Compass
      : category === "fitness"
        ? Footprints
        : category === "social" || category === "anniversary"
          ? Users
          : category === "hackathon"
            ? Code2
            : category === "exam"
              ? Flag
              : BookOpen;
  return <Icon size={size} />;
}
export default function App() {
  const [stage, setStage] = useState<Stage>("welcome"),
    [raw, setRaw] = useState(""),
    [filename, setFilename] = useState(""),
    [month, setMonth] = useState("2026-11"),
    [timezone, setTimezone] = useState("America/Los_Angeles"),
    [data, setData] = useState<MonthData>(),
    [pending, setPending] = useState(false),
    [error, setError] = useState(""),
    [demo, setDemo] = useState(false),
    [mode, setMode] = useState<"full" | "highlights">("full"),
    [progress, setProgress] = useState(0),
    [playing, setPlaying] = useState(false),
    [speed, setSpeed] = useState(1),
    [previewDone, setPreviewDone] = useState(false),
    [overview, setOverview] = useState(false),
    [lowQuality, setLowQuality] = useState(false),
    [architecture, setArchitecture] = useState(false),
    [toast, setToast] = useState(""),
    [filter, setFilter] = useState("all"),
    [flipped, setFlipped] = useState<string>(),
    [dragging, setDragging] = useState(false);
  const playback = useRef<Playback>({
    time: 0,
    playing: false,
    speed: 1,
    preview: false,
    overview: false,
  });
  const fileRef = useRef<HTMLInputElement>(null),
    currentRef = useRef<HTMLDivElement>(null),
    milestoneScrollFrame = useRef<number | undefined>(undefined);
  const journey = useMemo(
    () => (data ? createJourney(data, mode) : undefined),
    [data, mode],
  );
  const stats = useMemo(() => (data ? summarize(data) : undefined), [data]);
  const categoryReport = useMemo(
    () => (data ? summarizeCategories(data) : []),
    [data],
  );
  const cards = useMemo(() => (data ? createCollection(data) : []), [data]);
  const chapter = journey ? currentChapter(journey, progress) : undefined;
  const current = data?.events.find((e) => e.id === chapter?.eventId);
  const visible = data?.events.filter((e) => !e.hidden) || [];
  async function addEventPhoto(id: string, file?: File) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Choose an image file to add a calendar photo.");
      return;
    }
    if (file.size > 10_000_000) {
      setError("Choose an image smaller than 10 MB.");
      return;
    }
    const reader = new FileReader();
    const photo = await new Promise<string>((resolve, reject) => {
      reader.onload = () =>
        typeof reader.result === "string"
          ? resolve(reader.result)
          : reject(new Error("This image could not be read."));
      reader.onerror = () =>
        reject(reader.error || new Error("This image could not be read."));
      reader.readAsDataURL(file);
    }).catch((cause: unknown) => {
      setError(
        cause instanceof Error ? cause.message : "This image could not be read.",
      );
      return undefined;
    });
    if (photo) edit(id, { photo });
  }
  useEffect(() => {
    const target = currentRef.current;
    const list = target?.parentElement;
    if (!target || !list) return;

    const targetRect = target.getBoundingClientRect();
    const listRect = list.getBoundingClientRect();
    const distance =
      targetRect.bottom > listRect.bottom
        ? targetRect.bottom - listRect.bottom
        : targetRect.top < listRect.top
          ? targetRect.top - listRect.top
          : 0;
    if (!distance) return;

    if (milestoneScrollFrame.current !== undefined)
      cancelAnimationFrame(milestoneScrollFrame.current);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      list.scrollTop += distance;
      return;
    }

    const start = list.scrollTop;
    const destination = start + distance;
    const startedAt = performance.now();
    const duration = mode === "highlights" ? 800 : 450;
    const scroll = (now: number) => {
      const progress = Math.min((now - startedAt) / duration, 1);
      const eased = 1 - (1 - progress) ** 3;
      list.scrollTop = start + (destination - start) * eased;
      if (progress < 1)
        milestoneScrollFrame.current = requestAnimationFrame(scroll);
    };
    milestoneScrollFrame.current = requestAnimationFrame(scroll);
    return () => {
      if (milestoneScrollFrame.current !== undefined)
        cancelAnimationFrame(milestoneScrollFrame.current);
    };
  }, [current?.id, mode]);
  useEffect(() => {
    let frame: number,
      last = performance.now(),
      ui = 0;
    function tick(now: number) {
      const delta = Math.min((now - last) / 1000, 0.1);
      last = now;
      if (playback.current.playing && journey) {
        playback.current.time += delta * playback.current.speed;
        const limit = playback.current.preview ? 10 : journey.duration;
        if (playback.current.time >= limit) {
          playback.current.time = limit;
          playback.current.playing = false;
          setPlaying(false);
          setProgress(limit);
          if (playback.current.preview) setPreviewDone(true);
          else setStage("collection");
        }
        if (now - ui > 90) {
          setProgress(playback.current.time);
          ui = now;
        }
      }
      frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [journey]);
  useEffect(() => {
    currentRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });
  }, [current?.id]);
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(""), 3500);
    return () => clearTimeout(id);
  }, [toast]);
  useEffect(() => {
    function key(e: KeyboardEvent) {
      if (
        stage === "journey" &&
        e.code === "Space" &&
        !["INPUT", "SELECT", "TEXTAREA", "BUTTON"].includes(
          (e.target as HTMLElement)?.tagName,
        )
      ) {
        e.preventDefault();
        togglePlay();
      }
      if (e.key === "Escape") setArchitecture(false);
    }
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [stage, playing]);
  function reset() {
    playback.current = {
      time: 0,
      playing: false,
      speed: 1,
      preview: false,
      overview: false,
    };
    setProgress(0);
    setPlaying(false);
    setSpeed(1);
    setOverview(false);
    setPreviewDone(false);
  }
  function togglePlay() {
    const next = !playback.current.playing;
    playback.current.playing = next;
    setPlaying(next);
  }
  async function loadDemo(preview = false) {
    setPending(true);
    setError("");
    try {
      const response = await fetch("/demo-november-2026.ics");
      if (!response.ok)
        throw new Error("The sample calendar could not be loaded.");
      const text = await response.text();
      const parsed = await readCalendar(text, "2026-11", "America/Los_Angeles");
      setRaw(text);
      setData(parsed);
      setMonth("2026-11");
      setTimezone("America/Los_Angeles");
      setFilename("demo-november-2026.ics");
      setDemo(true);
      reset();
      if (preview) {
        setMode("full");
        playback.current.playing = true;
        playback.current.preview = true;
        setPlaying(true);
        setStage("journey");
      } else setStage("select");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not open the sample.");
    } finally {
      setPending(false);
    }
  }
  async function loadFile(file?: File) {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".ics")) {
      setError(
        "Please choose an .ics calendar file. Unzip your calendar export first if needed.",
      );
      return;
    }
    if (file.size > 5_000_000) {
      setError("Choose an .ics file smaller than 5 MB.");
      return;
    }
    setPending(true);
    setError("");
    try {
      const text = await file.text();
      const detected = inferMonth(text);
      const parsed = await readCalendar(text, detected, timezone);
      setRaw(text);
      setFilename(file.name);
      setMonth(detected);
      setData(parsed);
      setDemo(false);
      reset();
      setStage("select");
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "This calendar could not be read.",
      );
    } finally {
      setPending(false);
    }
  }
  async function chooseMonth() {
    setPending(true);
    setError("");
    try {
      const parsed = await readCalendar(raw, month, timezone);
      setData(parsed);
      setStage("review");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not read this month.");
    } finally {
      setPending(false);
    }
  }
  function edit(id: string, patch: Partial<CalendarEvent>) {
    setData((d) =>
      d
        ? {
            ...d,
            events: d.events.map((e) => (e.id === id ? { ...e, ...patch } : e)),
          }
        : d,
    );
  }
  function start(preview = false) {
    reset();
    playback.current.playing = true;
    playback.current.preview = preview;
    setPlaying(true);
    setStage("journey");
  }
  function seek(time: number) {
    playback.current.time = time;
    setProgress(time);
    setPreviewDone(false);
  }
  function saveMap() {
    const canvas = document.querySelector<HTMLCanvasElement>(
      ".world-canvas canvas",
    );
    if (!canvas) return;
    try {
      const link = document.createElement("a");
      link.download = `CaptureMyMonth3D-${month}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      setToast("Your map image has been saved.");
    } catch {
      setToast("Image export was unavailable in this browser.");
    }
  }
  function saveProject() {
    if (!data) return;
    const blob = new Blob(
      [JSON.stringify({ version: 1, month: data, cards }, null, 2)],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob),
      a = document.createElement("a");
    a.href = url;
    a.download = `CaptureMyMonth3D-${month}-field-guide.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setToast("Your field guide data has been saved.");
  }
  const nextMonth = (() => {
    const date = new Date(`${month}-15`);
    date.setMonth(date.getMonth() + 1);
    return date.toLocaleDateString("en-US", { month: "long" });
  })();
  return (
    <main className={`app stage-${stage}`}>
      <input
        ref={fileRef}
        aria-label="Upload an iCalendar file"
        type="file"
        accept=".ics,text/calendar"
        className="sr-only"
        onChange={(e) => {
          void loadFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      <div
        className="world-canvas"
        aria-label="Interactive winter diorama with a winding illuminated path"
      >
        <SceneBoundary>
          <Suspense
            fallback={
              <div className="scene-loading">
                <LoaderCircle className="spin" />
                <span>Building your little world…</span>
              </div>
            }
          >
            <World
              journey={journey}
              photo={current?.photo}
              playback={playback}
              active={stage === "journey"}
              lowQuality={lowQuality}
            />
          </Suspense>
        </SceneBoundary>
      </div>
      <header className="topbar">
        <button
          className="brand"
          onClick={() => {
            reset();
            setStage("welcome");
          }}
          aria-label="CaptureMyMonth3D home"
        >
          <span className="brand-mark">
            <Footprints size={23} />
          </span>
          <span>
            CaptureMyMonth<span className="brand-3d">3D</span>
          </span>
        </button>
        {stage === "welcome" ? (
          <nav className="landing-nav">
            <button onClick={() => setArchitecture(true)}>
              Behind the journey
            </button>
            <a href="/demo-november-2026.ics" download>
              Sample calendar <Download size={14} />
            </a>
          </nav>
        ) : (
          <nav className="steps" aria-label="Your journey steps">
            {STEP_NAMES.map((label, i) => (
              <span
                className={
                  i === stageIndex(stage)
                    ? "current"
                    : i < stageIndex(stage)
                      ? "done"
                      : ""
                }
                key={label}
              >
                <span className="step-number">
                  {i < stageIndex(stage) ? <Check size={11} /> : i + 1}
                </span>
                <span className="step-name">{label}</span>
                {i < 4 && <span className="step-line" />}
              </span>
            ))}
          </nav>
        )}
        <button
          className="icon-button settings"
          aria-label={
            lowQuality ? "Use high visual quality" : "Use performance mode"
          }
          title={lowQuality ? "Performance mode on" : "High quality mode"}
          onClick={() => {
            setLowQuality(!lowQuality);
            setToast(
              lowQuality
                ? "High quality enabled."
                : "Performance mode enabled.",
            );
          }}
        >
          <Settings2 size={18} />
        </button>
      </header>
      {error && (
        <div className="error-banner" role="alert">
          {error}
          <button aria-label="Dismiss error" onClick={() => setError("")}>
            <X size={16} />
          </button>
        </div>
      )}
      {stage === "welcome" && (
        <>
          <section className="hero-copy">
            <div className="eyebrow">
              <span className="little-star">✧</span> YOUR LIFE, A LITTLE WORLD
            </div>
            <h1>
              A month worth
              <br />
              <em>walking through.</em>
            </h1>
            <p>
              Your classes. Your people. Your little victories.
              <br />
              Turn your calendar into a world you can wander.
            </p>
            <div className="hero-actions">
              <button
                className="primary"
                onClick={() => void loadDemo()}
                disabled={pending}
              >
                {pending ? (
                  <LoaderCircle size={18} className="spin" />
                ) : (
                  <Footprints size={18} />
                )}
                Explore November
              </button>
              <button className="secondary" onClick={() => setStage("import")}>
                <Upload size={17} />
                Upload my calendar
              </button>
            </div>
            <button
              className="preview-link"
              onClick={() => void loadDemo(true)}
              disabled={pending}
            >
              <span>
                <Play size={13} fill="currentColor" />
              </span>
              Watch the 10-second scene
            </button>
            <div className="hero-note">
              <span className="tiny-rule" />
              No account. Your calendar stays in your browser.
            </div>
          </section>
          <div className="world-label">
            <span className="world-label-line" />
            <span>
              <b>FROSTLIGHT VALLEY</b>
              <small>A November story, waiting to unfold.</small>
            </span>
          </div>
          <div className="landing-bottom">
            <span>
              <span className="mini-icon">
                <CalendarDays size={16} />
              </span>
              One calendar. A world of memories.
            </span>
            <span className="theme-tag">
              <Sparkles size={14} /> WINTER EDITION <span>01</span>
            </span>
          </div>
        </>
      )}
      {stage === "import" && (
        <section
          className={`flow-panel import-panel ${dragging ? "dragging" : ""}`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            void loadFile(e.dataTransfer.files[0]);
          }}
        >
          <span className="eyebrow">THE FIRST STEP</span>
          <h2>
            Every journey starts
            <br />
            with your calendar.
          </h2>
          <p>
            Bring an .ics export from Google Calendar, Apple Calendar, or
            Outlook.
          </p>
          <button
            className="dropzone"
            disabled={pending}
            onClick={() => fileRef.current?.click()}
          >
            <span className="upload-orbit">
              <Upload size={28} />
            </span>
            <strong>
              {pending ? "Reading your calendar…" : "Drop your calendar here"}
            </strong>
            <span>or choose an .ics file · up to 5 MB</span>
          </button>
          <div className="privacy-line">
            <CheckCircle2 size={16} />
            <span>Read locally. Never uploaded to a server.</span>
          </div>
          <div className="panel-divider" />
          <button
            className="text-button"
            onClick={() => void loadDemo()}
            disabled={pending}
          >
            Just looking? Explore our November sample <ChevronRight size={15} />
          </button>
          <button className="subtle-back" onClick={() => setStage("welcome")}>
            Back to the valley
          </button>
        </section>
      )}
      {stage === "select" && (
        <section className="flow-panel">
          <span className="eyebrow">CHOOSE A CHAPTER</span>
          <h2>
            Which month
            <br />
            shall we wander?
          </h2>
          <p>A whole month, held in one little world.</p>
          <div className="file-chip">
            <FileText size={19} />
            <div>
              <strong>{filename}</strong>
              <span>
                {demo ? "Fictional demo calendar" : "Read in your browser"}
              </span>
            </div>
            <CheckCircle2 size={17} />
          </div>
          <label className="field-label" htmlFor="month">
            Your month
          </label>
          <div className="month-fields">
            <select
              id="month"
              aria-label="Month"
              value={month.slice(5)}
              onChange={(e) =>
                setMonth(`${month.slice(0, 4)}-${e.target.value}`)
              }
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i} value={String(i + 1).padStart(2, "0")}>
                  {new Date(2026, i, 15).toLocaleDateString("en-US", {
                    month: "long",
                  })}
                </option>
              ))}
            </select>
            <input
              aria-label="Year"
              type="number"
              min="2000"
              max="2100"
              value={month.slice(0, 4)}
              onChange={(e) => setMonth(`${e.target.value}-${month.slice(5)}`)}
            />
          </div>
          <label className="field-label" htmlFor="timezone">
            Display timezone
          </label>
          <select
            id="timezone"
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
          >
            <option value="America/Los_Angeles">
              Pacific Time · Los Angeles
            </option>
            <option value="America/Chicago">Central Time · Chicago</option>
            <option value="America/New_York">Eastern Time · New York</option>
            <option value="Asia/Seoul">Korea Standard Time · Seoul</option>
            <option value="Europe/London">London</option>
            <option value="UTC">UTC</option>
          </select>
          <div className="soft-note">
            <Map size={18} />
            <span>
              Your dates become a path. Your moments bring it to life.
            </span>
          </div>
          <button
            className="primary full"
            onClick={() => void chooseMonth()}
            disabled={pending || !month}
          >
            {pending ? (
              <LoaderCircle className="spin" size={17} />
            ) : (
              <Sparkles size={17} />
            )}
            Make this month mine
          </button>
          <button className="subtle-back" onClick={() => setStage("import")}>
            Choose another calendar
          </button>
        </section>
      )}
      {stage === "review" && data && stats && (
        <section className="review-panel">
          <div className="review-intro">
            <span className="eyebrow">A FEW PERSONAL TOUCHES</span>
            <h2>
              Make room for
              <br />
              <em>what matters.</em>
            </h2>
            <p>
              {prettyMonth(month)} · {stats.count} recorded events
            </p>
            <div className="review-stats">
              <span>
                <b>{stats.exams}</b> exams
              </span>
              <span>
                <b>{stats.workouts}</b> workouts
              </span>
              <span>
                <b>{stats.connections}</b> plans together
              </span>
            </div>
            <p className="small-copy">
              Star the moments you want to keep. Adjust a category, rename a
              memory, or leave an event out.
            </p>
            <div className="mode-toggle" aria-label="Journey playback mode">
              <button
                className={mode === "full" ? "selected" : ""}
                onClick={() => setMode("full")}
              >
                <Footprints size={16} />
                Every event
                <small>
                  {durationLabel(createJourney(data, "full").duration)}
                </small>
              </button>
              <button
                className={mode === "highlights" ? "selected" : ""}
                onClick={() => setMode("highlights")}
              >
                <Sparkles size={16} />
                Highlights
                <small>
                  {durationLabel(createJourney(data, "highlights").duration)}
                </small>
              </button>
            </div>
            <button
              className="primary full"
              disabled={!stats.count}
              onClick={() => start()}
            >
              <Play size={16} fill="currentColor" />
              Walk my month
            </button>
            <button
              className="text-button"
              disabled={!stats.count}
              onClick={() => start(true)}
            >
              Preview the first 10 seconds <Play size={13} />
            </button>
            <button className="subtle-back" onClick={() => setStage("select")}>
              Change month
            </button>
          </div>
          <div className="event-editor">
            <div className="editor-top">
              <strong>Your milestones</strong>
              <span>{data.events.length} in this calendar</span>
            </div>
            {data.warnings.length > 0 && (
              <div className="warnings">
                {data.warnings.map((w) => (
                  <p key={w}>{w}</p>
                ))}
              </div>
            )}
            {!data.events.length ? (
              <div className="empty-state">
                <CalendarDays size={32} />
                <h3>No events in this month.</h3>
                <p>Choose another month or try the November sample.</p>
              </div>
            ) : (
              data.events.map((e) => (
                <div
                  className={`edit-event ${e.hidden ? "is-hidden" : ""}`}
                  key={e.id}
                >
                  <button
                    className={`star-button ${e.highlight ? "starred" : ""}`}
                    aria-label={`${e.highlight ? "Unstar" : "Star"} ${e.title}`}
                    onClick={() => edit(e.id, { highlight: !e.highlight })}
                  >
                    <Sparkles size={17} />
                  </button>
                  <div className="edit-event-main">
                    <span className="event-date">
                      {e.dateLabel} · {e.timeLabel}
                    </span>
                    <input
                      aria-label={`Title for ${e.title}`}
                      value={e.title}
                      onChange={(v) => edit(e.id, { title: v.target.value })}
                    />
                    <select
                      aria-label={`Category for ${e.title}`}
                      value={e.category}
                      onChange={(v) =>
                        edit(e.id, { category: v.target.value as Category })
                      }
                    >
                      {Object.entries(CATEGORY_META).map(([key, v]) => (
                        <option key={key} value={key}>
                          {v.label}
                        </option>
                      ))}
                    </select>
                    <div className="event-photo">
                      {e.photo && (
                        <img src={e.photo} alt={`Photo for ${e.title}`} />
                      )}
                      <label className="photo-upload">
                        <ImagePlus size={14} />
                        {e.photo ? "Change photo" : "Add photo"}
                        <input
                          type="file"
                          accept="image/*"
                          aria-label={`Add photo for ${e.title}`}
                          onChange={(v) => {
                            void addEventPhoto(e.id, v.target.files?.[0]);
                            v.target.value = "";
                          }}
                        />
                      </label>
                      {e.photo && (
                        <button
                          className="remove-photo"
                          type="button"
                          aria-label={`Remove photo for ${e.title}`}
                          onClick={() => edit(e.id, { photo: undefined })}
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                  <button
                    className="include-button"
                    aria-label={`${e.hidden ? "Include" : "Hide"} ${e.title}`}
                    onClick={() => edit(e.id, { hidden: !e.hidden })}
                  >
                    {e.hidden ? "Include" : <Check size={16} />}
                  </button>
                </div>
              ))
            )}
          </div>
        </section>
      )}
      {stage === "journey" && journey && data && (
        <>
          <aside className="milestones">
            <div className="milestone-heading">
              <span className="eyebrow">YOUR MONTH, IN MOTION</span>
              <h2>{prettyMonth(month)}</h2>
              <p>
                {demo
                  ? "A sample student story"
                  : "Your calendar, your journey"}
              </p>
            </div>
            <div className="milestone-list">
              <div
                className={`milestone departure ${progress < 5 ? "active" : "passed"}`}
              >
                <span className="milestone-icon">
                  <Footprints size={17} />
                </span>
                <div>
                  <small>THE BEGINNING</small>
                  <h3>A new month awaits.</h3>
                  <p>Take the first little step.</p>
                </div>
              </div>
              {visible.map((e) => {
                const currentDay = current?.day || 1;
                const passed =
                  progress > 5 &&
                  (e.start < (current?.start || "") ||
                    progress >= journey.duration - 5);
                return (
                  <div
                    key={e.id}
                    ref={current?.id === e.id ? currentRef : undefined}
                    className={`milestone ${current?.id === e.id ? "active" : ""} ${passed ? "passed" : ""}`}
                  >
                    <span
                      className="milestone-icon"
                      style={{ color: CATEGORY_META[e.category].color }}
                    >
                      {passed ? (
                        <Check size={15} />
                      ) : (
                        <CategoryIcon category={e.category} />
                      )}
                    </span>
                    <div>
                      <small>
                        {e.dateLabel.toUpperCase()} ·{" "}
                        {CATEGORY_META[e.category].label.toUpperCase()}
                      </small>
                      <h3>{e.title}</h3>
                      <p>{e.timeLabel}</p>
                      {current?.id === e.id && e.location && (
                        <p className="location">
                          <MapPin size={12} />
                          {e.location}
                        </p>
                      )}
                      {e.day === currentDay && e.highlight && (
                        <span className="highlight-tag">
                          <Sparkles size={11} />A moment to keep
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
              <div className="milestone destination">
                <span className="milestone-icon">
                  <Flag size={17} />
                </span>
                <div>
                  <small>THE FINISH LINE</small>
                  <h3>A month to remember.</h3>
                  <p>Your field guide is waiting.</p>
                </div>
              </div>
            </div>
          </aside>
          <div className="scene-badge">
            <span className="scene-live" />
            {progress < 2.1
              ? "THE WHOLE LITTLE WORLD"
              : progress < 5
                ? "FINDING YOUR FIRST STEP"
                : current
                  ? CATEGORY_META[current.category].label.toUpperCase()
                  : "ONE MONTH, MANY MOMENTS"}
          </div>
          <div className="journey-tools">
            <button
              className={`icon-button ${overview ? "is-on" : ""}`}
              aria-label={
                overview ? "Follow the traveler" : "Show the whole map"
              }
              onClick={() => {
                playback.current.overview = !overview;
                setOverview(!overview);
              }}
            >
              <Map size={19} />
            </button>
            <button
              className="icon-button"
              aria-label="Restart journey"
              onClick={() => start(playback.current.preview)}
            >
              <RotateCcw size={18} />
            </button>
            <button
              className="icon-button"
              aria-label="Save map image"
              onClick={saveMap}
            >
              <Download size={18} />
            </button>
          </div>
          {previewDone && (
            <div className="preview-finish">
              <span className="eyebrow">JUST THE FIRST FEW STEPS</span>
              <h3>
                Your story is
                <br />
                just beginning.
              </h3>
              <p>Keep walking to discover your field guide.</p>
              <button
                className="primary"
                onClick={() => {
                  playback.current.preview = false;
                  playback.current.playing = true;
                  setPlaying(true);
                  setPreviewDone(false);
                }}
              >
                Continue my month <Play size={15} />
              </button>
              <button
                className="text-button"
                onClick={() => {
                  reset();
                  setStage("review");
                }}
              >
                Back to my milestones
              </button>
            </div>
          )}
          <div className="playback-bar">
            <button
              className="play-button"
              aria-label={playing ? "Pause journey" : "Play journey"}
              onClick={() => {
                if (previewDone) {
                  playback.current.preview = false;
                  setPreviewDone(false);
                }
                togglePlay();
              }}
            >
              {playing ? (
                <Pause size={18} fill="currentColor" />
              ) : (
                <Play size={18} fill="currentColor" />
              )}
            </button>
            <div className="timeline">
              <div className="timeline-labels">
                <span>
                  {progress < 5
                    ? "Your month begins"
                    : current
                      ? `${current.dateLabel} · ${current.title}`
                      : "The last little steps"}
                </span>
                <span>
                  {durationLabel(progress)} /{" "}
                  {durationLabel(
                    playback.current.preview ? 10 : journey.duration,
                  )}
                </span>
              </div>
              <input
                aria-label="Journey timeline"
                type="range"
                min={0}
                max={journey.duration - 0.01}
                step={0.1}
                value={progress}
                onChange={(e) => {
                  playback.current.preview = false;
                  seek(Number(e.target.value));
                }}
              />
              <div className="timeline-dates">
                <span>
                  {new Date(`${month}-15`)
                    .toLocaleDateString("en-US", { month: "short" })
                    .toUpperCase()}{" "}
                  1
                </span>
                <span>YOUR MONTH, ONE STEP AT A TIME</span>
                <span>
                  {new Date(`${month}-15`)
                    .toLocaleDateString("en-US", { month: "short" })
                    .toUpperCase()}{" "}
                  {data.days}
                </span>
              </div>
            </div>
            <select
              aria-label="Playback speed"
              value={speed}
              onChange={(e) => {
                const n = Number(e.target.value);
                setSpeed(n);
                playback.current.speed = n;
              }}
            >
              <option value={1}>1×</option>
              <option value={2}>2×</option>
              <option value={4}>4×</option>
              <option value={8}>8×</option>
            </select>
            <button
              className="text-button finish-control"
              onClick={() => {
                playback.current.preview = false;
                seek(journey.duration - 4.5);
                playback.current.playing = true;
                setPlaying(true);
              }}
              title="Jump to the final steps"
            >
              Final steps <Flag size={14} />
            </button>
          </div>
        </>
      )}
      {stage === "collection" && stats && data && (
        <section className="collection-screen">
          <div className="collection-title">
            <span className="eyebrow collection-greeting">Hi, Siena</span>
            <h1>
              Look how far
              <br />
              <em>your month took you.</em>
            </h1>
            <p>{prettyMonth(month)} · Your personal field guide</p>
            <div className="category-report">
              <div className="category-report-heading">
                <strong>Your month at a glance</strong>
              </div>
              <div
                className="category-report-bar"
                role="img"
                aria-label={`${stats.count} events by category${
                  categoryReport.length
                    ? `: ${categoryReport
                        .map(
                          ({ label, percentage }) =>
                            `${label} ${percentage.toFixed(1)}%`,
                        )
                        .join(", ")}`
                    : ""
                }`}
              >
                {categoryReport.map((category) => (
                  <span
                    className="category-report-segment"
                    key={category.category}
                    title={`${category.label}: ${category.percentage.toFixed(1)}% (${category.count} ${category.count === 1 ? "event" : "events"})`}
                    style={{
                      width: `${category.percentage}%`,
                      backgroundColor: category.color,
                    }}
                  />
                ))}
              </div>
              <div className="category-report-footer">
                <div className="category-report-legend">
                  {categoryReport.map((category) => (
                    <span
                      className="category-report-item"
                      key={category.category}
                    >
                      <i style={{ backgroundColor: category.color }} />
                      <span>{category.label}</span>
                      <b>{category.percentage.toFixed(1)}%</b>
                    </span>
                  ))}
                </div>
                <strong className="category-report-total">
                  {stats.count} events
                </strong>
              </div>
            </div>
          </div>
          <div
            className="collection-tabs"
            role="group"
            aria-label="Field guide collection"
          >
            <button
              className={filter === "all" ? "selected" : ""}
              onClick={() => setFilter("all")}
            >
              Main events
            </button>
            <button
              className={filter === "travel" ? "selected" : ""}
              onClick={() => setFilter("travel")}
            >
              <Compass size={15} />
              Travel journal
            </button>
            <button
              className={filter === "achievement" ? "selected" : ""}
              onClick={() => setFilter("achievement")}
            >
              <Mountain size={15} />
              Achievement journal
            </button>
            <button
              className={filter === "connection" ? "selected" : ""}
              onClick={() => setFilter("connection")}
            >
              <Users size={15} />
              People journal
            </button>
          </div>
          <div className="memory-grid">
            {cards
              .filter((c) => filter === "all" || c.kind === filter)
              .map((card, i) => (
                <article
                  className={`memory-card ${card.kind} ${flipped === card.id ? "flipped" : ""}`}
                  key={card.id}
                  onPointerMove={(e) => {
                    if (e.pointerType === "touch") return;
                    const r = e.currentTarget.getBoundingClientRect();
                    e.currentTarget.style.setProperty(
                      "--rx",
                      `${-(e.clientY - r.top - r.height / 2) / 45}deg`,
                    );
                    e.currentTarget.style.setProperty(
                      "--ry",
                      `${(e.clientX - r.left - r.width / 2) / 40}deg`,
                    );
                  }}
                  onPointerLeave={(e) => {
                    e.currentTarget.style.setProperty("--rx", "0deg");
                    e.currentTarget.style.setProperty("--ry", "0deg");
                  }}
                >
                  <div className="memory-top">
                    <span>
                      {card.kind === "travel"
                        ? "TRAVEL JOURNAL"
                        : card.kind === "achievement"
                          ? "ACHIEVEMENT JOURNAL"
                          : "PEOPLE JOURNAL"}
                    </span>
                    <span>0{i + 1}</span>
                  </div>
                  <div className="miniature">
                    <MemoryMiniature scene={card.scene} />
                  </div>
                  <div className="memory-info">
                    <span className="memory-date">
                      {card.date.toUpperCase()} · {month.slice(0, 4)}
                    </span>
                    <h3>{card.title}</h3>
                    <p>{card.subtitle}</p>
                    <div className="memory-bottom">
                      <span>{card.metric}</span>
                      <button
                        aria-label={`Read ${card.title}`}
                        onClick={() =>
                          setFlipped(flipped === card.id ? undefined : card.id)
                        }
                      >
                        <BookOpen size={16} />
                      </button>
                    </div>
                  </div>
                  {flipped === card.id && (
                    <div className="card-detail">
                      <button
                        aria-label="Close memory details"
                        onClick={() => setFlipped(undefined)}
                      >
                        <X size={18} />
                      </button>
                      <span className="eyebrow">FROM YOUR CALENDAR</span>
                      <h3>{card.title}</h3>
                      <p>{card.description}</p>
                      <small>Saved from your {card.date} calendar entry.</small>
                    </div>
                  )}
                </article>
              ))}
          </div>
          {!cards.filter((c) => filter === "all" || c.kind === filter)
            .length && (
            <p className="empty-collection">
              No moments in this journal yet. Star or categorize an event to add
              one.
            </p>
          )}
          <div className="collection-actions">
            <button
              className="primary"
              onClick={() => {
                reset();
                setRaw("");
                setData(undefined);
                setError("");
                setStage("import");
              }}
            >
              <Upload size={17} />
              Upload {nextMonth}'s calendar
            </button>
            <button className="secondary" onClick={saveProject}>
              <Download size={17} />
              Save my field guide
            </button>
            <button className="text-button" onClick={() => start()}>
              <RotateCcw size={15} />
              Walk it again
            </button>
          </div>
          <p className="collection-footnote">
            A record of what was on your calendar. A little reminder of what
            mattered.
          </p>
        </section>
      )}
      {stage !== "welcome" && stage !== "collection" && stage !== "journey" && (
        <div className="scene-caption">
          <span className="caption-pin">
            <MapPin size={15} />
          </span>
          <span>
            Frostlight Valley<small>One world. Your own story.</small>
          </span>
        </div>
      )}
      <button
        className="architecture-button"
        onClick={() => setArchitecture(true)}
        title="Explore the working architecture"
      >
        <Layers3 size={15} />
        <span>Inside the journey</span>
      </button>
      {architecture && (
        <div className="modal-scrim" onClick={() => setArchitecture(false)}>
          <section
            className="architecture-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="architecture-title"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="modal-close icon-button"
              aria-label="Close architecture"
              onClick={() => setArchitecture(false)}
            >
              <X size={20} />
            </button>
            <span className="eyebrow">SMALL WORLD. REAL SYSTEM.</span>
            <h2 id="architecture-title">Built for the next chapter.</h2>
            <p>
              A working, browser-first pipeline. Art assets can evolve without
              changing the calendar engine.
            </p>
            <div className="architecture-flow">
              {[
                [
                  "01",
                  "Import & normalize",
                  "ical.js · timezone-aware parsing · bounded recurrence expansion",
                ],
                [
                  "02",
                  "Make meaning",
                  "Editable categories · explicit highlights · hidden-event filtering",
                ],
                [
                  "03",
                  "Direct the journey",
                  "Deterministic timeline · event-to-action registry · seekable playback",
                ],
                [
                  "04",
                  "Bring it to life",
                  "React Three Fiber · real 3D geometry · camera choreography",
                ],
                [
                  "05",
                  "Keep what matters",
                  "Three field guides · source-event links · exportable records",
                ],
              ].map(([n, title, desc]) => (
                <div key={n}>
                  <span>{n}</span>
                  <div>
                    <h3>{title}</h3>
                    <p>{desc}</p>
                  </div>
                  <CheckCircle2 size={18} />
                </div>
              ))}
            </div>
            <div className="architecture-note">
              <strong>Working today</strong>
              <p>
                Local .ics parsing in a Web Worker, editable event metadata,
                five-step flow, 3D traversal, and memory cards.
              </p>
              <strong>Next art pass</strong>
              <p>
                Replace procedural props with Blender-made GLB assets. Add
                richer action clips, seasonal palettes, and video export.
              </p>
              <strong>Service boundary</strong>
              <p>
                The same domain engine also powers a tested POST /api/journeys
                HTTP adapter. The hosted demo runs privately in your browser;
                the optional local API is included in the source.
              </p>
            </div>
            <a className="text-button" href="/demo-november-2026.ics" download>
              <Download size={15} />
              Download the November test calendar
            </a>
          </section>
        </div>
      )}
      {toast && (
        <div className="toast" role="status">
          <CheckCircle2 size={16} />
          {toast}
        </div>
      )}
    </main>
  );
}
