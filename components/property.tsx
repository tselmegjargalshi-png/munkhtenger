"use client";
import { BadgeCheck, Bath, BedDouble, GitCompareArrows, Heart, Maximize2, MapPin, Star } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge, toast, useRun } from "./ui";
import { useLang } from "@/lib/i18n";
import { resolveImage } from "@/lib/images";
import { formatMNT, khorooLabel, priceSuffix, cx, m2 } from "@/lib/format";
import { CATEGORY_LABELS, LISTING_TYPE_SHORT } from "@/lib/labels";
import { toggleFavorite } from "@/lib/actions";
import { toggleCompare, useCompare } from "@/lib/compare";
import { useApp } from "@/lib/store";
import type { Db, Property } from "@/lib/types";

export function PropertyImage({ src, alt, className, eager }: { src: string; alt: string; className?: string; eager?: boolean }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={resolveImage(src)} alt={alt} loading={eager ? "eager" : "lazy"} decoding="async" className={cx("h-full w-full object-cover", className)} />;
}

export function districtName(db: Db, key: string, lang: "mn" | "en") {
  const d = db.districts.find((x) => x.key === key);
  return d ? d.name[lang] : key;
}

export function FavoriteButton({ id, className }: { id: string; className?: string }) {
  const { user } = useApp();
  const { tr } = useLang();
  const router = useRouter();
  const run = useRun();
  const on = !!user?.favorites.includes(id);
  return (
    <button
      type="button"
      data-testid="favorite-btn"
      aria-pressed={on}
      aria-label={on ? tr("Хадгалснаас хасах", "Remove from saved") : tr("Хадгалах", "Save")}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!user) {
          toast(tr("Хадгалахын тулд нэвтэрнэ үү", "Sign in to save properties"), "err");
          router.push(`/login?next=${encodeURIComponent(location.pathname + location.search)}`);
          return;
        }
        run(() => {
          const now = toggleFavorite(id);
          toast(now ? tr("Хадгаллаа", "Saved") : tr("Хадгалснаас хаслаа", "Removed from saved"));
        });
      }}
      className={cx("grid h-9 w-9 place-items-center rounded-full bg-white/95 text-ink shadow-card transition hover:scale-105", className)}
    >
      <Heart size={17} className={on ? "fill-rust text-rust" : ""} />
    </button>
  );
}

export function CompareButton({ id, className, label }: { id: string; className?: string; label?: boolean }) {
  const ids = useCompare();
  const { tr } = useLang();
  const on = ids.includes(id);
  return (
    <button
      type="button"
      data-testid="compare-btn"
      aria-pressed={on}
      aria-label={on ? tr("Харьцуулалтаас хасах", "Remove from compare") : tr("Харьцуулах", "Compare")}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        const r = toggleCompare(id);
        if (r === "full") toast(tr("Дээд тал нь 4 зар харьцуулна", "You can compare up to 4 properties"), "err");
        else toast(r === "added" ? tr("Харьцуулалтад нэмлээ", "Added to compare") : tr("Харьцуулалтаас хаслаа", "Removed from compare"));
      }}
      className={cx(label ? "btn-ghost" : "grid h-9 w-9 place-items-center rounded-full bg-white/95 text-ink shadow-card transition hover:scale-105", on && (label ? "!border-sky !bg-sky-soft !text-sky" : "!bg-sky !text-white"), className)}
    >
      <GitCompareArrows size={label ? 16 : 16} />
      {label && (on ? tr("Харьцуулалтад нэмэгдсэн", "In comparison") : tr("Харьцуулах", "Compare"))}
    </button>
  );
}

export function PromoBadge({ p }: { p: Property }) {
  const { tr } = useLang();
  if (p.promotion === "premium") return <Badge tone="dark"><Star size={11} className="fill-brass-2 text-brass-2" />{tr("Премиум", "Premium")}</Badge>;
  if (p.promotion === "featured") return <Badge tone="brass">{tr("Онцлох", "Featured")}</Badge>;
  return null;
}

export function PropertyCard({ p, db, layout = "grid", priority }: { p: Property; db: Db; layout?: "grid" | "list"; priority?: boolean }) {
  const { lang, l, tr } = useLang();
  const isList = layout === "list";
  const isLand = p.category === "land";
  return (
    <Link
      href={`/properties/${p.id}`}
      data-testid="property-card"
      className={cx("group card overflow-hidden transition duration-300 hover:-translate-y-0.5 hover:shadow-lift", isList ? "flex flex-col sm:flex-row" : "block", p.promotion === "premium" && "ring-1 ring-brass/50")}
    >
      <div className={cx("relative overflow-hidden bg-paper-2", isList ? "aspect-[16/10] sm:aspect-auto sm:w-72 sm:shrink-0" : "aspect-[4/3]")}>
        <PropertyImage src={p.images[0]} alt={l(p.title)} eager={priority} className="transition duration-500 group-hover:scale-[1.04]" />
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          <Badge tone="sky">{LISTING_TYPE_SHORT[p.listingType][lang]}</Badge>
          <PromoBadge p={p} />
        </div>
        <div className="absolute right-3 top-3 flex flex-col gap-1.5"><FavoriteButton id={p.id} /><CompareButton id={p.id} /></div>
        {p.demo && <span className="absolute bottom-2 left-3 rounded bg-ink/60 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-white/90">{tr("Демо зураг", "Demo image")}</span>}
      </div>
      <div className="flex-1 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="font-display text-[26px] font-semibold leading-none text-ink">
            {formatMNT(p.price)}
            <span className="font-sans text-xs font-medium text-ink-3">{priceSuffix(p.listingType, lang)}</span>
          </div>
          {p.verified && <BadgeCheck size={18} className="shrink-0 text-sky" aria-label={tr("Баталгаажсан", "Verified")} />}
        </div>
        <h3 className="mt-2 line-clamp-2 text-[15px] font-semibold leading-snug text-ink">{l(p.title)}</h3>
        <p className="mt-1 flex items-center gap-1 text-xs text-ink-3">
          <MapPin size={13} /> {districtName(db, p.district, lang)}{lang === "mn" ? " дүүрэг" : " District"}, {khorooLabel(p.khoroo, lang)}
        </p>
        <div className="mt-3 flex items-center gap-4 border-t border-paper-3/70 pt-3 text-xs text-ink-2">
          {!isLand && p.bedrooms > 0 && <span className="flex items-center gap-1"><BedDouble size={14} className="text-ink-4" />{p.bedrooms}</span>}
          {!isLand && p.bathrooms > 0 && <span className="flex items-center gap-1"><Bath size={14} className="text-ink-4" />{p.bathrooms}</span>}
          <span className="flex items-center gap-1"><Maximize2 size={13} className="text-ink-4" />{p.area.toLocaleString("en-US")} {m2(lang)}</span>
          <span className="ml-auto text-ink-4">{CATEGORY_LABELS[p.category][lang]}</span>
        </div>
      </div>
    </Link>
  );
}
