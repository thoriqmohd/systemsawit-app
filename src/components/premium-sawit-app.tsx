"use client";

import { useMemo, useState, type FormEvent } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { BadgeDollarSign, Bell, Building2, CalendarCheck, ClipboardList, CreditCard, FileBarChart, Leaf, LockKeyhole, MapPinned, Menu, QrCode, ReceiptText, Search, Settings, ShieldCheck, Sprout, Truck, UserRound, Users, Weight } from "lucide-react";
import { currency, getNetWeight, getPayableWeight, getPaymentAmount, getPaymentStatus, gradeRates, nextCollectionStatus, number, shortDate, statusSteps } from "@/lib/business";
import { demoAccounts, estatePerformance, initialState, yieldTrend, type AppState, type CollectionRecord, type Role } from "@/lib/mock-data";
import { ChartCard, DataTable, EmptyState, LinkButton, PageHeader, Panel, StatCard, StatusBadge, Timeline } from "@/components/ui-kit";

type PageKey = "dashboard" | "estates" | "workers" | "collections" | "weighbridge" | "transport" | "payments" | "reports" | "settings";
type NavItem = { key: PageKey; label: string; icon: typeof FileBarChart; roles: Role[] };

const navItems: NavItem[] = [
  { key: "dashboard", label: "Dashboard", icon: FileBarChart, roles: ["Super Admin", "Estate Owner", "Plantation Supervisor", "Finance Officer"] },
  { key: "estates", label: "Estate", icon: Building2, roles: ["Super Admin", "Estate Owner", "Plantation Supervisor"] },
  { key: "workers", label: "Workers", icon: Users, roles: ["Super Admin", "Estate Owner", "Plantation Supervisor", "Worker"] },
  { key: "collections", label: "FFB Collection", icon: ClipboardList, roles: ["Super Admin", "Estate Owner", "Plantation Supervisor", "Worker"] },
  { key: "weighbridge", label: "Weighbridge", icon: Weight, roles: ["Super Admin", "Weighbridge Operator", "Estate Owner"] },
  { key: "transport", label: "Transport", icon: Truck, roles: ["Super Admin", "Lorry Driver", "Plantation Supervisor"] },
  { key: "payments", label: "Payments", icon: CreditCard, roles: ["Super Admin", "Finance Officer", "Estate Owner"] },
  { key: "reports", label: "Reports", icon: FileBarChart, roles: ["Super Admin", "Estate Owner", "Plantation Supervisor", "Finance Officer"] },
  { key: "settings", label: "Settings", icon: Settings, roles: ["Super Admin", "Estate Owner"] }
];

const storageKey = "systemsawit-premium-demo-v2";
const chartIcon = FileBarChart;

function loadState(): AppState {
  if (typeof window === "undefined") return initialState;
  try {
    const stored = window.localStorage.getItem(storageKey);
    return stored ? { ...initialState, ...JSON.parse(stored) } : initialState;
  } catch {
    return initialState;
  }
}

function estateName(state: AppState, id: string) {
  return state.estates.find((estate) => estate.id === id)?.name ?? "Unknown estate";
}

function workerName(state: AppState, id: string) {
  return state.workers.find((worker) => worker.id === id)?.name ?? "Unknown worker";
}

function lorryName(state: AppState, id: string) {
  return state.lorries.find((lorry) => lorry.id === id)?.plateNo ?? "Unassigned";
}

function saveState(next: AppState) {
  if (typeof window !== "undefined") window.localStorage.setItem(storageKey, JSON.stringify(next));
}

export function PremiumSawitApp() {
  const [signedIn, setSignedIn] = useState(false);
  const [role, setRole] = useState<Role>("Estate Owner");
  const [page, setPage] = useState<PageKey>("dashboard");
  const [query, setQuery] = useState("");
  const [forgot, setForgot] = useState(false);
  const [state, setState] = useState<AppState>(() => loadState());
  const [selectedCollection, setSelectedCollection] = useState(initialState.collections[0]?.id ?? "");

  function persist(next: AppState) {
    setState(next);
    saveState(next);
  }

  function updateCollection(record: CollectionRecord) {
    persist({
      ...state,
      collections: state.collections.map((item) => item.id === record.id ? record : item),
      activities: [{ id: `act-${Date.now()}`, title: `${record.id} updated`, detail: `Status changed to ${record.status}`, time: "Just now", tone: "green" as const }, ...state.activities].slice(0, 8)
    });
  }

  const visibleNav = navItems.filter((item) => item.roles.includes(role));
  const activeCollection = state.collections.find((item) => item.id === selectedCollection) ?? state.collections[0];

  if (!signedIn) {
    return <AuthScreen forgot={forgot} setForgot={setForgot} setRole={setRole} setSignedIn={setSignedIn} />;
  }

  return <main className="min-h-screen bg-field">
    <div className="flex min-h-screen">
      <aside className="hidden w-72 shrink-0 border-r border-white/60 bg-white/80 p-4 shadow-soft backdrop-blur-xl lg:block">
        <div className="flex items-center gap-3 rounded-2xl bg-darkField p-4 text-white shadow-glow">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15"><Sprout size={23} /></div>
          <div><p className="text-xs uppercase tracking-[0.22em] text-limewash">SistemSawit</p><h1 className="text-lg font-semibold">PalmOps Cloud</h1></div>
        </div>
        <nav className="mt-5 space-y-1">
          {visibleNav.map(({ key, label, icon: Icon }) => <button className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold ${page === key ? "bg-canopy-600 text-white shadow-soft" : "text-slate-600 hover:bg-canopy-50 hover:text-canopy-900"}`} key={key} onClick={() => setPage(key)}><Icon size={18} />{label}</button>)}
        </nav>
        <div className="mt-6 rounded-2xl border border-canopy-100 bg-canopy-50 p-4">
          <p className="text-sm font-semibold text-canopy-900">Demo role</p>
          <select className="mt-3 w-full rounded-xl border border-canopy-200 bg-white px-3 py-2 text-sm" value={role} onChange={(event) => { setRole(event.target.value as Role); setPage("dashboard"); }}>
            {demoAccounts.map((account) => <option key={account.role}>{account.role}</option>)}
          </select>
        </div>
      </aside>
      <section className="min-w-0 flex-1">
        <Topbar role={role} query={query} setQuery={setQuery} setSignedIn={setSignedIn} />
        <div className="px-4 py-5 md:px-6 lg:px-8">
          <MobileNav page={page} setPage={setPage} items={visibleNav} />
          {page === "dashboard" && <DashboardPage state={state} setPage={setPage} />}
          {page === "estates" && <EstatesPage state={state} query={query} />}
          {page === "workers" && <WorkersPage state={state} query={query} />}
          {page === "collections" && <CollectionsPage state={state} persist={persist} selectedId={selectedCollection} setSelectedId={setSelectedCollection} activeCollection={activeCollection} updateCollection={updateCollection} />}
          {page === "weighbridge" && <WeighbridgePage state={state} updateCollection={updateCollection} />}
          {page === "transport" && <TransportPage state={state} />}
          {page === "payments" && <PaymentsPage state={state} updateCollection={updateCollection} />}
          {page === "reports" && <ReportsPage state={state} />}
          {page === "settings" && <SettingsPage role={role} />}
        </div>
      </section>
    </div>
  </main>;
}

function AuthScreen({ forgot, setForgot, setRole, setSignedIn }: { forgot: boolean; setForgot: (value: boolean) => void; setRole: (role: Role) => void; setSignedIn: (value: boolean) => void }) {
  return <main className="min-h-screen bg-darkField p-4 text-white">
    <div className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-6xl overflow-hidden rounded-[2rem] border border-white/10 bg-white/10 shadow-glow backdrop-blur lg:grid-cols-[1.05fr_0.95fr]">
      <section className="relative flex flex-col justify-between p-8 md:p-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(217,249,157,0.24),transparent_22rem)]" />
        <div className="relative">
          <div className="inline-flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3 ring-1 ring-white/15"><Leaf size={22} /><span className="font-semibold">SistemSawit Malaysia</span></div>
          <h1 className="mt-10 max-w-2xl text-4xl font-semibold leading-tight md:text-6xl">Premium palm oil operations platform for estates, transport, grading and payments.</h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-white/72">Track FFB from block to collection centre, weighbridge receipt and final payment with role-based dashboards and business-ready workflows.</p>
        </div>
        <div className="relative mt-10 grid gap-3 md:grid-cols-3">{["GPS proof", "QR tracking", "Payment-ready"].map((item) => <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/10" key={item}><p className="text-sm font-semibold">{item}</p><p className="mt-2 text-xs leading-5 text-white/60">Built for Malaysian plantation teams.</p></div>)}</div>
      </section>
      <section className="bg-white p-6 text-ink md:p-8">
        <div className="rounded-3xl border border-slate-100 bg-mist p-5 shadow-panel">
          <div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-canopy-600 text-white"><LockKeyhole size={20} /></div><div><h2 className="text-xl font-semibold">{forgot ? "Reset password" : "Sign in"}</h2><p className="text-sm text-slate-500">Use a demo role to explore the full platform.</p></div></div>
          {forgot ? <div className="mt-6 space-y-4"><input className="w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="Email address" /><button className="w-full rounded-2xl bg-canopy-600 px-4 py-3 font-semibold text-white">Send reset link</button><button className="text-sm font-semibold text-canopy-700" onClick={() => setForgot(false)}>Back to login</button></div> : <div className="mt-6 space-y-3">{demoAccounts.map((account) => <button className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 text-left hover:border-canopy-300 hover:shadow-soft" key={account.role} onClick={() => { setRole(account.role); setSignedIn(true); }}><span><strong className="block text-sm text-ink">{account.role}</strong><span className="text-xs text-slate-500">{account.email} / {account.password}</span></span><span className="rounded-full bg-canopy-50 px-3 py-1 text-xs font-semibold text-canopy-700">{account.accent}</span></button>)}<button className="pt-2 text-sm font-semibold text-canopy-700" onClick={() => setForgot(true)}>Forgot password?</button></div>}
        </div>
      </section>
    </div>
  </main>;
}

function Topbar({ role, query, setQuery, setSignedIn }: { role: Role; query: string; setQuery: (value: string) => void; setSignedIn: (value: boolean) => void }) {
  return <header className="sticky top-0 z-20 border-b border-white/60 bg-white/75 px-4 py-3 backdrop-blur-xl md:px-6 lg:px-8"><div className="flex items-center gap-3"><button className="rounded-xl border border-slate-200 bg-white p-2 lg:hidden"><Menu size={18} /></button><div className="relative min-w-0 flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} /><input className="w-full rounded-2xl border border-slate-200 bg-white/90 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-canopy-400 focus:ring-2 focus:ring-canopy-100" placeholder="Search estate, worker, collection ID..." value={query} onChange={(event) => setQuery(event.target.value)} /></div><button className="hidden rounded-2xl border border-slate-200 bg-white p-2.5 text-slate-600 md:block"><Bell size={18} /></button><div className="hidden items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 md:flex"><div className="flex h-8 w-8 items-center justify-center rounded-xl bg-canopy-100 text-canopy-700"><UserRound size={16} /></div><div><p className="text-sm font-semibold text-ink">{role}</p><p className="text-xs text-slate-500">Demo workspace</p></div></div><button className="rounded-2xl bg-ink px-3 py-2 text-sm font-semibold text-white" onClick={() => setSignedIn(false)}>Logout</button></div></header>;
}

function MobileNav({ page, setPage, items }: { page: PageKey; setPage: (page: PageKey) => void; items: NavItem[] }) {
  return <div className="mb-4 flex gap-2 overflow-x-auto pb-1 lg:hidden">{items.map((item) => <button className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold ${page === item.key ? "bg-canopy-600 text-white" : "bg-white text-slate-600"}`} key={item.key} onClick={() => setPage(item.key)}>{item.label}</button>)}</div>;
}

function DashboardPage({ state, setPage }: { state: AppState; setPage: (page: PageKey) => void }) {
  const collectedToday = state.collections.filter((item) => item.date === "2026-05-03").reduce((sum, item) => sum + item.actualWeight, 0);
  const monthlyYield = state.estates.reduce((sum, item) => sum + item.monthlyYield, 0);
  const pending = state.collections.filter((item) => !["Approved", "Paid"].includes(item.status)).length;
  const paymentTotal = state.collections.reduce((sum, item) => sum + getPaymentAmount(item), 0);
  return <div className="space-y-6"><PageHeader eyebrow="Command centre" title="Smart palm operations dashboard" description="Real-time view of FFB collection, estate performance, grading status and pending payments across your Malaysian plantation network." actionLabel="Add Collection" onAction={() => setPage("collections")} />
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"><StatCard label="FFB collected today" value={`${number.format(collectedToday / 1000)} t`} helper="Across active collection centres" icon={Leaf} tone="green" /><StatCard label="Monthly yield" value={`${number.format(monthlyYield / 1000)} t`} helper="+13.4% vs last month" icon={chartIcon} tone="blue" /><StatCard label="Active workers" value={String(state.workers.filter((w) => w.status === "Active").length)} helper="Attendance monitored by estate" icon={Users} tone="purple" /><StatCard label="Payment summary" value={currency.format(paymentTotal)} helper={`${pending} collections need action`} icon={BadgeDollarSign} tone="amber" /></div>
    <div className="grid gap-5 xl:grid-cols-[1.3fr_0.9fr]"><ChartCard title="Yield trend" description="Monthly FFB yield and payment movement."><ResponsiveContainer width="100%" height="100%"><AreaChart data={yieldTrend}><defs><linearGradient id="yield" x1="0" x2="0" y1="0" y2="1"><stop offset="5%" stopColor="#20a45a" stopOpacity={0.55}/><stop offset="95%" stopColor="#20a45a" stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" /><XAxis dataKey="month" /><YAxis /><Tooltip /><Area type="monotone" dataKey="yield" stroke="#15844a" fill="url(#yield)" strokeWidth={3} /></AreaChart></ResponsiveContainer></ChartCard><ChartCard title="Estate performance" description="Tonnes per hectare by estate."><ResponsiveContainer width="100%" height="100%"><BarChart data={estatePerformance}><CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" /><XAxis dataKey="name" /><YAxis /><Tooltip /><Bar dataKey="value" fill="#9a6b3f" radius={[10,10,0,0]} /></BarChart></ResponsiveContainer></ChartCard></div>
    <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]"><Panel><div className="mb-4 flex items-center justify-between"><h3 className="text-lg font-semibold text-ink">Recent collections</h3><LinkButton onClick={() => setPage("collections")}>View workflow</LinkButton></div><DataTable headers={["ID", "Estate", "Block", "Weight", "Grade", "Status"]} rows={state.collections.slice(0, 5).map((item) => [item.id, estateName(state, item.estateId), item.block, `${number.format(getNetWeight(item))} kg`, <StatusBadge key="g" status={item.grade} />, <StatusBadge key="s" status={item.status} />])} /></Panel><Panel><h3 className="text-lg font-semibold text-ink">Alerts and activities</h3><div className="mt-4 space-y-3">{state.activities.map((item) => <div className="rounded-2xl border border-slate-100 bg-white p-4" key={item.id}><div className="flex items-center justify-between"><p className="text-sm font-semibold text-ink">{item.title}</p><span className="text-xs text-slate-400">{item.time}</span></div><p className="mt-1 text-sm text-slate-500">{item.detail}</p></div>)}</div></Panel></div>
  </div>;
}

function EstatesPage({ state, query }: { state: AppState; query: string }) {
  const estates = state.estates.filter((estate) => estate.name.toLowerCase().includes(query.toLowerCase()) || estate.state.toLowerCase().includes(query.toLowerCase()));
  return <div className="space-y-6"><PageHeader eyebrow="Estate management" title="Plantation portfolio" description="Manage estate profiles, block coverage, supervisors, location cards and productivity by block." actionLabel="New Estate" /><div className="grid gap-5 lg:grid-cols-3">{estates.map((estate) => <Panel key={estate.id}><div className="flex items-start justify-between gap-3"><div><h3 className="text-lg font-semibold text-ink">{estate.name}</h3><p className="mt-1 text-sm text-slate-500">{estate.owner}</p></div><StatusBadge status={estate.status} /></div><div className="mt-5 rounded-2xl bg-darkField p-4 text-white"><MapPinned size={20}/><p className="mt-3 text-sm font-semibold">{estate.district}, {estate.state}</p><p className="text-xs text-white/60">{estate.location}</p></div><div className="mt-5 grid grid-cols-3 gap-3 text-sm"><Metric label="Hectares" value={number.format(estate.hectares)} /><Metric label="Palm age" value={`${estate.palmAge}y`} /><Metric label="t/ha" value={String(estate.productivity)} /></div><div className="mt-4 flex flex-wrap gap-2">{estate.blocks.map((block) => <span className="rounded-full bg-canopy-50 px-3 py-1 text-xs font-semibold text-canopy-700" key={block}>{block}</span>)}</div></Panel>)}</div></div>;
}

function WorkersPage({ state, query }: { state: AppState; query: string }) {
  const workers = state.workers.filter((worker) => worker.name.toLowerCase().includes(query.toLowerCase()) || worker.role.toLowerCase().includes(query.toLowerCase()));
  return <div className="space-y-6"><PageHeader eyebrow="Worker management" title="Attendance and harvester performance" description="Track assigned estate, block, check-in status, daily collection history and payment/commission summary." actionLabel="Add Worker" /><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{workers.map((worker) => <Panel key={worker.id}><div className="flex items-center gap-3"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-canopy-100 font-semibold text-canopy-700">{worker.name.slice(0,2)}</div><div><h3 className="font-semibold text-ink">{worker.name}</h3><p className="text-sm text-slate-500">{worker.role}</p></div></div><div className="mt-4 flex items-center justify-between"><StatusBadge status={worker.attendance} /><StatusBadge status={worker.status} /></div><div className="mt-5 grid grid-cols-2 gap-3"><Metric label="Collections" value={String(worker.collections)} /><Metric label="Earnings" value={currency.format(worker.earnings)} /></div><p className="mt-4 text-sm text-slate-500">{estateName(state, worker.estateId)} - Block {worker.block}</p></Panel>)}</div></div>;
}

function CollectionsPage({ state, persist, selectedId, setSelectedId, activeCollection, updateCollection }: { state: AppState; persist: (state: AppState) => void; selectedId: string; setSelectedId: (id: string) => void; activeCollection?: CollectionRecord; updateCollection: (record: CollectionRecord) => void }) {
  const [form, setForm] = useState({ estateId: state.estates[0]?.id ?? "", block: state.estates[0]?.blocks[0] ?? "", workerId: state.workers[0]?.id ?? "", lorryId: state.lorries[0]?.id ?? "", centre: "Kluang Collection Centre", bunchCount: "", estimatedWeight: "", actualWeight: "" });
  function submit(event: FormEvent) { event.preventDefault(); const record: CollectionRecord = { id: `FFB-${Date.now().toString().slice(-6)}`, estateId: form.estateId, block: form.block, workerId: form.workerId, team: "New field team", date: new Date().toISOString().slice(0,10), lorryId: form.lorryId, centre: form.centre, bunchCount: Number(form.bunchCount || 0), estimatedWeight: Number(form.estimatedWeight || 0), actualWeight: Number(form.actualWeight || form.estimatedWeight || 0), grossWeight: 0, tareWeight: 0, grade: "Pending", deductionPercent: 0, moisturePercent: 0, dirtPercent: 0, rate: gradeRates.B, status: "Draft", photo: "Photo upload placeholder", remarks: "Created from demo form" }; persist({ ...state, collections: [record, ...state.collections] }); setSelectedId(record.id); }
  return <div className="space-y-6"><PageHeader eyebrow="FFB collection" title="Create and track collection records" description="Step-by-step flow from Draft to Collected, Delivered, Graded, Approved and Paid with QR-style collection IDs." /><div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]"><Panel><h3 className="text-lg font-semibold text-ink">New collection</h3><form className="mt-4 grid gap-3" onSubmit={submit}><Select label="Estate" value={form.estateId} onChange={(v) => setForm({...form, estateId:v})} options={state.estates.map((e) => [e.id,e.name] as [string,string])}/><Input label="Block" value={form.block} onChange={(v) => setForm({...form, block:v})}/><Select label="Worker/team" value={form.workerId} onChange={(v) => setForm({...form, workerId:v})} options={state.workers.map((w) => [w.id,w.name] as [string,string])}/><Select label="Lorry" value={form.lorryId} onChange={(v) => setForm({...form, lorryId:v})} options={state.lorries.map((l) => [l.id,l.plateNo] as [string,string])}/><Input label="Collection centre" value={form.centre} onChange={(v) => setForm({...form, centre:v})}/><div className="grid gap-3 sm:grid-cols-3"><Input label="Bunch count" type="number" value={form.bunchCount} onChange={(v) => setForm({...form, bunchCount:v})}/><Input label="Estimated kg" type="number" value={form.estimatedWeight} onChange={(v) => setForm({...form, estimatedWeight:v})}/><Input label="Actual kg" type="number" value={form.actualWeight} onChange={(v) => setForm({...form, actualWeight:v})}/></div><button className="rounded-2xl bg-canopy-600 px-4 py-3 font-semibold text-white">Create collection</button></form></Panel><Panel>{activeCollection ? <CollectionDetail state={state} record={activeCollection} updateCollection={updateCollection} /> : <EmptyState title="No collection selected" description="Create or select a collection to view its workflow timeline." />}</Panel></div><Panel><DataTable headers={["ID", "Estate", "Worker", "Centre", "Payable", "Status", "Action"]} rows={state.collections.map((item) => [<button className="font-semibold text-canopy-700" key="id" onClick={() => setSelectedId(item.id)}>{item.id}</button>, estateName(state,item.estateId), workerName(state,item.workerId), item.centre, `${number.format(getPayableWeight(item))} kg`, <StatusBadge key="s" status={item.status}/>, <button className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold" key="a" onClick={() => updateCollection(nextCollectionStatus(item))}>Advance</button>])}/></Panel></div>;
}

function CollectionDetail({ state, record, updateCollection }: { state: AppState; record: CollectionRecord; updateCollection: (record: CollectionRecord) => void }) {
  return <div><div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between"><div><p className="text-sm font-semibold text-canopy-600">Collection ID</p><h3 className="mt-1 text-2xl font-semibold text-ink">{record.id}</h3><p className="mt-1 text-sm text-slate-500">{estateName(state, record.estateId)} - Block {record.block}</p></div><div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center"><QrCode className="mx-auto text-canopy-700" size={38}/><p className="mt-2 text-xs font-semibold text-slate-500">QR tracking</p></div></div><div className="mt-5 grid gap-3 sm:grid-cols-3"><Metric label="Net weight" value={`${number.format(getNetWeight(record))} kg`} /><Metric label="Payable" value={`${number.format(getPayableWeight(record))} kg`} /><Metric label="Amount" value={currency.format(getPaymentAmount(record))} /></div><div className="mt-5"><Timeline items={statusSteps.map((step) => ({ title: step, detail: statusSteps.indexOf(step) <= statusSteps.indexOf(record.status) ? "Completed or current stage" : "Waiting for next approval", tone: statusSteps.indexOf(step) <= statusSteps.indexOf(record.status) ? "green" : "slate" }))} /></div><button className="mt-5 rounded-2xl bg-ink px-4 py-3 text-sm font-semibold text-white" onClick={() => updateCollection(nextCollectionStatus(record))}>Move to next status</button></div>;
}

function WeighbridgePage({ state, updateCollection }: { state: AppState; updateCollection: (record: CollectionRecord) => void }) {
  const incoming = state.collections.filter((item) => ["Collected", "Delivered", "Graded"].includes(item.status));
  return <div className="space-y-6"><PageHeader eyebrow="Weighbridge and grading" title="Incoming delivery grading" description="Record gross weight, tare weight, deduction percentage, moisture, dirt and grade quality to calculate payable weight." /><Panel><DataTable headers={["ID", "Lorry", "Gross", "Tare", "Net", "Grade", "Receipt"]} rows={incoming.map((item) => [item.id, lorryName(state,item.lorryId), `${number.format(item.grossWeight)} kg`, `${number.format(item.tareWeight)} kg`, `${number.format(getNetWeight(item))} kg`, <StatusBadge key="g" status={item.grade}/>, <button className="rounded-xl bg-canopy-600 px-3 py-1.5 text-xs font-semibold text-white" key="r" onClick={() => updateCollection({ ...item, grossWeight: item.grossWeight || item.actualWeight + 6200, tareWeight: item.tareWeight || 6200, actualWeight: item.actualWeight || item.estimatedWeight, grade: item.grade === "Pending" ? "B" : item.grade, deductionPercent: item.deductionPercent || 2, moisturePercent: item.moisturePercent || 1, dirtPercent: item.dirtPercent || 0.5, status: "Graded", rate: item.grade === "A" ? gradeRates.A : gradeRates.B })}>Generate receipt</button>])}/></Panel></div>;
}

function TransportPage({ state }: { state: AppState }) { return <div className="space-y-6"><PageHeader eyebrow="Transport" title="Lorry and trip operations" description="Monitor driver assignment, delivery status, fuel cost and trip performance." actionLabel="Add Trip" /><div className="grid gap-5 md:grid-cols-3">{state.lorries.map((lorry) => <Panel key={lorry.id}><div className="flex items-start justify-between"><div><h3 className="text-lg font-semibold text-ink">{lorry.plateNo}</h3><p className="text-sm text-slate-500">{lorry.driver}</p></div><StatusBadge status={lorry.status}/></div><div className="mt-5 grid grid-cols-3 gap-3"><Metric label="Trips" value={String(lorry.trips)} /><Metric label="Delivered" value={`${number.format(lorry.deliveredKg/1000)} t`} /><Metric label="Fuel" value={currency.format(lorry.fuelCost)} /></div></Panel>)}</div></div>; }

function PaymentsPage({ state, updateCollection }: { state: AppState; updateCollection: (record: CollectionRecord) => void }) { return <div className="space-y-6"><PageHeader eyebrow="Finance" title="Payment vouchers and billing" description="Calculate payment from payable weight, grade rate, deductions and commission. Mark approved collections as paid." /><Panel><DataTable headers={["Voucher", "Worker", "Grade", "Payable", "Rate", "Amount", "Payment", "Action"]} rows={state.collections.map((item) => [item.id.replace("FFB", "PAY"), workerName(state,item.workerId), <StatusBadge key="g" status={item.grade}/>, `${number.format(getPayableWeight(item))} kg`, currency.format(item.rate), currency.format(getPaymentAmount(item)), <StatusBadge key="p" status={getPaymentStatus(item)}/>, item.status !== "Paid" ? <button className="rounded-xl bg-ink px-3 py-1.5 text-xs font-semibold text-white" key="pay" onClick={() => updateCollection({ ...item, status: "Paid" })}>Mark as paid</button> : <ReceiptText key="done" className="text-canopy-600" size={18}/>])}/></Panel></div>; }

function ReportsPage({ state }: { state: AppState }) {
  const [status, setStatus] = useState("All");
  const rows = state.collections.filter((item) => status === "All" || item.status === status);
  const statusOptions: Array<[string, string]> = ["All", ...statusSteps].map((item) => [item, item]);
  return <div className="space-y-6"><PageHeader eyebrow="Reports" title="Analytics and export centre" description="Filter daily collection, monthly yield, productivity, estate performance and payment reports. Export buttons are prepared for PDF and Excel." /><Panel><div className="mb-4 flex flex-wrap gap-3"><Select label="Status" value={status} onChange={setStatus} options={statusOptions}/><button className="self-end rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold">Export PDF</button><button className="self-end rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold">Export Excel</button></div><DataTable headers={["Date", "Collection", "Estate", "Worker", "Weight", "Amount", "Status"]} rows={rows.map((item) => [shortDate(item.date), item.id, estateName(state,item.estateId), workerName(state,item.workerId), `${number.format(getNetWeight(item))} kg`, currency.format(getPaymentAmount(item)), <StatusBadge key="s" status={item.status}/>])}/></Panel></div>;
}

function SettingsPage({ role }: { role: Role }) { return <div className="space-y-6"><PageHeader eyebrow="Admin settings" title="Company, permissions and rules" description="Manage users, role permissions, FFB price/rate settings, grading rules, company profile and notification preferences." /><div className="grid gap-5 lg:grid-cols-3"><Panel><ShieldCheck className="text-canopy-600"/><h3 className="mt-3 font-semibold text-ink">Role permissions</h3><p className="mt-2 text-sm text-slate-500">Current role: {role}. Menus adapt based on operational responsibility.</p></Panel><Panel><BadgeDollarSign className="text-canopy-600"/><h3 className="mt-3 font-semibold text-ink">FFB rates</h3><p className="mt-2 text-sm text-slate-500">Grade A RM760/t, B RM710/t, C RM650/t. Reject not payable.</p></Panel><Panel><Bell className="text-canopy-600"/><h3 className="mt-3 font-semibold text-ink">Notifications</h3><p className="mt-2 text-sm text-slate-500">Alerts for low productivity, pending grading and unpaid collections.</p></Panel></div></div>; }

function Metric({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl bg-slate-50 p-3"><p className="text-xs text-slate-500">{label}</p><p className="mt-1 text-sm font-semibold text-ink">{value}</p></div>; }
function Input({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) { return <label className="block text-sm font-semibold text-slate-600">{label}<input className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-canopy-400 focus:ring-2 focus:ring-canopy-100" type={type} value={value} onChange={(event) => onChange(event.target.value)} /></label>; }
function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: Array<[string, string]> }) { return <label className="block text-sm font-semibold text-slate-600">{label}<select className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-canopy-400 focus:ring-2 focus:ring-canopy-100" value={value} onChange={(event) => onChange(event.target.value)}>{options.map(([optionValue, labelText]) => <option key={optionValue} value={optionValue}>{labelText}</option>)}</select></label>; }
