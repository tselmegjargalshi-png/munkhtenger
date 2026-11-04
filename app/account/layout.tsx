"use client";
import { DashShell } from "@/components/dash";
import { useLang } from "@/lib/i18n";
import { useApp } from "@/lib/store";

export default function Layout({ children }: { children: React.ReactNode }) {
  const { tr } = useLang();
  const { db, user } = useApp();
  const unread = db && user ? db.notifications.filter((n) => n.userId === user.id && !n.read).length : 0;
  return (
    <DashShell
      roles={["customer", "owner", "agent", "agency_owner", "platform_admin", "super_admin"]}
      title={tr("Миний хуудас", "My account")}
      nav={[
        { href: "/account", label: tr("Хураангуй", "Overview") },
        { href: "/account/profile", label: tr("Профайл", "Profile") },
        { href: "/account/favorites", label: tr("Хадгалсан зарууд", "Saved properties") },
        { href: "/account/recent", label: tr("Саяхан үзсэн", "Recently viewed") },
        { href: "/account/inquiries", label: tr("Лавлагааны түүх", "Inquiry history") },
        { href: "/account/viewings", label: tr("Үзлэгүүд", "Viewings") },
        { href: "/account/searches", label: tr("Хадгалсан хайлт", "Saved searches") },
        { href: "/notifications", label: tr("Мэдэгдэл", "Notifications"), badge: unread },
        { href: "/compare", label: tr("Харьцуулалт", "Compare") },
      ]}
    >
      {children}
    </DashShell>
  );
}
