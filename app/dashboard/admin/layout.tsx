"use client";
import { DashShell } from "@/components/dash";
import { useLang } from "@/lib/i18n";
import { useApp } from "@/lib/store";

export default function Layout({ children }: { children: React.ReactNode }) {
  const { tr } = useLang();
  const { db } = useApp();
  const pending = db ? db.properties.filter((p) => p.status === "pending").length : 0;
  const pays = db ? db.payments.filter((p) => p.status === "pending").length : 0;
  const reports = db ? db.reports.filter((r) => r.status === "open").length : 0;
  return (
    <DashShell
      roles={["platform_admin", "super_admin"]}
      title={tr("Админы самбар", "Admin console")}
      nav={[
        { href: "/dashboard/admin", label: tr("Хураангуй", "Overview") },
        { href: "/dashboard/admin/analytics", label: tr("Аналитик", "Analytics") },
        { href: "/dashboard/admin/listings", label: tr("Зарууд", "Listings"), badge: pending },
        { href: "/dashboard/admin/people", label: tr("Хэрэглэгчид", "People") },
        { href: "/dashboard/admin/agencies", label: tr("Агентлагууд", "Agencies") },
        { href: "/dashboard/admin/catalog", label: tr("Ангилал, байршил", "Categories and locations") },
        { href: "/dashboard/admin/promotions", label: tr("Сурталчилгаа", "Promotions") },
        { href: "/dashboard/admin/billing", label: tr("Багц, төлбөр", "Billing"), badge: pays },
        { href: "/dashboard/admin/activity", label: tr("Үйл ажиллагаа", "Activity and reports"), badge: reports },
        { href: "/dashboard/admin/content", label: tr("Вэб агуулга", "Website content") },
        { href: "/dashboard/admin/audit", label: tr("Аудитын бүртгэл", "Audit log") },
        { href: "/account/profile", label: tr("Профайл", "Profile") },
      ]}
    >
      {children}
    </DashShell>
  );
}
