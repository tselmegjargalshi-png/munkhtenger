"use client";
import Link from "next/link";
import { useState } from "react";
import { PageHead } from "@/components/dash";
import { Badge, Empty, Tabs, useRun } from "@/components/ui";
import { resolveReport } from "@/lib/actions";
import { formatDate, formatDateTime, formatMNT, formatPhone } from "@/lib/format";
import { useLang } from "@/lib/i18n";
import { VIEWING_STATUS_LABELS } from "@/lib/labels";
import { useApp } from "@/lib/store";

export default function Page() {
  const { db } = useApp();
  const { tr, lang, l } = useLang();
  const run = useRun();
  const [tab, setTab] = useState<"deals" | "inquiries" | "viewings" | "reports">("deals");
  if (!db) return null;
  const name = (id?: string) => db.users.find((u) => u.id === id)?.name ?? "";
  const prop = (id: string) => db.properties.find((p) => p.id === id);
  const deals = [...db.deals].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  const inq = [...db.inquiries].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)).slice(0, 60);
  const vw = [...db.viewings].sort((a, b) => +new Date(b.date) - +new Date(a.date)).slice(0, 60);
  const reasons = { incorrect: tr("Буруу мэдээлэл", "Incorrect info"), duplicate: tr("Давхардсан", "Duplicate"), sold: tr("Зарагдсан", "Already sold"), scam: tr("Залилан", "Suspected scam"), other: tr("Бусад", "Other") };
  return (
    <>
      <PageHead title={tr("Үйл ажиллагаа, гүйлгээ, мэдэгдэл", "Activity, transactions and reports")} />
      <Tabs value={tab} onChange={setTab} items={[{ key: "deals", label: tr("Гүйлгээ", "Transactions"), count: deals.length }, { key: "inquiries", label: tr("Лавлагаа", "Inquiries"), count: db.inquiries.length }, { key: "viewings", label: tr("Үзлэг", "Viewings"), count: db.viewings.length }, { key: "reports", label: tr("Мэдэгдэл", "Reports"), count: db.reports.filter((r) => r.status === "open").length }]} />
      <div className="mt-4">
        {tab === "deals" && (deals.length === 0 ? <Empty title={tr("Гүйлгээ алга", "No transactions")} /> : <div className="card overflow-x-auto"><table className="table-x min-w-[760px]" data-testid="admin-deals"><thead><tr><th>{tr("Зар", "Property")}</th><th>{tr("Агент", "Agent")}</th><th>{tr("Төрөл", "Type")}</th><th>{tr("Дүн", "Amount")}</th><th>{tr("Комисс", "Commission")}</th><th>{tr("Төлөв", "Status")}</th><th>{tr("Огноо", "Date")}</th></tr></thead><tbody>{deals.map((d) => { const p = prop(d.propertyId); return <tr key={d.id} data-status={d.status}><td>{p && <Link href={`/properties/${p.id}`} className="font-semibold hover:underline">{p.code} · {l(p.title)}</Link>}</td><td>{name(d.agentId)}</td><td>{d.kind === "sale" ? tr("Худалдаа", "Sale") : tr("Түрээс", "Rental")}</td><td className="font-semibold">{formatMNT(d.amount)}</td><td>{formatMNT(d.commission)}</td><td><Badge tone={d.status === "completed" ? "moss" : d.status === "active" ? "brass" : "rust"}>{d.status}</Badge></td><td className="text-xs">{formatDate(d.closedAt ?? d.createdAt, lang)}</td></tr>; })}</tbody></table></div>)}
        {tab === "inquiries" && <div className="card overflow-x-auto"><table className="table-x min-w-[760px]"><thead><tr><th>{tr("Үйлчлүүлэгч", "Customer")}</th><th>{tr("Зар", "Property")}</th><th>{tr("Агент", "Agent")}</th><th>{tr("Төлөв", "Status")}</th><th>{tr("Огноо", "Date")}</th></tr></thead><tbody>{inq.map((q) => <tr key={q.id}><td><div className="font-semibold">{q.name}</div><div className="text-xs text-ink-3">{formatPhone(q.phone)}</div></td><td className="max-w-[260px] truncate">{prop(q.propertyId)?.code} · {l(prop(q.propertyId)?.title)}</td><td>{name(q.agentId)}</td><td><Badge tone={q.status === "new" ? "brass" : "moss"}>{q.status}</Badge></td><td className="text-xs">{formatDate(q.createdAt, lang)}</td></tr>)}</tbody></table></div>}
        {tab === "viewings" && <div className="card overflow-x-auto"><table className="table-x min-w-[760px]"><thead><tr><th>{tr("Огноо", "When")}</th><th>{tr("Үйлчлүүлэгч", "Client")}</th><th>{tr("Зар", "Property")}</th><th>{tr("Агент", "Agent")}</th><th>{tr("Төлөв", "Status")}</th></tr></thead><tbody>{vw.map((v) => <tr key={v.id}><td className="whitespace-nowrap text-xs">{formatDateTime(v.date, lang)}</td><td>{v.name}</td><td className="max-w-[240px] truncate">{prop(v.propertyId)?.code}</td><td>{name(v.agentId)}</td><td><Badge>{VIEWING_STATUS_LABELS[v.status][lang]}</Badge></td></tr>)}</tbody></table></div>}
        {tab === "reports" && (db.reports.length === 0 ? <Empty title={tr("Мэдэгдэл алга", "No reports")} /> : <ul className="card divide-y divide-paper-3/70" data-testid="reports">{db.reports.map((r) => <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm"><div><div className="font-semibold">{reasons[r.reason]} · <Link href={`/properties/${r.propertyId}`} className="text-sky hover:underline">{prop(r.propertyId)?.code}</Link></div><div className="text-ink-3">{r.details}</div><div className="text-xs text-ink-4">{formatDate(r.createdAt, lang)}</div></div><div className="flex items-center gap-2"><Badge tone={r.status === "open" ? "brass" : "neutral"}>{r.status}</Badge>{r.status === "open" && <><button className="btn-primary btn-sm" onClick={() => run(() => resolveReport(r.id, "resolved"), tr("Шийдвэрлэлээ", "Resolved"))}>{tr("Шийдвэрлэх", "Resolve")}</button><button className="btn-ghost btn-sm" onClick={() => run(() => resolveReport(r.id, "dismissed"))}>{tr("Хаах", "Dismiss")}</button></>}</div></li>)}</ul>)}
      </div>
    </>
  );
}
