"use client";
import Link from "next/link";
import { BarChart } from "@/components/charts";
import { LineChart } from "@/components/charts";
import { PageHead } from "@/components/dash";
import { Stat } from "@/components/ui";
import { formatDateTime, formatMNT, timeAgo } from "@/lib/format";
import { useLang } from "@/lib/i18n";
import { VIEWING_STATUS_LABELS } from "@/lib/labels";
import { performance, scoped } from "@/lib/queries";
import { useApp } from "@/lib/store";

export default function Page() {
  const { db, user } = useApp();
  const { tr, lang, l } = useLang();
  if (!db || !user) return null;
  const s = scoped(db, user);
  const perf = performance(s.properties, 30);
  const active = s.properties.filter((p) => p.status === "published");
  const views30 = perf.reduce((a, d) => a + d.views, 0);
  const upcoming = s.viewings.filter((v) => (v.status === "confirmed" || v.status === "requested") && new Date(v.date) > new Date(Date.now() - 36e5)).sort((a, b) => +new Date(a.date) - +new Date(b.date));
  const due = s.leads.flatMap((x) => x.reminders.filter((r) => !r.done && new Date(r.due).getTime() < Date.now() + 2 * 864e5).map((r) => ({ lead: x, r }))).sort((a, b) => +new Date(a.r.due) - +new Date(b.r.due));
  const commission = s.deals.filter((d) => d.status === "completed").reduce((a, d) => a + d.commission, 0);
  return (
    <>
      <PageHead title={tr(`Сайн байна уу, ${user.name}`, `Welcome, ${user.name}`)} sub={tr("Таны өнөөдрийн ажлын тойм", "Your workday at a glance")} actions={<Link href="/dashboard/agent/listings/new" className="btn-primary btn-sm">{tr("Шинэ зар", "New listing")}</Link>} />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4" data-testid="agent-stats">
        <Stat label={tr("Идэвхтэй зар", "Active listings")} value={active.length} sub={`${s.properties.filter((p) => p.status === "pending").length} ${tr("хянагдаж байна", "pending review")}`} />
        <Stat label={tr("Сүүлийн 30 хоногийн үзсэн", "Views, 30 days")} value={views30.toLocaleString("en-US")} />
        <Stat label={tr("Шинэ лавлагаа", "New inquiries")} value={s.inquiries.filter((q) => q.status === "new").length} tone="brass" sub={`${s.inquiries.length} ${tr("нийт", "total")}`} />
        <Stat label={tr("Идэвхтэй гүйлгээ", "Active deals")} value={s.deals.filter((d) => d.status === "active").length} sub={`${tr("Комисс", "Commission")} ${formatMNT(commission)}`} />
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <div className="card p-5"><h2 className="mb-3 font-semibold">{tr("Үзэлт ба лавлагаа, 30 хоног", "Views and inquiries, 30 days")}</h2><LineChart labels={perf.map((d) => d.day)} series={[{ name: tr("Үзсэн", "Views"), color: "#1E3A5F", values: perf.map((d) => d.views) }, { name: tr("Лавлагаа", "Inquiries"), color: "#A9814A", values: perf.map((d) => d.inquiries * 5) }]} /></div>
        <div className="card p-5"><h2 className="mb-3 font-semibold">{tr("Харилцагчийн шатлал", "Lead pipeline")}</h2><BarChart color="#2F6B4F" data={(["new", "contacted", "interested", "viewing", "negotiation", "successful", "lost"] as const).map((st) => ({ label: { new: tr("Шинэ", "New"), contacted: tr("Холб.", "Cont."), interested: tr("Сонир.", "Int."), viewing: tr("Үзлэг", "View"), negotiation: tr("Хэлэл.", "Neg."), successful: tr("Амжил.", "Won"), lost: tr("Алдсан", "Lost") }[st], value: s.leads.filter((x) => x.stage === st).length }))} /></div>
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <div className="card p-5 xl:col-span-1"><div className="mb-3 flex items-center justify-between"><h2 className="font-semibold">{tr("Шинэ лавлагаа", "Latest inquiries")}</h2><Link href="/dashboard/agent/inquiries" className="text-xs font-semibold text-sky">{tr("Бүгд", "All")}</Link></div>
          <ul className="space-y-3">{s.inquiries.slice(0, 4).map((q) => { const p = db.properties.find((x) => x.id === q.propertyId); return <li key={q.id} className="text-sm"><div className="font-semibold">{q.name}</div><div className="line-clamp-1 text-xs text-ink-3">{p ? l(p.title) : ""}</div><div className="text-[11px] text-ink-4">{timeAgo(q.createdAt, lang)}</div></li>; })}{s.inquiries.length === 0 && <li className="text-sm text-ink-3">{tr("Лавлагаа алга", "No inquiries yet")}</li>}</ul></div>
        <div className="card p-5"><div className="mb-3 flex items-center justify-between"><h2 className="font-semibold">{tr("Удахгүй болох үзлэг", "Upcoming viewings")}</h2><Link href="/dashboard/agent/viewings" className="text-xs font-semibold text-sky">{tr("Бүгд", "All")}</Link></div>
          <ul className="space-y-3">{upcoming.slice(0, 4).map((v) => <li key={v.id} className="text-sm"><div className="font-semibold">{v.name}</div><div className="text-xs text-ink-3">{formatDateTime(v.date, lang)} · {VIEWING_STATUS_LABELS[v.status][lang]}</div></li>)}{upcoming.length === 0 && <li className="text-sm text-ink-3">{tr("Товлосон үзлэг алга", "Nothing scheduled")}</li>}</ul></div>
        <div className="card p-5"><div className="mb-3 flex items-center justify-between"><h2 className="font-semibold">{tr("Дагаж холбогдох сануулга", "Follow up reminders")}</h2><Link href="/dashboard/agent/leads" className="text-xs font-semibold text-sky">CRM</Link></div>
          <ul className="space-y-3">{due.slice(0, 4).map(({ lead, r }) => <li key={r.id} className="text-sm"><div className="font-semibold">{lead.name}</div><div className="text-xs text-ink-3">{r.text}</div><div className="text-[11px] text-ink-4">{formatDateTime(r.due, lang)}</div></li>)}{due.length === 0 && <li className="text-sm text-ink-3">{tr("Сануулга алга", "No reminders due")}</li>}</ul></div>
      </div>
    </>
  );
}
