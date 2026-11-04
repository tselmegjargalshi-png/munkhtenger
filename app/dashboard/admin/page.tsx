"use client";
import Link from "next/link";
import { BarChart } from "@/components/charts";
import { PageHead } from "@/components/dash";
import { Stat } from "@/components/ui";
import { formatMNT } from "@/lib/format";
import { useLang } from "@/lib/i18n";
import { monthlyRevenue, platformStats } from "@/lib/queries";
import { useApp } from "@/lib/store";

export default function Page() {
  const { db } = useApp();
  const { tr } = useLang();
  if (!db) return null;
  const s = platformStats(db);
  const rev = monthlyRevenue(db, 6);
  return (
    <>
      <PageHead title={tr("Платформын хураангуй", "Platform overview")} sub={tr("Бүх статистик демо мэдээлэл дээр суурилсан", "All figures are based on demo data")} />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5" data-testid="admin-stats">
        <Stat label={tr("Нийт зар", "Total properties")} value={s.totalProperties} />
        <Stat label={tr("Идэвхтэй зар", "Active listings")} value={s.active} tone="moss" />
        <Stat label={tr("Батлах хүлээгдэж буй", "Pending approvals")} value={s.pending} tone="brass" />
        <Stat label={tr("Агент", "Agents")} value={s.agents} />
        <Stat label={tr("Хэрэглэгч", "Customers")} value={s.customers} />
        <Stat label={tr("Нийт лавлагаа", "Total inquiries")} value={s.inquiries} />
        <Stat label={tr("Товлосон үзлэг", "Scheduled viewings")} value={s.viewings} />
        <Stat label={tr("Зарагдсан", "Sold")} value={s.sold} />
        <Stat label={tr("Түрээслэгдсэн", "Rented")} value={s.rented} />
        <Stat label={tr("Энэ сарын орлого", "Monthly revenue")} value={formatMNT(s.revenue)} tone="brass" />
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <div className="card p-5"><h2 className="mb-3 font-semibold">{tr("Сарын орлого (демо төлбөр)", "Monthly revenue (demo payments)")}</h2><BarChart money data={rev.map((r) => ({ label: r.label, value: r.total }))} testid="revenue-chart" /></div>
        <div className="card p-5"><h2 className="mb-3 font-semibold">{tr("Хурдан үйлдэл", "Quick actions")}</h2>
          <ul className="space-y-2 text-sm">
            <li><Link className="font-semibold text-sky hover:underline" href="/dashboard/admin/listings?status=pending">{s.pending} {tr("зар батлахыг хүлээж байна", "listings awaiting approval")}</Link></li>
            <li><Link className="font-semibold text-sky hover:underline" href="/dashboard/admin/billing">{db.payments.filter((p) => p.status === "pending").length} {tr("төлбөр баталгаажуулах", "payments to confirm")}</Link></li>
            <li><Link className="font-semibold text-sky hover:underline" href="/dashboard/admin/people">{db.users.filter((u) => u.role === "agent" && !u.verified).length} {tr("агент баталгаажуулах", "agents to verify")}</Link></li>
            <li><Link className="font-semibold text-sky hover:underline" href="/dashboard/admin/activity">{db.reports.filter((r) => r.status === "open").length} {tr("нээлттэй мэдэгдэл", "open reports")}</Link></li>
          </ul>
          <p className="mt-4 text-xs text-ink-4">{tr("Гүйлгээний нийт дүн", "Closed deal volume")}: {formatMNT(s.dealVolume)}</p>
        </div>
      </div>
    </>
  );
}
