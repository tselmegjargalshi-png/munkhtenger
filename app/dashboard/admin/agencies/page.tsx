"use client";
import { BadgeCheck } from "lucide-react";
import Link from "next/link";
import { PageHead } from "@/components/dash";
import { Badge, Empty, useRun } from "@/components/ui";
import { adminVerifyAgency } from "@/lib/actions";
import { formatDate, formatMNT } from "@/lib/format";
import { useLang } from "@/lib/i18n";
import { useApp } from "@/lib/store";

export default function Page() {
  const { db } = useApp();
  const { tr, lang } = useLang();
  const run = useRun();
  if (!db) return null;
  return (
    <>
      <PageHead title={tr("Агентлагууд", "Agencies")} />
      {db.agencies.length === 0 ? <Empty title={tr("Агентлаг алга", "No agencies")} /> : (
        <div className="card overflow-x-auto"><table className="table-x min-w-[760px]" data-testid="agency-table"><thead><tr><th>{tr("Агентлаг", "Agency")}</th><th>{tr("Эзэн", "Owner")}</th><th>{tr("Агент", "Agents")}</th><th>{tr("Идэвхтэй зар", "Active")}</th><th>{tr("Гүйлгээ", "Deal volume")}</th><th>{tr("Үүссэн", "Created")}</th><th /></tr></thead><tbody>
          {db.agencies.map((a) => { const owner = db.users.find((u) => u.id === a.ownerId); const members = db.users.filter((u) => u.agencyId === a.id && u.role === "agent"); const vol = db.deals.filter((d) => d.status === "completed" && members.concat(owner ? [owner] : []).some((m) => m.id === d.agentId)).reduce((s, d) => s + d.amount, 0); return (
            <tr key={a.id}><td><Link href={`/agencies/${a.id}`} className="flex items-center gap-2 font-semibold hover:underline"><span className="grid h-8 w-8 place-items-center rounded-lg text-sm font-bold text-white" style={{ background: a.color }}>{a.name.charAt(0)}</span>{a.name}{a.verified && <BadgeCheck size={14} className="text-sky" />}</Link></td><td className="text-sm">{owner?.name}</td><td>{members.length}</td><td>{db.properties.filter((p) => p.agencyId === a.id && p.status === "published").length}</td><td className="whitespace-nowrap">{formatMNT(vol)}</td><td className="text-xs text-ink-3">{formatDate(a.createdAt, lang)}</td><td className="text-right">{a.verified ? <button className="btn-ghost btn-sm" onClick={() => run(() => adminVerifyAgency(a.id, false))}>{tr("Баталгаа хасах", "Unverify")}</button> : <><Badge tone="brass">{tr("Хүлээгдэж буй", "Pending")}</Badge> <button className="btn-primary btn-sm" data-testid="verify-agency" onClick={() => run(() => adminVerifyAgency(a.id, true), tr("Агентлаг баталгаажлаа", "Agency verified"))}>{tr("Баталгаажуулах", "Verify")}</button></>}</td></tr>); })}
        </tbody></table></div>
      )}
    </>
  );
}
