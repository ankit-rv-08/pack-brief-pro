import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  Sparkles, FileSpreadsheet, FileText, Plus, Download, Search, ArrowUpRight, AlertTriangle,
  Loader2, Check, RotateCw, Volume2, VolumeX, AlertCircle, Upload,
} from "lucide-react";
import { Jessy, type JessyMsg } from "@/components/brief/Jessy";
import { ding, tick } from "@/lib/sound";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Brief AI — Packaging Design Brief" },
      { name: "description", content: "Draft evidence-backed packaging design briefs from your source files." },
      { property: "og:title", content: "Brief AI — Packaging Design Brief" },
      { property: "og:description", content: "Draft evidence-backed packaging design briefs from your source files." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

type FType = "xlsx" | "pdf";
type Cite = { id: string; file: string; type: FType; loc: string; line: string; snippet: string };
type SrcFile = { name: string; type: FType; meta: string };

const cites = [
  { id: "c1", file: "production_specs.xlsx", type: "xlsx", loc: "p.2", line: "Row 3", snippet: "ECO-01 bar soap, 100g. Carton target: 100% recyclable, max unit cost $0.18, launch Q2 retail." },
  { id: "c2", file: "brand_guidelines.pdf", type: "pdf", loc: "p.14", line: "Page 14", snippet: "Packaging must express a natural, low-impact identity. Prefer uncoated, earthy substrates." },
  { id: "c3", file: "production_specs.xlsx", type: "xlsx", loc: "p.2", line: "Row 7", snippet: "Board: 350gsm recycled kraft, water-based inks, no laminate. FSC certification required." },
  { id: "c4", file: "retailer_req.pdf", type: "pdf", loc: "p.3", line: "Page 3", snippet: "Shelf-ready packaging should use bleached white board for consistent color reproduction." },
] as const satisfies readonly Cite[];

const SAMPLE: SrcFile[] = [
  { name: "production_specs.xlsx", type: "xlsx", meta: "24 rows · 2 sheets" },
  { name: "brand_guidelines.pdf", type: "pdf", meta: "32 pages · 4.1 MB" },
  { name: "retailer_req.pdf", type: "pdf", meta: "6 pages · 820 KB" },
];
const STAGES = ["Upload", "Extract", "Analyze", "Draft"];
const STEPS = ["Uploading sources", "Extracting facts from 12 rows", "Checking conflicts across 3 files", "Drafting brief section 2 of 5"];

type Toast = { id: number; kind: "ok" | "err"; text: string };

function FileIcon({ type, className = "h-3.5 w-3.5" }: { type: FType; className?: string }) {
  return type === "xlsx" ? <FileSpreadsheet className={`${className} text-success`} /> : <FileText className={`${className} text-danger`} />;
}
function Badge({ n, amber }: { n: number; amber?: boolean }) {
  return <span key={n} className={`badge-bounce rounded-full px-1.5 py-px text-[10px] font-semibold ${amber ? "bg-warning-soft text-warning" : "bg-muted text-muted-foreground"}`}>{n}</span>;
}

function Clock() {
  const [now, setNow] = useState<string | null>(null);
  useEffect(() => {
    const f = () => setNow(new Date().toLocaleTimeString("en-GB", { hour12: false }));
    f();
    const i = setInterval(f, 1000);
    return () => clearInterval(i);
  }, []);
  return (
    <div className="flex items-center gap-1.5 font-mono text-[11px] tracking-[0.02em] text-muted-foreground">
      <span key={now} className="heartbeat h-1.5 w-1.5 rounded-full bg-primary" />
      {now ?? "--:--:--"}
    </div>
  );
}

function Pipeline({ stage, running }: { stage: number; running: boolean }) {
  return (
    <div className="flex items-center justify-center gap-3">
      {STAGES.map((s, i) => {
        const done = running ? i < stage : false;
        const cur = running && i === stage;
        return (
          <div key={s} className="flex items-center gap-3">
            <span className={`flex items-center gap-1.5 font-mono text-[11px] ${done || cur ? "text-primary" : "text-muted-foreground"}`}>
              {cur && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />}
              {String(i + 1).padStart(2, "0")} {s}
            </span>
            {i < STAGES.length - 1 && (
              <span className={`h-0 w-10 border-t ${done ? "border-solid border-primary" : cur ? "border-solid border-primary/40" : "border-dashed border-muted-foreground/40"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function Confetti() {
  return (
    <div className="pointer-events-none absolute left-1/2 top-6 z-10">
      {Array.from({ length: 12 }).map((_, i) => {
        const a = (i / 12) * Math.PI * 2;
        return <span key={i} className="confetti-dot" style={{ ["--dx" as string]: `${Math.cos(a) * 70}px`, ["--dy" as string]: `${Math.sin(a) * 40 - 20}px` }} />;
      })}
    </div>
  );
}

let msgId = 1;

function Index() {
  const [sel, setSel] = useState<Cite | null>(null);
  const [files, setFiles] = useState<SrcFile[]>([]);
  const [phase, setPhase] = useState<"idle" | "running" | "done">("idle");
  const [stage, setStage] = useState(0);
  const [btn, setBtn] = useState<"default" | "running" | "ready">("default");
  const [glow, setGlow] = useState(false);
  const [sparkle, setSparkle] = useState(false);
  const [confetti, setConfetti] = useState(false);
  const [sound, setSound] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [msgs, setMsgs] = useState<JessyMsg[]>([{ id: 0, from: "jessy", text: "Ready when you are. Drop your sources and I'll take it from there." }]);
  const [thinking, setThinking] = useState(false);
  const [thinkingText, setThinkingText] = useState("");
  const [activity, setActivity] = useState<string[]>([]);
  const fileInput = useRef<HTMLInputElement>(null);
  const soundRef = useRef(sound);
  soundRef.current = sound;

  const say = (text: string, from: JessyMsg["from"] = "jessy") => setMsgs((m) => [...m, { id: msgId++, from, text }]);
  const toast = (kind: Toast["kind"], text: string) => setToasts((t) => [...t, { id: msgId++, kind, text }]);

  useEffect(() => {
    if (!toasts.length) return;
    const t = setTimeout(() => setToasts((q) => q.slice(1)), 4000);
    return () => clearTimeout(t);
  }, [toasts]);

  const addFiles = (list: SrcFile[]) => {
    const merged = [...files, ...list.filter((f) => !files.some((x) => x.name === f.name))];
    setFiles(merged);
    if (soundRef.current) tick();
    setGlow(true);
    setTimeout(() => setGlow(false), 2000);
    say(`Got it. ${merged.length} file${merged.length === 1 ? "" : "s"}, ${merged.length * 18} elements. Ready when you click Generate.`);
  };

  const onPick = (fl: FileList | null) => {
    if (!fl?.length) return;
    addFiles(Array.from(fl).map((f) => ({
      name: f.name,
      type: /\.(xlsx|xls|csv)$/i.test(f.name) ? "xlsx" : "pdf",
      meta: `${Math.max(1, Math.round(f.size / 1024))} KB`,
    })));
  };

  const generate = () => {
    if (!files.length || phase === "running") return;
    setPhase("running"); setBtn("running"); setStage(0); setActivity([]); setSel(null);
    setThinking(true); setThinkingText(`Cross-referencing ${files.length * 18} elements against 12 fact groups…`);
    STEPS.forEach((s, i) => setTimeout(() => { setStage(i); setActivity((a) => [...a, s]); }, 300 + i * 900));
    setTimeout(() => {
      setThinking(false); setActivity([]); setPhase("done"); setBtn("ready");
      setConfetti(true); setSparkle(true);
      setTimeout(() => setConfetti(false), 900);
      setTimeout(() => setSparkle(false), 3000);
      setTimeout(() => setBtn("default"), 2000);
      say("Draft ready. 5 sections, 21 facts, 2 open gaps, 1 conflict.");
      toast("ok", "Brief generated");
      if (soundRef.current) ding();
    }, 300 + STEPS.length * 900);
  };

  const reset = () => { setPhase("idle"); setFiles([]); setSel(null); setStage(0); say("Clean slate. Drop new sources whenever you're ready."); };

  const onSend = (t: string) => {
    say(t, "user");
    setThinking(true); setThinkingText("Checking sources…");
    setTimeout(() => {
      setThinking(false);
      if (/rate|error|snag/i.test(t)) {
        say("Hit a snag — Groq is rate-limited. Should clear in about 15 minutes.");
        toast("err", "Groq rate limit — try again in 15 min");
      } else if (phase === "done") {
        say("Section 2 cites production_specs.xlsx, row 3. I've opened it in the evidence panel.");
        setSel(cites[2]);
      } else if (!files.length) {
        say("Nothing to read yet. Add your sources and I'll map them for you.");
      } else {
        say(`I have ${files.length} source${files.length === 1 ? "" : "s"} queued. Click Generate brief and I'll draft it.`);
      }
      if (soundRef.current) ding();
    }, 1100);
  };

  const Chip = ({ c }: { c: Cite }) => (
    <button onClick={() => setSel(c)} className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] transition hover:shadow-sm ${sel?.id === c.id ? "border-primary bg-primary/5 text-foreground" : "border-border bg-card text-muted-foreground"}`}>
      <FileIcon type={c.type} /> {c.file}, {c.loc}
    </button>
  );
  const Pill = ({ v }: { v: number }) => {
    const hi = v >= 90;
    return <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${hi ? "bg-success-soft text-success" : "bg-warning-soft text-warning"}`}><span className={`h-1.5 w-1.5 rounded-full ${hi ? "bg-success" : "bg-warning"}`} />{v}% Confidence</span>;
  };

  const GenButton = ({ className = "" }: { className?: string }) => (
    <button onClick={generate} disabled={!files.length || btn === "running"}
      className={`inline-flex items-center justify-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed ${!files.length ? "opacity-40" : ""} ${className}`}>
      {btn === "running" ? <><Loader2 className="h-4 w-4 animate-spin" />Working…</> : btn === "ready" ? <><Check className="h-4 w-4" />Brief ready</> : <><Sparkles className="h-4 w-4" />Generate brief</>}
    </button>
  );

  const done = phase === "done";

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background font-sans text-foreground">
      <input ref={fileInput} type="file" multiple hidden onChange={(e) => { onPick(e.target.files); e.target.value = ""; }} />
      <header className="flex h-[52px] shrink-0 items-center justify-between border-b border-border px-5">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-foreground"><Sparkles className="h-3.5 w-3.5 text-background" /></div>
          <span className="text-sm font-bold">Brief AI</span>
        </div>
        <Clock />
        <div className="flex gap-2">
          <button onClick={() => fileInput.current?.click()} className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted"><Plus className="h-4 w-4" />Add files</button>
          <GenButton />
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside className="flex w-[300px] shrink-0 flex-col border-r border-border bg-sidebar">
          <div className="nice-scroll flex-1 space-y-6 overflow-y-auto p-4">
            <section className="fade-up">
              <h3 className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Sources <Badge n={files.length} /></h3>
              {files.length === 0 ? (
                <button onClick={() => fileInput.current?.click()} className="w-full rounded-lg border border-dashed border-border p-4 text-center text-[12px] text-muted-foreground hover:bg-card">
                  <Upload className="mx-auto mb-1 h-4 w-4" />Add spreadsheets or PDFs
                </button>
              ) : (
                <div className="space-y-1.5">
                  {files.map((f) => (
                    <div key={f.name} className="slide-in flex items-center gap-2.5 rounded-lg border border-border bg-card p-2.5 transition hover:shadow-sm">
                      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted"><FileIcon type={f.type} className="h-4 w-4" /></div>
                      <div className="min-w-0"><div className="truncate text-[13px] font-medium">{f.name}</div><div className="text-[11px] text-muted-foreground">{f.meta}</div></div>
                    </div>
                  ))}
                  {!done && <GenButton className={`mt-2 w-full ${glow ? "glow-pulse" : ""}`} />}
                </div>
              )}
            </section>
            {done && (
              <>
                <section className="fade-up" style={{ animationDelay: "80ms" }}>
                  <h3 className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Gaps <Badge n={2} amber /></h3>
                  <div className="space-y-1.5">
                    {[["Target retail price", "No source specifies the shelf price point."], ["Print run quantity", "Initial order volume is not defined."]].map(([t, d]) => (
                      <div key={t} className="rounded-lg border border-warning/25 bg-warning-soft p-2.5">
                        <div className="flex items-center gap-1.5 text-[13px] font-medium"><AlertTriangle className="h-3.5 w-3.5 text-warning" />{t}</div>
                        <p className="mt-0.5 text-[12px] text-muted-foreground">{d}</p>
                      </div>
                    ))}
                  </div>
                </section>
                <section className="fade-up" style={{ animationDelay: "160ms" }}>
                  <h3 className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Conflicts <Badge n={1} /></h3>
                  <div className="rounded-lg border border-border bg-card p-3">
                    <div className="mb-2 text-[12px] font-medium">Board substrate</div>
                    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-center">
                      <button onClick={() => setSel(cites[2])} className="rounded-md bg-muted p-2 text-[12px] hover:shadow-sm"><div className="font-medium">Recycled Kraft</div><div className="text-[10px] text-muted-foreground">production_specs</div></button>
                      <span className="text-[10px] font-bold text-primary">VS</span>
                      <button onClick={() => setSel(cites[3])} className="rounded-md bg-muted p-2 text-[12px] hover:shadow-sm"><div className="font-medium">Bleached White</div><div className="text-[10px] text-muted-foreground">retailer_req</div></button>
                    </div>
                  </div>
                </section>
              </>
            )}
          </div>
          <div className="flex items-center gap-2 border-t border-border p-3">
            {done && (
              <button onClick={reset} className="group inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[12px] text-muted-foreground hover:bg-muted">
                <RotateCw className="h-3.5 w-3.5 transition-transform duration-1000 group-hover:rotate-360" />Start another brief
              </button>
            )}
            <button onClick={() => setSound((s) => !s)} aria-label={sound ? "Turn sound off" : "Turn sound on"} title={sound ? "Sound on" : "Sound off"}
              className="ml-auto flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted">
              {sound ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </button>
          </div>
        </aside>

        <main className="relative min-w-0 flex-1 bg-card">
          {confetti && <Confetti />}
          {!done ? (
            <div className="mesh relative flex h-full flex-col items-center justify-center px-10 text-center">
              <div className="relative">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">{phase === "running" ? "Drafting" : "New brief"}</div>
                <h1 className="mt-3 font-display text-[32px] font-normal leading-tight tracking-[-0.02em]">A clearer brief starts with better evidence.</h1>
                <p className="mx-auto mt-3 max-w-md text-[14px] text-muted-foreground">Add your specs, brand guidelines and retailer requirements. Every line of the brief will point back to its source.</p>
                <div className="mt-8"><Pipeline stage={stage} running={phase === "running"} /></div>
                {phase === "idle" && (
                  <div className="mt-8 flex justify-center gap-2">
                    <button onClick={() => fileInput.current?.click()} className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-sm hover:bg-muted"><Plus className="h-4 w-4" />Add files</button>
                    {files.length === 0 && <button onClick={() => addFiles(SAMPLE)} className="rounded-md px-3 py-1.5 text-sm text-primary hover:bg-primary/5">Use sample sources</button>}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="nice-scroll edge-fade h-full overflow-y-auto">
              <div className="mx-auto max-w-3xl px-10 py-10">
                <div className="fade-up text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">Working Draft · v0.3</div>
                <h1 className="fade-up mt-2 font-display text-[32px] font-normal leading-tight tracking-[-0.02em]">Draft Brief: ECO-01 Soap Packaging Redesign</h1>
                <div className="mt-6 h-px bg-border" />
                {[
                  { n: 1, t: "Project Overview", v: 94, body: "Redesign the primary carton for ECO-01, a 100g bar soap, ahead of a Q2 retail launch. The packaging must be fully recyclable, communicate a natural low-impact identity, and hold a unit cost under $0.18.", c: [cites[0], cites[1]] },
                  { n: 2, t: "Material Specs", v: 82, body: "Specify 350gsm recycled kraft board with water-based inks and no laminate; FSC certification is required. Note that retailer guidance favors bleached white board for color consistency — this conflict must be resolved.", c: [cites[2], cites[3]] },
                ].map((s, i) => (
                  <section key={s.n} className="fade-up mt-6 rounded-xl border border-border bg-card p-6 transition hover:shadow-md" style={{ animationDelay: `${60 + i * 60}ms` }}>
                    <div className="flex items-start justify-between gap-4">
                      <h2 className="text-lg font-semibold"><span className="mr-2 text-muted-foreground">{s.n}.</span>{s.t}</h2>
                      <Pill v={s.v} />
                    </div>
                    <p className="mt-3 text-[14.5px] leading-relaxed text-foreground/85">{s.body}</p>
                    <div className="mt-4 flex flex-wrap gap-2">{s.c.map((c) => <Chip key={c.id} c={c} />)}</div>
                  </section>
                ))}
                <div className="fade-up mt-6 grid gap-4 md:grid-cols-2" style={{ animationDelay: "180ms" }}>
                  <div className="rounded-xl border border-warning/25 bg-warning-soft p-5">
                    <h3 className="text-sm font-semibold">Uncertainty</h3>
                    <ul className="mt-2 list-disc space-y-1 pl-4 text-[13px] text-foreground/80">
                      <li>Substrate choice is contested between sources.</li>
                      <li>Cost ceiling may not include print finishing.</li>
                      <li>Launch date references an older timeline.</li>
                    </ul>
                  </div>
                  <div className="rounded-xl border border-border bg-card p-5">
                    <h3 className="text-sm font-semibold">Open Questions for Agency</h3>
                    <ol className="mt-2 list-decimal space-y-1 pl-4 text-[13px] text-foreground/80">
                      <li>Which board takes priority: brand or retailer?</li>
                      <li>What is the target shelf price?</li>
                      <li>What is the first print run volume?</li>
                    </ol>
                  </div>
                </div>
                <div className="fade-up mt-8 flex gap-2 pb-6" style={{ animationDelay: "240ms" }}>
                  {["Export PDF", "Export DOCX"].map((l) => <button key={l} className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted"><Download className="h-4 w-4" />{l}</button>)}
                </div>
              </div>
            </div>
          )}
        </main>

        <aside className={`nice-scroll w-[340px] shrink-0 overflow-y-auto border-l border-border bg-sidebar p-5 ${done ? "panel-in" : ""}`} key={done ? "d" : "e"}>
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Evidence</h3>
          {!sel ? (
            <div className="mt-16 flex flex-col items-center text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted"><Search className="h-4 w-4 text-muted-foreground" /></div>
              <p className="mt-3 max-w-[220px] text-[13px] text-muted-foreground">Select a citation in the brief to inspect the exact supporting source.</p>
            </div>
          ) : (
            <div key={sel.id} className="fade-up mt-4">
              <div className="flex items-center gap-2 text-[13px] font-medium"><FileIcon type={sel.type} className="h-4 w-4" />{sel.file}</div>
              <div className="mt-3 rounded-lg border border-border bg-muted p-4 text-[13.5px] leading-relaxed">
                <mark className="rounded bg-primary/15 px-0.5 text-foreground">{sel.snippet}</mark>
              </div>
              <div className="mt-3 font-mono text-[11px] text-muted-foreground">Source file: {sel.file} · {sel.line}</div>
              <a href="#" className="mt-3 inline-flex items-center gap-1 text-[13px] font-medium text-primary hover:underline">Open full source <ArrowUpRight className="h-3.5 w-3.5" /></a>
            </div>
          )}
        </aside>
      </div>

      {toasts[0] && (
        <div key={toasts[0].id} className="toast-in fixed bottom-6 left-1/2 z-50 -translate-x-1/2">
          <div className={`flex items-center gap-2 rounded-lg border px-4 py-2.5 text-[13px] shadow-lg ${toasts[0].kind === "ok" ? "border-border bg-card" : "border-danger/20 bg-danger-soft text-danger"}`}>
            {toasts[0].kind === "ok" ? <Check className="h-4 w-4 text-primary" /> : <AlertCircle className="h-4 w-4" />}
            {toasts[0].text}
          </div>
        </div>
      )}

      <Jessy messages={msgs} thinking={thinking} thinkingText={thinkingText} activity={activity}
        active={phase === "running" || thinking} sparkle={sparkle} onSend={onSend} />
    </div>
  );
}
