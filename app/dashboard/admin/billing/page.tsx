"use client";
import { useState } from "react";
import { PageHead } from "@/components/dash";
import { Badge, Empty, Tabs, useRun } from "@/components/ui";
import { adminConfirmPayment, adminUpdatePlan, cancelSubscription } from "@/lib/actions";
import { formatDate, formatMNT } from "@/lib/format";
import { useLang } from "@/lib/i18n";
import { PAYMENT_METHOD_LABELS } from "@/lib/labels";
import { useApp } from "@/lib/store";

export default function Page() {
  const { db } = useApp();
  const { tr, lang, l } = useLang();
  const run = useRun();
  const [tab, setTab] = useState<"payments" | "subs" | "plans">("payments");
  if (!db) return null;
  const pays = [...db.payments].sort((a, b) => (a.status === "pending" ? -1 : 0) - (b.status === "pending" ? -1 : 0) || +new Date(b.createdAt) - +new Date(a.createdAt));
  const subs = [...db.subscriptions].sort((a, b) => +new Date(b.startAt) - +new Date(a.startAt));
  const user = (id: string) => db.users.find((u) => u.id === id)?.name ?? "";
  const planName = (id: string) => l(db.plans.find((p) => p.id === id)?.name);
  const tone = { paid: "moss", pending: "brass", failed: "rust", refunded: "neutral" } as const;
  return (
    <>
      <PageHead title={tr("Багц, төлбөр, орлого", "Subscriptions, payments and revenue")} sub={tr("Бүх төлбөр демо. Банк, бэлэн төлбөрийг эндээс гараар баталгаажуулна.", "All payments are demo records. Bank and cash payments are confirmed here.")} />
      <Tabs value={tab} onChange={setTab} items={[{ key: "payments", label: tr("Төлбөр", "Payments"), count: pays.length }, { key: "subs", label: tr("Захиалга", "Subscriptions"), count: subs.length }, { key: "plans", label: tr("Багцын тохиргоо", "Plan settings") }]} />
      <div className="mt-4">
        {tab === "payments" && (pays.length === 0 ? <Empty title={tr("Төлбөр алга", "No payments")} /> : <div className="card overflow-x-auto"><table className="table-x min-w-[820px]" data-testid="admin-pay-table"><thead><tr><th>{tr("Огноо", "Date")}</th><th>{tr("Хэрэглэгч", "User")}</th><th>{tr("Багц", "Plan")}</th><th>{tr("Хэрэгсэл", "Method")}</th><th>{tr("Дүн", "Amount")}</th><th>{tr("Төлөв", "Status")}</th><th /></tr></thead><tbody>
          {pays.slice(0, 60).map((p) => <tr key={p.id} data-status={p.status}><td className="whitespace-nowrap text-xs">{formatDate(p.createdAt, lang)}</td><td>{user(p.userId)}</td><td>{planName(p.planId)}</td><td>{PAYMENT_METHOD_LABELS[p.method][lang]}</td><td className="font-semibold">{formatMNT(p.amount)}</td><td><Badge tone={tone[p.status]}>{p.status}</Badge></td><td className="text-right">{p.status === "pending" && <span className="flex justify-end gap-1.5"><button className="btn-primary btn-sm" data-testid="confirm-payment" onClick={() => run(() => adminConfirmPayment(p.id, true), tr("Төлбөр баталгаажлаа", "Payment confirmed"))}>{tr("Батлах", "Confirm")}</button><button className="btn-danger btn-sm" onClick={() => run(() => adminConfirmPayment(p.id, false))}>{tr("Татгалзах", "Reject")}</button></span>}</td></tr>)}
        </tbody></table></div>)}
        {tab === "subs" && <div className="card overflow-x-auto"><table className="table-x min-w-[680px]"><thead><tr><th>{tr("Хэрэглэгч", "User")}</th><th>{tr("Багц", "Plan")}</th><th>{tr("Эхэлсэн", "Start")}</th><th>{tr("Дуусах", "End")}</th><th>{tr("Төлөв", "Status")}</th><th /></tr></thead><tbody>{subs.map((s) => <tr key={s.id}><td>{user(s.userId)}</td><td>{planName(s.planId)}</td><td className="text-xs">{formatDate(s.startAt, lang)}</td><td className="text-xs">{formatDate(s.endAt, lang)}</td><td><Badge tone={s.status === "active" ? "moss" : "neutral"}>{s.status}</Badge></td><td className="text-right">{s.status === "active" && <button className="btn-danger btn-sm" onClick={() => run(() => cancelSubscription(s.id), tr("Цуцаллаа", "Cancelled"))}>{tr("Цуцлах", "Cancel")}</button>}</td></tr>)}</tbody></table></div>}
        {tab === "plans" && <div className="card overflow-x-auto"><table className="table-x min-w-[620px]" data-testid="plan-table"><thead><tr><th>{tr("Багц", "Plan")}</th><th>{tr("Төрөл", "Audience")}</th><th>{tr("Үнэ (₮)", "Price (₮)")}</th><th>{tr("Зарын лимит", "Listing limit")}</th></tr></thead><tbody>{db.plans.map((p) => <tr key={p.id}><td className="font-semibold">{l(p.name)}</td><td className="text-xs text-ink-3">{p.audience}</td><td><input type="number" min={0} className="input !w-36 !py-1.5" defaultValue={p.price} onBlur={(e) => Number(e.target.value) !== p.price && run(() => adminUpdatePlan(p.id, { price: Number(e.target.value) }), tr("Үнэ шинэчлэгдлээ", "Price updated"))} aria-label="price" /></td><td><input type="number" min={1} className="input !w-28 !py-1.5" defaultValue={p.listingLimit} onBlur={(e) => Number(e.target.value) !== p.listingLimit && run(() => adminUpdatePlan(p.id, { listingLimit: Number(e.target.value) }), tr("Шинэчлэгдлээ", "Updated"))} aria-label="limit" /></td></tr>)}</tbody></table></div>}
      </div>
    </>
  );
}
