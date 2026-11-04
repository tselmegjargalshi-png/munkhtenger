"use client";
import { BadgeCheck, Mail, Phone } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { PropertyCard } from "@/components/property";
import { Avatar } from "@/components/shell";
import { Empty, PageLoading } from "@/components/ui";
import { formatPhone } from "@/lib/format";
import { useLang } from "@/lib/i18n";
import { publicProperties } from "@/lib/search";
import { useApp } from "@/lib/store";

export function AgentClient({ id }: { id: string }) {
  const { db, ready } = useApp();
  const { tr, l } = useLang();
  const [phone, setPhone] = useState(false);
  if (!ready || !db) return <PageLoading />;
  const a = db.users.find((u) => u.id === id && (u.role === "agent" || u.role === "agency_owner" || u.role === "owner"));
  if (!a) return <div className="container-x py-16"><Empty title={tr("Агент олдсонгүй", "Agent not found")} action={{ label: tr("Бүх агент", "All agents"), href: "/agents" }} /></div>;
  const ag = db.agencies.find((x) => x.id === a.agencyId);
  const props = publicProperties(db).filter((p) => p.agentId === a.id);
  const closed = db.deals.filter((d) => d.agentId === a.id && d.status === "completed").length;
  return (
    <div className="container-x py-10">
      <div className="card flex flex-col gap-6 p-6 sm:flex-row sm:items-center">
        <Avatar name={a.name} color={a.avatarColor} src={a.avatar} size={96} />
        <div className="flex-1">
          <h1 className="h-display flex items-center gap-2 text-4xl">{a.name}{a.verified && <BadgeCheck className="text-sky" size={24} />}</h1>
          <div className="text-ink-3">{l(a.title)}{ag && <> · <Link href={`/agencies/${ag.id}`} className="text-brass hover:underline">{ag.name}</Link></>}</div>
          <p className="mt-2 max-w-xl text-sm text-ink-2">{l(a.bio)}</p>
          <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm text-ink-3"><span>{props.length} {tr("идэвхтэй зар", "active listings")}</span><span>{closed} {tr("хаагдсан гүйлгээ", "closed deals")}</span>{a.experienceYears && <span>{a.experienceYears} {tr("жилийн туршлага", "years of experience")}</span>}</div>
        </div>
        <div className="flex flex-col gap-2">
          <button className="btn-primary" onClick={() => setPhone(true)}><Phone size={15} />{phone ? formatPhone(a.phone) : tr("Утас харах", "Show phone")}</button>
          <a className="btn-ghost" href={`mailto:${a.email}`}><Mail size={15} />{tr("Имэйл", "Email")}</a>
        </div>
      </div>
      <h2 className="h-display mb-5 mt-10 text-3xl">{tr("Агентын зарууд", "Listings by this agent")}</h2>
      {props.length === 0 ? <Empty title={tr("Идэвхтэй зар алга", "No active listings")} /> : <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{props.map((p) => <PropertyCard key={p.id} p={p} db={db} />)}</div>}
    </div>
  );
}
