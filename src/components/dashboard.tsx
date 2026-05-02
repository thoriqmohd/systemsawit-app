"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  BarChart3,
  CalendarCheck,
  ClipboardList,
  Leaf,
  MapPinned,
  Plus,
  QrCode,
  Save,
  Sprout,
  Truck,
  Users
} from "lucide-react";
import { hasSupabaseConfig } from "@/lib/supabase";

type ModuleKey = "dashboard" | "ladang" | "pekerja" | "kehadiran" | "tuaian" | "kesihatan" | "tph" | "penghantaran";

type Estate = {
  id: string;
  name: string;
  state: string;
  block: string;
  hectares: number;
  palmCount: number;
  plantedYear: number;
  latitude: string;
  longitude: string;
};

type Worker = {
  id: string;
  name: string;
  role: string;
  team: string;
  phone: string;
  status: string;
};

type Attendance = {
  id: string;
  date: string;
  workerId: string;
  block: string;
  status: string;
  checkIn: string;
  gps: string;
};

type Harvest = {
  id: string;
  date: string;
  block: string;
  workerId: string;
  bunches: number;
  weightKg: number;
  status: string;
};

type Health = {
  id: string;
  date: string;
  block: string;
  issue: string;
  severity: string;
  action: string;
  status: string;
};

type CollectionPoint = {
  id: string;
  code: string;
  block: string;
  name: string;
  gps: string;
  status: string;
};

type Delivery = {
  id: string;
  date: string;
  driver: string;
  lorry: string;
  mill: string;
  weightKg: number;
  pricePerTonne: number;
  status: string;
};

type AppData = {
  estates: Estate[];
  workers: Worker[];
  attendance: Attendance[];
  harvests: Harvest[];
  health: Health[];
  tph: CollectionPoint[];
  deliveries: Delivery[];
};

const today = new Date().toISOString().slice(0, 10);
const storageKey = "systemsawit-malaysia-mvp-v1";

const initialData: AppData = {
  estates: [
    {
      id: "estate-1",
      name: "Ladang Seri Murni",
      state: "Johor",
      block: "B12",
      hectares: 18.5,
      palmCount: 2440,
      plantedYear: 2018,
      latitude: "2.03011",
      longitude: "103.31845"
    },
    {
      id: "estate-2",
      name: "Ladang Bukit Aman",
      state: "Pahang",
      block: "C04",
      hectares: 22,
      palmCount: 2980,
      plantedYear: 2016,
      latitude: "3.80770",
      longitude: "102.54210"
    }
  ],
  workers: [
    { id: "worker-1", name: "Amin Abdullah", role: "Mandor", team: "Pasukan A", phone: "012-555 0198", status: "Aktif" },
    { id: "worker-2", name: "Ravi Kumar", role: "Penuai", team: "Pasukan A", phone: "011-234 7781", status: "Aktif" },
    { id: "worker-3", name: "Siti Nora", role: "Kerani Ladang", team: "Pentadbiran", phone: "013-890 4412", status: "Aktif" }
  ],
  attendance: [
    { id: "att-1", date: today, workerId: "worker-1", block: "B12", status: "Hadir", checkIn: "07:05", gps: "2.03011, 103.31845" },
    { id: "att-2", date: today, workerId: "worker-2", block: "B12", status: "Hadir", checkIn: "07:12", gps: "2.03015, 103.31839" }
  ],
  harvests: [
    { id: "harvest-1", date: today, block: "B12", workerId: "worker-2", bunches: 420, weightKg: 8600, status: "Direkod" },
    { id: "harvest-2", date: today, block: "C04", workerId: "worker-1", bunches: 315, weightKg: 6100, status: "Menunggu timbang" }
  ],
  health: [
    { id: "health-1", date: today, block: "B12", issue: "Serangan ulat bungkus", severity: "Tinggi", action: "Jadual semburan", status: "Terbuka" },
    { id: "health-2", date: today, block: "C04", issue: "Parit tersumbat", severity: "Sederhana", action: "Kerja pembersihan", status: "Dalam tindakan" }
  ],
  tph: [
    { id: "tph-1", code: "TPH-B12-01", block: "B12", name: "TPH Simpang Utara", gps: "2.03011, 103.31845", status: "Aktif" },
    { id: "tph-2", code: "TPH-C04-03", block: "C04", name: "TPH Jalan Kilang", gps: "3.80770, 102.54210", status: "Aktif" }
  ],
  deliveries: [
    { id: "del-1", date: today, driver: "Faizal", lorry: "JTN 4821", mill: "Kilang Sawit Selatan", weightKg: 14200, pricePerTonne: 710, status: "Dihantar" }
  ]
};

const modules: Array<{ key: ModuleKey; label: string; icon: typeof BarChart3 }> = [
  { key: "dashboard", label: "Dashboard", icon: BarChart3 },
  { key: "ladang", label: "Ladang & Blok", icon: MapPinned },
  { key: "pekerja", label: "Pekerja", icon: Users },
  { key: "kehadiran", label: "Kehadiran", icon: CalendarCheck },
  { key: "tuaian", label: "Tuaian BTS", icon: ClipboardList },
  { key: "kesihatan", label: "Kesihatan", icon: Leaf },
  { key: "tph", label: "TPH QR", icon: QrCode },
  { key: "penghantaran", label: "Penghantaran", icon: Truck }
];

const money = new Intl.NumberFormat("ms-MY", { style: "currency", currency: "MYR", maximumFractionDigits: 0 });
const number = new Intl.NumberFormat("ms-MY");

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function loadData(): AppData {
  if (typeof window === "undefined") return initialData;

  const stored = window.localStorage.getItem(storageKey);
  if (!stored) return initialData;

  try {
    return { ...initialData, ...JSON.parse(stored) };
  } catch {
    return initialData;
  }
}

function workerName(workers: Worker[], id: string) {
  return workers.find((worker) => worker.id === id)?.name ?? "Tidak dipilih";
}

export function Dashboard() {
  const [active, setActive] = useState<ModuleKey>("dashboard");
  const [data, setData] = useState<AppData>(initialData);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setData(loadData());
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) window.localStorage.setItem(storageKey, JSON.stringify(data));
  }, [data, ready]);

  const totals = useMemo(() => {
    const totalWeightKg = data.harvests.reduce((sum, item) => sum + item.weightKg, 0);
    const revenue = data.deliveries.reduce((sum, item) => sum + (item.weightKg / 1000) * item.pricePerTonne, 0);
    const presentToday = data.attendance.filter((item) => item.date === today && item.status === "Hadir").length;
    const activeIssues = data.health.filter((item) => item.status !== "Selesai").length;

    return {
      totalWeightKg,
      revenue,
      presentToday,
      activeIssues,
      attendanceRate: data.workers.length ? Math.round((presentToday / data.workers.length) * 100) : 0
    };
  }, [data]);

  function updateData(next: Partial<AppData>) {
    setData((current) => ({ ...current, ...next }));
  }

  return (
    <main className="min-h-screen bg-[#f5f7f3]">
      <div className="mx-auto flex max-w-7xl gap-5 px-4 py-5 lg:px-6">
        <aside className="hidden w-64 shrink-0 rounded-lg border border-leaf-100 bg-white p-4 shadow-panel lg:block">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-md bg-leaf-600 text-white">
              <Sprout size={22} />
            </div>
            <div>
              <p className="text-sm text-slate-500">Malaysia MVP</p>
              <h1 className="text-lg font-semibold text-ink">SistemSawit</h1>
            </div>
          </div>
          <nav className="space-y-1">
            {modules.map(({ key, label, icon: Icon }) => (
              <button
                className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm font-medium ${active === key ? "bg-leaf-50 text-leaf-900" : "text-slate-600 hover:bg-slate-50"}`}
                key={key}
                onClick={() => setActive(key)}
              >
                <Icon size={17} />
                {label}
              </button>
            ))}
          </nav>
        </aside>

        <section className="min-w-0 flex-1">
          <header className="mb-5 rounded-lg border border-leaf-100 bg-white px-5 py-4 shadow-panel">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-medium text-leaf-600">app.sistemsawit.com</p>
                <h2 className="text-2xl font-semibold tracking-normal text-ink">Pengurusan ladang kelapa sawit</h2>
                <p className="mt-1 max-w-3xl text-sm text-slate-500">Versi Malaysia untuk rekod pekerja, kehadiran, lokasi lot tanaman, kesihatan tanaman, tuaian BTS/FFB, TPH dan penghantaran ke kilang.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className={`rounded-md px-3 py-2 text-sm font-medium ${hasSupabaseConfig ? "bg-leaf-50 text-leaf-700" : "bg-amber-50 text-amber-700"}`}>
                  {hasSupabaseConfig ? "Supabase connected" : "Local MVP"}
                </span>
                <span className="rounded-md bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700">Data disimpan di browser</span>
              </div>
            </div>
            <div className="mt-4 flex gap-2 overflow-x-auto pb-1 lg:hidden">
              {modules.map(({ key, label }) => (
                <button
                  className={`shrink-0 rounded-md px-3 py-2 text-sm font-medium ${active === key ? "bg-leaf-600 text-white" : "bg-slate-100 text-slate-700"}`}
                  key={key}
                  onClick={() => setActive(key)}
                >
                  {label}
                </button>
              ))}
            </div>
          </header>

          {active === "dashboard" && <DashboardPanel data={data} totals={totals} setActive={setActive} />}
          {active === "ladang" && <EstatePanel estates={data.estates} updateData={updateData} />}
          {active === "pekerja" && <WorkerPanel workers={data.workers} updateData={updateData} />}
          {active === "kehadiran" && <AttendancePanel attendance={data.attendance} estates={data.estates} workers={data.workers} updateData={updateData} />}
          {active === "tuaian" && <HarvestPanel harvests={data.harvests} estates={data.estates} workers={data.workers} updateData={updateData} />}
          {active === "kesihatan" && <HealthPanel health={data.health} estates={data.estates} updateData={updateData} />}
          {active === "tph" && <TphPanel tph={data.tph} estates={data.estates} updateData={updateData} />}
          {active === "penghantaran" && <DeliveryPanel deliveries={data.deliveries} updateData={updateData} />}
        </section>
      </div>
    </main>
  );
}

function DashboardPanel({ data, totals, setActive }: { data: AppData; totals: { totalWeightKg: number; revenue: number; presentToday: number; activeIssues: number; attendanceRate: number }; setActive: (key: ModuleKey) => void }) {
  const cards = [
    { label: "Hasil BTS direkod", value: `${number.format(totals.totalWeightKg / 1000)} t`, detail: `${number.format(data.harvests.reduce((sum, item) => sum + item.bunches, 0))} tandan` },
    { label: "Kehadiran hari ini", value: `${totals.attendanceRate}%`, detail: `${totals.presentToday}/${data.workers.length} pekerja hadir` },
    { label: "Anggaran jualan", value: money.format(totals.revenue), detail: `${data.deliveries.length} rekod penghantaran` },
    { label: "Isu tanaman aktif", value: `${totals.activeIssues}`, detail: "Perlu tindakan mandor/agronomi" }
  ];

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div className="rounded-lg border border-leaf-100 bg-white p-5 shadow-panel" key={card.label}>
            <p className="text-sm text-slate-500">{card.label}</p>
            <strong className="mt-3 block text-2xl font-semibold text-ink">{card.value}</strong>
            <p className="mt-2 text-sm text-slate-500">{card.detail}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.35fr_1fr]">
        <section className="rounded-lg border border-leaf-100 bg-white p-5 shadow-panel">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-ink">Rekod tuaian terkini</h3>
            <button className="rounded-md bg-leaf-600 px-3 py-2 text-sm font-medium text-white" onClick={() => setActive("tuaian")}>Tambah tuaian</button>
          </div>
          <DataTable
            headers={["Tarikh", "Blok", "Pekerja", "Tandan", "Berat", "Status"]}
            rows={data.harvests.slice(0, 5).map((item) => [item.date, item.block, workerName(data.workers, item.workerId), number.format(item.bunches), `${number.format(item.weightKg)} kg`, item.status])}
          />
        </section>

        <section className="rounded-lg border border-leaf-100 bg-white p-5 shadow-panel">
          <h3 className="text-lg font-semibold text-ink">Tindakan pantas</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            {[
              ["Daftar ladang/blok", "ladang", MapPinned],
              ["Rekod kehadiran", "kehadiran", CalendarCheck],
              ["Lapor kesihatan", "kesihatan", Leaf],
              ["Daftar TPH QR", "tph", QrCode]
            ].map(([label, key, Icon]) => {
              const ActionIcon = Icon as typeof MapPinned;
              return (
                <button className="flex items-center gap-3 rounded-md border border-slate-200 px-4 py-3 text-left text-sm font-medium text-ink hover:border-leaf-300 hover:bg-leaf-50" key={label as string} onClick={() => setActive(key as ModuleKey)}>
                  <ActionIcon className="text-leaf-600" size={18} />
                  {label as string}
                </button>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}

function EstatePanel({ estates, updateData }: { estates: Estate[]; updateData: (next: Partial<AppData>) => void }) {
  const [form, setForm] = useState({ name: "", state: "Johor", block: "", hectares: "", palmCount: "", plantedYear: "", latitude: "", longitude: "" });

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!form.name || !form.block) return;
    updateData({
      estates: [
        { id: makeId("estate"), name: form.name, state: form.state, block: form.block, hectares: Number(form.hectares || 0), palmCount: Number(form.palmCount || 0), plantedYear: Number(form.plantedYear || 0), latitude: form.latitude, longitude: form.longitude },
        ...estates
      ]
    });
    setForm({ name: "", state: "Johor", block: "", hectares: "", palmCount: "", plantedYear: "", latitude: "", longitude: "" });
  }

  return <ModuleShell title="Ladang, blok dan lokasi tanaman" description="Daftar ladang, blok/lot, keluasan hektar, jumlah pokok dan koordinat GPS.">
    <form className="grid gap-3 md:grid-cols-4" onSubmit={submit}>
      <Input label="Nama ladang" value={form.name} onChange={(name) => setForm({ ...form, name })} />
      <Input label="Negeri" value={form.state} onChange={(state) => setForm({ ...form, state })} />
      <Input label="Kod blok/lot" value={form.block} onChange={(block) => setForm({ ...form, block })} />
      <Input label="Hektar" type="number" value={form.hectares} onChange={(hectares) => setForm({ ...form, hectares })} />
      <Input label="Jumlah pokok" type="number" value={form.palmCount} onChange={(palmCount) => setForm({ ...form, palmCount })} />
      <Input label="Tahun tanam" type="number" value={form.plantedYear} onChange={(plantedYear) => setForm({ ...form, plantedYear })} />
      <Input label="Latitud" value={form.latitude} onChange={(latitude) => setForm({ ...form, latitude })} />
      <Input label="Longitud" value={form.longitude} onChange={(longitude) => setForm({ ...form, longitude })} />
      <SubmitButton label="Simpan blok" />
    </form>
    <DataTable headers={["Ladang", "Negeri", "Blok", "Hektar", "Pokok", "GPS"]} rows={estates.map((item) => [item.name, item.state, item.block, number.format(item.hectares), number.format(item.palmCount), `${item.latitude}, ${item.longitude}`])} />
  </ModuleShell>;
}

function WorkerPanel({ workers, updateData }: { workers: Worker[]; updateData: (next: Partial<AppData>) => void }) {
  const [form, setForm] = useState({ name: "", role: "Penuai", team: "", phone: "", status: "Aktif" });

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!form.name) return;
    updateData({ workers: [{ id: makeId("worker"), ...form }, ...workers] });
    setForm({ name: "", role: "Penuai", team: "", phone: "", status: "Aktif" });
  }

  return <ModuleShell title="Pekerja, mandor dan pasukan" description="Rekod pekerja ladang, pasukan kerja, mandor dan status aktif.">
    <form className="grid gap-3 md:grid-cols-5" onSubmit={submit}>
      <Input label="Nama pekerja" value={form.name} onChange={(name) => setForm({ ...form, name })} />
      <Select label="Peranan" value={form.role} options={["Mandor", "Penuai", "Kerani Ladang", "Pemandu", "Penyelia"]} onChange={(role) => setForm({ ...form, role })} />
      <Input label="Pasukan" value={form.team} onChange={(team) => setForm({ ...form, team })} />
      <Input label="Telefon" value={form.phone} onChange={(phone) => setForm({ ...form, phone })} />
      <Select label="Status" value={form.status} options={["Aktif", "Cuti", "Tidak Aktif"]} onChange={(status) => setForm({ ...form, status })} />
      <SubmitButton label="Simpan pekerja" />
    </form>
    <DataTable headers={["Nama", "Peranan", "Pasukan", "Telefon", "Status"]} rows={workers.map((item) => [item.name, item.role, item.team, item.phone, item.status])} />
  </ModuleShell>;
}

function AttendancePanel({ attendance, workers, estates, updateData }: { attendance: Attendance[]; workers: Worker[]; estates: Estate[]; updateData: (next: Partial<AppData>) => void }) {
  const [form, setForm] = useState({ date: today, workerId: workers[0]?.id ?? "", block: estates[0]?.block ?? "", status: "Hadir", checkIn: "07:00", gps: "" });

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!form.workerId) return;
    updateData({ attendance: [{ id: makeId("att"), ...form }, ...attendance] });
  }

  return <ModuleShell title="Kehadiran dengan bukti lokasi" description="Rekod kehadiran harian pekerja, blok kerja, masa masuk dan lokasi GPS.">
    <form className="grid gap-3 md:grid-cols-6" onSubmit={submit}>
      <Input label="Tarikh" type="date" value={form.date} onChange={(date) => setForm({ ...form, date })} />
      <Select label="Pekerja" value={form.workerId} options={workers.map((item) => item.id)} labels={Object.fromEntries(workers.map((item) => [item.id, item.name]))} onChange={(workerId) => setForm({ ...form, workerId })} />
      <Select label="Blok" value={form.block} options={estates.map((item) => item.block)} onChange={(block) => setForm({ ...form, block })} />
      <Select label="Status" value={form.status} options={["Hadir", "Cuti", "Tidak Hadir", "Lewat"]} onChange={(status) => setForm({ ...form, status })} />
      <Input label="Masa masuk" type="time" value={form.checkIn} onChange={(checkIn) => setForm({ ...form, checkIn })} />
      <Input label="GPS" value={form.gps} onChange={(gps) => setForm({ ...form, gps })} />
      <SubmitButton label="Simpan kehadiran" />
    </form>
    <DataTable headers={["Tarikh", "Pekerja", "Blok", "Status", "Masa", "GPS"]} rows={attendance.map((item) => [item.date, workerName(workers, item.workerId), item.block, item.status, item.checkIn, item.gps])} />
  </ModuleShell>;
}

function HarvestPanel({ harvests, workers, estates, updateData }: { harvests: Harvest[]; workers: Worker[]; estates: Estate[]; updateData: (next: Partial<AppData>) => void }) {
  const [form, setForm] = useState({ date: today, block: estates[0]?.block ?? "", workerId: workers[0]?.id ?? "", bunches: "", weightKg: "", status: "Direkod" });

  function submit(event: FormEvent) {
    event.preventDefault();
    updateData({ harvests: [{ id: makeId("harvest"), date: form.date, block: form.block, workerId: form.workerId, bunches: Number(form.bunches || 0), weightKg: Number(form.weightKg || 0), status: form.status }, ...harvests] });
    setForm({ ...form, bunches: "", weightKg: "" });
  }

  return <ModuleShell title="Rekod tuaian BTS/FFB" description="Rekod jumlah tandan, anggaran/sebenar berat dan status kutipan mengikut blok dan pekerja.">
    <form className="grid gap-3 md:grid-cols-6" onSubmit={submit}>
      <Input label="Tarikh" type="date" value={form.date} onChange={(date) => setForm({ ...form, date })} />
      <Select label="Blok" value={form.block} options={estates.map((item) => item.block)} onChange={(block) => setForm({ ...form, block })} />
      <Select label="Pekerja" value={form.workerId} options={workers.map((item) => item.id)} labels={Object.fromEntries(workers.map((item) => [item.id, item.name]))} onChange={(workerId) => setForm({ ...form, workerId })} />
      <Input label="Tandan" type="number" value={form.bunches} onChange={(bunches) => setForm({ ...form, bunches })} />
      <Input label="Berat kg" type="number" value={form.weightKg} onChange={(weightKg) => setForm({ ...form, weightKg })} />
      <Select label="Status" value={form.status} options={["Direkod", "Menunggu timbang", "Dihantar", "Disahkan"]} onChange={(status) => setForm({ ...form, status })} />
      <SubmitButton label="Simpan tuaian" />
    </form>
    <DataTable headers={["Tarikh", "Blok", "Pekerja", "Tandan", "Berat", "Status"]} rows={harvests.map((item) => [item.date, item.block, workerName(workers, item.workerId), number.format(item.bunches), `${number.format(item.weightKg)} kg`, item.status])} />
  </ModuleShell>;
}

function HealthPanel({ health, estates, updateData }: { health: Health[]; estates: Estate[]; updateData: (next: Partial<AppData>) => void }) {
  const [form, setForm] = useState({ date: today, block: estates[0]?.block ?? "", issue: "", severity: "Sederhana", action: "", status: "Terbuka" });

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!form.issue) return;
    updateData({ health: [{ id: makeId("health"), ...form }, ...health] });
    setForm({ ...form, issue: "", action: "" });
  }

  return <ModuleShell title="Kesihatan tanaman dan tindakan susulan" description="Rekod penyakit, perosak, parit, baja dan isu agronomi mengikut blok.">
    <form className="grid gap-3 md:grid-cols-6" onSubmit={submit}>
      <Input label="Tarikh" type="date" value={form.date} onChange={(date) => setForm({ ...form, date })} />
      <Select label="Blok" value={form.block} options={estates.map((item) => item.block)} onChange={(block) => setForm({ ...form, block })} />
      <Input label="Isu" value={form.issue} onChange={(issue) => setForm({ ...form, issue })} />
      <Select label="Tahap" value={form.severity} options={["Rendah", "Sederhana", "Tinggi", "Kritikal"]} onChange={(severity) => setForm({ ...form, severity })} />
      <Input label="Tindakan" value={form.action} onChange={(action) => setForm({ ...form, action })} />
      <Select label="Status" value={form.status} options={["Terbuka", "Dalam tindakan", "Selesai"]} onChange={(status) => setForm({ ...form, status })} />
      <SubmitButton label="Simpan laporan" />
    </form>
    <DataTable headers={["Tarikh", "Blok", "Isu", "Tahap", "Tindakan", "Status"]} rows={health.map((item) => [item.date, item.block, item.issue, item.severity, item.action, item.status])} />
  </ModuleShell>;
}

function TphPanel({ tph, estates, updateData }: { tph: CollectionPoint[]; estates: Estate[]; updateData: (next: Partial<AppData>) => void }) {
  const [form, setForm] = useState({ code: "", block: estates[0]?.block ?? "", name: "", gps: "", status: "Aktif" });

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!form.code) return;
    updateData({ tph: [{ id: makeId("tph"), ...form }, ...tph] });
    setForm({ code: "", block: form.block, name: "", gps: "", status: "Aktif" });
  }

  return <ModuleShell title="TPH dan QR collection point" description="Daftar Tempat Pengumpulan Hasil dengan kod QR, blok, lokasi dan status aktif.">
    <form className="grid gap-3 md:grid-cols-5" onSubmit={submit}>
      <Input label="Kod QR/TPH" value={form.code} onChange={(code) => setForm({ ...form, code })} />
      <Select label="Blok" value={form.block} options={estates.map((item) => item.block)} onChange={(block) => setForm({ ...form, block })} />
      <Input label="Nama lokasi" value={form.name} onChange={(name) => setForm({ ...form, name })} />
      <Input label="GPS" value={form.gps} onChange={(gps) => setForm({ ...form, gps })} />
      <Select label="Status" value={form.status} options={["Aktif", "Tutup", "Perlu semak"]} onChange={(status) => setForm({ ...form, status })} />
      <SubmitButton label="Simpan TPH" />
    </form>
    <DataTable headers={["Kod", "Blok", "Nama", "GPS", "Status"]} rows={tph.map((item) => [item.code, item.block, item.name, item.gps, item.status])} />
  </ModuleShell>;
}

function DeliveryPanel({ deliveries, updateData }: { deliveries: Delivery[]; updateData: (next: Partial<AppData>) => void }) {
  const [form, setForm] = useState({ date: today, driver: "", lorry: "", mill: "", weightKg: "", pricePerTonne: "", status: "Dihantar" });

  function submit(event: FormEvent) {
    event.preventDefault();
    updateData({ deliveries: [{ id: makeId("delivery"), date: form.date, driver: form.driver, lorry: form.lorry, mill: form.mill, weightKg: Number(form.weightKg || 0), pricePerTonne: Number(form.pricePerTonne || 0), status: form.status }, ...deliveries] });
    setForm({ ...form, driver: "", lorry: "", mill: "", weightKg: "", pricePerTonne: "" });
  }

  return <ModuleShell title="Penghantaran ke kilang sawit" description="Rekod lori, pemandu, kilang, berat dan anggaran nilai jualan BTS.">
    <form className="grid gap-3 md:grid-cols-7" onSubmit={submit}>
      <Input label="Tarikh" type="date" value={form.date} onChange={(date) => setForm({ ...form, date })} />
      <Input label="Pemandu" value={form.driver} onChange={(driver) => setForm({ ...form, driver })} />
      <Input label="No lori" value={form.lorry} onChange={(lorry) => setForm({ ...form, lorry })} />
      <Input label="Kilang" value={form.mill} onChange={(mill) => setForm({ ...form, mill })} />
      <Input label="Berat kg" type="number" value={form.weightKg} onChange={(weightKg) => setForm({ ...form, weightKg })} />
      <Input label="RM/tan" type="number" value={form.pricePerTonne} onChange={(pricePerTonne) => setForm({ ...form, pricePerTonne })} />
      <Select label="Status" value={form.status} options={["Dihantar", "Diterima", "Disahkan", "Ditolak"]} onChange={(status) => setForm({ ...form, status })} />
      <SubmitButton label="Simpan DO" />
    </form>
    <DataTable headers={["Tarikh", "Pemandu", "Lori", "Kilang", "Berat", "Nilai", "Status"]} rows={deliveries.map((item) => [item.date, item.driver, item.lorry, item.mill, `${number.format(item.weightKg)} kg`, money.format((item.weightKg / 1000) * item.pricePerTonne), item.status])} />
  </ModuleShell>;
}

function ModuleShell({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return <section className="space-y-5 rounded-lg border border-leaf-100 bg-white p-5 shadow-panel">
    <div>
      <h3 className="text-xl font-semibold text-ink">{title}</h3>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
    </div>
    {children}
  </section>;
}

function Input({ label, value, onChange, type = "text" }: { label: string; value: string; type?: string; onChange: (value: string) => void }) {
  return <label className="block text-sm font-medium text-slate-600">
    {label}
    <input className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-leaf-500 focus:ring-2 focus:ring-leaf-100" type={type} value={value} onChange={(event) => onChange(event.target.value)} />
  </label>;
}

function Select({ label, value, options, labels, onChange }: { label: string; value: string; options: string[]; labels?: Record<string, string>; onChange: (value: string) => void }) {
  return <label className="block text-sm font-medium text-slate-600">
    {label}
    <select className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-leaf-500 focus:ring-2 focus:ring-leaf-100" value={value} onChange={(event) => onChange(event.target.value)}>
      {options.map((option) => <option key={option} value={option}>{labels?.[option] ?? option}</option>)}
    </select>
  </label>;
}

function SubmitButton({ label }: { label: string }) {
  return <button className="inline-flex h-10 items-center justify-center gap-2 self-end rounded-md bg-leaf-600 px-4 text-sm font-semibold text-white hover:bg-leaf-500" type="submit">
    <Save size={16} />
    {label}
  </button>;
}

function DataTable({ headers, rows }: { headers: string[]; rows: Array<Array<string | number>> }) {
  return <div className="overflow-x-auto rounded-lg border border-slate-100">
    <table className="w-full min-w-[720px] border-collapse text-left text-sm">
      <thead className="bg-slate-50 text-slate-500">
        <tr>{headers.map((header) => <th className="px-4 py-3 font-medium" key={header}>{header}</th>)}</tr>
      </thead>
      <tbody>
        {rows.length ? rows.map((row, index) => (
          <tr className="border-t border-slate-100" key={index}>
            {row.map((cell, cellIndex) => <td className="px-4 py-3 text-slate-700" key={`${index}-${cellIndex}`}>{cell}</td>)}
          </tr>
        )) : <tr><td className="px-4 py-8 text-center text-slate-400" colSpan={headers.length}>Belum ada rekod.</td></tr>}
      </tbody>
    </table>
  </div>;
}
