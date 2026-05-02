"use client";

import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { LucideIcon } from "lucide-react";
import { BadgeDollarSign, Bell, Building2, CalendarCheck, CheckCircle2, ClipboardList, CreditCard, Download, Eye, FileBarChart, Leaf, LockKeyhole, MapPinned, Menu, Pencil, Plus, QrCode, ReceiptText, RotateCcw, Save, Search, Settings, ShieldCheck, Sprout, Trash2, Truck, UserPlus, UserRound, Users, Weight, X } from "lucide-react";
import { currency, getNetWeight, getPayableWeight, getPaymentAmount, getPaymentStatus, gradeRates, nextCollectionStatus, number, shortDate, statusSteps } from "@/lib/business";
import { demoAccounts, estatePerformance, initialState, yieldTrend, type AppState, type CollectionRecord, type Estate, type Lorry, type Role, type Worker } from "@/lib/mock-data";
import { ChartCard, DataTable, EmptyState, PageHeader, Panel, StatCard, StatusBadge, Timeline } from "@/components/ui-kit";

type PageKey = "dashboard" | "estates" | "workers" | "collections" | "weighbridge" | "transport" | "payments" | "reports" | "settings";
type ModalKind = "estate" | "worker" | "lorry" | "collection" | "grading" | "voucher" | "details" | "user" | "settings" | "activity" | "comingSoon" | null;
type Toast = { id: number; title: string; detail: string; tone: "success" | "info" | "warning" };
type Confirm = { title: string; detail: string; action: () => void } | null;
type NavItem = { key: PageKey; label: string; icon: LucideIcon; roles: Role[] };

const storageKey = "systemsawit-demo-ready-v1";
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

const emptyCollectionForm = { estateId: "", block: "", workerId: "", lorryId: "", centre: "Kluang Collection Centre", bunchCount: "", estimatedWeight: "", actualWeight: "" };
const emptyGradingForm = { grossWeight: "", tareWeight: "", grade: "B", deductionPercent: "2", moisturePercent: "1", dirtPercent: "0.5" };

function loadState(): AppState {
  if (typeof window === "undefined") return initialState;
  try {
    const stored = window.localStorage.getItem(storageKey);
    return stored ? { ...initialState, ...JSON.parse(stored) } : initialState;
  } catch {
    return initialState;
  }
}

function persistState(next: AppState) {
  if (typeof window !== "undefined") window.localStorage.setItem(storageKey, JSON.stringify(next));
}

function uid(prefix: string) {
  return `${prefix}-${Date.now().toString().slice(-6)}`;
}

function estateName(state: AppState, id: string) { return state.estates.find((item) => item.id === id)?.name ?? "Unknown estate"; }
function workerName(state: AppState, id: string) { return state.workers.find((item) => item.id === id)?.name ?? "Unknown worker"; }
function lorryName(state: AppState, id: string) { return state.lorries.find((item) => item.id === id)?.plateNo ?? "Unassigned"; }

export function DemoReadySawitApp() {
  const [signedIn, setSignedIn] = useState(false);
  const [forgot, setForgot] = useState(false);
  const [role, setRole] = useState<Role>("Estate Owner");
  const [page, setPage] = useState<PageKey>("dashboard");
  const [state, setState] = useState<AppState>(() => loadState());
  const [query, setQuery] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [modal, setModal] = useState<ModalKind>(null);
  const [modalTitle, setModalTitle] = useState("");
  const [selectedId, setSelectedId] = useState(state.collections[0]?.id ?? "");
  const [toast, setToast] = useState<Toast[]>([]);
  const [confirm, setConfirm] = useState<Confirm>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [collectionForm, setCollectionForm] = useState({ ...emptyCollectionForm, estateId: state.estates[0]?.id ?? "", block: state.estates[0]?.blocks[0] ?? "", workerId: state.workers[0]?.id ?? "", lorryId: state.lorries[0]?.id ?? "" });
  const [gradingForm, setGradingForm] = useState(emptyGradingForm);
  const [filters, setFilters] = useState({ estate: "All", worker: "All", status: "All", date: "" });

  const visibleNav = navItems.filter((item) => item.roles.includes(role));
  const selectedCollection = state.collections.find((item) => item.id === selectedId) ?? state.collections[0];

  function notify(title: string, detail: string, tone: Toast["tone"] = "success") {
    const id = Date.now();
    setToast((items) => [{ id, title, detail, tone }, ...items].slice(0, 3));
    window.setTimeout(() => setToast((items) => items.filter((item) => item.id !== id)), 3200);
  }

  function persist(next: AppState, message?: string) {
    setState(next);
    persistState(next);
    if (message) notify("Updated", message);
  }

  function addActivity(next: AppState, title: string, detail: string): AppState {
    return { ...next, activities: [{ id: uid("act"), title, detail, time: "Just now", tone: "green" as const }, ...next.activities].slice(0, 10) };
  }

  function open(kind: ModalKind, title: string, id?: string) {
    if (id) setSelectedId(id);
    setModal(kind);
    setModalTitle(title);
    setErrors({});
  }

  function comingSoon(title: string) {
    open("comingSoon", title);
  }

  function switchPage(next: PageKey) {
    setPage(next);
    setMobileOpen(false);
  }

  function updateCollection(record: CollectionRecord, message = `${record.id} updated`) {
    const next = addActivity({ ...state, collections: state.collections.map((item) => item.id === record.id ? record : item) }, `${record.id} updated`, `Status is now ${record.status}`);
    persist(next, message);
  }

  function deleteEstate(id: string) {
    setConfirm({ title: "Delete estate?", detail: "Demo data will remove this estate and keep other records unchanged.", action: () => {
      persist(addActivity({ ...state, estates: state.estates.filter((item) => item.id !== id) }, "Estate deleted", estateName(state, id)), "Estate deleted");
      setConfirm(null);
    }});
  }

  function submitEstate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get("name") || "").trim();
    const owner = String(data.get("owner") || "").trim();
    if (!name || !owner) return setErrors({ estate: "Estate name and owner are required." });
    const estate: Estate = { id: uid("est"), name, owner, state: String(data.get("state") || "Johor"), district: String(data.get("district") || "Kluang"), supervisor: String(data.get("supervisor") || "New Supervisor"), status: "New", hectares: Number(data.get("hectares") || 120), palmAge: Number(data.get("palmAge") || 6), blocks: ["A01"], monthlyYield: 0, productivity: 0, location: "Location pending" };
    persist(addActivity({ ...state, estates: [estate, ...state.estates] }, "Estate created", estate.name), "Estate created");
    setModal(null);
  }

  function submitWorker(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get("name") || "").trim();
    if (!name) return setErrors({ worker: "Worker name is required." });
    const worker: Worker = { id: uid("wrk"), name, role: String(data.get("role") || "Harvester") as Worker["role"], estateId: String(data.get("estateId") || state.estates[0]?.id), block: String(data.get("block") || "A01"), phone: String(data.get("phone") || "010-000 0000"), attendance: "Present", collections: 0, earnings: 0, status: "Active" };
    persist(addActivity({ ...state, workers: [worker, ...state.workers] }, "Worker added", worker.name), "Worker added");
    setModal(null);
  }

  function submitLorry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const plateNo = String(data.get("plateNo") || "").trim();
    if (!plateNo) return setErrors({ lorry: "Lorry plate number is required." });
    const lorry: Lorry = { id: uid("lor"), plateNo, driver: String(data.get("driver") || "Unassigned"), status: "Available", trips: 0, deliveredKg: 0, fuelCost: 0 };
    persist(addActivity({ ...state, lorries: [lorry, ...state.lorries] }, "Lorry added", plateNo), "Lorry added");
    setModal(null);
  }

  function submitCollection(event: FormEvent) {
    event.preventDefault();
    if (!collectionForm.bunchCount || !collectionForm.estimatedWeight) return setErrors({ collection: "Bunch count and estimated weight are required." });
    const record: CollectionRecord = { id: uid("FFB"), estateId: collectionForm.estateId, block: collectionForm.block, workerId: collectionForm.workerId, team: "New field team", date: new Date().toISOString().slice(0, 10), lorryId: collectionForm.lorryId, centre: collectionForm.centre, bunchCount: Number(collectionForm.bunchCount), estimatedWeight: Number(collectionForm.estimatedWeight), actualWeight: Number(collectionForm.actualWeight || collectionForm.estimatedWeight), grossWeight: 0, tareWeight: 0, grade: "Pending", deductionPercent: 0, moisturePercent: 0, dirtPercent: 0, rate: gradeRates.B, status: "Draft", photo: "Proof placeholder ready", remarks: "Created from demo flow" };
    setSelectedId(record.id);
    persist(addActivity({ ...state, collections: [record, ...state.collections] }, "Collection draft created", record.id), "Collection saved as draft");
    setModal(null);
  }

  function saveGrading() {
    if (!selectedCollection) return;
    const grossWeight = Number(gradingForm.grossWeight || selectedCollection.actualWeight + 6200);
    const tareWeight = Number(gradingForm.tareWeight || 6200);
    if (grossWeight <= tareWeight) return setErrors({ grading: "Gross weight must be higher than tare weight." });
    updateCollection({ ...selectedCollection, grossWeight, tareWeight, grade: gradingForm.grade as CollectionRecord["grade"], deductionPercent: Number(gradingForm.deductionPercent || 0), moisturePercent: Number(gradingForm.moisturePercent || 0), dirtPercent: Number(gradingForm.dirtPercent || 0), rate: gradeRates[gradingForm.grade as CollectionRecord["grade"]], status: "Graded" }, "Grading saved and net weight calculated");
    setModal(null);
  }

  function markPaid(record: CollectionRecord) {
    setConfirm({ title: "Mark payment as paid?", detail: `${record.id} will move to Paid and dashboard totals will update.`, action: () => { updateCollection({ ...record, status: "Paid" }, "Payment marked as paid"); setConfirm(null); } });
  }

  if (!signedIn) return <AuthScreen forgot={forgot} setForgot={setForgot} setRole={setRole} setSignedIn={setSignedIn} notify={notify} />;

  return <main className="min-h-screen bg-field">
    <Toasts items={toast} dismiss={(id) => setToast((items) => items.filter((item) => item.id !== id))} />
    {confirm && <ConfirmDialog confirm={confirm} close={() => setConfirm(null)} />}
    {modal && <Modal title={modalTitle} close={() => setModal(null)}>{renderModal()}</Modal>}
    {mobileOpen && <button className="fixed inset-0 z-30 bg-ink/30 lg:hidden" aria-label="Close mobile menu" onClick={() => setMobileOpen(false)} />}
    <div className="flex min-h-screen">
      <aside className={`${mobileOpen ? "fixed inset-y-0 left-0 z-40 block" : "hidden"} w-72 shrink-0 border-r border-white/60 bg-white/90 p-4 shadow-soft backdrop-blur-xl lg:static lg:block`}>
        <Brand />
        <nav className="mt-5 space-y-1">{visibleNav.map(({ key, label, icon: Icon }) => <button className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold ${page === key ? "bg-canopy-600 text-white shadow-soft" : "text-slate-600 hover:bg-canopy-50 hover:text-canopy-900"}`} key={key} onClick={() => switchPage(key)}><Icon size={18} />{label}</button>)}</nav>
        <div className="mt-6 rounded-2xl border border-canopy-100 bg-canopy-50 p-4"><p className="text-sm font-semibold text-canopy-900">Demo role</p><select className="mt-3 w-full rounded-xl border border-canopy-200 bg-white px-3 py-2 text-sm" value={role} onChange={(event) => { setRole(event.target.value as Role); switchPage("dashboard"); notify("Role changed", `Now viewing as ${event.target.value}`, "info"); }}>{demoAccounts.map((account) => <option key={account.role}>{account.role}</option>)}</select></div>
      </aside>
      <section className="min-w-0 flex-1">
        <Topbar role={role} query={query} setQuery={setQuery} openMenu={() => setMobileOpen(true)} openAlerts={() => open("activity", "Notifications and activity")} logout={() => setConfirm({ title: "Log out?", detail: "You can sign in again using any demo account.", action: () => { setSignedIn(false); setConfirm(null); } })} />
        <div className="px-4 py-5 md:px-6 lg:px-8">{renderPage()}</div>
      </section>
    </div>
  </main>;

  function renderPage() {
    if (page === "dashboard") return <DashboardPage state={state} go={switchPage} open={open} notify={notify} />;
    if (page === "estates") return <EstatesPage state={state} query={query} setQuery={setQuery} open={open} deleteEstate={deleteEstate} comingSoon={comingSoon} />;
    if (page === "workers") return <WorkersPage state={state} query={query} setQuery={setQuery} open={open} persist={persist} comingSoon={comingSoon} />;
    if (page === "collections") return <CollectionsPage state={state} selected={selectedCollection} setSelectedId={setSelectedId} open={open} updateCollection={updateCollection} setCollectionForm={setCollectionForm} />;
    if (page === "weighbridge") return <WeighbridgePage state={state} setSelectedId={setSelectedId} open={open} updateCollection={updateCollection} setGradingForm={setGradingForm} />;
    if (page === "transport") return <TransportPage state={state} open={open} persist={persist} notify={notify} />;
    if (page === "payments") return <PaymentsPage state={state} setSelectedId={setSelectedId} open={open} markPaid={markPaid} updateCollection={updateCollection} />;
    if (page === "reports") return <ReportsPage state={state} filters={filters} setFilters={setFilters} notify={notify} />;
    return <SettingsPage role={role} state={state} open={open} notify={notify} />;
  }

  function renderModal() {
    if (modal === "estate") return <EstateForm errors={errors} submit={submitEstate} close={() => setModal(null)} />;
    if (modal === "worker") return <WorkerForm state={state} errors={errors} submit={submitWorker} close={() => setModal(null)} />;
    if (modal === "lorry") return <LorryForm errors={errors} submit={submitLorry} close={() => setModal(null)} />;
    if (modal === "collection") return <CollectionForm state={state} form={collectionForm} setForm={setCollectionForm} errors={errors} submit={submitCollection} close={() => setModal(null)} />;
    if (modal === "grading") return <GradingForm form={gradingForm} setForm={setGradingForm} errors={errors} save={saveGrading} close={() => setModal(null)} />;
    if (modal === "voucher" && selectedCollection) return <Voucher record={selectedCollection} state={state} close={() => setModal(null)} />;
    if (modal === "details" && selectedCollection) return <CollectionDetail state={state} record={selectedCollection} update={updateCollection} close={() => setModal(null)} />;
    if (modal === "activity") return <ActivityList state={state} go={(next) => { setModal(null); switchPage(next); }} />;
    if (modal === "user") return <UserForm close={() => setModal(null)} notify={notify} />;
    if (modal === "settings") return <SettingsForm close={() => setModal(null)} notify={notify} />;
    return <ComingSoon title={modalTitle} close={() => setModal(null)} notify={notify} />;
  }
}

function Brand() { return <div className="flex items-center gap-3 rounded-2xl bg-darkField p-4 text-white shadow-glow"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15"><Sprout size={23} /></div><div><p className="text-xs uppercase tracking-[0.22em] text-limewash">SistemSawit</p><h1 className="text-lg font-semibold">PalmOps Cloud</h1></div></div>; }

function AuthScreen({ forgot, setForgot, setRole, setSignedIn, notify }: { forgot: boolean; setForgot: (value: boolean) => void; setRole: (role: Role) => void; setSignedIn: (value: boolean) => void; notify: (title: string, detail: string, tone?: Toast["tone"]) => void }) {
  return <main className="min-h-screen bg-darkField p-4 text-white"><div className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-6xl overflow-hidden rounded-[2rem] border border-white/10 bg-white/10 shadow-glow backdrop-blur lg:grid-cols-[1.05fr_0.95fr]"><section className="relative flex flex-col justify-between p-8 md:p-10"><div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(217,249,157,0.24),transparent_22rem)]" /><div className="relative"><div className="inline-flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3 ring-1 ring-white/15"><Leaf size={22} /><span className="font-semibold">SistemSawit Malaysia</span></div><h1 className="mt-10 max-w-2xl text-4xl font-semibold leading-tight md:text-6xl">Premium palm oil operations platform for estates, transport, grading and payments.</h1><p className="mt-5 max-w-xl text-base leading-7 text-white/72">Client-demo ready flows for Malaysian estate teams, collection centres and finance officers.</p></div><div className="relative mt-10 grid gap-3 md:grid-cols-3">{["GPS proof", "QR tracking", "Payment-ready"].map((item) => <button className="rounded-2xl bg-white/10 p-4 text-left ring-1 ring-white/10 hover:bg-white/15" key={item} onClick={() => notify(item, "Demo capability is active in the dashboard.", "info")}><p className="text-sm font-semibold">{item}</p><p className="mt-2 text-xs leading-5 text-white/60">Built for Malaysian plantation teams.</p></button>)}</div></section><section className="bg-white p-6 text-ink md:p-8"><div className="rounded-3xl border border-slate-100 bg-mist p-5 shadow-panel"><div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-canopy-600 text-white"><LockKeyhole size={20} /></div><div><h2 className="text-xl font-semibold">{forgot ? "Reset password" : "Sign in"}</h2><p className="text-sm text-slate-500">Use a demo role to explore the full platform.</p></div></div>{forgot ? <form className="mt-6 space-y-4" onSubmit={(event) => { event.preventDefault(); notify("Reset link prepared", "A demo reset email state was generated."); setForgot(false); }}><input className="w-full rounded-2xl border border-slate-200 px-4 py-3" required type="email" placeholder="Email address" /><button className="w-full rounded-2xl bg-canopy-600 px-4 py-3 font-semibold text-white">Send reset link</button><button type="button" className="text-sm font-semibold text-canopy-700" onClick={() => setForgot(false)}>Back to login</button></form> : <div className="mt-6 space-y-3">{demoAccounts.map((account) => <button className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 text-left hover:border-canopy-300 hover:shadow-soft" key={account.role} onClick={() => { setRole(account.role); setSignedIn(true); notify("Signed in", `Welcome ${account.role}`, "success"); }}><span><strong className="block text-sm text-ink">{account.role}</strong><span className="text-xs text-slate-500">{account.email} / {account.password}</span></span><span className="rounded-full bg-canopy-50 px-3 py-1 text-xs font-semibold text-canopy-700">{account.accent}</span></button>)}<button className="pt-2 text-sm font-semibold text-canopy-700" onClick={() => setForgot(true)}>Forgot password?</button></div>}</div></section></div></main>;
}

function Topbar({ role, query, setQuery, openMenu, openAlerts, logout }: { role: Role; query: string; setQuery: (value: string) => void; openMenu: () => void; openAlerts: () => void; logout: () => void }) { return <header className="sticky top-0 z-20 border-b border-white/60 bg-white/75 px-4 py-3 backdrop-blur-xl md:px-6 lg:px-8"><div className="flex items-center gap-3"><button className="rounded-xl border border-slate-200 bg-white p-2 lg:hidden" onClick={openMenu} aria-label="Open mobile navigation"><Menu size={18} /></button><div className="relative min-w-0 flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} /><input className="w-full rounded-2xl border border-slate-200 bg-white/90 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-canopy-400 focus:ring-2 focus:ring-canopy-100" placeholder="Search estate, worker, collection ID..." value={query} onChange={(event) => setQuery(event.target.value)} /></div><button className="hidden rounded-2xl border border-slate-200 bg-white p-2.5 text-slate-600 md:block" onClick={openAlerts} aria-label="Open notifications"><Bell size={18} /></button><div className="hidden items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 md:flex"><div className="flex h-8 w-8 items-center justify-center rounded-xl bg-canopy-100 text-canopy-700"><UserRound size={16} /></div><div><p className="text-sm font-semibold text-ink">{role}</p><p className="text-xs text-slate-500">Demo workspace</p></div></div><button className="rounded-2xl bg-ink px-3 py-2 text-sm font-semibold text-white" onClick={logout}>Logout</button></div></header>; }

function DashboardPage({ state, go, open, notify }: { state: AppState; go: (page: PageKey) => void; open: (kind: ModalKind, title: string, id?: string) => void; notify: (title: string, detail: string, tone?: Toast["tone"]) => void }) {
  const collectedToday = state.collections.filter((item) => item.date === "2026-05-03").reduce((sum, item) => sum + item.actualWeight, 0);
  const paymentTotal = state.collections.reduce((sum, item) => sum + getPaymentAmount(item), 0);
  return <div className="space-y-6"><PageHeader eyebrow="Command centre" title="Smart palm operations dashboard" description="Operational cockpit for FFB collection, estate performance, grading, transport and payments." actionLabel="Add Collection" onAction={() => open("collection", "Add new collection")} /><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"><StatButton label="FFB collected today" value={`${number.format(collectedToday / 1000)} t`} icon={Leaf} onClick={() => go("collections")} /><StatButton label="Monthly yield" value={`${number.format(state.estates.reduce((s, e) => s + e.monthlyYield, 0) / 1000)} t`} icon={FileBarChart} onClick={() => go("reports")} /><StatButton label="Active workers" value={String(state.workers.filter((w) => w.status === "Active").length)} icon={Users} onClick={() => go("workers")} /><StatButton label="Payment summary" value={currency.format(paymentTotal)} icon={BadgeDollarSign} onClick={() => go("payments")} /></div><div className="grid gap-5 xl:grid-cols-[1.3fr_0.9fr]"><ChartCard title="Yield trend" description="Click export in Reports for mock PDF/Excel output."><ResponsiveContainer width="100%" height="100%"><AreaChart data={yieldTrend}><defs><linearGradient id="yield" x1="0" x2="0" y1="0" y2="1"><stop offset="5%" stopColor="#20a45a" stopOpacity={0.55}/><stop offset="95%" stopColor="#20a45a" stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" /><XAxis dataKey="month" /><YAxis /><Tooltip /><Area type="monotone" dataKey="yield" stroke="#15844a" fill="url(#yield)" strokeWidth={3} /></AreaChart></ResponsiveContainer></ChartCard><ChartCard title="Estate performance" description="Tonnes per hectare by estate."><ResponsiveContainer width="100%" height="100%"><BarChart data={estatePerformance}><CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" /><XAxis dataKey="name" /><YAxis /><Tooltip /><Bar dataKey="value" fill="#9a6b3f" radius={[10,10,0,0]} /></BarChart></ResponsiveContainer></ChartCard></div><div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]"><Panel><HeaderRow title="Recent collections" action="View reports" onAction={() => go("reports")} /><DataTable headers={["ID", "Estate", "Weight", "Status", "Action"]} rows={state.collections.slice(0, 5).map((item) => [item.id, estateName(state, item.estateId), `${number.format(getNetWeight(item))} kg`, <StatusBadge key="s" status={item.status} />, <button key="d" className="rounded-xl border px-3 py-1 text-xs font-semibold" onClick={() => open("details", "Collection details", item.id)}>Details</button>])} /></Panel><Panel><HeaderRow title="Alerts and activity" action="Open activity" onAction={() => open("activity", "Notifications and activity")} /><div className="space-y-3">{state.activities.map((item) => <button className="w-full rounded-2xl border border-slate-100 bg-white p-4 text-left hover:bg-canopy-50" key={item.id} onClick={() => notify(item.title, item.detail, item.tone === "red" ? "warning" : "info")}><p className="text-sm font-semibold text-ink">{item.title}</p><p className="mt-1 text-sm text-slate-500">{item.detail}</p></button>)}</div></Panel></div></div>;
}

function EstatesPage({ state, query, setQuery, open, deleteEstate, comingSoon }: { state: AppState; query: string; setQuery: (value: string) => void; open: (kind: ModalKind, title: string, id?: string) => void; deleteEstate: (id: string) => void; comingSoon: (title: string) => void }) {
  const [status, setStatus] = useState("All");
  const estates = state.estates.filter((estate) => (status === "All" || estate.status === status) && (estate.name.toLowerCase().includes(query.toLowerCase()) || estate.state.toLowerCase().includes(query.toLowerCase())));
  return <div className="space-y-6"><PageHeader eyebrow="Estate management" title="Plantation portfolio" description="Search, filter, view, edit, delete and manage block productivity." actionLabel="Add Estate" onAction={() => open("estate", "Add estate")} /><FilterBar query={query} setQuery={setQuery} status={status} setStatus={setStatus} statuses={["All", "Excellent", "Watchlist", "New"]} reset={() => { setQuery(""); setStatus("All"); }} /><div className="grid gap-5 lg:grid-cols-3">{estates.map((estate) => <Panel key={estate.id}><div className="flex items-start justify-between gap-3"><div><h3 className="text-lg font-semibold text-ink">{estate.name}</h3><p className="text-sm text-slate-500">{estate.owner}</p></div><StatusBadge status={estate.status} /></div><button className="mt-5 w-full rounded-2xl bg-darkField p-4 text-left text-white" onClick={() => comingSoon(`Map and productivity for ${estate.name}`)}><MapPinned size={20}/><p className="mt-3 text-sm font-semibold">{estate.district}, {estate.state}</p><p className="text-xs text-white/60">{estate.location}</p></button><div className="mt-5 grid grid-cols-3 gap-3"><Metric label="Hectares" value={number.format(estate.hectares)} /><Metric label="Palm age" value={`${estate.palmAge}y`} /><Metric label="t/ha" value={String(estate.productivity)} /></div><div className="mt-4 flex flex-wrap gap-2">{estate.blocks.map((block) => <button className="rounded-full bg-canopy-50 px-3 py-1 text-xs font-semibold text-canopy-700" key={block} onClick={() => comingSoon(`Block ${block} productivity`)}>{block}</button>)}</div><ActionRow actions={[ ["View", () => comingSoon(`${estate.name} detail page`)], ["Edit", () => open("estate", "Edit estate")], ["Assign", () => comingSoon("Assign supervisor")], ["Delete", () => deleteEstate(estate.id)] ]} /></Panel>)}</div>{!estates.length && <EmptyState title="No estates match filters" description="Reset filters or add a new estate." />}</div>;
}

function WorkersPage({ state, query, setQuery, open, persist, comingSoon }: { state: AppState; query: string; setQuery: (value: string) => void; open: (kind: ModalKind, title: string) => void; persist: (state: AppState, message?: string) => void; comingSoon: (title: string) => void }) {
  const [status, setStatus] = useState("All");
  const workers = state.workers.filter((worker) => (status === "All" || worker.status === status) && (worker.name.toLowerCase().includes(query.toLowerCase()) || worker.role.toLowerCase().includes(query.toLowerCase())));
  const updateStatus = (worker: Worker) => persist({ ...state, workers: state.workers.map((item) => item.id === worker.id ? { ...item, status: item.status === "Active" ? "On Leave" : "Active" } : item) }, `${worker.name} status updated`);
  return <div className="space-y-6"><PageHeader eyebrow="Worker management" title="Attendance and harvester performance" description="Manage profiles, assignments, attendance and productivity." actionLabel="Add Worker" onAction={() => open("worker", "Add worker")} /><FilterBar query={query} setQuery={setQuery} status={status} setStatus={setStatus} statuses={["All", "Active", "On Leave", "Inactive"]} reset={() => { setQuery(""); setStatus("All"); }} /><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{workers.map((worker) => <Panel key={worker.id}><div className="flex items-center gap-3"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-canopy-100 font-semibold text-canopy-700">{worker.name.slice(0,2)}</div><div><h3 className="font-semibold text-ink">{worker.name}</h3><p className="text-sm text-slate-500">{worker.role}</p></div></div><div className="mt-4 flex items-center justify-between"><StatusBadge status={worker.attendance} /><StatusBadge status={worker.status} /></div><div className="mt-5 grid grid-cols-2 gap-3"><Metric label="Collections" value={String(worker.collections)} /><Metric label="Earnings" value={currency.format(worker.earnings)} /></div><p className="mt-4 text-sm text-slate-500">{estateName(state, worker.estateId)} - Block {worker.block}</p><ActionRow actions={[ ["Profile", () => comingSoon(`${worker.name} profile`)], ["Edit", () => open("worker", "Edit worker")], ["Assign", () => comingSoon("Assign estate/block")], ["Status", () => updateStatus(worker)] ]} /></Panel>)}</div>{!workers.length && <EmptyState title="No workers match filters" description="Reset filters or add a new worker." />}</div>;
}

function CollectionsPage({ state, selected, setSelectedId, open, updateCollection, setCollectionForm }: { state: AppState; selected?: CollectionRecord; setSelectedId: (id: string) => void; open: (kind: ModalKind, title: string, id?: string) => void; updateCollection: (record: CollectionRecord, message?: string) => void; setCollectionForm: (form: typeof emptyCollectionForm) => void }) {
  return <div className="space-y-6"><PageHeader eyebrow="FFB collection" title="Create and track collection records" description="Draft, submit, upload proof, QR view, status update and cancellation flows are active." actionLabel="Add Collection" onAction={() => { setCollectionForm({ ...emptyCollectionForm, estateId: state.estates[0]?.id ?? "", block: state.estates[0]?.blocks[0] ?? "", workerId: state.workers[0]?.id ?? "", lorryId: state.lorries[0]?.id ?? "" }); open("collection", "Add new collection"); }} /><div className="grid gap-5 xl:grid-cols-[1fr_0.9fr]"><Panel><DataTable headers={["ID", "Estate", "Worker", "Payable", "Status", "Actions"]} rows={state.collections.map((item) => [<button className="font-semibold text-canopy-700" key="id" onClick={() => { setSelectedId(item.id); open("details", "Collection details", item.id); }}>{item.id}</button>, estateName(state, item.estateId), workerName(state, item.workerId), `${number.format(getPayableWeight(item))} kg`, <StatusBadge key="s" status={item.status}/>, <ActionGroup key="a" actions={[ ["View", () => open("details", "Collection details", item.id)], ["Advance", () => updateCollection(nextCollectionStatus(item), "Collection status advanced")], ["QR", () => open("details", "QR and collection ID", item.id)], ["Cancel", () => updateCollection({ ...item, status: "Draft" }, "Collection returned to draft") ] ]} />])}/></Panel><Panel>{selected ? <CollectionDetail state={state} record={selected} update={updateCollection} close={() => undefined} /> : <EmptyState title="No collection selected" description="Select a collection to view details." />}</Panel></div></div>;
}

function WeighbridgePage({ state, setSelectedId, open, updateCollection, setGradingForm }: { state: AppState; setSelectedId: (id: string) => void; open: (kind: ModalKind, title: string, id?: string) => void; updateCollection: (record: CollectionRecord, message?: string) => void; setGradingForm: (form: typeof emptyGradingForm) => void }) {
  const rows = state.collections.filter((item) => ["Collected", "Delivered", "Graded"].includes(item.status));
  return <div className="space-y-6"><PageHeader eyebrow="Weighbridge and grading" title="Incoming delivery grading" description="Gross weight, tare weight, grade, deductions, approval and receipt generation." actionLabel="Open Incoming" onAction={() => rows[0] ? open("details", "Incoming delivery", rows[0].id) : open("comingSoon", "No incoming deliveries")} /><Panel><DataTable headers={["ID", "Lorry", "Net", "Grade", "Status", "Actions"]} rows={rows.map((item) => [item.id, lorryName(state, item.lorryId), `${number.format(getNetWeight(item))} kg`, <StatusBadge key="g" status={item.grade}/>, <StatusBadge key="s" status={item.status}/>, <ActionGroup key="a" actions={[ ["Record", () => { setSelectedId(item.id); setGradingForm({ grossWeight: String(item.grossWeight || item.actualWeight + 6200), tareWeight: String(item.tareWeight || 6200), grade: item.grade === "Pending" ? "B" : item.grade, deductionPercent: String(item.deductionPercent || 2), moisturePercent: String(item.moisturePercent || 1), dirtPercent: String(item.dirtPercent || 0.5) }); open("grading", "Record grading", item.id); }], ["Approve", () => updateCollection({ ...item, status: "Approved" }, "Grading approved")], ["Receipt", () => open("voucher", "Weighbridge receipt", item.id)] ]} />])}/></Panel></div>;
}

function TransportPage({ state, open, persist, notify }: { state: AppState; open: (kind: ModalKind, title: string) => void; persist: (state: AppState, message?: string) => void; notify: (title: string, detail: string, tone?: Toast["tone"]) => void }) {
  const updateTrip = (lorry: Lorry) => persist({ ...state, lorries: state.lorries.map((item) => item.id === lorry.id ? { ...item, status: item.status === "On Trip" ? "Available" : "On Trip", trips: item.trips + 1, deliveredKg: item.deliveredKg + 4800, fuelCost: item.fuelCost + 180 } : item) }, `${lorry.plateNo} trip updated`);
  return <div className="space-y-6"><PageHeader eyebrow="Transport" title="Lorry and trip operations" description="Add lorry, add driver, assign driver, create trip and update delivery status." actionLabel="Add Lorry" onAction={() => open("lorry", "Add lorry")} /><div className="flex flex-wrap gap-2"><SmallButton onClick={() => open("lorry", "Add driver / lorry")}>Add Driver</SmallButton><SmallButton onClick={() => notify("Trip created", "A demo trip was prepared for dispatch.")}>Create Trip</SmallButton></div><div className="grid gap-5 md:grid-cols-3">{state.lorries.map((lorry) => <Panel key={lorry.id}><div className="flex items-start justify-between"><div><h3 className="text-lg font-semibold text-ink">{lorry.plateNo}</h3><p className="text-sm text-slate-500">{lorry.driver}</p></div><StatusBadge status={lorry.status}/></div><div className="mt-5 grid grid-cols-3 gap-3"><Metric label="Trips" value={String(lorry.trips)} /><Metric label="Delivered" value={`${number.format(lorry.deliveredKg/1000)} t`} /><Metric label="Fuel" value={currency.format(lorry.fuelCost)} /></div><ActionRow actions={[ ["Assign", () => open("lorry", "Assign driver")], ["Trip", () => updateTrip(lorry)], ["Details", () => notify("Trip details", `${lorry.plateNo} has ${lorry.trips} completed trips.`, "info")] ]} /></Panel>)}</div></div>;
}

function PaymentsPage({ state, setSelectedId, open, markPaid, updateCollection }: { state: AppState; setSelectedId: (id: string) => void; open: (kind: ModalKind, title: string, id?: string) => void; markPaid: (record: CollectionRecord) => void; updateCollection: (record: CollectionRecord, message?: string) => void }) {
  const [status, setStatus] = useState("All");
  const rows = state.collections.filter((item) => status === "All" || getPaymentStatus(item) === status);
  return <div className="space-y-6"><PageHeader eyebrow="Finance" title="Payment vouchers and billing" description="Payment calculation, processing, paid state, voucher and filters." actionLabel="Generate Voucher" onAction={() => rows[0] && open("voucher", "Payment voucher", rows[0].id)} /><FilterBar query="" setQuery={() => undefined} status={status} setStatus={setStatus} statuses={["All", "Pending", "Processing", "Paid"]} reset={() => setStatus("All")} /><Panel><DataTable headers={["Voucher", "Worker", "Payable", "Amount", "Payment", "Actions"]} rows={rows.map((item) => [item.id.replace("FFB", "PAY"), workerName(state, item.workerId), `${number.format(getPayableWeight(item))} kg`, currency.format(getPaymentAmount(item)), <StatusBadge key="p" status={getPaymentStatus(item)}/>, <ActionGroup key="a" actions={[ ["Processing", () => updateCollection({ ...item, status: "Approved" }, "Payment marked as processing")], ["Paid", () => markPaid(item)], ["Voucher", () => { setSelectedId(item.id); open("voucher", "Payment voucher", item.id); } ] ]} />])}/></Panel></div>;
}

function ReportsPage({ state, filters, setFilters, notify }: { state: AppState; filters: { estate: string; worker: string; status: string; date: string }; setFilters: (filters: { estate: string; worker: string; status: string; date: string }) => void; notify: (title: string, detail: string, tone?: Toast["tone"]) => void }) {
  const rows = state.collections.filter((item) => (filters.estate === "All" || item.estateId === filters.estate) && (filters.worker === "All" || item.workerId === filters.worker) && (filters.status === "All" || item.status === filters.status) && (!filters.date || item.date === filters.date));
  return <div className="space-y-6"><PageHeader eyebrow="Reports" title="Analytics and export centre" description="Date, estate, worker and status filters with polished export placeholders." /><Panel><div className="grid gap-3 md:grid-cols-5"><SelectField label="Estate" value={filters.estate} onChange={(v) => setFilters({ ...filters, estate: v })} options={[["All", "All estates"], ...state.estates.map((e) => [e.id, e.name] as [string, string])]} /><SelectField label="Worker" value={filters.worker} onChange={(v) => setFilters({ ...filters, worker: v })} options={[["All", "All workers"], ...state.workers.map((w) => [w.id, w.name] as [string, string])]} /><SelectField label="Status" value={filters.status} onChange={(v) => setFilters({ ...filters, status: v })} options={[["All", "All statuses"], ...statusSteps.map((s) => [s, s] as [string, string])]} /><InputField label="Date" type="date" value={filters.date} onChange={(v) => setFilters({ ...filters, date: v })} /><div className="flex items-end gap-2"><SmallButton onClick={() => setFilters({ estate: "All", worker: "All", status: "All", date: "" })}>Reset</SmallButton></div></div><div className="mt-4 flex flex-wrap gap-2"><SmallButton onClick={() => notify("PDF export ready", `${rows.length} records prepared as mock PDF.`)}><Download size={15}/>Export PDF</SmallButton><SmallButton onClick={() => notify("Excel export ready", `${rows.length} records prepared as mock Excel.`)}><Download size={15}/>Export Excel</SmallButton></div></Panel><Panel><DataTable headers={["Date", "Collection", "Estate", "Worker", "Weight", "Amount", "Status"]} rows={rows.map((item) => [shortDate(item.date), item.id, estateName(state, item.estateId), workerName(state, item.workerId), `${number.format(getNetWeight(item))} kg`, currency.format(getPaymentAmount(item)), <StatusBadge key="s" status={item.status}/>])} emptyText="No report records found" /></Panel></div>;
}

function SettingsPage({ role, state, open, notify }: { role: Role; state: AppState; open: (kind: ModalKind, title: string) => void; notify: (title: string, detail: string, tone?: Toast["tone"]) => void }) { return <div className="space-y-6"><PageHeader eyebrow="Admin settings" title="Company, permissions and rules" description="User management, role permissions, company profile and notification settings." actionLabel="Add User" onAction={() => open("user", "Add user")} /><div className="grid gap-5 lg:grid-cols-3"><Panel><ShieldCheck className="text-canopy-600"/><h3 className="mt-3 font-semibold text-ink">Role permissions</h3><p className="mt-2 text-sm text-slate-500">Current role: {role}. Menus adapt by responsibility.</p><Toggle label="Approve collections" notify={notify}/><Toggle label="Manage payments" notify={notify}/><Toggle label="Export reports" notify={notify}/></Panel><Panel><BadgeDollarSign className="text-canopy-600"/><h3 className="mt-3 font-semibold text-ink">FFB rates</h3><p className="mt-2 text-sm text-slate-500">Grade A RM760/t, B RM710/t, C RM650/t.</p><ActionRow actions={[ ["Edit rates", () => open("settings", "Edit FFB rates")], ["Save", () => notify("Settings saved", "Rate settings saved for demo.")] ]} /></Panel><Panel><Bell className="text-canopy-600"/><h3 className="mt-3 font-semibold text-ink">Company profile</h3><p className="mt-2 text-sm text-slate-500">{state.estates[0]?.owner ?? "Demo company"}</p><ActionRow actions={[ ["Edit profile", () => open("settings", "Company profile")], ["Notifications", () => notify("Notifications saved", "Notification settings updated.")] ]} /></Panel></div></div>; }

function CollectionDetail({ state, record, update, close }: { state: AppState; record: CollectionRecord; update: (record: CollectionRecord, message?: string) => void; close: () => void }) { return <div><div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between"><div><p className="text-sm font-semibold text-canopy-600">Collection ID</p><h3 className="mt-1 text-2xl font-semibold text-ink">{record.id}</h3><p className="mt-1 text-sm text-slate-500">{estateName(state, record.estateId)} - Block {record.block}</p></div><button className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center" onClick={() => update({ ...record, photo: "QR viewed and proof placeholder confirmed" }, "QR viewed")}><QrCode className="mx-auto text-canopy-700" size={38}/><p className="mt-2 text-xs font-semibold text-slate-500">View QR</p></button></div><div className="mt-5 grid gap-3 sm:grid-cols-3"><Metric label="Net weight" value={`${number.format(getNetWeight(record))} kg`} /><Metric label="Payable" value={`${number.format(getPayableWeight(record))} kg`} /><Metric label="Amount" value={currency.format(getPaymentAmount(record))} /></div><div className="mt-5"><Timeline items={statusSteps.map((step) => ({ title: step, detail: statusSteps.indexOf(step) <= statusSteps.indexOf(record.status) ? "Completed or current stage" : "Waiting for next approval", tone: statusSteps.indexOf(step) <= statusSteps.indexOf(record.status) ? "green" : "slate" }))} /></div><div className="mt-5 flex flex-wrap gap-2"><SmallButton onClick={() => update(nextCollectionStatus(record), "Collection status advanced")}>Update status</SmallButton><SmallButton onClick={() => update({ ...record, photo: "Proof uploaded placeholder" }, "Proof uploaded")}>Upload proof</SmallButton><SmallButton onClick={() => update({ ...record, status: "Collected" }, "Collection submitted")}>Submit</SmallButton><SmallButton onClick={close}>Close</SmallButton></div></div>; }

function EstateForm({ errors, submit, close }: { errors: Record<string,string>; submit: (e: FormEvent<HTMLFormElement>) => void; close: () => void }) { return <form className="space-y-3" onSubmit={submit}><InputField name="name" label="Estate name" defaultValue="Ladang Meranti" required /><InputField name="owner" label="Owner/company" defaultValue="Meranti Sawit Sdn Bhd" required /><InputField name="state" label="State" defaultValue="Johor" /><InputField name="district" label="District" defaultValue="Kota Tinggi" /><InputField name="supervisor" label="Supervisor" defaultValue="Zulhilmi Zain" /><div className="grid gap-3 md:grid-cols-2"><InputField name="hectares" label="Hectares" type="number" defaultValue="260" /><InputField name="palmAge" label="Palm age" type="number" defaultValue="7" /></div>{errors.estate && <ErrorText>{errors.estate}</ErrorText>}<FormActions close={close} /></form>; }
function WorkerForm({ state, errors, submit, close }: { state: AppState; errors: Record<string,string>; submit: (e: FormEvent<HTMLFormElement>) => void; close: () => void }) { return <form className="space-y-3" onSubmit={submit}><InputField name="name" label="Worker name" defaultValue="Hakimi Salleh" required /><SelectField name="role" label="Role" defaultValue="Harvester" options={[["Harvester","Harvester"],["Mandor","Mandor"],["Field Clerk","Field Clerk"],["Sprayer","Sprayer"],["Driver","Driver"]]} /><SelectField name="estateId" label="Estate" defaultValue={state.estates[0]?.id} options={state.estates.map((e) => [e.id,e.name])} /><InputField name="block" label="Block" defaultValue="A01" /><InputField name="phone" label="Phone" defaultValue="012-345 6789" />{errors.worker && <ErrorText>{errors.worker}</ErrorText>}<FormActions close={close} /></form>; }
function LorryForm({ errors, submit, close }: { errors: Record<string,string>; submit: (e: FormEvent<HTMLFormElement>) => void; close: () => void }) { return <form className="space-y-3" onSubmit={submit}><InputField name="plateNo" label="Plate number" defaultValue="JQP 8821" required /><InputField name="driver" label="Driver" defaultValue="Azri Hamid" />{errors.lorry && <ErrorText>{errors.lorry}</ErrorText>}<FormActions close={close} /></form>; }
function CollectionForm({ state, form, setForm, errors, submit, close }: { state: AppState; form: typeof emptyCollectionForm; setForm: (form: typeof emptyCollectionForm) => void; errors: Record<string,string>; submit: (e: FormEvent) => void; close: () => void }) { return <form className="space-y-3" onSubmit={submit}><SelectField label="Estate" value={form.estateId} onChange={(v) => setForm({ ...form, estateId: v })} options={state.estates.map((e) => [e.id,e.name])} /><InputField label="Block" value={form.block} onChange={(v) => setForm({ ...form, block: v })} /><SelectField label="Worker/team" value={form.workerId} onChange={(v) => setForm({ ...form, workerId: v })} options={state.workers.map((w) => [w.id,w.name])} /><SelectField label="Lorry" value={form.lorryId} onChange={(v) => setForm({ ...form, lorryId: v })} options={state.lorries.map((l) => [l.id,l.plateNo])} /><InputField label="Centre" value={form.centre} onChange={(v) => setForm({ ...form, centre: v })} /><div className="grid gap-3 md:grid-cols-3"><InputField label="Bunch count" type="number" value={form.bunchCount} onChange={(v) => setForm({ ...form, bunchCount: v })} /><InputField label="Estimated kg" type="number" value={form.estimatedWeight} onChange={(v) => setForm({ ...form, estimatedWeight: v })} /><InputField label="Actual kg" type="number" value={form.actualWeight} onChange={(v) => setForm({ ...form, actualWeight: v })} /></div>{errors.collection && <ErrorText>{errors.collection}</ErrorText>}<FormActions close={close} submitLabel="Save draft" /></form>; }
function GradingForm({ form, setForm, errors, save, close }: { form: typeof emptyGradingForm; setForm: (form: typeof emptyGradingForm) => void; errors: Record<string,string>; save: () => void; close: () => void }) { const net = Math.max(Number(form.grossWeight || 0) - Number(form.tareWeight || 0), 0); return <div className="space-y-3"><div className="grid gap-3 md:grid-cols-2"><InputField label="Gross weight" type="number" value={form.grossWeight} onChange={(v) => setForm({ ...form, grossWeight: v })} /><InputField label="Tare weight" type="number" value={form.tareWeight} onChange={(v) => setForm({ ...form, tareWeight: v })} /></div><Metric label="Calculated net weight" value={`${number.format(net)} kg`} /><SelectField label="Grade" value={form.grade} onChange={(v) => setForm({ ...form, grade: v })} options={[["A","A"],["B","B"],["C","C"],["Reject","Reject"]]} /><div className="grid gap-3 md:grid-cols-3"><InputField label="Deduction %" type="number" value={form.deductionPercent} onChange={(v) => setForm({ ...form, deductionPercent: v })} /><InputField label="Moisture %" type="number" value={form.moisturePercent} onChange={(v) => setForm({ ...form, moisturePercent: v })} /><InputField label="Dirt %" type="number" value={form.dirtPercent} onChange={(v) => setForm({ ...form, dirtPercent: v })} /></div>{errors.grading && <ErrorText>{errors.grading}</ErrorText>}<div className="flex justify-end gap-2"><SmallButton onClick={close}>Cancel</SmallButton><SmallButton onClick={save}><Save size={15}/>Save grading</SmallButton></div></div>; }
function Voucher({ record, state, close }: { record: CollectionRecord; state: AppState; close: () => void }) { return <div className="space-y-4"><Panel className="bg-canopy-50"><h3 className="text-lg font-semibold text-ink">Voucher {record.id.replace("FFB", "PAY")}</h3><p className="text-sm text-slate-500">{estateName(state, record.estateId)} - {workerName(state, record.workerId)}</p><div className="mt-4 grid gap-3 md:grid-cols-3"><Metric label="Payable weight" value={`${number.format(getPayableWeight(record))} kg`} /><Metric label="Rate" value={currency.format(record.rate)} /><Metric label="Amount" value={currency.format(getPaymentAmount(record))} /></div></Panel><SmallButton onClick={close}>Close receipt</SmallButton></div>; }
function UserForm({ close, notify }: { close: () => void; notify: (title: string, detail: string, tone?: Toast["tone"]) => void }) { return <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); notify("User added", "Demo user has been added to user management."); close(); }}><InputField label="Name" defaultValue="New Estate Admin" required /><InputField label="Email" type="email" defaultValue="admin@example.com" required /><SelectField label="Role" defaultValue="Estate Owner" options={demoAccounts.map((a) => [a.role, a.role])} /><FormActions close={close} /></form>; }
function SettingsForm({ close, notify }: { close: () => void; notify: (title: string, detail: string, tone?: Toast["tone"]) => void }) { return <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); notify("Settings saved", "Company profile and settings updated."); close(); }}><InputField label="Company name" defaultValue="Murni Agro Sdn Bhd" /><InputField label="Default FFB rate" type="number" defaultValue="710" /><Toggle label="Email notifications" notify={notify}/><Toggle label="WhatsApp alerts" notify={notify}/><FormActions close={close} /></form>; }

function Modal({ title, children, close }: { title: string; children: ReactNode; close: () => void }) { return <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/45 p-4" onMouseDown={close}><section className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-5 shadow-glow" onMouseDown={(event) => event.stopPropagation()}><div className="mb-4 flex items-center justify-between"><h2 className="text-xl font-semibold text-ink">{title}</h2><button className="rounded-xl border p-2" onClick={close} aria-label="Close modal"><X size={18}/></button></div>{children}</section></div>; }
function ConfirmDialog({ confirm, close }: { confirm: NonNullable<Confirm>; close: () => void }) { return <div className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/50 p-4"><section className="w-full max-w-md rounded-3xl bg-white p-5 shadow-glow"><h2 className="text-xl font-semibold text-ink">{confirm.title}</h2><p className="mt-2 text-sm text-slate-500">{confirm.detail}</p><div className="mt-5 flex justify-end gap-2"><SmallButton onClick={close}>Cancel</SmallButton><SmallButton onClick={confirm.action}>Confirm</SmallButton></div></section></div>; }
function Toasts({ items, dismiss }: { items: Toast[]; dismiss: (id: number) => void }) { return <div className="fixed right-4 top-4 z-[70] space-y-2">{items.map((item) => <button key={item.id} className="w-80 rounded-2xl border border-white/70 bg-white p-4 text-left shadow-glow" onClick={() => dismiss(item.id)}><p className="text-sm font-semibold text-ink">{item.title}</p><p className="mt-1 text-sm text-slate-500">{item.detail}</p></button>)}</div>; }
function ComingSoon({ title, close, notify }: { title: string; close: () => void; notify: (title: string, detail: string, tone?: Toast["tone"]) => void }) { return <div className="space-y-4"><EmptyState title={title} description="This polished placeholder confirms the control is intentionally wired for the next backend phase." /><div className="flex justify-end gap-2"><SmallButton onClick={() => { notify("Roadmap item saved", title, "info"); close(); }}>Save to roadmap</SmallButton><SmallButton onClick={close}>Close</SmallButton></div></div>; }
function ActivityList({ state, go }: { state: AppState; go: (page: PageKey) => void }) { return <div className="space-y-3">{state.activities.map((item) => <button className="w-full rounded-2xl border p-4 text-left hover:bg-canopy-50" key={item.id} onClick={() => go(item.title.includes("Payment") ? "payments" : item.title.includes("Weighbridge") ? "weighbridge" : "collections")}><p className="font-semibold text-ink">{item.title}</p><p className="text-sm text-slate-500">{item.detail}</p></button>)}</div>; }

function StatButton({ label, value, icon: Icon, onClick }: { label: string; value: string; icon: LucideIcon; onClick: () => void }) { return <button className="rounded-2xl border border-white/70 bg-white/85 p-5 text-left shadow-panel hover:-translate-y-0.5 hover:shadow-glow" onClick={onClick}><div className="flex items-start justify-between"><div><p className="text-sm text-slate-500">{label}</p><strong className="mt-3 block text-2xl font-semibold text-ink">{value}</strong></div><div className="rounded-2xl bg-canopy-50 p-3 text-canopy-700 ring-1 ring-canopy-100"><Icon size={20}/></div></div><p className="mt-4 text-sm text-canopy-700">View details</p></button>; }
function HeaderRow({ title, action, onAction }: { title: string; action: string; onAction: () => void }) { return <div className="mb-4 flex items-center justify-between gap-3"><h3 className="text-lg font-semibold text-ink">{title}</h3><button className="text-sm font-semibold text-canopy-700" onClick={onAction}>{action}</button></div>; }
function Metric({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl bg-slate-50 p-3"><p className="text-xs text-slate-500">{label}</p><p className="mt-1 text-sm font-semibold text-ink">{value}</p></div>; }
function ActionRow({ actions }: { actions: Array<[string, () => void]> }) { return <div className="mt-4 flex flex-wrap gap-2">{actions.map(([label, action]) => <SmallButton key={label} onClick={action}>{label}</SmallButton>)}</div>; }
function ActionGroup({ actions }: { actions: Array<[string, () => void]> }) { return <div className="flex flex-wrap gap-1">{actions.map(([label, action]) => <button key={label} className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-semibold hover:bg-canopy-50" onClick={action}>{label}</button>)}</div>; }
function SmallButton({ children, onClick }: { children: ReactNode; onClick: () => void }) { return <button type="button" className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-ink hover:border-canopy-300 hover:bg-canopy-50" onClick={onClick}>{children}</button>; }
function FilterBar({ query, setQuery, status, setStatus, statuses, reset }: { query: string; setQuery: (value: string) => void; status: string; setStatus: (value: string) => void; statuses: string[]; reset: () => void }) { return <Panel><div className="grid gap-3 md:grid-cols-[1fr_220px_auto]"><InputField label="Search" value={query} onChange={setQuery} /><SelectField label="Status" value={status} onChange={setStatus} options={statuses.map((item) => [item, item])} /><div className="flex items-end"><SmallButton onClick={reset}><RotateCcw size={15}/>Reset</SmallButton></div></div></Panel>; }
function InputField({ label, value, defaultValue, onChange, type = "text", name, required }: { label: string; value?: string; defaultValue?: string; onChange?: (value: string) => void; type?: string; name?: string; required?: boolean }) { return <label className="block text-sm font-semibold text-slate-600">{label}<input name={name} required={required} className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-canopy-400 focus:ring-2 focus:ring-canopy-100" type={type} value={value} defaultValue={defaultValue} onChange={(event) => onChange?.(event.target.value)} /></label>; }
function SelectField({ label, value, defaultValue, onChange, options, name }: { label: string; value?: string; defaultValue?: string; onChange?: (value: string) => void; options: Array<[string, string]>; name?: string }) { return <label className="block text-sm font-semibold text-slate-600">{label}<select name={name} className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-canopy-400 focus:ring-2 focus:ring-canopy-100" value={value} defaultValue={defaultValue} onChange={(event) => onChange?.(event.target.value)}>{options.map(([optionValue, labelText]) => <option key={optionValue} value={optionValue}>{labelText}</option>)}</select></label>; }
function Toggle({ label, notify }: { label: string; notify: (title: string, detail: string, tone?: Toast["tone"]) => void }) { const [enabled, setEnabled] = useState(true); return <button className="mt-3 flex w-full items-center justify-between rounded-2xl border border-slate-100 bg-white p-3 text-left" onClick={() => { setEnabled(!enabled); notify("Setting updated", `${label} ${!enabled ? "enabled" : "disabled"}.`, "info"); }}><span className="text-sm font-semibold text-ink">{label}</span><span className={`h-6 w-11 rounded-full p-1 ${enabled ? "bg-canopy-600" : "bg-slate-200"}`}><span className={`block h-4 w-4 rounded-full bg-white transition ${enabled ? "translate-x-5" : ""}`} /></span></button>; }
function FormActions({ close, submitLabel = "Save" }: { close: () => void; submitLabel?: string }) { return <div className="flex justify-end gap-2 pt-2"><SmallButton onClick={close}>Cancel</SmallButton><button className="inline-flex items-center gap-1 rounded-xl bg-canopy-600 px-4 py-2 text-sm font-semibold text-white hover:bg-canopy-500" type="submit"><Save size={15}/>{submitLabel}</button></div>; }
function ErrorText({ children }: { children: ReactNode }) { return <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{children}</p>; }
