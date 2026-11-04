"use client";
import { Check } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { CheckoutModal } from "@/components/checkout";
import { PageLoading, Tabs, toast } from "@/components/ui";
import { activePlanFor } from "@/lib/actions";
import { cx, formatMNT } from "@/lib/format";
import { useLang } from "@/lib/i18n";
import { useApp } from "@/lib/store";
import type { Plan, PlanAudience } from "@/lib/types";
import { useRouter } from "next/navigation";
import { canManageProperty } from "@/lib/perms";

export default function PricingPage() {
  const { db, user, ready } = useApp();
  const { tr, l, lang } = useLang();
  const router = useRouter();
  const [tab, setTab] = useState<PlanAudience>("agent");
  const [plan, setPlan] = useState<Plan | null>(null);
  const [propId, setPropId] = useState("");
  if (!ready || !db) return <PageLoading />;
  const current = user ? activePlanFor(db, user.id) : null;
  const plans = db.plans.filter((p) => p.audience === tab);
  const myProps = user ? db.properties.filter((p) => p.status === "published" && canManageProperty(user, p)) : [];
  const buy = (p: Plan) => {
    if (!user) { toast(tr("Эхлээд нэвтэрнэ үү", "Please sign in first"), "err"); router.push("/login?next=/pricing"); return; }
    if (user.role === "customer") { toast(tr("Энэ багцыг агент, өмчлөгч, агентлаг авна", "Plans are for agents, owners and agencies"), "err"); return; }
    if (p.audience === "agency" && user.role !== "agency_owner") { toast(tr("Агентлагийн багцыг зөвхөн агентлагийн эзэн авна", "Only agency owners can buy agency plans"), "err"); return; }
    if (p.audience === "listing" && !propId) { toast(tr("Сурталчлах зараа сонгоно уу", "Choose a listing to promote"), "err"); return; }
    if (p.price === 0) { toast(tr("Энэ бол үнэгүй багц. Бүх бүртгэлд автоматаар идэвхтэй.", "This free plan is active on every account.")); return; }
    setPlan(p);
  };
  return (
    <div className="container-x py-12">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="h-display text-5xl">{tr("Үнийн багц", "Plans and pricing")}</h1>
        <p className="mt-3 text-ink-3">{tr("Үнэгүй эхлээд, зараа онцлох болон багцаа ахиулах боломжтой. Төлбөрүүд бүгд демо болно.", "Start free, then promote listings or upgrade. All payments in this build are simulated.")}</p>
        <div className="mt-6 flex justify-center"><Tabs value={tab} onChange={setTab} items={[{ key: "agent", label: tr("Агент", "Agents") }, { key: "agency", label: tr("Агентлаг", "Agencies") }, { key: "listing", label: tr("Зар сурталчлах", "Promote a listing") }]} /></div>
      </div>
      {tab === "listing" && (
        <div className="mx-auto mt-8 max-w-md">
          {user && myProps.length > 0 ? (
            <select className="input" value={propId} onChange={(e) => setPropId(e.target.value)} data-testid="promo-property"><option value="">{tr("Сурталчлах зараа сонгоно уу", "Choose the listing to promote")}</option>{myProps.map((p) => <option key={p.id} value={p.id}>{p.code} · {l(p.title)}</option>)}</select>
          ) : <p className="text-center text-sm text-ink-3">{user ? tr("Сурталчлах нийтлэгдсэн зар алга.", "You have no published listings to promote.") : <><Link href="/login?next=/pricing" className="font-semibold text-sky">{tr("Нэвтэрч", "Sign in")}</Link> {tr("зараа сонгоно уу.", "to choose a listing.")}</>}</p>}
        </div>
      )}
      <div className={cx("mx-auto mt-10 grid max-w-6xl gap-5", plans.length === 3 ? "md:grid-cols-3" : "sm:grid-cols-2 lg:grid-cols-4")} data-testid="plans">
        {plans.map((p) => (
          <div key={p.id} className={cx("card relative flex flex-col p-6", p.highlight && "ring-2 ring-brass")} data-testid={`plan-${p.id}`}>
            {p.highlight && <span className="absolute -top-3 left-6 rounded-full bg-brass px-3 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white">{tr("Алдартай", "Popular")}</span>}
            <h3 className="h-display text-2xl">{l(p.name)}</h3>
            <div className="mt-3 font-display text-4xl font-semibold">{p.price === 0 ? tr("Үнэгүй", "Free") : formatMNT(p.price)}</div>
            <div className="text-xs text-ink-3">{p.price === 0 ? "" : `/ ${p.periodDays === 30 ? tr("сар", "month") : `${p.periodDays} ${tr("хоног", "days")}`}`}</div>
            <ul className="mt-5 flex-1 space-y-2.5 text-sm">{p.perks[lang].map((x) => <li key={x} className="flex gap-2"><Check size={16} className="mt-0.5 shrink-0 text-moss" />{x}</li>)}</ul>
            {current?.id === p.id ? <div className="mt-6 rounded-full bg-moss-soft py-2.5 text-center text-sm font-semibold text-moss">{tr("Таны одоогийн багц", "Your current plan")}</div> : <button className={cx("mt-6", p.highlight ? "btn-brass" : "btn-primary")} data-testid={`buy-${p.id}`} onClick={() => buy(p)}>{p.price === 0 ? tr("Үнэгүй эхлэх", "Start free") : tr("Сонгох", "Choose plan")}</button>}
          </div>
        ))}
      </div>
      <p className="mx-auto mt-8 max-w-xl text-center text-xs text-ink-4">{tr("QPay, SocialPay, банкны шилжүүлэг, бэлэн мөнгө нь демо интерфэйс. Бодит төлбөр боловсруулахгүй.", "QPay, SocialPay, bank transfer and cash are demo interfaces. No real payments are processed.")}</p>
      <CheckoutModal plan={plan} propertyId={propId || undefined} open={!!plan} onClose={() => setPlan(null)} onDone={() => toast(tr("Төлбөрийн түүхээс харна уу", "See your payment history in the dashboard"))} />
    </div>
  );
}
