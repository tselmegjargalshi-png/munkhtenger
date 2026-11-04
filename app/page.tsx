"use client";
import { ArrowRight, BadgeCheck, Building2, MapPin, ShieldCheck, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Avatar } from "@/components/shell";
import { PropertyCard, PropertyImage } from "@/components/property";
import { PageLoading } from "@/components/ui";
import { cx, formatMNT } from "@/lib/format";
import { useLang } from "@/lib/i18n";
import { CATEGORY_LABELS, CATEGORY_ORDER } from "@/lib/labels";
import { publicProperties } from "@/lib/search";
import { useApp } from "@/lib/store";
import type { ListingType } from "@/lib/types";

const CAT_ICON_SEED: Record<string, number> = { apartment: 11, house: 5, land: 8, commercial: 3, office: 14, retail: 21, warehouse: 9, new_development: 4 };
const CAT_IMG_KIND: Record<string, string> = { apartment: "apartment", house: "house", land: "land", commercial: "commercial", office: "office", retail: "retail", warehouse: "warehouse", new_development: "development" };

export default function Home() {
  const { db, user, ready } = useApp();
  const { lang, tr, l } = useLang();
  const router = useRouter();
  const [type, setType] = useState<ListingType | "">("sale");
  const [district, setDistrict] = useState("");
  const [category, setCategory] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [guestRecent, setGuestRecent] = useState<string[]>([]);
  useEffect(() => {
    try {
      setGuestRecent(JSON.parse(localStorage.getItem("mt_recent_guest") || "[]"));
    } catch {}
  }, []);

  const pub = useMemo(() => (db ? publicProperties(db) : []), [db]);
  if (!ready || !db) return <PageLoading />;

  const premium = pub.filter((p) => p.promotion === "premium").slice(0, 4);
  const featured = pub.filter((p) => p.promotion === "featured").slice(0, 4);
  const recent = [...pub].sort((a, b) => new Date(b.publishedAt ?? b.createdAt).getTime() - new Date(a.publishedAt ?? a.createdAt).getTime()).slice(0, 8);
  const recentIds = user ? user.recentlyViewed : guestRecent;
  const recentlyViewed = recentIds.map((id) => pub.find((p) => p.id === id)).filter(Boolean).slice(0, 4) as typeof pub;
  const popularDistricts = db.districts.filter((d) => d.enabled && d.popular).map((d) => ({ d, n: pub.filter((p) => p.district === d.key).length }));
  const agents = db.users.filter((u) => u.role === "agent" && u.verified && u.active).slice(0, 4);
  const hero = premium[0] ?? pub[0];

  const go = (e: React.FormEvent) => {
    e.preventDefault();
    const q = new URLSearchParams();
    if (type) q.set("type", type);
    if (district) q.set("district", district);
    if (category) q.set("category", category);
    if (maxPrice) q.set("max", maxPrice);
    router.push(`/properties${q.toString() ? "?" + q.toString() : ""}`);
  };

  return (
    <>
      <section className="relative overflow-hidden bg-sky text-white">
        <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)", backgroundSize: "26px 26px" }} />
        <div className="container-x relative grid gap-10 py-14 lg:grid-cols-[1.1fr_0.9fr] lg:py-20">
          <div>
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.25em] text-brass-2">{tr("Улаанбаатар · Монгол", "Ulaanbaatar · Mongolia")}</p>
            <h1 className="h-display text-[44px] leading-[1.05] sm:text-6xl" data-testid="hero-title">{l(db.content.heroTitle)}</h1>
            <p className="mt-5 max-w-lg text-lg text-white/75">{l(db.content.heroSubtitle)}</p>
            <form onSubmit={go} className="mt-8 rounded-3xl bg-white p-3 text-ink shadow-lift" data-testid="hero-search">
              <div className="mb-3 flex flex-wrap gap-1 px-1">
                {([["sale", tr("Худалдах", "Buy")], ["rent", tr("Түрээс", "Rent")], ["long_lease", tr("Урт түрээс", "Long lease")], ["short_rent", tr("Богино түрээс", "Short stay")]] as [ListingType, string][]).map(([k, label]) => (
                  <button type="button" key={k} onClick={() => setType(k)} data-testid={`hero-type-${k}`} className={cx("rounded-full px-3.5 py-1.5 text-sm font-semibold transition", type === k ? "bg-sky text-white" : "text-ink-3 hover:bg-paper-2")}>{label}</button>
                ))}
              </div>
              <div className="grid gap-2 sm:grid-cols-[1fr_1fr_1fr_auto]">
                <select className="input" aria-label={tr("Дүүрэг", "District")} value={district} onChange={(e) => setDistrict(e.target.value)} data-testid="hero-district">
                  <option value="">{tr("Бүх дүүрэг", "All districts")}</option>
                  {db.districts.filter((d) => d.enabled).map((d) => <option key={d.key} value={d.key}>{d.name[lang]}</option>)}
                </select>
                <select className="input" aria-label={tr("Ангилал", "Category")} value={category} onChange={(e) => setCategory(e.target.value)} data-testid="hero-category">
                  <option value="">{tr("Бүх ангилал", "All categories")}</option>
                  {CATEGORY_ORDER.filter((k) => db.categories.find((c) => c.key === k)?.enabled !== false).map((k) => <option key={k} value={k}>{CATEGORY_LABELS[k][lang]}</option>)}
                </select>
                <select className="input" aria-label={tr("Дээд үнэ", "Max price")} value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} data-testid="hero-price">
                  <option value="">{tr("Дээд үнэ", "Max price")}</option>
                  {(type === "sale" || type === "" ? [150e6, 250e6, 400e6, 600e6, 1e9, 2e9] : type === "short_rent" ? [100e3, 150e3, 250e3] : [1e6, 2e6, 4e6, 8e6]).map((n) => <option key={n} value={n}>{formatMNT(n)}</option>)}
                </select>
                <button className="btn-primary !rounded-2xl px-7" data-testid="hero-submit"><Search size={16} /> {tr("Хайх", "Search")}</button>
              </div>
            </form>
            <div className="mt-6 flex flex-wrap gap-x-8 gap-y-2 text-sm text-white/70">
              <span className="flex items-center gap-2"><ShieldCheck size={16} className="text-brass-2" />{tr("Шалгагдсан зар", "Reviewed listings")}</span>
              <span className="flex items-center gap-2"><BadgeCheck size={16} className="text-brass-2" />{tr("Баталгаажсан агентууд", "Verified agents")}</span>
              <span className="flex items-center gap-2"><MapPin size={16} className="text-brass-2" />{tr("6 дүүрэг, хороо бүрээр", "6 districts, every khoroo")}</span>
            </div>
          </div>
          {hero && (
            <Link href={`/properties/${hero.id}`} className="group relative hidden self-center lg:block">
              <div className="aspect-[4/5] overflow-hidden rounded-[2rem] border border-white/20 shadow-lift">
                <PropertyImage src={hero.images[0]} alt={l(hero.title)} eager className="transition duration-700 group-hover:scale-105" />
              </div>
              <div className="absolute -bottom-5 -left-5 right-10 rounded-2xl bg-white p-4 text-ink shadow-lift">
                <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-brass">{tr("Премиум зар", "Premium listing")}</div>
                <div className="mt-1 font-display text-2xl font-semibold">{formatMNT(hero.price)}</div>
                <div className="truncate text-sm text-ink-3">{l(hero.title)}</div>
              </div>
            </Link>
          )}
        </div>
      </section>

      <Section title={tr("Ангиллаар үзэх", "Browse by category")} href="/properties" more={tr("Бүх зар", "All properties")}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {CATEGORY_ORDER.filter((k) => db.categories.find((c) => c.key === k)?.enabled !== false).map((k) => {
            const n = pub.filter((p) => p.category === k).length;
            return (
              <Link key={k} href={`/properties?category=${k}`} data-testid={`cat-${k}`} className="group relative aspect-[4/3] overflow-hidden rounded-2xl">
                <PropertyImage src={`gen:${CAT_IMG_KIND[k]}:${CAT_ICON_SEED[k]}`} alt="" className="transition duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/75 via-ink/10 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-3.5 text-white">
                  <div className="text-[15px] font-semibold leading-tight">{CATEGORY_LABELS[k][lang]}</div>
                  <div className="text-xs text-white/70">{n} {tr("зар", "listings")}</div>
                </div>
              </Link>
            );
          })}
        </div>
      </Section>

      {premium.length > 0 && (
        <Section title={tr("Премиум зарууд", "Premium listings")} sub={tr("Баталгаажсан, онцгой байршилтай сонголтууд", "Verified, standout properties")} href="/properties?sort=price_desc" more={tr("Бүгдийг үзэх", "See all")}>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{premium.map((p) => <PropertyCard key={p.id} p={p} db={db} />)}</div>
        </Section>
      )}

      {featured.length > 0 && (
        <Section title={tr("Онцлох зарууд", "Featured properties")}>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{featured.map((p) => <PropertyCard key={p.id} p={p} db={db} />)}</div>
        </Section>
      )}

      <Section title={tr("Шинээр нэмэгдсэн", "Recently added")} href="/properties?sort=newest" more={tr("Бүгдийг үзэх", "See all")}>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{recent.map((p) => <PropertyCard key={p.id} p={p} db={db} />)}</div>
      </Section>

      <Section title={tr("Алдартай байршил", "Popular locations")}>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {popularDistricts.map(({ d, n }, i) => (
            <Link key={d.key} href={`/properties?district=${d.key}`} data-testid={`loc-${d.key}`} className="group card flex items-center gap-4 p-3 transition hover:shadow-lift">
              <div className="h-16 w-20 shrink-0 overflow-hidden rounded-xl"><PropertyImage src={`gen:${["apartment", "house", "development", "office", "apartment", "commercial"][i % 6]}:${30 + i * 3}`} alt="" /></div>
              <div className="min-w-0 flex-1"><div className="font-display text-xl font-semibold">{d.name[lang]}</div><div className="text-xs text-ink-3">{n} {tr("зар", "listings")} · {d.khoroos} {tr("хороо", "khoroos")}</div></div>
              <ArrowRight size={16} className="text-ink-4 transition group-hover:translate-x-1" />
            </Link>
          ))}
        </div>
      </Section>

      {recentlyViewed.length > 0 && (
        <Section title={tr("Саяхан үзсэн", "Recently viewed")} testid="recently-viewed">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{recentlyViewed.map((p) => <PropertyCard key={p.id} p={p} db={db} />)}</div>
        </Section>
      )}

      <Section title={tr("Баталгаажсан агентууд", "Verified agents")} href="/agents" more={tr("Бүх агент", "All agents")}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {agents.map((a) => {
            const ag = db.agencies.find((x) => x.id === a.agencyId);
            const n = pub.filter((p) => p.agentId === a.id).length;
            return (
              <Link key={a.id} href={`/agents/${a.id}`} className="card p-5 text-center transition hover:shadow-lift">
                <div className="mx-auto w-fit"><Avatar name={a.name} color={a.avatarColor} src={a.avatar} size={64} /></div>
                <div className="mt-3 flex items-center justify-center gap-1 font-semibold">{a.name} <BadgeCheck size={15} className="text-sky" /></div>
                <div className="text-xs text-ink-3">{l(a.title)}</div>
                <div className="mt-1 text-xs text-brass">{ag?.name}</div>
                <div className="mt-3 text-xs text-ink-3">{n} {tr("идэвхтэй зар", "active listings")}</div>
              </Link>
            );
          })}
        </div>
      </Section>

      <section className="container-x mt-20">
        <div className="relative overflow-hidden rounded-[2rem] bg-ink px-8 py-12 text-white sm:px-14">
          <Building2 className="absolute -right-6 -top-6 text-white/5" size={220} />
          <div className="relative max-w-xl">
            <h2 className="h-display text-4xl">{tr("Агент эсвэл агентлаг уу?", "An agent or agency?")}</h2>
            <p className="mt-3 text-white/70">{tr("Зар байршуулах, харилцагчаа удирдах, үзлэг товлох бүх хэрэгсэл нэг дор. Үнэгүй эхлээд, өсөхдөө багцаа ахиулна.", "Listings, a built in CRM and viewing scheduling in one place. Start free and upgrade as you grow.")}</p>
            <div className="mt-6 flex flex-wrap gap-3"><Link href="/register?role=agent" className="btn-brass">{tr("Агентаар бүртгүүлэх", "Join as an agent")}</Link><Link href="/pricing" className="btn border border-white/25 text-white hover:bg-white/10">{tr("Багцуудыг харах", "See plans")}</Link></div>
          </div>
        </div>
      </section>
    </>
  );
}

function Section({ title, sub, href, more, children, testid }: { title: string; sub?: string; href?: string; more?: string; children: React.ReactNode; testid?: string }) {
  return (
    <section className="container-x mt-16" data-testid={testid}>
      <div className="mb-6 flex items-end justify-between gap-4">
        <div><h2 className="h-display text-3xl sm:text-4xl">{title}</h2>{sub && <p className="mt-1 text-sm text-ink-3">{sub}</p>}</div>
        {href && more && <Link href={href} className="hidden shrink-0 items-center gap-1 text-sm font-semibold text-sky hover:underline sm:flex">{more} <ArrowRight size={14} /></Link>}
      </div>
      {children}
    </section>
  );
}
