"use client";
import { BadgeCheck, MapPin } from "lucide-react";
import Link from "next/link";
import { PropertyCard } from "@/components/property";
import { Avatar } from "@/components/shell";
import { Empty, PageLoading } from "@/components/ui";
import { formatPhone } from "@/lib/format";
import { useLang } from "@/lib/i18n";
import { publicProperties } from "@/lib/search";
import { useApp } from "@/lib/store";

export function AgencyPublic({ id }: { id: string }) {
  const { db, ready } = useApp();
  const { tr, l } = useLang();
  if (!ready || !db) return <PageLoading />;
  const ag = db.agencies.find((a) => a.id === id);
  if (!ag) return <div className="container-x py-16"><Empty title={tr("Агентлаг олдсонгүй", "Agency not found")} action={{ label: tr("Нүүр хуудас", "Home"), href: "/" }} /></div>;
  const team = db.users.filter((u) => u.agencyId === ag.id && u.role === "agent" && u.active);
  const props = publicProperties(db).filter((p) => p.agencyId === ag.id);
  return (
    <div className="container-x py-10">
      <div className="card p-6 sm:p-8">
        <div className="flex items-center gap-4"><span className="grid h-16 w-16 place-items-center rounded-2xl font-display text-3xl font-bold text-white" style={{ background: ag.color }}>{ag.name.charAt(0)}</span><div><h1 className="h-display flex items-center gap-2 text-4xl">{ag.name}{ag.verified && <BadgeCheck className="text-sky" />}</h1><p className="flex items-center gap-1 text-sm text-ink-3"><MapPin size={14} />{ag.address}</p></div></div>
        <p className="mt-4 max-w-2xl text-ink-2">{l(ag.description)}</p>
        <p className="mt-3 text-sm text-ink-3">{formatPhone(ag.phone)} · {ag.email}</p>
      </div>
      <h2 className="h-display mb-5 mt-10 text-3xl">{tr("Манай баг", "Our team")}</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{team.map((a) => <Link key={a.id} href={`/agents/${a.id}`} className="card flex items-center gap-3 p-4 hover:shadow-lift"><Avatar name={a.name} color={a.avatarColor} src={a.avatar} size={44} /><div><div className="flex items-center gap-1 text-sm font-semibold">{a.name}{a.verified && <BadgeCheck size={14} className="text-sky" />}</div><div className="text-xs text-ink-3">{l(a.title)}</div></div></Link>)}</div>
      <h2 className="h-display mb-5 mt-10 text-3xl">{tr("Агентлагийн зарууд", "Agency listings")}</h2>
      {props.length === 0 ? <Empty title={tr("Идэвхтэй зар алга", "No active listings")} /> : <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{props.map((p) => <PropertyCard key={p.id} p={p} db={db} />)}</div>}
    </div>
  );
}
