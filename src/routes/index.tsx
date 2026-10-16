import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Sparkles, FileSpreadsheet, FileText, Plus, Download, Search, ArrowUpRight, AlertTriangle } from "lucide-react";

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

type Cite = { id: string; file: string; type: "xlsx" | "pdf"; loc: string; line: string; snippet: string };
const cites = [
  { id: "c1", file: "production_specs.xlsx", type: "xlsx", loc: "p.2", line: "Row 3", snippet: "ECO-01 bar soap, 100g. Carton target: 100% recyclable, max unit cost $0.18, launch Q2 retail." },
  { id: "c2", file: "brand_guidelines.pdf", type: "pdf", loc: "p.14", line: "Page 14", snippet: "Packaging must express a natural, low-impact identity. Prefer uncoated, earthy substrates." },
  { id: "c3", file: "production_specs.xlsx", type: "xlsx", loc: "p.2", line: "Row 7", snippet: "Board: 350gsm recycled kraft, water-based inks, no laminate. FSC certification required." },
  { id: "c4", file: "retailer_req.pdf", type: "pdf", loc: "p.3", line: "Page 3", snippet: "Shelf-ready packaging should use bleached white board for consistent color reproduction." },
] as const satisfies readonly Cite[];

function FileIcon({ type, className = "h-3.5 w-3.5" }: { type: "xlsx" | "pdf"; className?: string }) {
  return type === "xlsx" ? <FileSpreadsheet className={`${className} text-success`} /> : <FileText className={`${className} text-danger`} />;
}

function Badge({ n, amber }: { n: number; amber?: boolean }) {
  return <span className={`rounded-full px-1.5 py-px text-[10px] font-semibold ${amber ? "bg-warning-soft text-warning" : "bg-muted text-muted-foreground"}`}>{n}</span>;
}

function Index() {
  const [sel, setSel] = useState<Cite | null>(null);
  const Chip = ({ c }: { c: Cite }) => (
    <button onClick={() => setSel(c)} className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] transition hover:shadow-sm ${sel?.id === c.id ? "border-primary bg-primary/5 text-foreground" : "border-border bg-card text-muted-foreground"}`}>
      <FileIcon type={c.type} /> {c.file}, {c.loc}
    </button>
  );
  const Pill = ({ v }: { v: number }) => {
    const hi = v >= 90;
    return <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${hi ? "bg-success-soft text-success" : "bg-warning-soft text-warning"}`}><span className={`h-1.5 w-1.5 rounded-full ${hi ? "bg-success" : "bg-warning"}`} />{v}% Confidence</span>;
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background font-sans text-foreground">
      <header className="flex h-[52px] shrink-0 items-center justify-between border-b border-border px-5">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-foreground"><Sparkles className="h-3.5 w-3.5 text-background" /></div>
          <span className="text-sm font-bold">Brief AI</span>
        </div>
        <div className="flex gap-2">
          <button className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted"><Plus className="h-4 w-4" />Add files</button>
          <button className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"><Sparkles className="h-4 w-4" />Generate brief</button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside className="w-[300px] shrink-0 space-y-6 overflow-y-auto border-r border-border bg-sidebar p-4">
          <section className="fade-up">
            <h3 className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Sources <Badge n={3} /></h3>
            <div className="space-y-1.5">
              {[["production_specs.xlsx", "xlsx", "24 rows · 2 sheets"], ["brand_guidelines.pdf", "pdf", "32 pages · 4.1 MB"], ["retailer_req.pdf", "pdf", "6 pages · 820 KB"]].map(([f, t, m]) => (
                <div key={f} className="flex items-center gap-2.5 rounded-lg border border-border bg-card p-2.5 transition hover:shadow-sm">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted"><FileIcon type={t as "xlsx"} className="h-4 w-4" /></div>
                  <div className="min-w-0"><div className="truncate text-[13px] font-medium">{f}</div><div className="text-[11px] text-muted-foreground">{m}</div></div>
                </div>
              ))}
            </div>
          </section>
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
        </aside>

        <main className="min-w-0 flex-1 overflow-y-auto bg-card">
          <div className="mx-auto max-w-3xl px-10 py-10">
            <div className="fade-up text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">Working Draft · v0.3</div>
            <h1 className="fade-up mt-2 font-display text-4xl leading-tight">Draft Brief: ECO-01 Soap Packaging Redesign</h1>
            <div className="mt-6 h-px bg-border" />
            {[
              { n: 1, t: "Project Overview", v: 94, body: "Redesign the primary carton for ECO-01, a 100g bar soap, ahead of a Q2 retail launch. The packaging must be fully recyclable, communicate a natural low-impact identity, and hold a unit cost under $0.18.", c: [cites[0], cites[1]] },
              { n: 2, t: "Material Specs", v: 82, body: "Specify 350gsm recycled kraft board with water-based inks and no laminate; FSC certification is required. Note that retailer guidance favors bleached white board for color consistency — this conflict must be resolved.", c: [cites[2], cites[3]] },
            ].map((s, i) => (
              <section key={s.n} className="fade-up mt-6 rounded-xl border border-border bg-card p-6 transition hover:shadow-md" style={{ animationDelay: `${120 + i * 100}ms` }}>
                <div className="flex items-start justify-between gap-4">
                  <h2 className="text-lg font-semibold"><span className="mr-2 text-muted-foreground">{s.n}.</span>{s.t}</h2>
                  <Pill v={s.v} />
                </div>
                <p className="mt-3 text-[14.5px] leading-relaxed text-foreground/85">{s.body}</p>
                <div className="mt-4 flex flex-wrap gap-2">{s.c.map((c) => <Chip key={c.id} c={c} />)}</div>
              </section>
            ))}
            <div className="fade-up mt-6 grid gap-4 md:grid-cols-2" style={{ animationDelay: "340ms" }}>
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
            <div className="mt-8 flex gap-2 pb-6">
              {["Export PDF", "Export DOCX"].map((l) => <button key={l} className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted"><Download className="h-4 w-4" />{l}</button>)}
            </div>
          </div>
        </main>

        <aside className="w-[340px] shrink-0 overflow-y-auto border-l border-border bg-sidebar p-5">
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
    </div>
  );
}
