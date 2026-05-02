import type { LucideIcon } from "lucide-react";
import { AlertTriangle, ChevronRight, Loader2, Plus } from "lucide-react";
import type { ReactNode } from "react";

type StatusTone = "green" | "amber" | "red" | "blue" | "slate" | "purple";

const toneClasses: Record<StatusTone, string> = {
  green: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  amber: "bg-amber-50 text-amber-700 ring-amber-200",
  red: "bg-red-50 text-red-700 ring-red-200",
  blue: "bg-sky-50 text-sky-700 ring-sky-200",
  slate: "bg-slate-100 text-slate-700 ring-slate-200",
  purple: "bg-purple-50 text-purple-700 ring-purple-200"
};

export function statusTone(status: string): StatusTone {
  if (["Paid", "Approved", "Excellent", "Present", "Active", "Available", "A"].includes(status)) return "green";
  if (["Pending", "Processing", "Collected", "Draft", "Watchlist", "Late", "On Trip", "B"].includes(status)) return "amber";
  if (["Reject", "Absent", "Maintenance", "Inactive", "Overdue"].includes(status)) return "red";
  if (["Delivered", "Graded", "New", "C"].includes(status)) return "blue";
  return "slate";
}

export function StatusBadge({ status }: { status: string }) {
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${toneClasses[statusTone(status)]}`}>{status}</span>;
}

export function PageHeader({ eyebrow, title, description, actionLabel, onAction }: { eyebrow: string; title: string; description: string; actionLabel?: string; onAction?: () => void }) {
  return <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
    <div>
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-canopy-600">{eyebrow}</p>
      <h2 className="mt-2 text-2xl font-semibold tracking-normal text-ink md:text-3xl">{title}</h2>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">{description}</p>
    </div>
    {actionLabel && <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-canopy-600 px-4 py-2.5 text-sm font-semibold text-white shadow-glow hover:bg-canopy-500" onClick={onAction}><Plus size={17} />{actionLabel}</button>}
  </div>;
}

export function StatCard({ label, value, helper, icon: Icon, tone = "green" }: { label: string; value: string; helper: string; icon: LucideIcon; tone?: StatusTone }) {
  return <div className="group rounded-2xl border border-white/70 bg-white/85 p-5 shadow-panel backdrop-blur hover:-translate-y-0.5 hover:shadow-glow">
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm text-slate-500">{label}</p>
        <strong className="mt-3 block text-2xl font-semibold text-ink">{value}</strong>
      </div>
      <div className={`rounded-2xl p-3 ring-1 ${toneClasses[tone]}`}><Icon size={20} /></div>
    </div>
    <p className="mt-4 text-sm text-slate-500">{helper}</p>
  </div>;
}

export function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-2xl border border-white/70 bg-white/90 p-5 shadow-panel backdrop-blur ${className}`}>{children}</section>;
}

export function ChartCard({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return <Panel>
    <div className="mb-5 flex items-center justify-between gap-4">
      <div>
        <h3 className="text-lg font-semibold text-ink">{title}</h3>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>
    </div>
    <div className="h-72">{children}</div>
  </Panel>;
}

export function DataTable({ headers, rows, emptyText = "No records found." }: { headers: string[]; rows: ReactNode[][]; emptyText?: string }) {
  if (!rows.length) return <EmptyState title={emptyText} description="Try changing filters or create a new record to get started." />;
  return <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white">
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] border-collapse text-left text-sm">
        <thead className="bg-slate-50 text-slate-500">
          <tr>{headers.map((header) => <th className="px-4 py-3 font-medium" key={header}>{header}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, index) => <tr className="border-t border-slate-100 hover:bg-canopy-50/40" key={index}>{row.map((cell, cellIndex) => <td className="px-4 py-3 align-middle text-slate-700" key={`${index}-${cellIndex}`}>{cell}</td>)}</tr>)}
        </tbody>
      </table>
    </div>
  </div>;
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return <div className="rounded-2xl border border-dashed border-canopy-200 bg-canopy-50/50 p-8 text-center">
    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-canopy-600 shadow-soft"><AlertTriangle size={20} /></div>
    <h3 className="mt-4 text-base font-semibold text-ink">{title}</h3>
    <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">{description}</p>
  </div>;
}

export function Timeline({ items }: { items: Array<{ title: string; detail: string; tone?: string }> }) {
  return <div className="space-y-4">
    {items.map((item, index) => <div className="flex gap-3" key={`${item.title}-${index}`}>
      <div className={`mt-1 h-3 w-3 rounded-full ${item.tone === "red" ? "bg-red-500" : item.tone === "amber" ? "bg-amber-500" : "bg-canopy-500"}`} />
      <div>
        <p className="text-sm font-semibold text-ink">{item.title}</p>
        <p className="mt-1 text-sm text-slate-500">{item.detail}</p>
      </div>
    </div>)}
  </div>;
}

export function SkeletonCard() {
  return <div className="rounded-2xl border border-white/70 bg-white/80 p-5 shadow-panel">
    <Loader2 className="animate-spin text-canopy-600" size={18} />
    <div className="mt-4 h-4 w-32 rounded bg-slate-100" />
    <div className="mt-3 h-8 w-44 rounded bg-slate-100" />
  </div>;
}

export function LinkButton({ children, onClick }: { children: ReactNode; onClick?: () => void }) {
  return <button className="inline-flex items-center gap-1 text-sm font-semibold text-canopy-700 hover:text-canopy-600" onClick={onClick}>{children}<ChevronRight size={15} /></button>;
}
