"use client";
import { useRouter } from "next/navigation";
import { Guard } from "@/components/guard";
import { Empty } from "@/components/ui";
import { markAllNotificationsRead, markNotificationRead } from "@/lib/actions";
import { cx, timeAgo } from "@/lib/format";
import { useLang } from "@/lib/i18n";
import { NOTIFICATION_TEXT } from "@/lib/labels";
import { useApp } from "@/lib/store";

export default function Page() {
  return <Guard><Inner /></Guard>;
}

function Inner() {
  const { db, user } = useApp();
  const { lang, tr } = useLang();
  const router = useRouter();
  if (!db || !user) return null;
  const mine = db.notifications.filter((n) => n.userId === user.id);
  return (
    <div className="container-x max-w-3xl py-10">
      <div className="mb-6 flex items-end justify-between"><h1 className="h-display text-4xl">{tr("Мэдэгдэл", "Notifications")}</h1>{mine.some((n) => !n.read) && <button className="btn-ghost btn-sm" onClick={markAllNotificationsRead} data-testid="mark-all-read">{tr("Бүгдийг уншсан болгох", "Mark all as read")}</button>}</div>
      {mine.length === 0 ? <Empty title={tr("Мэдэгдэл алга", "No notifications yet")} text={tr("Лавлагаа, үзлэг, зарын шинэчлэлт энд харагдана.", "Inquiries, viewings and listing updates will show up here.")} /> : (
        <ul className="card divide-y divide-paper-3/70 overflow-hidden" data-testid="notification-list">
          {mine.map((n) => (
            <li key={n.id}>
              <button onClick={() => { markNotificationRead(n.id); router.push(n.link); }} className={cx("flex w-full items-start gap-3 px-5 py-4 text-left hover:bg-paper-2/60", !n.read && "bg-sky-soft/40")} data-testid="notification-item">
                <span className={cx("mt-1.5 h-2 w-2 shrink-0 rounded-full", n.read ? "bg-transparent" : "bg-sky")} />
                <span className="min-w-0"><span className="block text-sm leading-snug">{NOTIFICATION_TEXT[n.type](n.params)[lang]}</span><span className="mt-1 block text-xs text-ink-4">{timeAgo(n.createdAt, lang)}</span></span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
