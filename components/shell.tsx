"use client";
import { Bell, ChevronDown, Globe, LogOut, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Logo } from "./brand";
import { toast } from "./ui";
import { logout, markNotificationRead, runMaintenance } from "@/lib/actions";
import { cx, timeAgo } from "@/lib/format";
import { useLang } from "@/lib/i18n";
import { NOTIFICATION_TEXT, ROLE_LABELS } from "@/lib/labels";
import { dashboardPath } from "@/lib/perms";
import { resetDemo, useApp } from "@/lib/store";

export function Avatar({ name, color, src, size = 32 }: { name: string; color: string; src?: string; size?: number }) {
  if (src)
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={name} width={size} height={size} className="rounded-full object-cover" style={{ width: size, height: size }} />;
  const initial = name.replace(/^[^\p{L}]*\p{L}\.\s*/u, "").charAt(0) || name.charAt(0);
  return (
    <span className="inline-grid shrink-0 place-items-center rounded-full font-semibold text-white" style={{ width: size, height: size, background: color, fontSize: size * 0.42 }}>
      {initial.toUpperCase()}
    </span>
  );
}

export function DemoBanner() {
  const { db } = useApp();
  const { tr, l } = useLang();
  const [hidden, setHidden] = useState(false);
  if (!db || hidden || !db.content.announcementOn) return null;
  return (
    <div className="bg-ink text-[12px] text-white/90" data-testid="demo-banner">
      <div className="container-x flex items-center justify-between gap-3 py-1.5">
        <p>
          <span className="mr-2 rounded bg-brass px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">{tr("Демо", "Demo")}</span>
          {l(db.content.announcement)}
        </p>
        <button onClick={() => setHidden(true)} aria-label={tr("Хаах", "Dismiss")} className="shrink-0 text-white/70 hover:text-white"><X size={14} /></button>
      </div>
    </div>
  );
}

function NotificationBell() {
  const { db, user } = useApp();
  const { lang, tr } = useLang();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  useEffect(() => {
    const h = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  if (!db || !user) return null;
  const mine = db.notifications.filter((n) => n.userId === user.id);
  const unread = mine.filter((n) => !n.read).length;
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen((o) => !o)} aria-label={tr("Мэдэгдэл", "Notifications")} data-testid="bell" className="relative grid h-10 w-10 place-items-center rounded-full text-ink-2 hover:bg-paper-2">
        <Bell size={19} />
        {unread > 0 && <span data-testid="bell-count" className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-rust px-1 text-[10px] font-bold text-white">{unread > 9 ? "9+" : unread}</span>}
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-[min(92vw,380px)] animate-fadeUp overflow-hidden rounded-2xl border border-paper-3 bg-white shadow-lift">
          <div className="flex items-center justify-between border-b border-paper-3 px-4 py-3">
            <span className="text-sm font-semibold">{tr("Мэдэгдэл", "Notifications")}</span>
            <Link href="/notifications" onClick={() => setOpen(false)} className="text-xs font-semibold text-sky">{tr("Бүгдийг харах", "View all")}</Link>
          </div>
          <ul className="max-h-96 divide-y divide-paper-3/70 overflow-y-auto">
            {mine.length === 0 && <li className="px-4 py-8 text-center text-sm text-ink-3">{tr("Мэдэгдэл алга", "No notifications yet")}</li>}
            {mine.slice(0, 7).map((n) => (
              <li key={n.id}>
                <button
                  onClick={() => {
                    markNotificationRead(n.id);
                    setOpen(false);
                    router.push(n.link);
                  }}
                  className={cx("w-full px-4 py-3 text-left text-sm hover:bg-paper-2", !n.read && "bg-sky-soft/50")}
                >
                  <span className="block leading-snug text-ink-2">{NOTIFICATION_TEXT[n.type](n.params)[lang]}</span>
                  <span className="mt-1 block text-xs text-ink-4">{timeAgo(n.createdAt, lang)}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function UserMenu() {
  const { user } = useApp();
  const { lang, tr } = useLang();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  useEffect(() => {
    const h = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  if (!user)
    return (
      <div className="flex items-center gap-2">
        <Link href="/login" className="btn-ghost btn-sm hidden sm:inline-flex" data-testid="nav-login">{tr("Нэвтрэх", "Sign in")}</Link>
        <Link href="/register" className="btn-primary btn-sm" data-testid="nav-register">{tr("Бүртгүүлэх", "Join")}</Link>
      </div>
    );
  const dash = dashboardPath(user.role);
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen((o) => !o)} data-testid="user-menu" className="flex items-center gap-2 rounded-full border border-paper-3 bg-white py-1 pl-1 pr-2.5 hover:border-ink-4">
        <Avatar name={user.name} color={user.avatarColor} src={user.avatar} size={30} />
        <span className="hidden max-w-[110px] truncate text-sm font-semibold sm:block">{user.name}</span>
        <ChevronDown size={14} className="text-ink-3" />
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-64 animate-fadeUp overflow-hidden rounded-2xl border border-paper-3 bg-white shadow-lift">
          <div className="border-b border-paper-3 px-4 py-3">
            <div className="truncate text-sm font-semibold">{user.name}</div>
            <div className="truncate text-xs text-ink-3">{user.email}</div>
            <div className="mt-1.5 text-[11px] font-semibold uppercase tracking-wide text-brass" data-testid="role-label">{ROLE_LABELS[user.role][lang]}</div>
          </div>
          <div className="p-1.5 text-sm">
            <Link href={dash} onClick={() => setOpen(false)} className="block rounded-lg px-3 py-2 hover:bg-paper-2" data-testid="menu-dashboard">{user.role === "customer" ? tr("Миний хуудас", "My account") : tr("Самбар", "Dashboard")}</Link>
            {user.role !== "customer" && <Link href="/account/profile" onClick={() => setOpen(false)} className="block rounded-lg px-3 py-2 hover:bg-paper-2">{tr("Профайл", "Profile")}</Link>}
            <Link href="/account/favorites" onClick={() => setOpen(false)} className="block rounded-lg px-3 py-2 hover:bg-paper-2">{tr("Хадгалсан зарууд", "Saved properties")}</Link>
            <Link href="/notifications" onClick={() => setOpen(false)} className="block rounded-lg px-3 py-2 hover:bg-paper-2">{tr("Мэдэгдэл", "Notifications")}</Link>
            <button
              data-testid="logout"
              onClick={() => {
                logout();
                setOpen(false);
                router.push("/");
                toast(tr("Гарлаа", "Signed out"));
              }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-rust hover:bg-rust-soft"
            >
              <LogOut size={15} /> {tr("Гарах", "Sign out")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function Header() {
  const { lang, setLang, tr } = useLang();
  const { user } = useApp();
  const [open, setOpen] = useState(false);
  const path = usePathname();
  useEffect(() => setOpen(false), [path]);
  const nav = [
    { href: "/properties?type=sale", label: tr("Худалдан авах", "Buy"), match: "type=sale" },
    { href: "/properties?type=rent", label: tr("Түрээслэх", "Rent"), match: "type=rent" },
    { href: "/properties?category=new_development", label: tr("Шинэ төсөл", "New developments"), match: "new_development" },
    { href: "/agents", label: tr("Агентууд", "Agents"), match: "/agents" },
    { href: "/pricing", label: tr("Үнийн багц", "Pricing"), match: "/pricing" },
  ];
  return (
    <header className="sticky top-0 z-40 border-b border-paper-3/70 bg-paper/90 backdrop-blur-md">
      <div className="container-x flex h-16 items-center gap-6">
        <Link href="/" aria-label="Munkhtenger" className="shrink-0"><Logo lang={lang} /></Link>
        <nav className="ml-4 hidden items-center gap-1 lg:flex" aria-label="Main">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} className="rounded-full px-3.5 py-2 text-sm font-medium text-ink-2 transition hover:bg-paper-2 hover:text-ink">{n.label}</Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <button onClick={() => setLang(lang === "mn" ? "en" : "mn")} data-testid="lang-toggle" aria-label={tr("Хэл солих", "Switch language")} className="flex h-10 items-center gap-1.5 rounded-full px-3 text-sm font-semibold text-ink-2 hover:bg-paper-2">
            <Globe size={16} /> {lang === "mn" ? "EN" : "МН"}
          </button>
          {user && <NotificationBell />}
          <UserMenu />
          <button className="grid h-10 w-10 place-items-center rounded-full hover:bg-paper-2 lg:hidden" onClick={() => setOpen((o) => !o)} aria-label="Menu" aria-expanded={open} data-testid="mobile-menu-btn">
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>
      {open && (
        <nav className="animate-fadeUp border-t border-paper-3 bg-paper lg:hidden" aria-label="Mobile">
          <div className="container-x flex flex-col py-3">
            {nav.map((n) => (
              <Link key={n.href} href={n.href} className="rounded-xl px-3 py-3 text-base font-medium hover:bg-paper-2">{n.label}</Link>
            ))}
            <Link href="/compare" className="rounded-xl px-3 py-3 text-base font-medium hover:bg-paper-2">{tr("Харьцуулах", "Compare")}</Link>
            {!user && <Link href="/login" className="rounded-xl px-3 py-3 text-base font-medium hover:bg-paper-2">{tr("Нэвтрэх", "Sign in")}</Link>}
          </div>
        </nav>
      )}
    </header>
  );
}

export function Footer() {
  const { lang, tr, l } = useLang();
  const { db } = useApp();
  const router = useRouter();
  return (
    <footer className="mt-24 bg-ink text-white/80">
      <div className="container-x grid gap-10 py-14 md:grid-cols-4">
        <div className="md:col-span-2">
          <Logo lang={lang} light />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/60">{db ? l(db.content.aboutText) : ""}</p>
          <p className="mt-4 text-sm text-white/60">{db ? `+976 ${db.content.contactPhone.slice(0, 4)} ${db.content.contactPhone.slice(4)}` : ""} · {db?.content.contactEmail}</p>
        </div>
        <div>
          <h4 className="mb-3 text-xs font-semibold uppercase tracking-widest text-white/40">{tr("Хайх", "Explore")}</h4>
          <ul className="space-y-2 text-sm">
            <li><Link className="hover:text-white" href="/properties?type=sale">{tr("Худалдах зар", "Properties for sale")}</Link></li>
            <li><Link className="hover:text-white" href="/properties?type=rent">{tr("Түрээсийн зар", "Properties for rent")}</Link></li>
            <li><Link className="hover:text-white" href="/properties?view=map">{tr("Газрын зураг", "Map search")}</Link></li>
            <li><Link className="hover:text-white" href="/agents">{tr("Агентууд", "Agents")}</Link></li>
            <li><Link className="hover:text-white" href="/compare">{tr("Харьцуулах", "Compare")}</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-xs font-semibold uppercase tracking-widest text-white/40">{tr("Мэргэжилтнүүдэд", "For professionals")}</h4>
          <ul className="space-y-2 text-sm">
            <li><Link className="hover:text-white" href="/pricing">{tr("Үнийн багц", "Pricing and plans")}</Link></li>
            <li><Link className="hover:text-white" href="/register?role=agent">{tr("Агентаар бүртгүүлэх", "Join as an agent")}</Link></li>
            <li><Link className="hover:text-white" href="/register?role=owner">{tr("Зар тавих", "List your property")}</Link></li>
            <li><Link className="hover:text-white" href="/login">{tr("Нэвтрэх", "Sign in")}</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-x flex flex-col gap-2 py-5 text-xs text-white/45 sm:flex-row sm:items-center sm:justify-between">
          <p>{tr("© 2026 Мөнхтэнгэр. Бүх зар, хэрэглэгч, төлбөр зохиомол демо мэдээлэл болно. Бодит төлбөр боловсруулахгүй.", "© 2026 Munkhtenger. All listings, users and payments are fictional demo data. No real payments are processed.")}</p>
          <button
            data-testid="reset-demo"
            onClick={() => {
              if (confirm(tr("Демо мэдээллийг анхны байдалд нь буцаах уу? Таны оруулсан бүх өөрчлөлт устна.", "Reset the demo to its original data? All your changes will be lost."))) {
                resetDemo();
                runMaintenance();
                router.push("/");
                toast(tr("Демо мэдээлэл сэргээгдлээ", "Demo data was reset"));
              }
            }}
            className="self-start text-white/60 underline underline-offset-2 hover:text-white sm:self-auto"
          >
            {tr("Демо мэдээллийг шинэчлэх", "Reset demo data")}
          </button>
        </div>
      </div>
    </footer>
  );
}
