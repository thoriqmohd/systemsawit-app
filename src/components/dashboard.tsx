import { Activity, BarChart3, Bell, CalendarCheck, ClipboardList, Leaf, MapPinned, Users } from "lucide-react";
import { cropHealth, harvestRows, navigation, stats } from "@/lib/demo-data";
import { hasSupabaseConfig } from "@/lib/supabase";

const quickActions = [
  { label: "Rekod kehadiran", icon: CalendarCheck },
  { label: "Tambah hasil tuaian", icon: ClipboardList },
  { label: "Lapor kesihatan tanaman", icon: Leaf },
  { label: "Daftar lot tanaman", icon: MapPinned }
];

export function Dashboard() {
  return (
    <main className="min-h-screen bg-[#f5f7f3]">
      <div className="mx-auto flex max-w-7xl gap-6 px-5 py-6 lg:px-8">
        <aside className="hidden w-64 shrink-0 rounded-lg border border-leaf-100 bg-white p-4 shadow-panel lg:block">
          <div className="mb-7 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-md bg-leaf-600 text-white">
              <Leaf size={22} />
            </div>
            <div>
              <p className="text-sm text-slate-500">SaaS Operasi</p>
              <h1 className="text-lg font-semibold">SistemSawit</h1>
            </div>
          </div>
          <nav className="space-y-1">
            {navigation.map((item) => (
              <a
                className={`block rounded-md px-3 py-2 text-sm font-medium ${item === "Dashboard" ? "bg-leaf-50 text-leaf-900" : "text-slate-600 hover:bg-slate-50"}`}
                href="#"
                key={item}
              >
                {item}
              </a>
            ))}
          </nav>
        </aside>

        <section className="min-w-0 flex-1">
          <header className="mb-6 flex flex-col gap-4 rounded-lg border border-leaf-100 bg-white px-5 py-4 shadow-panel md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-medium text-leaf-600">app.sistemsawit.com</p>
              <h2 className="text-2xl font-semibold tracking-normal text-ink">Pusat operasi ladang</h2>
              <p className="mt-1 text-sm text-slate-500">Pantau pekerja, lot tanaman, kesihatan pokok, dan hasil kutipan dalam satu tempat.</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`rounded-md px-3 py-2 text-sm font-medium ${hasSupabaseConfig ? "bg-leaf-50 text-leaf-700" : "bg-amber-50 text-amber-700"}`}>
                {hasSupabaseConfig ? "Supabase connected" : "Demo mode"}
              </span>
              <button className="rounded-md border border-slate-200 bg-white p-2 text-slate-600" aria-label="Notifikasi">
                <Bell size={19} />
              </button>
            </div>
          </header>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => (
              <div className="rounded-lg border border-leaf-100 bg-white p-5 shadow-panel" key={stat.label}>
                <p className="text-sm text-slate-500">{stat.label}</p>
                <div className="mt-3 flex items-end justify-between gap-3">
                  <strong className="text-2xl font-semibold text-ink">{stat.value}</strong>
                  <span className="rounded-md bg-leaf-50 px-2 py-1 text-xs font-medium text-leaf-700">{stat.delta}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-[1.5fr_1fr]">
            <section className="rounded-lg border border-leaf-100 bg-white p-5 shadow-panel">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-slate-500">Operasi hari ini</p>
                  <h3 className="text-lg font-semibold text-ink">Rekod hasil kutipan</h3>
                </div>
                <BarChart3 className="text-leaf-600" size={22} />
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-500">
                      <th className="py-3 pr-4 font-medium">Tarikh</th>
                      <th className="py-3 pr-4 font-medium">Lot</th>
                      <th className="py-3 pr-4 font-medium">Pasukan</th>
                      <th className="py-3 pr-4 font-medium">Tandan</th>
                      <th className="py-3 pr-4 font-medium">Berat</th>
                      <th className="py-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {harvestRows.map((row) => (
                      <tr className="border-b border-slate-100 last:border-0" key={`${row.date}-${row.block}`}>
                        <td className="py-3 pr-4 text-slate-700">{row.date}</td>
                        <td className="py-3 pr-4 font-medium text-ink">{row.block}</td>
                        <td className="py-3 pr-4 text-slate-700">{row.team}</td>
                        <td className="py-3 pr-4 text-slate-700">{row.bunches}</td>
                        <td className="py-3 pr-4 text-slate-700">{row.weight}</td>
                        <td className="py-3 text-slate-700">{row.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="rounded-lg border border-leaf-100 bg-white p-5 shadow-panel">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-slate-500">Tindakan pantas</p>
                  <h3 className="text-lg font-semibold text-ink">Kerja lapangan</h3>
                </div>
                <Activity className="text-leaf-600" size={22} />
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                {quickActions.map(({ label, icon: Icon }) => (
                  <button className="flex items-center gap-3 rounded-md border border-slate-200 bg-white px-4 py-3 text-left text-sm font-medium text-ink hover:border-leaf-300 hover:bg-leaf-50" key={label}>
                    <Icon className="text-leaf-600" size={18} />
                    {label}
                  </button>
                ))}
              </div>
            </section>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <section className="rounded-lg border border-leaf-100 bg-white p-5 shadow-panel">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-ink">Kesihatan tanaman</h3>
                <Leaf className="text-leaf-600" size={21} />
              </div>
              <div className="space-y-3">
                {cropHealth.map((item) => (
                  <div className="rounded-md border border-slate-100 p-4" key={`${item.block}-${item.issue}`}>
                    <div className="flex items-center justify-between gap-3">
                      <strong className="text-sm text-ink">Lot {item.block}</strong>
                      <span className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-600">{item.severity}</span>
                    </div>
                    <p className="mt-2 text-sm text-slate-600">{item.issue}</p>
                    <p className="mt-1 text-xs text-slate-400">PIC: {item.owner}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-lg border border-leaf-100 bg-white p-5 shadow-panel">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-ink">Asas SaaS</h3>
                <Users className="text-leaf-600" size={21} />
              </div>
              <div className="space-y-4 text-sm text-slate-600">
                <p>Versi pertama disediakan untuk multi-tenant: setiap pelanggan mempunyai syarikat, pengguna, ladang, lot, pekerja, dan rekod operasi sendiri.</p>
                <div className="rounded-md bg-leaf-50 p-4 text-leaf-900">
                  Database schema sudah disediakan dalam folder Supabase. Langkah seterusnya ialah jalankan SQL, masukkan env Vercel, kemudian bina borang sebenar.
                </div>
              </div>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
