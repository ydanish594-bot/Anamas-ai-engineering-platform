import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Route, Switch, Link, useLocation, Router as WouterRouter } from 'wouter';
import {
  Activity, ArrowDownRight, ArrowRight, ArrowUpRight, Blocks, BookOpenCheck, Check,
  ChevronDown, CircleHelp, Command, Cpu, FolderKanban, Gauge, Layers3, LayoutDashboard,
  Lightbulb, Menu, Moon, Plus, Search, Settings2, ShieldAlert, Sparkles, Sun, X,
} from 'lucide-react';
import NotFound from '@/pages/not-found';

type Project = { id: string; name: string; description: string; stack: string[]; health: number; status: string; createdAt: string };
type Milestone = { title: string; description: string; priority: string };
type ArchitectureSpec = { projectName: string; summary: string; architecture: string[]; milestones: Milestone[]; technologies: string[]; risks: string[]; acceptanceCriteria: string[] };

const queryClient = new QueryClient();
const initialProjects: Project[] = [
  { id: 'p-01', name: 'Signalboard', description: 'A quiet, real-time observability layer for small product teams.', stack: ['Next.js', 'Postgres', 'Inngest'], health: 82, status: 'In progress', createdAt: '2025-04-16' },
  { id: 'p-02', name: 'Fieldnotes API', description: 'A durable API for collecting research notes from the field.', stack: ['Node.js', 'SQLite', 'Hono'], health: 64, status: 'Planning', createdAt: '2025-04-12' },
  { id: 'p-03', name: 'Atlas Queue', description: 'A compact job queue with visibility built into every step.', stack: ['Go', 'Redis', 'HTMX'], health: 91, status: 'In progress', createdAt: '2025-04-08' },
];
const demoSpec: ArchitectureSpec = {
  projectName: 'Signalboard',
  summary: 'DEMO architecture: a small, event-driven observability workspace that ingests product signals, shapes them into useful summaries, and keeps the current state easy to inspect.',
  architecture: ['Web app · Next.js App Router with server-rendered project views', 'Ingestion API · validated event intake with idempotency keys', 'Event buffer · Inngest workflows for retries and scheduled rollups', 'Persistence · PostgreSQL with time-bucketed signal records', 'Delivery · lightweight polling first; streaming can follow proven need'],
  milestones: [
    { title: 'Define the event contract', description: 'Specify a versioned event envelope, validation rules, and retention boundary.', priority: 'P1' },
    { title: 'Ship the ingestion path', description: 'Persist events safely and make retries idempotent under duplicate delivery.', priority: 'P1' },
    { title: 'Build the signal overview', description: 'Surface recent activity, health indicators, and a useful empty state.', priority: 'P2' },
    { title: 'Add operational guardrails', description: 'Document limits, alert on failed workflows, and verify retention behavior.', priority: 'P2' },
  ],
  technologies: ['Next.js · product interface', 'PostgreSQL · durable event store', 'Inngest · background workflows', 'Zod · shared input contracts'],
  risks: ['High-cardinality event properties can increase storage and query cost.', 'Retries without a stable idempotency key may create duplicate records.', 'Polling cadence should be validated against expected traffic and freshness needs.'],
  acceptanceCriteria: ['Invalid events are rejected with actionable validation details.', 'Duplicate delivery does not create duplicate persisted events.', 'A project with no events has a clear, non-error empty state.', 'Workflow failures are inspectable without exposing sensitive payloads.'],
};

function usePersistentState<T>(key: string, fallback: T) {
  const [value, setValue] = useState<T>(() => {
    try { const saved = localStorage.getItem(key); return saved ? JSON.parse(saved) as T : fallback; } catch { return fallback; }
  });
  useEffect(() => { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* local demo storage unavailable */ } }, [key, value]);
  return [value, setValue] as const;
}

function AppShell({ children, path, onCreate }: { children: ReactNode; path: string; onCreate: () => void }) {
  const [dark, setDark] = usePersistentState('nova-theme', true);
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => { document.documentElement.classList.toggle('dark', dark); }, [dark]);
  const navItems = [
    { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
    { href: '/projects', label: 'Projects', icon: FolderKanban },
    { href: '/architect', label: 'Architect', icon: Blocks },
  ];
  return <div className="nova-shell flex">
    <aside className={`sidebar ${menuOpen ? 'sidebar-open' : ''}`} data-testid="navigation-sidebar">
      <div className="flex items-center justify-between px-2">
        <Link href="/dashboard" className="flex items-center gap-3" data-testid="link-nova-home">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20"><span className="display text-xl font-bold">A</span></span>
          <span><span className="display block text-[19px] font-bold leading-none tracking-[-.06em]">ANAMAS</span><span className="eyebrow muted mt-1 block text-[8px]">engineering intelligence</span></span>
        </Link>
        <button aria-label="Close navigation" onClick={() => setMenuOpen(false)} className="sidebar-close rounded-md p-2" data-testid="button-close-menu"><X size={17}/></button>
      </div>
      <div className="mt-9 px-2"><div className="eyebrow muted mb-3">Workspace</div>
        <div className="surface flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left" data-testid="workspace-demo-label">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-secondary"><Command size={16}/></div>
          <div className="min-w-0 flex-1"><div className="truncate text-xs font-bold">ANAMAS / Demo</div><div className="mono muted mt-1 text-[9px]">LOCAL WORKSPACE</div></div><ChevronDown size={14} className="muted"/>
        </div>
      </div>
      <nav className="mt-8 flex flex-col gap-1" aria-label="Main navigation">
        <div className="eyebrow muted mb-2 px-3">Workspace</div>
        {navItems.map(({ href, label, icon: Icon }) => <Link key={href} href={href} onClick={() => setMenuOpen(false)} className={`nav-item flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-semibold ${path === href ? 'bg-sidebar-accent text-foreground' : 'muted hover:bg-sidebar-accent hover:text-foreground'}`} data-testid={`link-nav-${label.toLowerCase()}`} aria-current={path === href ? 'page' : undefined}>
          <Icon size={17} className={path === href ? 'text-primary' : ''}/>{label}{path === href && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-secondary"/>}
        </Link>)}
      </nav>
      <div className="mt-auto">
        <div className="surface mb-4 rounded-xl p-3.5">
          <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-secondary"/><span className="eyebrow">Demo workspace</span></div>
          <p className="muted mt-2 text-[11px] leading-relaxed">Local sample data only. Nothing here is connected to a live model.</p>
          <div className="mono muted mt-3 border-t border-border pt-2 text-[9px]">ANAMAS · PREVIEW BUILD 01</div>
        </div>
        <button className="nav-item flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[12px] font-semibold muted hover:bg-sidebar-accent hover:text-foreground" onClick={() => setDark(!dark)} data-testid="button-theme-toggle" aria-label={`Switch to ${dark ? 'light' : 'dark'} theme`}>
          {dark ? <Sun size={16}/> : <Moon size={16}/>}<span>{dark ? 'Light appearance' : 'Dark appearance'}</span><span className="mono ml-auto text-[9px]">{dark ? 'ON' : 'OFF'}</span>
        </button>
        <div className="mt-4 flex items-center gap-2 border-t border-sidebar-border px-2 pt-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">D</div>
          <div className="min-w-0 flex-1"><div className="text-xs font-bold">Demo builder</div><div className="muted mt-0.5 text-[10px]">Local session</div></div>
          <Settings2 size={15} className="muted"/>
        </div>
      </div>
    </aside>
    {menuOpen && <button className="sidebar-overlay modal-backdrop fixed inset-0 z-30" onClick={() => setMenuOpen(false)} aria-label="Close navigation overlay" data-testid="button-menu-overlay"/>}
    <div className="min-w-0 flex-1">
      <header className="sticky top-0 z-20 flex h-[68px] items-center justify-between border-b border-border bg-background/90 px-5 backdrop-blur-xl md:px-9">
        <div className="flex items-center gap-3">
          <button aria-label="Open navigation" onClick={() => setMenuOpen(true)} className="mobile-menu-button rounded-lg p-2 hover:bg-muted" data-testid="button-open-menu"><Menu size={18}/></button>
          <div className="eyebrow muted hidden sm:block">ANAMAS <span className="mx-1">/</span> {navItems.find(n => n.href === path)?.label || 'Workspace'}</div>
          <div className="eyebrow muted sm:hidden">ANAMAS / {navItems.find(n => n.href === path)?.label || 'Workspace'}</div>
        </div>
        <div className="flex items-center gap-2 md:gap-4">
          <div className="hidden items-center gap-2 rounded-full border border-border px-3 py-1.5 sm:flex"><span className="h-1.5 w-1.5 rounded-full bg-secondary"/><span className="mono text-[9px] tracking-wider">DEMO MODE</span></div>
          <button className="rounded-lg p-2 muted transition hover:bg-muted hover:text-foreground" title="Help" data-testid="button-help" onClick={() => window.alert('ANAMAS preview: all sample content is local demo data.')}><CircleHelp size={17}/></button>
          <button className="flex items-center gap-2 rounded-lg bg-primary px-3.5 py-2 text-xs font-bold text-primary-foreground transition hover:brightness-110" onClick={onCreate} data-testid="button-create-project-top"><Plus size={15}/><span className="hidden sm:inline">New project</span></button>
        </div>
      </header>
      <main className="mx-auto w-full max-w-[1440px] px-5 py-8 md:px-9 md:py-10">{children}</main>
    </div>
  </div>;
}

function Tag({ children, tone = 'default' }: { children: ReactNode; tone?: string }) {
  return <span className={`eyebrow inline-flex items-center rounded-md border px-2 py-1 ${tone === 'cyan' ? 'border-secondary/25 bg-accent text-accent-foreground' : 'border-border bg-muted/50 muted'}`}>{children}</span>;
}
function PageHeading({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: ReactNode }) {
  return <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><div className="eyebrow mb-3 text-primary">{eyebrow}</div><h1 className="display text-3xl font-semibold md:text-[40px]" data-testid="text-page-title">{title}</h1><p className="muted mt-2 max-w-2xl text-sm leading-relaxed">{description}</p></div>{action}</div>;
}
function EmptyState({ title, body, onAction }: { title: string; body: string; onAction: () => void }) {
  return <div className="surface grid-dots flex min-h-[270px] flex-col items-center justify-center rounded-2xl px-6 py-12 text-center"><div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Layers3 size={22}/></div><h3 className="display text-xl font-semibold">{title}</h3><p className="muted mt-2 max-w-sm text-sm leading-relaxed">{body}</p><button onClick={onAction} className="mt-5 flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground" data-testid="button-empty-create"><Plus size={15}/>Create a project</button></div>;
}
function ProjectModal({ close, create }: { close: () => void; create: (p: Project) => void }) {
  const [name, setName] = useState(''); const [description, setDescription] = useState(''); const [stack, setStack] = useState('');
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') close(); };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [close]);
  function submit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    create({ id: `local-${Date.now()}`, name: name.trim(), description: description.trim() || 'A new idea, ready to become a build plan.', stack: stack.split(',').map(s => s.trim()).filter(Boolean), health: 0, status: 'Planning', createdAt: new Date().toISOString().slice(0, 10) });
  }
  return <div className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4" onMouseDown={e => { if (e.target === e.currentTarget) close(); }} data-testid="modal-create-project">
    <form onSubmit={submit} className="surface w-full max-w-[500px] rounded-2xl p-6 shadow-2xl shadow-black/30 md:p-8">
      <div className="mb-6 flex items-start justify-between"><div><div className="eyebrow text-primary">LOCAL DEMO PROJECT</div><h2 className="display mt-2 text-2xl font-semibold">Start with an idea.</h2><p className="muted mt-1 text-xs">Saved only in this browser workspace.</p></div><button type="button" aria-label="Close create project" onClick={close} className="rounded-lg p-2 muted hover:bg-muted" data-testid="button-close-create"><X size={17}/></button></div>
      <label className="eyebrow mb-2 block">Project name</label><input autoFocus value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Personal knowledge graph" className="mb-4 w-full rounded-lg border border-input bg-background px-3.5 py-3 text-sm outline-none placeholder:text-muted-foreground focus:border-primary" required maxLength={60} data-testid="input-project-name"/>
      <label className="eyebrow mb-2 block">What are you building?</label><textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="A sentence about the problem or product..." className="mb-4 min-h-[92px] w-full resize-y rounded-lg border border-input bg-background px-3.5 py-3 text-sm outline-none placeholder:text-muted-foreground focus:border-primary" maxLength={240} data-testid="input-project-description"/>
      <label className="eyebrow mb-2 block">Stack ideas <span className="muted normal-case tracking-normal">(comma separated)</span></label><input value={stack} onChange={e => setStack(e.target.value)} placeholder="TypeScript, PostgreSQL, ..." className="w-full rounded-lg border border-input bg-background px-3.5 py-3 text-sm outline-none placeholder:text-muted-foreground focus:border-primary" data-testid="input-project-stack"/>
      <div className="mt-7 flex justify-end gap-2"><button type="button" onClick={close} className="rounded-lg border border-border px-4 py-2.5 text-xs font-bold hover:bg-muted" data-testid="button-cancel-create">Cancel</button><button disabled={!name.trim()} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-45" type="submit" data-testid="button-submit-project"><Plus size={14}/>Create demo project</button></div>
    </form>
  </div>;
}

function Dashboard({ projects, onCreate }: { projects: Project[]; onCreate: () => void }) {
  const active = projects.filter(p => p.status === 'In progress').length;
  return <div className="page-in">
    <PageHeading eyebrow="YOUR WORKSPACE · DEMO" title="Make the next move clear." description="A focused view of ideas in motion. Everything below is sample workspace data, stored locally in your browser." action={<Tag tone="cyan">DEMO DATA</Tag>}/>
    <section className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Demo workspace metrics">
      {[
        { label: 'Projects in orbit', value: projects.length.toString().padStart(2, '0'), delta: 'LOCAL DEMO', icon: FolderKanban, tone: 'text-primary' },
        { label: 'In progress', value: active.toString().padStart(2, '0'), delta: 'SAMPLE STATUS', icon: Activity, tone: 'text-secondary' },
        { label: 'Avg. project health', value: `${projects.length ? Math.round(projects.reduce((a,p) => a+p.health,0)/projects.length) : 0}%`, delta: 'DEMO SCORE', icon: Gauge, tone: 'text-chart-3' },
        { label: 'Architecture drafts', value: '04', delta: 'SAMPLE ONLY', icon: Cpu, tone: 'text-chart-4' },
      ].map((m,i) => <div className="surface rounded-xl p-4 md:p-5" key={m.label} data-testid={`metric-card-${i}`}><div className="flex items-center justify-between"><span className="eyebrow muted">{m.label}</span><m.icon className={m.tone} size={17}/></div><div className="display mt-4 text-3xl font-semibold">{m.value}</div><div className="mono muted mt-2 text-[9px] tracking-wider">{m.delta}</div></div>)}
    </section>
    <section className="grid gap-5 xl:grid-cols-[1.55fr_1fr]">
      <div className="surface min-w-0 rounded-2xl p-5 md:p-6">
        <div className="flex items-start justify-between"><div><div className="eyebrow muted">DEMO ACTIVITY</div><h2 className="display mt-2 text-xl font-semibold">Build momentum</h2></div><Tag>LAST 7 DAYS</Tag></div>
        <div className="mt-5 flex items-center gap-3"><span className="display text-3xl font-semibold">18</span><span className="flex items-center gap-1 rounded-md bg-accent px-2 py-1 text-[10px] font-bold text-accent-foreground"><ArrowUpRight size={12}/> 12.4%</span><span className="muted text-xs">sample planning events</span></div>
        <div className="mt-4 h-[180px] w-full" role="img" aria-label="DEMO sample activity chart across seven days" data-testid="chart-demo-activity"><svg viewBox="0 0 700 180" preserveAspectRatio="none" className="h-full w-full">
          <defs><linearGradient id="areaGradient" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="hsl(var(--chart-1))" stopOpacity=".24"/><stop offset="100%" stopColor="hsl(var(--chart-1))" stopOpacity="0"/></linearGradient></defs>
          {[24,66,108,150].map(y=><line key={y} x1="0" x2="700" y1={y} y2={y} className="chart-grid"/>)}<path className="chart-area" d="M0 132 C45 126 55 92 100 101 S165 129 200 83 S265 98 300 70 S365 94 400 58 S465 74 500 47 S565 61 600 31 S665 53 700 19 L700 180 L0 180 Z"/><path className="chart-line" d="M0 132 C45 126 55 92 100 101 S165 129 200 83 S265 98 300 70 S365 94 400 58 S465 74 500 47 S565 61 600 31 S665 53 700 19"/>
          {[['M', 0],['T',100],['W',200],['T',300],['F',400],['S',500],['S',600]].map(([d,x])=><text key={String(x)} x={Number(x)} y="174" fill="hsl(var(--muted-foreground))" fontSize="9" fontFamily="var(--app-font-mono)">{d}</text>)}
        </svg></div><div className="mono muted mt-1 text-[9px]">PLANNING ACTIVITY · ILLUSTRATIVE SAMPLE</div>
      </div>
      <div className="surface rounded-2xl p-5 md:p-6">
        <div className="flex items-start justify-between"><div><div className="eyebrow muted">RECENT PROJECTS · DEMO</div><h2 className="display mt-2 text-xl font-semibold">On the workbench</h2></div><Link className="flex items-center gap-1 text-xs font-bold text-primary hover:underline" href="/projects" data-testid="link-view-projects">View all <ArrowRight size={13}/></Link></div>
        {projects.length ? <div className="mt-4 divide-y divide-border">{projects.slice(0,3).map(p=><div key={p.id} className="flex items-center gap-3 py-3" data-testid={`recent-project-${p.id}`}><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><Layers3 size={16}/></div><div className="min-w-0 flex-1"><div className="truncate text-xs font-bold">{p.name}</div><div className="muted mt-1 truncate text-[10px]">{p.description}</div></div><span className="mono rounded-md bg-muted px-2 py-1 text-[9px]">{p.health}%</span></div>)}</div> : <div className="muted py-10 text-center text-sm">No demo projects yet.</div>}
        <button onClick={onCreate} className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border py-2.5 text-xs font-bold muted transition hover:border-primary hover:text-primary" data-testid="button-add-project-inline"><Plus size={14}/>Add a project</button>
      </div>
    </section>
    <section className="mt-5 grid gap-4 md:grid-cols-[1.15fr_1fr_1fr]">
      <div className="relative overflow-hidden rounded-2xl bg-primary p-5 text-primary-foreground md:p-6"><div className="absolute -right-7 -top-9 h-36 w-36 rounded-full border border-white/20"/><div className="absolute -right-1 -top-3 h-24 w-24 rounded-full border border-white/20"/><div className="eyebrow opacity-75">A BETTER FIRST STEP</div><h3 className="display mt-4 max-w-[250px] text-2xl font-semibold leading-tight">Give your idea a shape.</h3><p className="mt-2 max-w-[260px] text-xs leading-relaxed opacity-75">Turn a rough prompt into a structured plan you can actually evaluate.</p><Link className="mt-5 inline-flex items-center gap-2 rounded-lg bg-white/15 px-3 py-2 text-xs font-bold hover:bg-white/25" href="/architect" data-testid="link-open-architect">Explore Architect <ArrowRight size={14}/></Link></div>
      <div className="surface rounded-2xl p-5"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-secondary"><BookOpenCheck size={17}/></div><div className="eyebrow muted mt-4">PLANNING SIGNAL</div><h3 className="display mt-2 text-lg font-semibold">Small scopes ship.</h3><p className="muted mt-2 text-xs leading-relaxed">The sample architecture starts with a narrow contract and adds operational complexity only when the evidence asks for it.</p></div>
      <div className="surface rounded-2xl p-5"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary"><ShieldAlert size={17}/></div><div className="eyebrow muted mt-4">MODEL STATUS</div><h3 className="display mt-2 text-lg font-semibold">Live generation is off.</h3><p className="muted mt-2 text-xs leading-relaxed">Gemini generation requires a configured key. Sample architecture is explicitly labeled and never generated live.</p></div>
    </section>
    <div className="eyebrow muted mt-8 text-center">ALL METRICS AND RECORDS ON THIS PAGE ARE DEMO DATA</div>
  </div>;
}

function Projects({ projects, onCreate }: { projects: Project[]; onCreate: () => void }) {
  const [search, setSearch] = useState('');
  const filtered = useMemo(() => projects.filter(p => `${p.name} ${p.description} ${p.stack.join(' ')}`.toLowerCase().includes(search.toLowerCase())), [projects, search]);
  return <div className="page-in">
    <PageHeading eyebrow="PROJECTS · LOCAL DEMO" title="A home for what’s next." description="Keep early ideas legible, compare their shape, and decide what deserves a build." action={<button onClick={onCreate} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground hover:brightness-110" data-testid="button-create-project"><Plus size={15}/>New project</button>}/>
    <div className="mb-6 flex flex-col justify-between gap-4 border-b border-border pb-5 sm:flex-row sm:items-center">
      <div className="flex items-center gap-4"><div><div className="display text-2xl font-semibold" data-testid="text-project-count">{projects.length.toString().padStart(2,'0')}</div><div className="eyebrow muted mt-1">DEMO PROJECTS</div></div><div className="h-9 border-l border-border"/><p className="muted max-w-[250px] text-xs leading-relaxed">Saved locally. Your entries stay in this browser.</p></div>
      <label className="relative block w-full sm:w-[260px]"><Search className="muted absolute left-3 top-1/2 -translate-y-1/2" size={15}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Find a project..." className="w-full rounded-lg border border-input bg-card py-2.5 pl-9 pr-3 text-xs outline-none focus:border-primary" aria-label="Search projects" data-testid="input-search-projects"/></label>
    </div>
    {filtered.length ? <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">{filtered.map((p,i)=><article key={p.id} className="surface rounded-2xl p-5 transition-colors duration-200 hover:border-primary/40 md:p-6" data-testid={`card-project-${p.id}`}>
      <div className="flex items-start justify-between"><div className={`flex h-11 w-11 items-center justify-center rounded-xl ${i%3===1?'bg-accent text-secondary':i%3===2?'bg-chart-3/10 text-chart-3':'bg-primary/10 text-primary'}`}><Layers3 size={19}/></div><Tag tone="cyan">DEMO</Tag></div>
      <div className="mt-5 flex items-center gap-2"><h2 className="display truncate text-[21px] font-semibold">{p.name}</h2></div>
      <p className="muted mt-2 min-h-[40px] text-xs leading-relaxed">{p.description}</p>
      <div className="mt-4 flex flex-wrap gap-1.5">{(p.stack.length ? p.stack : ['Stack undecided']).map((s,j)=><span key={`${p.id}-${s}-${j}`} className="mono rounded-md border border-border px-2 py-1 text-[9px] muted">{s}</span>)}</div>
      <div className="mt-6 border-t border-border pt-4">
        <div className="mb-2 flex items-center justify-between"><span className="eyebrow muted">DEMO HEALTH</span><span className="mono text-[11px]">{p.health}%</span></div><div className="h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-gradient-to-r from-primary to-secondary" style={{width: `${p.health}%`}}/></div>
        <div className="mt-4 flex items-center justify-between"><span className="flex items-center gap-1.5 text-[10px] font-semibold"><span className={`h-1.5 w-1.5 rounded-full ${p.status === 'In progress' ? 'bg-secondary' : 'bg-chart-3'}`}/>{p.status}</span><span className="mono muted text-[9px]">{new Date(p.createdAt).toLocaleDateString('en-US',{month:'short',day:'numeric'})}</span></div>
      </div>
    </article>)}</div> : projects.length ? <div className="surface rounded-2xl px-6 py-16 text-center"><Search className="muted mx-auto" size={24}/><h3 className="display mt-4 text-lg font-semibold">No matching projects.</h3><p className="muted mt-2 text-xs">Try a different project name or technology.</p><button className="mt-4 text-xs font-bold text-primary" onClick={() => setSearch('')} data-testid="button-clear-search">Clear search</button></div> : <EmptyState title="The workbench is clear." body="Add your first idea and give it a name, a direction, and a place to grow." onAction={onCreate}/>}
    <div className="eyebrow muted mt-8 text-center">PROJECT DETAILS, HEALTH SCORES, AND STATUS LABELS ARE SAMPLE DEMO DATA</div>
  </div>;
}

function Architect() {
  const [idea, setIdea] = useState('');
  const [spec, setSpec] = useState<ArchitectureSpec | null>(null);
  const [sampleNotice, setSampleNotice] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const loadSample = () => { setSpec({ ...demoSpec, projectName: idea.trim() || demoSpec.projectName }); setSampleNotice(true); setShowAll(true); };
  return <div className="page-in">
    <PageHeading eyebrow="ARCHITECT · DEMO WORKSPACE" title="From idea to buildable." description="Shape a promising thought into a plan with visible assumptions, sequence, and trade-offs." action={<Tag tone="cyan">SAMPLE MODE</Tag>}/>
    <section className="surface grid-dots relative overflow-hidden rounded-2xl p-5 md:p-8">
      <div className="pointer-events-none absolute right-8 top-5 hidden text-primary/15 md:block"><Sparkles size={106} strokeWidth={.65}/></div>
      <div className="relative max-w-[770px]"><div className="eyebrow flex items-center gap-2 text-primary"><Lightbulb size={13}/> THE IDEA DESK</div><h2 className="display mt-3 text-2xl font-semibold md:text-3xl">What do you want to build?</h2><p className="muted mt-2 max-w-xl text-sm leading-relaxed">Start with the problem, not the perfect prompt. A few honest constraints make for a more useful plan.</p>
        <textarea value={idea} onChange={e => setIdea(e.target.value)} placeholder="I want to build a lightweight service that helps small teams understand how their product is being used..." rows={4} className="mt-6 w-full resize-y rounded-xl border border-input bg-background/80 p-4 text-sm leading-relaxed outline-none placeholder:text-muted-foreground/70 focus:border-primary" data-testid="input-architecture-idea"/>
        <div className="mt-3 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center"><span className="mono muted text-[9px]">IDEAS STAY IN THIS BROWSER · NO MODEL CALLS</span><div className="flex w-full flex-wrap gap-2 sm:w-auto">
          <button onClick={loadSample} className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-primary/40 bg-primary/10 px-4 py-2.5 text-xs font-bold text-primary transition hover:bg-primary/15 sm:flex-none" data-testid="button-load-sample"><BookOpenCheck size={15}/>Inspect sample architecture</button>
          <button disabled title="Live Gemini generation is unavailable until a Gemini API key is configured." className="flex flex-1 cursor-not-allowed items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground opacity-45 sm:flex-none" data-testid="button-live-generate" aria-describedby="live-generate-explanation"><Sparkles size={15}/>Generate live</button>
        </div></div>
        <p id="live-generate-explanation" className="mt-3 text-right text-[10px] muted">Disabled: configure a Gemini API key to enable live generation.</p>
      </div>
    </section>
    {!spec ? <section className="surface mt-5 flex min-h-[210px] flex-col items-center justify-center rounded-2xl px-5 py-10 text-center" data-testid="architect-empty-state"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-secondary"><Blocks size={19}/></div><h3 className="display mt-4 text-lg font-semibold">An architecture takes shape here.</h3><p className="muted mt-2 max-w-md text-xs leading-relaxed">Explore the clearly labeled sample plan to see the structure. The sample is static demo content, not AI output.</p><div className="mt-4 flex items-center gap-2 text-[10px] font-semibold text-secondary"><Check size={13}/>No backend connection required</div></section> :
    <section className="mt-6" data-testid="architecture-sample-results">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/10 text-secondary"><Blocks size={19}/></div><div><div className="eyebrow text-secondary">STATIC SAMPLE · NOT AI OUTPUT</div><h2 className="display mt-1 text-xl font-semibold">{spec.projectName} architecture</h2></div></div><button onClick={() => { setSpec(null); setSampleNotice(false); }} className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-bold muted hover:bg-muted hover:text-foreground" data-testid="button-clear-architecture"><X size={14}/>Clear sample</button></div>
      {sampleNotice && <div role="status" className="mb-4 flex items-start gap-2 rounded-xl border border-secondary/25 bg-accent px-4 py-3 text-xs text-accent-foreground" data-testid="status-sample-loaded"><Check size={15} className="mt-0.5 shrink-0"/><span><strong>Sample architecture loaded.</strong> This is static illustrative content; no AI model was called or used to create it.</span></div>}
      <div className="grid gap-4 xl:grid-cols-[1.3fr_.7fr]">
        <div className="surface rounded-2xl p-5 md:p-6"><div className="eyebrow muted">01 / OVERVIEW · DEMO</div><p className="mt-3 max-w-3xl text-sm leading-7">{spec.summary}</p>
          <div className="eyebrow muted mt-7">SYSTEM SHAPE</div><div className="mt-3 space-y-2">{spec.architecture.map((line,i)=><div key={line} className="flex gap-3 rounded-xl border border-border/70 bg-background/40 p-3.5" data-testid={`architecture-layer-${i}`}><span className="mono mt-0.5 text-[10px] text-primary">0{i+1}</span><span className="text-xs leading-relaxed">{line}</span></div>)}</div>
          <div className="eyebrow muted mt-7">TECHNOLOGIES · DEMO</div><div className="mt-3 grid gap-2 sm:grid-cols-2">{spec.technologies.map(t=><div key={t} className="flex items-start gap-2 rounded-lg bg-muted/50 p-3 text-xs leading-relaxed"><span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-secondary"/>{t}</div>)}</div>
        </div>
        <div className="space-y-4">
          <div className="surface rounded-2xl p-5 md:p-6"><div className="eyebrow muted">02 / MILESTONES · DEMO</div><div className="mt-4 space-y-4">{spec.milestones.slice(0,showAll?undefined:2).map((m,i)=><div key={m.title} className="flex gap-3" data-testid={`milestone-${i}`}><div className="relative flex flex-col items-center"><span className="mono flex h-7 w-7 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-[9px] text-primary">{String(i+1).padStart(2,'0')}</span>{i<spec.milestones.length-1&&<span className="mt-1 h-full w-px bg-border"/>}</div><div className="pb-2"><div className="flex flex-wrap items-center gap-2"><h3 className="text-xs font-bold">{m.title}</h3><span className="mono rounded bg-muted px-1.5 py-0.5 text-[8px] muted">{m.priority}</span></div><p className="muted mt-1 text-[11px] leading-relaxed">{m.description}</p></div></div>)}</div><button onClick={() => setShowAll(!showAll)} className="mt-3 text-[10px] font-bold text-primary hover:underline" data-testid="button-toggle-milestones">{showAll ? 'Show fewer milestones' : 'Show all milestones'}</button></div>
          <div className="surface rounded-2xl p-5"><div className="flex items-center gap-2"><ShieldAlert size={15} className="text-chart-3"/><div className="eyebrow muted">RISKS TO TEST · DEMO</div></div><ul className="mt-3 space-y-2">{spec.risks.slice(0,showAll?undefined:2).map((r,i)=><li key={r} className="flex gap-2 text-[11px] leading-relaxed muted" data-testid={`risk-${i}`}><ArrowDownRight size={13} className="mt-0.5 shrink-0 text-chart-3"/>{r}</li>)}</ul>
          {showAll&&<><div className="eyebrow muted mt-5">ACCEPTANCE CRITERIA · DEMO</div><ul className="mt-3 space-y-2">{spec.acceptanceCriteria.map((c,i)=><li key={c} className="flex gap-2 text-[11px] leading-relaxed muted" data-testid={`acceptance-criteria-${i}`}><Check size={13} className="mt-0.5 shrink-0 text-secondary"/>{c}</li>)}</ul></>}</div>
        </div>
      </div>
      <div className="eyebrow muted mt-5 text-center">ALL ARCHITECTURE CONTENT ABOVE IS STATIC DEMO SAMPLE DATA</div>
    </section>}
  </div>;
}

function Router() {
  const [location] = useLocation();
  const [projects, setProjects] = usePersistentState<Project[]>('nova-demo-projects', initialProjects);
  const [modalOpen, setModalOpen] = useState(false);
  const createProject = (project: Project) => { setProjects(prev => [project, ...prev]); setModalOpen(false); };
  const openModal = () => setModalOpen(true);
  return <>
    <ErrorBoundary resetKey={location}>
      <AppShell path={location} onCreate={openModal}>
        <Switch>
          <Route path="/"><Dashboard projects={projects} onCreate={openModal}/></Route>
          <Route path="/dashboard"><Dashboard projects={projects} onCreate={openModal}/></Route>
          <Route path="/projects"><Projects projects={projects} onCreate={openModal}/></Route>
          <Route path="/architect"><Architect/></Route>
          <Route component={NotFound}/>
        </Switch>
      </AppShell>
    </ErrorBoundary>
    {modalOpen && <ProjectModal close={() => setModalOpen(false)} create={createProject}/>}
  </>;
}

function App() {
  return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><Router/></WouterRouter><Toaster/></TooltipProvider></QueryClientProvider>;
}
export default App;
