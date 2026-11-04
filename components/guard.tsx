"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PageLoading } from "./ui";
import { useLang } from "@/lib/i18n";
import { useApp } from "@/lib/store";
import type { Role } from "@/lib/types";
import { dashboardPath } from "@/lib/perms";

/** Client side role guard. In production the same rules are enforced by Supabase row level security. */
export function Guard({ roles, children }: { roles?: Role[]; children: React.ReactNode }) {
  const { ready, user } = useApp();
  const { tr } = useLang();
  const path = usePathname();
  if (!ready) return <PageLoading />;
  if (!user)
    return (
      <div className="container-x py-24 text-center" data-testid="guard-signin">
        <h1 className="h-display text-3xl">{tr("Нэвтэрнэ үү", "Please sign in")}</h1>
        <p className="mx-auto mt-2 max-w-sm text-sm text-ink-3">{tr("Энэ хуудсыг үзэхийн тулд нэвтэрсэн байх шаардлагатай.", "You need to be signed in to see this page.")}</p>
        <Link href={`/login?next=${encodeURIComponent(path)}`} className="btn-primary mt-6">{tr("Нэвтрэх", "Sign in")}</Link>
      </div>
    );
  if (roles && !roles.includes(user.role))
    return (
      <div className="container-x py-24 text-center" data-testid="guard-forbidden">
        <h1 className="h-display text-3xl">{tr("Хандах эрхгүй", "Access denied")}</h1>
        <p className="mx-auto mt-2 max-w-sm text-sm text-ink-3">{tr("Таны эрх энэ хуудсанд хандах боломжгүй байна.", "Your role does not have access to this page.")}</p>
        <Link href={dashboardPath(user.role)} className="btn-primary mt-6">{tr("Миний самбар руу", "Go to my dashboard")}</Link>
      </div>
    );
  return <>{children}</>;
}
