"use client";
import { BadgeCheck } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Avatar } from "@/components/shell";
import { Empty, PageLoading } from "@/components/ui";
import { useLang } from "@/lib/i18n";
import { publicProperties } from "@/lib/search";
import { useApp } from "@/lib/store";

export default function AgentsPage() {
  const { db, ready } = useApp();
  const { tr, l } = useLang();
  const [q, setQ] = useState("");
  const [agency, setAgency] = useState("");
  const [onlyVerified, setOnlyVerified] = useState(false);
  if (!ready || !db) return <PageLoading />;
  const pub = publicProperties(db);
  const agents = db.users.filter((u) => (u.role === "agent" || u.role === "agency_owner") && u.active && (!onlyVerified || u.verified) && (!agency || u.agencyId === agency) && u.name.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="container-x py-10">
      <h1 className="h-display text-4xl">{tr("Үл хөдлөхийн агентууд", "Real estate agents")}</h1>
      <p className="mt-1 text-sm text-ink-3">{tr("Баталгаажсан агентууд шалгагдсан бүртгэлтэй.", "Verified agents have reviewed profiles.")}</p>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <input className="input !w-64" placeholder={tr("Нэрээр хайх", "Search by name")} value={q} onChange={(e) => setQ(e.target.value)} data-testid="agent-search" />
        <select className="input !w-64" value={agency} onChange={(e) => setAgency(e.target.value)}><option value="">{tr("Бүх агентлаг", "All agencies")}</option>{db.agencies.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4 accent-[#1E3A5F]" checked={onlyVerified} onChange={(e) => setOnlyVerified(e.target.checked)} />{tr("Зөвхөн баталгаажсан", "Verified only")}</label>
      </div>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" data-testid="agent-grid">
        {agents.length === 0 && <div className="col-span-full"><Empty title={tr("Агент олдсонгүй", "No agents found")} /></div>}
        {agents.map((a) => {
          const ag = db.agencies.find((x) => x.id === a.agencyId);
          return (
            <Link key={a.id} href={`/agents/${a.id}`} className="card p-5 text-center transition hover:shadow-lift">
              <div className="mx-auto w-fit"><Avatar name={a.name} color={a.avatarColor} src={a.avatar} size={68} /></div>
              <div className="mt-3 flex items-center justify-center gap-1 font-semibold">{a.name}{a.verified && <BadgeCheck size={15} className="text-sky" />}</div>
              <div className="text-xs text-ink-3">{l(a.title)}</div>
              <div className="mt-1 text-xs text-brass">{ag?.name}</div>
              <div className="mt-3 text-xs text-ink-3">{pub.filter((p) => p.agentId === a.id).length} {tr("идэвхтэй зар", "active listings")}</div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
