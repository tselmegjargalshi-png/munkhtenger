"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Guard } from "./guard";
import { cx } from "@/lib/format";
import { useLang } from "@/lib/i18n";
import type { Role } from "@/lib/types";

export interface NavItem { href: string; label: string; badge?: number }

export function DashShell({ roles, nav, title, children }: { roles: Role[]; nav: NavItem[]; title: string; children: React.ReactNode }) {
  const path = usePathname();
  const { tr } = useLang();
  return (
    <Guard roles={roles}>
      <div className="container-x py-6 lg:py-8">
        <div className="grid gap-6 lg:grid-cols-[230px_1fr]">
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="mb-3 hidden text-xs font-semibold uppercase tracking-[0.2em] text-brass lg:block">{title}</div>
            <nav aria-label={tr("Самбарын цэс", "Dashboard menu")} className="no-scrollbar -mx-4 flex gap-1 overflow-x-auto px-4 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0" data-testid="dash-nav">
              {nav.map((n) => {
                const active = n.href === path || (n.href.split("/").length > 3 && path.startsWith(n.href));
                return (
                  <Link key={n.href} href={n.href} className={cx("flex items-center justify-between gap-2 whitespace-nowrap rounded-xl px-3.5 py-2.5 text-sm font-medium transition", active ? "bg-ink text-white" : "text-ink-2 hover:bg-paper-2")}>
                    <span>{n.label}</span>
                    {!!n.badge && <span className={cx("grid h-5 min-w-5 place-items-center rounded-full px-1 text-[11px] font-bold", active ? "bg-white/20" : "bg-rust text-white")}>{n.badge}</span>}
                  </Link>
                );
              })}
            </nav>
          </aside>
          <div className="min-w-0">{children}</div>
        </div>
      </div>
    </Guard>
  );
}

export function PageHead({ title, sub, actions }: { title: string; sub?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div><h1 className="h-display text-3xl sm:text-4xl">{title}</h1>{sub && <p className="mt-1 text-sm text-ink-3">{sub}</p>}</div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
