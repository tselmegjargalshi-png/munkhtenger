"use client";
import { BadgeCheck, Bath, BedDouble, Building, CalendarDays, Check, ChevronLeft, ChevronRight, Flag, Layers, MapPin, Maximize2, Phone, Share2, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { DemoMap } from "@/components/demo-map";
import { Avatar } from "@/components/shell";
import { CompareButton, FavoriteButton, PromoBadge, PropertyCard, PropertyImage, districtName } from "@/components/property";
import { Badge, Empty, Field, Modal, PageLoading, toast, useRun } from "@/components/ui";
import { requestViewing, submitInquiry, submitReport, trackView } from "@/lib/actions";
import { cx, formatDate, formatMNT, formatPhone, khorooLabel, m2, priceSuffix } from "@/lib/format";
import { useLang } from "@/lib/i18n";
import { AMENITIES, CATEGORY_LABELS, LISTING_TYPE_LABELS, NEARBY_LABELS, STATUS_LABELS } from "@/lib/labels";
import { canManageProperty } from "@/lib/perms";
import { similarProperties } from "@/lib/search";
import { useApp } from "@/lib/store";

export function DetailClient({ id }: { id: string }) {
  const { db, user, ready } = useApp();
  const { lang, tr, l } = useLang();
  const run = useRun();
  const [idx, setIdx] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const [showPhone, setShowPhone] = useState(false);
  const [viewingOpen, setViewingOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const p = db?.properties.find((x) => x.id === id);
  const visible = !!p && (p.status === "published" || canManageProperty(user, p));

  useEffect(() => {
    if (ready && p && p.status === "published") trackView(p.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, p?.id]);

  const similar = useMemo(() => (db && p ? similarProperties(db, p, 4) : []), [db, p]);

  if (!ready || !db) return <PageLoading />;
  if (!p || !visible)
    return (
      <div className="container-x py-20">
        <Empty title={tr("Зар олдсонгүй", "Listing not found")} text={tr("Энэ зар устгагдсан эсвэл нийтлэгдээгүй байна.", "This listing was removed or is not published.")} action={{ label: tr("Бусад зарыг үзэх", "Browse other listings"), href: "/properties" }} />
      </div>
    );

  const agent = db.users.find((u) => u.id === p.agentId);
  const agency = db.agencies.find((a) => a.id === p.agencyId);
  const isLand = p.category === "land";
  const ppm = p.area ? Math.round(p.price / p.area) : 0;
  const next = () => setIdx((i) => (i + 1) % p.images.length);
  const prev = () => setIdx((i) => (i - 1 + p.images.length) % p.images.length);

  const specs: [React.ReactNode, string, string][] = [
    [<Maximize2 key="a" size={18} />, `${p.area.toLocaleString("en-US")} ${m2(lang)}`, tr("Нийт талбай", "Total area")],
    ...(!isLand && p.rooms ? ([[<Building key="r" size={18} />, String(p.rooms), tr("Өрөө", "Rooms")]] as [React.ReactNode, string, string][]) : []),
    ...(!isLand && p.bedrooms ? ([[<BedDouble key="b" size={18} />, String(p.bedrooms), tr("Унтлагын өрөө", "Bedrooms")]] as [React.ReactNode, string, string][]) : []),
    ...(!isLand && p.bathrooms ? ([[<Bath key="t" size={18} />, String(p.bathrooms), tr("Угаалгын өрөө", "Bathrooms")]] as [React.ReactNode, string, string][]) : []),
    ...(!isLand && p.floor ? ([[<Layers key="f" size={18} />, `${p.floor} / ${p.buildingFloors}`, tr("Давхар", "Floor")]] as [React.ReactNode, string, string][]) : []),
    ...(p.yearBuilt ? ([[<CalendarDays key="y" size={18} />, String(p.yearBuilt), tr("Ашиглалтад орсон", "Year built")]] as [React.ReactNode, string, string][]) : []),
  ];

  return (
    <div className="container-x py-6" data-testid="property-detail">
      {p.status !== "published" && (
        <div className="mb-4 rounded-xl border border-brass/40 bg-brass-soft px-4 py-3 text-sm text-[#7C5B2B]" data-testid="preview-banner">
          {tr("Урьдчилан харж байна. Төлөв:", "Preview only. Status:")} <b>{STATUS_LABELS[p.status][lang]}</b>. {tr("Энэ зар олон нийтэд харагдахгүй.", "This listing is not visible to the public.")}
          {p.rejectionReason && <> {tr("Шалтгаан:", "Reason:")} {p.rejectionReason}</>}
        </div>
      )}
      <nav className="mb-4 text-xs text-ink-3" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-ink">{tr("Нүүр", "Home")}</Link> / <Link href={`/properties?category=${p.category}`} className="hover:text-ink">{CATEGORY_LABELS[p.category][lang]}</Link> / <span className="text-ink-2">{p.code}</span>
      </nav>

      <div className="grid gap-2 overflow-hidden rounded-3xl md:grid-cols-[2fr_1fr] md:grid-rows-2" data-testid="gallery">
        <button className="group relative aspect-[16/10] overflow-hidden md:row-span-2 md:aspect-auto md:min-h-[460px]" onClick={() => setLightbox(true)} aria-label={tr("Зургийг томруулах", "Enlarge photo")} data-testid="gallery-main">
          <PropertyImage src={p.images[idx]} alt={l(p.title)} eager className="transition duration-500 group-hover:scale-[1.02]" />
          <div className="absolute left-4 top-4 flex gap-2"><Badge tone="sky">{LISTING_TYPE_LABELS[p.listingType][lang]}</Badge><PromoBadge p={p} /></div>
          <span className="absolute bottom-4 right-4 rounded-full bg-ink/70 px-3 py-1 text-xs font-semibold text-white">{idx + 1} / {p.images.length}</span>
        </button>
        {[1, 2].map((o) => {
          const i = (idx + o) % p.images.length;
          return p.images.length > o ? (
            <button key={o} className="relative hidden aspect-[4/3] overflow-hidden md:block" onClick={() => setIdx(i)} aria-label={`${tr("Зураг", "Photo")} ${i + 1}`}>
              <PropertyImage src={p.images[i]} alt="" className="transition duration-500 hover:scale-105" />
              {o === 2 && p.images.length > 3 && <span className="absolute inset-0 grid place-items-center bg-ink/45 text-sm font-semibold text-white" onClick={(e) => { e.stopPropagation(); setLightbox(true); }}>+{p.images.length - 3} {tr("зураг", "photos")}</span>}
            </button>
          ) : <div key={o} className="hidden bg-paper-2 md:block" />;
        })}
      </div>
      <div className="no-scrollbar mt-2 flex gap-2 overflow-x-auto md:hidden">
        {p.images.map((im, i) => <button key={i} onClick={() => setIdx(i)} className={cx("h-14 w-20 shrink-0 overflow-hidden rounded-lg border-2", i === idx ? "border-sky" : "border-transparent")}><PropertyImage src={im} alt="" /></button>)}
      </div>
      {p.demo && <p className="mt-2 text-xs text-ink-4">{tr("Зургууд нь демо зориулалттай зохиомол дүрслэл болно.", "Photos are generated illustrations for demo purposes.")}</p>}

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_380px]">
        <div className="min-w-0">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="mb-2 flex flex-wrap items-center gap-2 text-xs font-semibold text-ink-3"><span data-testid="listing-id" className="rounded bg-paper-2 px-2 py-0.5 font-mono">{p.code}</span>{p.verified && <span className="flex items-center gap-1 text-sky"><BadgeCheck size={14} />{tr("Баталгаажсан зар", "Verified listing")}</span>}<span>{tr("Нийтэлсэн", "Posted")} {formatDate(p.publishedAt ?? p.createdAt, lang)}</span></div>
              <h1 className="h-display text-3xl leading-tight sm:text-4xl" data-testid="detail-title">{l(p.title)}</h1>
              <p className="mt-2 flex items-center gap-1.5 text-ink-3"><MapPin size={16} />{p.address}</p>
            </div>
            <div className="flex gap-2">
              <FavoriteButton id={p.id} className="!h-11 !w-11 border border-paper-3" />
              <CompareButton id={p.id} className="!h-11 !w-11 border border-paper-3" />
              <button className="grid h-11 w-11 place-items-center rounded-full border border-paper-3 bg-white hover:bg-paper-2" aria-label={tr("Хуваалцах", "Share")} data-testid="share-btn" onClick={async () => {
                const url = location.href;
                try {
                  if (navigator.share) await navigator.share({ title: l(p.title), url });
                  else { await navigator.clipboard.writeText(url); toast(tr("Холбоос хуулагдлаа", "Link copied")); }
                } catch { toast(tr("Холбоос: ", "Link: ") + url); }
              }}><Share2 size={17} /></button>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-end gap-x-6 gap-y-1">
            <div className="font-display text-5xl font-semibold" data-testid="detail-price">{formatMNT(p.price)}<span className="font-sans text-sm font-medium text-ink-3">{priceSuffix(p.listingType, lang)}</span></div>
            {ppm > 0 && p.listingType === "sale" && <div className="pb-1.5 text-sm text-ink-3">{formatMNT(ppm)} / {m2(lang)}</div>}
          </div>

          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {specs.map(([icon, v, label]) => (
              <div key={label} className="flex items-center gap-3 rounded-2xl border border-paper-3 bg-white p-3.5"><span className="grid h-10 w-10 place-items-center rounded-xl bg-sky-soft text-sky">{icon}</span><div><div className="text-lg font-semibold leading-tight">{v}</div><div className="text-xs text-ink-3">{label}</div></div></div>
            ))}
          </div>

          <h2 className="h-display mt-10 text-2xl">{tr("Тайлбар", "Description")}</h2>
          <p className="mt-3 whitespace-pre-line leading-relaxed text-ink-2">{l(p.description)}</p>

          <h2 className="h-display mt-10 text-2xl">{tr("Барилга ба байршил", "Building and location")}</h2>
          <dl className="mt-3 grid gap-x-8 sm:grid-cols-2">
            {([
              [tr("Ангилал", "Category"), CATEGORY_LABELS[p.category][lang]],
              [tr("Дүүрэг", "District"), districtName(db, p.district, lang)],
              [tr("Хороо", "Khoroo"), khorooLabel(p.khoroo, lang)],
              ...(p.buildingFloors ? [[tr("Барилгын давхар", "Building floors"), String(p.buildingFloors)]] : []),
              ...(p.yearBuilt ? [[tr("Барилгын нас", "Building age"), `${new Date().getFullYear() - p.yearBuilt} ${tr("жил", "years")}`]] : []),
              ...(p.landArea ? [[tr("Газрын хэмжээ", "Land area"), `${p.landArea.toLocaleString("en-US")} ${m2(lang)}`]] : []),
              [tr("Тавилга", "Furnished"), p.furnished ? tr("Тийм", "Yes") : tr("Үгүй", "No")],
              [tr("Зогсоол", "Parking"), p.parking ? tr("Тийм", "Yes") : tr("Үгүй", "No")],
              [tr("Тагт", "Balcony"), p.balcony ? tr("Тийм", "Yes") : tr("Үгүй", "No")],
              [tr("Цахилгаан шат", "Elevator"), p.elevator ? tr("Тийм", "Yes") : tr("Үгүй", "No")],
            ] as [string, string][]).map(([k, v]) => <div key={k} className="flex justify-between border-b border-paper-3/70 py-2.5 text-sm"><dt className="text-ink-3">{k}</dt><dd className="font-semibold">{v}</dd></div>)}
          </dl>

          {p.amenities.length > 0 && (
            <>
              <h2 className="h-display mt-10 text-2xl">{tr("Тохижилт, үйлчилгээ", "Amenities")}</h2>
              <ul className="mt-3 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3" data-testid="amenities">
                {p.amenities.map((a) => <li key={a} className="flex items-center gap-2 text-sm"><Check size={15} className="shrink-0 text-moss" />{AMENITIES[a]?.[lang] ?? a}</li>)}
              </ul>
            </>
          )}

          <h2 className="h-display mt-10 text-2xl">{tr("Ойр орчим", "Nearby")}</h2>
          <ul className="mt-3 grid gap-2.5 sm:grid-cols-2" data-testid="nearby">
            {p.nearby.map((n, i) => (
              <li key={i} className="flex items-center justify-between rounded-xl border border-paper-3 bg-white px-3.5 py-2.5 text-sm"><span><span className="mr-2 text-xs font-semibold uppercase tracking-wide text-brass">{NEARBY_LABELS[n.type][lang]}</span>{l(n.name)}</span><span className="text-ink-3">{n.distanceM >= 1000 ? `${(n.distanceM / 1000).toFixed(1)} ${tr("км", "km")}` : `${n.distanceM} ${tr("м", "m")}`}</span></li>
            ))}
          </ul>

          <h2 className="h-display mt-10 text-2xl">{tr("Газрын зураг дээрх байршил", "Map location")}</h2>
          <div className="mt-3"><DemoMap properties={[p]} districts={db.districts} selectedId={p.id} onSelect={() => {}} bbox={null} onBbox={() => {}} height={340} /></div>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="card p-5" data-testid="agent-card">
            {agent && (
              <div className="flex items-center gap-3">
                <Avatar name={agent.name} color={agent.avatarColor} src={agent.avatar} size={56} />
                <div className="min-w-0">
                  <Link href={`/agents/${agent.id}`} className="flex items-center gap-1 font-semibold hover:underline">{agent.name}{agent.verified && <BadgeCheck size={15} className="text-sky" />}</Link>
                  <div className="text-xs text-ink-3">{l(agent.title) || (agent.role === "owner" ? tr("Өмчлөгч", "Owner") : "")}</div>
                  {agency && <div className="text-xs text-brass">{agency.name}</div>}
                </div>
              </div>
            )}
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button className="btn-ghost" data-testid="show-phone" onClick={() => setShowPhone(true)}><Phone size={15} />{showPhone && agent ? formatPhone(agent.phone) : tr("Утас харах", "Show phone")}</button>
              {showPhone && agent ? <a href={`tel:+976${agent.phone}`} className="btn-primary" data-testid="call-agent">{tr("Залгах", "Call")}</a> : <button className="btn-primary" onClick={() => document.getElementById("inquiry-form")?.scrollIntoView({ behavior: "smooth", block: "center" })} data-testid="contact-agent">{tr("Агенттай холбогдох", "Contact agent")}</button>}
            </div>
            <button className="btn-brass mt-2 w-full" data-testid="schedule-viewing" onClick={() => setViewingOpen(true)}><CalendarDays size={15} />{tr("Үзлэг товлох", "Schedule a viewing")}</button>
          </div>

          <InquiryForm propertyId={p.id} />
          <button className="mt-3 flex items-center gap-1.5 text-xs text-ink-4 hover:text-rust" onClick={() => setReportOpen(true)} data-testid="report-btn"><Flag size={12} />{tr("Зарыг мэдэгдэх", "Report this listing")}</button>
        </aside>
      </div>

      {similar.length > 0 && (
        <section className="mt-16" data-testid="similar">
          <h2 className="h-display mb-6 text-3xl">{tr("Төстэй зарууд", "Similar properties")}</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{similar.map((s) => <PropertyCard key={s.id} p={s} db={db} />)}</div>
        </section>
      )}

      {lightbox && <Lightbox images={p.images} index={idx} setIndex={setIdx} onClose={() => setLightbox(false)} next={next} prev={prev} alt={l(p.title)} />}
      <ViewingModal open={viewingOpen} onClose={() => setViewingOpen(false)} propertyId={p.id} />
      <ReportModal open={reportOpen} onClose={() => setReportOpen(false)} propertyId={p.id} />
    </div>
  );
}

function Lightbox({ images, index, setIndex, onClose, next, prev, alt }: { images: string[]; index: number; setIndex: (i: number) => void; onClose: () => void; next: () => void; prev: () => void; alt: string }) {
  const { tr } = useLang();
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); if (e.key === "ArrowRight") next(); if (e.key === "ArrowLeft") prev(); };
    window.addEventListener("keydown", k);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", k); document.body.style.overflow = prevOverflow; };
  }, [onClose, next, prev]);
  return (
    <div className="fixed inset-0 z-[95] flex flex-col bg-ink/95" role="dialog" aria-modal="true" aria-label={tr("Зургийн цомог", "Photo gallery")} data-testid="lightbox">
      <div className="flex items-center justify-between p-4 text-white"><span className="text-sm">{index + 1} / {images.length}</span><button onClick={onClose} aria-label={tr("Хаах", "Close")} data-testid="lightbox-close" className="rounded-full p-2 hover:bg-white/10"><X size={22} /></button></div>
      <div className="relative flex min-h-0 flex-1 items-center justify-center px-4 sm:px-16">
        <button onClick={prev} aria-label={tr("Өмнөх", "Previous")} className="absolute left-2 grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20 sm:left-6"><ChevronLeft /></button>
        <div className="aspect-[16/10] max-h-full w-full max-w-5xl overflow-hidden rounded-2xl"><PropertyImage src={images[index]} alt={alt} className="!object-contain" /></div>
        <button onClick={next} aria-label={tr("Дараах", "Next")} data-testid="lightbox-next" className="absolute right-2 grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20 sm:right-6"><ChevronRight /></button>
      </div>
      <div className="no-scrollbar flex justify-center gap-2 overflow-x-auto p-4">{images.map((im, i) => <button key={i} onClick={() => setIndex(i)} className={cx("h-14 w-20 shrink-0 overflow-hidden rounded-lg border-2 opacity-70 hover:opacity-100", i === index ? "border-brass-2 !opacity-100" : "border-transparent")}><PropertyImage src={im} alt="" /></button>)}</div>
    </div>
  );
}

function InquiryForm({ propertyId }: { propertyId: string }) {
  const { user } = useApp();
  const { tr } = useLang();
  const run = useRun();
  const [f, setF] = useState({ name: "", phone: "", email: "", message: "" });
  const [sent, setSent] = useState(false);
  useEffect(() => {
    if (user) setF((x) => ({ ...x, name: x.name || user.name, phone: x.phone || user.phone, email: x.email || user.email }));
  }, [user]);
  if (sent)
    return (
      <div className="card mt-4 p-5 text-center" data-testid="inquiry-sent">
        <div className="mx-auto mb-2 grid h-10 w-10 place-items-center rounded-full bg-moss-soft text-moss"><Check size={20} /></div>
        <h3 className="font-semibold">{tr("Лавлагаа илгээгдлээ", "Inquiry sent")}</h3>
        <p className="mt-1 text-sm text-ink-3">{tr("Агент тантай удахгүй холбогдоно.", "The agent will contact you shortly.")}{user?.role === "customer" && <> <Link href="/account/inquiries" className="font-semibold text-sky">{tr("Лавлагаагаа харах", "View my inquiries")}</Link></>}</p>
        <button className="mt-3 text-xs font-semibold text-sky" onClick={() => { setSent(false); setF((x) => ({ ...x, message: "" })); }}>{tr("Дахин илгээх", "Send another")}</button>
      </div>
    );
  return (
    <form id="inquiry-form" className="card mt-4 space-y-3 p-5" data-testid="inquiry-form" onSubmit={(e) => { e.preventDefault(); run(() => { submitInquiry(propertyId, f); setSent(true); }); }}>
      <h3 className="font-display text-xl font-semibold">{tr("Лавлагаа илгээх", "Send an inquiry")}</h3>
      <Field label={tr("Нэр", "Name")}><input className="input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} data-testid="inq-name" autoComplete="name" /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label={tr("Утас", "Phone")}><input className="input" inputMode="tel" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} data-testid="inq-phone" placeholder="9911 2233" autoComplete="tel" /></Field>
        <Field label={tr("Имэйл", "Email")}><input className="input" type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} data-testid="inq-email" autoComplete="email" /></Field>
      </div>
      <Field label={tr("Зурвас", "Message")}><textarea className="input min-h-24 resize-y" value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} data-testid="inq-message" placeholder={tr("Сайн байна уу, энэ зарын талаар лавлах гэсэн юм...", "Hello, I would like to ask about this listing.")} /></Field>
      <button className="btn-primary w-full" data-testid="inq-submit">{tr("Илгээх", "Send inquiry")}</button>
      <p className="text-[11px] text-ink-4">{tr("Таны мэдээлэл зөвхөн энэ зарын агентад очно.", "Your details are shared only with this listing's agent.")}</p>
    </form>
  );
}

function ViewingModal({ open, onClose, propertyId }: { open: boolean; onClose: () => void; propertyId: string }) {
  const { user } = useApp();
  const { tr } = useLang();
  const run = useRun();
  const [f, setF] = useState({ name: "", phone: "", date: "", note: "" });
  useEffect(() => {
    if (user) setF((x) => ({ ...x, name: x.name || user.name, phone: x.phone || user.phone }));
  }, [user, open]);
  const min = new Date(Date.now() - new Date().getTimezoneOffset() * 6e4).toISOString().slice(0, 16);
  return (
    <Modal open={open} onClose={onClose} title={tr("Үзлэг товлох", "Schedule a viewing")}>
      <form className="space-y-4" data-testid="viewing-form" onSubmit={(e) => { e.preventDefault(); run(() => { requestViewing(propertyId, f); onClose(); }, tr("Үзлэгийн хүсэлт илгээгдлээ. Агент баталгаажуулна.", "Viewing request sent. The agent will confirm.")); }}>
        <Field label={tr("Нэр", "Name")}><input className="input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} data-testid="vw-name" /></Field>
        <Field label={tr("Утас", "Phone")}><input className="input" inputMode="tel" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} data-testid="vw-phone" placeholder="9911 2233" /></Field>
        <Field label={tr("Огноо, цаг", "Date and time")}><input className="input" type="datetime-local" min={min} value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} data-testid="vw-date" /></Field>
        <Field label={tr("Нэмэлт тайлбар", "Note")}><textarea className="input" value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} data-testid="vw-note" /></Field>
        <div className="flex justify-end gap-2"><button type="button" className="btn-ghost" onClick={onClose}>{tr("Болих", "Cancel")}</button><button className="btn-primary" data-testid="vw-submit">{tr("Хүсэлт илгээх", "Request viewing")}</button></div>
      </form>
    </Modal>
  );
}

function ReportModal({ open, onClose, propertyId }: { open: boolean; onClose: () => void; propertyId: string }) {
  const { tr } = useLang();
  const run = useRun();
  const [reason, setReason] = useState<"incorrect" | "duplicate" | "sold" | "scam" | "other">("incorrect");
  const [details, setDetails] = useState("");
  return (
    <Modal open={open} onClose={onClose} title={tr("Зарыг мэдэгдэх", "Report this listing")}>
      <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); run(() => { submitReport(propertyId, reason, details); onClose(); setDetails(""); }, tr("Мэдэгдсэнд баярлалаа", "Thanks, your report was sent")); }}>
        <Field label={tr("Шалтгаан", "Reason")}>
          <select className="input" value={reason} onChange={(e) => setReason(e.target.value as typeof reason)}>
            <option value="incorrect">{tr("Буруу мэдээлэл", "Incorrect information")}</option><option value="duplicate">{tr("Давхардсан зар", "Duplicate listing")}</option><option value="sold">{tr("Зарагдсан эсвэл түрээслэгдсэн", "Already sold or rented")}</option><option value="scam">{tr("Залилан сэжигтэй", "Suspected scam")}</option><option value="other">{tr("Бусад", "Other")}</option>
          </select>
        </Field>
        <Field label={tr("Дэлгэрэнгүй", "Details")}><textarea className="input" value={details} onChange={(e) => setDetails(e.target.value)} /></Field>
        <div className="flex justify-end gap-2"><button type="button" className="btn-ghost" onClick={onClose}>{tr("Болих", "Cancel")}</button><button className="btn-primary">{tr("Илгээх", "Submit")}</button></div>
      </form>
    </Modal>
  );
}
