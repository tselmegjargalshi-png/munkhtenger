"use client";
import Link from "next/link";
import { PageHead } from "@/components/dash";
import { Stat } from "@/components/ui";
import { dashboardPath } from "@/lib/perms";
import { formatDateTime } from "@/lib/format";
import { useLang } from "@/lib/i18n";
import { VIEWING_STATUS_LABELS } from "@/lib/labels";
import { useApp } from "@/lib/store";

export default function Page() {
  const { db, user } = useApp();
  const { tr, lang, l } = useLang();
  if (!db || !user) return null;
  const inq = db.inquiries.filter((q) => q.customerId === user.id);
  const vw = db.viewings.filter((v) => v.customerId === user.id);
  const upcoming = vw.filter((v) => (v.status === "confirmed" || v.status === "requested") && new Date(v.date) > new Date()).sort((a, b) => +new Date(a.date) - +new Date(b.date));
  const dash = dashboardPath(user.role);
  return (
    <>
      <PageHead title={tr(`Сайн байна уу, ${user.name}`, `Hello, ${user.name}`)} sub={user.email} actions={dash !== "/account" && <Link href={dash} className="btn-primary btn-sm">{tr("Мэргэжлийн самбар", "Professional dashboard")}</Link>} />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label={tr("Хадгалсан", "Saved")} value={user.favorites.length} />
        <Stat label={tr("Лавлагаа", "Inquiries")} value={inq.length} />
        <Stat label={tr("Үзлэг", "Viewings")} value={vw.length} />
        <Stat label={tr("Хадгалсан хайлт", "Saved searches")} value={db.savedSearches.filter((s) => s.userId === user.id).length} />
      </div>
      <h2 className="h-display mb-3 mt-8 text-2xl">{tr("Удахгүй болох үзлэг", "Upcoming viewings")}</h2>
      {upcoming.length === 0 ? <p className="text-sm text-ink-3">{tr("Товлосон үзлэг алга.", "No viewings scheduled.")}</p> : (
        <ul className="card divide-y divide-paper-3/70">{upcoming.slice(0, 4).map((v) => { const p = db.properties.find((x) => x.id === v.propertyId); return <li key={v.id} className="flex items-center justify-between gap-3 p-4 text-sm"><Link href={`/properties/${v.propertyId}`} className="font-semibold hover:underline">{p ? l(p.title) : ""}</Link><span className="text-ink-3">{formatDateTime(v.date, lang)} · {VIEWING_STATUS_LABELS[v.status][lang]}</span></li>; })}</ul>
      )}
    </>
  );
}
