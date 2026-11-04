"use client";
import Link from "next/link";
import { BarChart, LineChart } from "@/components/charts";
import { PageHead } from "@/components/dash";
import { Stat } from "@/components/ui";
import { formatMNT } from "@/lib/format";
import { useLang } from "@/lib/i18n";
import { CATEGORY_LABELS, LEAD_SOURCE_LABELS, LEAD_STAGES, LEAD_STAGE_LABELS } from "@/lib/labels";
import { monthlyRevenue, performance, platformStats } from "@/lib/queries";
import { useApp } from "@/lib/store";
import type { LeadSource } from "@/lib/types";

export default function Page() {
  const { db } = useApp();
  const { tr, lang, l } = useLang();
  if (!db) return null;
  const perf = performance(db.properties, 30);
  const s = platformStats(db);
  const won = db.leads.filter((x) => x.stage === "successful").length;
  const conv = db.leads.length ? Math.round((won / db.leads.length) * 100) : 0;
  const top = [...db.properties].sort((a, b) => b.views - a.views).slice(0, 6);
  const rev = monthlyRevenue(db, 6);
  const topAgents = db.users.filter((u) => u.role === "agent").map((u) => ({ u, deals: db.deals.filter((d) => d.agentId === u.id && d.status === "completed"), views: db.properties.filter((p) => p.agentId === u.id).reduce((a, p) => a + p.views, 0) })).sort((a, b) => b.views - a.views).slice(0, 5);
  return (
    <>
      <PageHead title={tr("Аналитик", "Analytics")} />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4"><Stat label={tr("Нийт үзэлт", "Total views")} value={db.properties.reduce((a, p) => a + p.views, 0).toLocaleString("en-US")} /><Stat label={tr("Лавлагаа / зар", "Inquiries per listing")} value={(db.inquiries.length / Math.max(1, s.active)).toFixed(2)} /><Stat label={tr("Харилцагчийн хөрвөлт", "Lead conversion")} value={`${conv}%`} tone="moss" /><Stat label={tr("Гүйлгээний дүн", "Deal volume")} value={formatMNT(s.dealVolume)} tone="brass" /></div>
      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <div className="card p-5"><h2 className="mb-3 font-semibold">{tr("Үзэлт ба лавлагаа, 30 хоног", "Views and inquiries, 30 days")}</h2><LineChart labels={perf.map((d) => d.day)} series={[{ name: tr("Үзсэн", "Views"), color: "#1E3A5F", values: perf.map((d) => d.views) }, { name: tr("Лавлагаа (x5)", "Inquiries (x5)"), color: "#A9814A", values: perf.map((d) => d.inquiries * 5) }]} /></div>
        <div className="card p-5"><h2 className="mb-3 font-semibold">{tr("Сарын орлого", "Monthly revenue")}</h2><BarChart money data={rev.map((r) => ({ label: r.label, value: r.total }))} color="#A9814A" /></div>
        <div className="card p-5"><h2 className="mb-3 font-semibold">{tr("Харилцагчийн шатлал", "Lead funnel")}</h2><BarChart color="#2F6B4F" data={LEAD_STAGES.map((st) => ({ label: LEAD_STAGE_LABELS[st][lang].slice(0, 7), value: db.leads.filter((x) => x.stage === st).length }))} /></div>
        <div className="card p-5"><h2 className="mb-3 font-semibold">{tr("Эх сурвалж", "Lead sources")}</h2><BarChart data={(Object.keys(LEAD_SOURCE_LABELS) as LeadSource[]).map((k) => ({ label: LEAD_SOURCE_LABELS[k][lang].slice(0, 8), value: db.leads.filter((x) => x.source === k).length }))} /></div>
        <div className="card p-5"><h2 className="mb-3 font-semibold">{tr("Дүүрэг тус бүрийн идэвхтэй зар", "Active listings by district")}</h2><BarChart color="#6B4F7A" data={db.districts.filter((d) => d.enabled).map((d) => ({ label: d.name[lang].slice(0, 8), value: db.properties.filter((p) => p.status === "published" && p.district === d.key).length }))} /></div>
        <div className="card p-5"><h2 className="mb-3 font-semibold">{tr("Ангиллаар", "Listings by category")}</h2><BarChart color="#7A4F4F" data={db.categories.map((c) => ({ label: CATEGORY_LABELS[c.key][lang].slice(0, 7), value: db.properties.filter((p) => p.status === "published" && p.category === c.key).length }))} /></div>
        <div className="card p-5"><h2 className="mb-3 font-semibold">{tr("Хамгийн их үзсэн зарууд", "Most viewed listings")}</h2><ol className="space-y-2 text-sm">{top.map((p) => <li key={p.id} className="flex justify-between gap-3"><Link href={`/properties/${p.id}`} className="truncate hover:underline">{p.code} · {l(p.title)}</Link><span className="font-semibold">{p.views}</span></li>)}</ol></div>
        <div className="card p-5"><h2 className="mb-3 font-semibold">{tr("Шилдэг агентууд", "Top agents")}</h2><ol className="space-y-2 text-sm">{topAgents.map(({ u, deals, views }) => <li key={u.id} className="flex justify-between gap-3"><Link href={`/agents/${u.id}`} className="truncate hover:underline">{u.name}</Link><span className="text-ink-3">{views} {tr("үзэлт", "views")} · {deals.length} {tr("гүйлгээ", "deals")}</span></li>)}</ol></div>
      </div>
    </>
  );
}
