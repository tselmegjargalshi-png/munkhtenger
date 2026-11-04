"use client";
import Link from "next/link";
import { useState } from "react";
import { PageHead } from "@/components/dash";
import { Badge, Empty, useRun } from "@/components/ui";
import { activePlanFor, cancelSubscription } from "@/lib/actions";
import { formatDate, formatMNT } from "@/lib/format";
import { useLang } from "@/lib/i18n";
import { PAYMENT_METHOD_LABELS } from "@/lib/labels";
import { useApp } from "@/lib/store";

export default function Page() {
  const { db, user } = useApp();
  const { tr, lang, l } = useLang();
  const run = useRun();
  const [, force] = useState(0);
  if (!db || !user) return null;
  const plan = activePlanFor(db, user.id);
  const subs = db.subscriptions.filter((s) => s.userId === user.id || (user.agencyId && s.agencyId === user.agencyId && user.role === "agency_owner")).sort((a, b) => +new Date(b.startAt) - +new Date(a.startAt));
  const pays = db.payments.filter((p) => p.userId === user.id).sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  const used = db.properties.filter((p) => p.agentId === user.id && ["pending", "published", "unpublished"].includes(p.status)).length;
  const active = subs.find((s) => s.status === "active" && new Date(s.endAt) > new Date());
  const payTone = { paid: "moss", pending: "brass", failed: "rust", refunded: "neutral" } as const;
  return (
    <>
      <PageHead title={tr("Багц, төлбөр", "Plan and billing")} actions={<Link href="/pricing" className="btn-primary btn-sm">{tr("Багц ахиулах", "Upgrade plan")}</Link>} />
      <div className="card p-5" data-testid="current-plan">
        <div className="flex flex-wrap items-center justify-between gap-3"><div><div className="text-xs font-semibold uppercase tracking-wide text-ink-3">{tr("Одоогийн багц", "Current plan")}</div><div className="font-display text-3xl font-semibold">{l(plan.name)}</div>{active && <div className="text-sm text-ink-3">{tr("Дуусах огноо", "Renews or ends")}: {formatDate(active.endAt, lang)}</div>}</div><div className="text-right text-sm"><div>{used} / {plan.listingLimit >= 999 ? "∞" : plan.listingLimit} {tr("зар", "listings")}</div><div className="text-ink-3">{plan.featuredSlots} {tr("онцлох байршил", "featured slots")}</div></div></div>
      </div>
      <h2 className="h-display mb-3 mt-8 text-2xl">{tr("Багцын түүх", "Subscription history")}</h2>
      {subs.length === 0 ? <Empty title={tr("Багц идэвхжүүлээгүй", "No subscriptions yet")} /> : <div className="card overflow-x-auto"><table className="table-x min-w-[560px]" data-testid="sub-table"><thead><tr><th>{tr("Багц", "Plan")}</th><th>{tr("Эхэлсэн", "Started")}</th><th>{tr("Дуусах", "Ends")}</th><th>{tr("Төлөв", "Status")}</th><th /></tr></thead><tbody>{subs.map((s) => <tr key={s.id}><td className="font-semibold">{l(db.plans.find((p) => p.id === s.planId)?.name)}</td><td>{formatDate(s.startAt, lang)}</td><td>{formatDate(s.endAt, lang)}</td><td><Badge tone={s.status === "active" ? "moss" : "neutral"}>{s.status === "active" ? tr("Идэвхтэй", "Active") : s.status === "expired" ? tr("Дууссан", "Expired") : tr("Цуцлагдсан", "Cancelled")}</Badge></td><td className="text-right">{s.status === "active" && <button className="btn-danger btn-sm" onClick={() => run(() => { cancelSubscription(s.id); force((x) => x + 1); }, tr("Цуцаллаа", "Cancelled"))}>{tr("Цуцлах", "Cancel")}</button>}</td></tr>)}</tbody></table></div>}
      <h2 className="h-display mb-3 mt-8 text-2xl">{tr("Төлбөрийн түүх", "Payment history")}</h2>
      {pays.length === 0 ? <Empty title={tr("Төлбөр алга", "No payments yet")} /> : <div className="card overflow-x-auto"><table className="table-x min-w-[640px]" data-testid="pay-table"><thead><tr><th>{tr("Огноо", "Date")}</th><th>{tr("Зориулалт", "For")}</th><th>{tr("Хэрэгсэл", "Method")}</th><th>{tr("Дүн", "Amount")}</th><th>{tr("Төлөв", "Status")}</th><th>{tr("Лавлах", "Ref")}</th></tr></thead><tbody>{pays.map((p) => <tr key={p.id}><td className="whitespace-nowrap">{formatDate(p.createdAt, lang)}</td><td>{l(db.plans.find((x) => x.id === p.planId)?.name)}</td><td>{PAYMENT_METHOD_LABELS[p.method][lang]}</td><td className="font-semibold">{formatMNT(p.amount)}</td><td><Badge tone={payTone[p.status]}>{p.status === "paid" ? tr("Төлөгдсөн", "Paid") : p.status === "pending" ? tr("Хүлээгдэж буй", "Pending") : p.status === "failed" ? tr("Амжилтгүй", "Failed") : tr("Буцаасан", "Refunded")}</Badge></td><td className="font-mono text-xs">{p.reference}</td></tr>)}</tbody></table></div>}
      <p className="mt-4 text-xs text-ink-4">{tr("Бүх төлбөр демо болно. Бодит төлбөр боловсруулаагүй.", "All payments are simulated demo records. No real payments were processed.")}</p>
    </>
  );
}
