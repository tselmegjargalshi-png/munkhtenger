"use client";
import Link from "next/link";
import { useState } from "react";
import { PageHead } from "@/components/dash";
import { Badge, Empty, Stat, Tabs } from "@/components/ui";
import { formatDate, formatMNT } from "@/lib/format";
import { useLang } from "@/lib/i18n";
import { scoped } from "@/lib/queries";
import { useApp } from "@/lib/store";

export default function Page() {
  const { db, user } = useApp();
  const { tr, lang, l } = useLang();
  const [tab, setTab] = useState<"all" | "active" | "completed">("all");
  if (!db || !user) return null;
  const all = scoped(db, user).deals.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  const items = tab === "all" ? all : all.filter((d) => d.status === tab);
  const done = all.filter((d) => d.status === "completed");
  return (
    <>
      <PageHead title={tr("Гүйлгээнүүд", "Deals")} sub={tr("Хэлэлцээрийн шатанд орсон болон хаагдсан гүйлгээ", "Deals in negotiation and closed deals")} />
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4"><Stat label={tr("Идэвхтэй", "Active")} value={all.filter((d) => d.status === "active").length} /><Stat label={tr("Хаагдсан", "Completed")} value={done.length} tone="moss" /><Stat label={tr("Гүйлгээний дүн", "Deal volume")} value={formatMNT(done.reduce((a, d) => a + d.amount, 0))} /><Stat label={tr("Комисс", "Commission")} value={formatMNT(done.reduce((a, d) => a + d.commission, 0))} tone="brass" /></div>
      <Tabs value={tab} onChange={setTab} items={[{ key: "all", label: tr("Бүгд", "All"), count: all.length }, { key: "active", label: tr("Идэвхтэй", "Active") }, { key: "completed", label: tr("Хаагдсан", "Completed") }]} />
      <div className="mt-4">{items.length === 0 ? <Empty title={tr("Гүйлгээ алга", "No deals yet")} text={tr("Харилцагчийг \"Хэлэлцээр\" шатанд шилжүүлэхэд гүйлгээ автоматаар нээгдэнэ.", "Moving a lead to Negotiation opens a deal automatically.")} /> : (
        <div className="card overflow-x-auto"><table className="table-x min-w-[720px]" data-testid="deal-table"><thead><tr><th>{tr("Зар", "Property")}</th><th>{tr("Төрөл", "Type")}</th><th>{tr("Дүн", "Amount")}</th><th>{tr("Комисс", "Commission")}</th><th>{tr("Төлөв", "Status")}</th><th>{tr("Огноо", "Date")}</th></tr></thead><tbody>
          {items.map((d) => { const p = db.properties.find((x) => x.id === d.propertyId); return <tr key={d.id}><td>{p ? <Link href={`/properties/${p.id}`} className="font-semibold hover:underline">{p.code} · {l(p.title)}</Link> : ""}</td><td>{d.kind === "sale" ? tr("Худалдаа", "Sale") : tr("Түрээс", "Rental")}</td><td className="font-semibold">{formatMNT(d.amount)}</td><td>{formatMNT(d.commission)}</td><td><Badge tone={d.status === "completed" ? "moss" : d.status === "active" ? "brass" : "rust"}>{d.status === "completed" ? tr("Хаагдсан", "Completed") : d.status === "active" ? tr("Идэвхтэй", "Active") : tr("Цуцлагдсан", "Cancelled")}</Badge></td><td className="text-xs text-ink-3">{formatDate(d.closedAt ?? d.createdAt, lang)}</td></tr>; })}
        </tbody></table></div>
      )}</div>
    </>
  );
}
