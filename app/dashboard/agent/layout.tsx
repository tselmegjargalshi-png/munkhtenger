"use client";
import { DashShell } from "@/components/dash";
import { useLang } from "@/lib/i18n";
import { scoped } from "@/lib/queries";
import { useApp } from "@/lib/store";

export default function Layout({ children }: { children: React.ReactNode }) {
  const { tr } = useLang();
  const { db, user } = useApp();
  const s = db && user ? scoped(db, user) : null;
  const newInq = s ? s.inquiries.filter((q) => q.status === "new").length : 0;
  const reqView = s ? s.viewings.filter((v) => v.status === "requested").length : 0;
  const isAgency = user?.role === "agency_owner";
  return (
    <DashShell
      roles={["agent", "owner", "agency_owner"]}
      title={isAgency ? tr("Агентлагийн самбар", "Agency workspace") : tr("Агентын самбар", "Agent workspace")}
      nav={[
        { href: "/dashboard/agent", label: tr("Хураангуй", "Overview") },
        { href: "/dashboard/agent/listings", label: tr("Миний зарууд", "My listings") },
        { href: "/dashboard/agent/inquiries", label: tr("Лавлагаа", "Inquiries"), badge: newInq },
        { href: "/dashboard/agent/viewings", label: tr("Үзлэгүүд", "Viewings"), badge: reqView },
        { href: "/dashboard/agent/leads", label: tr("Харилцагч (CRM)", "Leads (CRM)") },
        { href: "/dashboard/agent/deals", label: tr("Гүйлгээ", "Deals") },
        { href: "/dashboard/agent/billing", label: tr("Багц, төлбөр", "Plan and billing") },
        ...(isAgency ? [{ href: "/dashboard/agency", label: tr("Агентлагийн удирдлага", "Agency management") }] : []),
        { href: "/account/profile", label: tr("Профайл", "Profile") },
      ]}
    >
      {children}
    </DashShell>
  );
}
