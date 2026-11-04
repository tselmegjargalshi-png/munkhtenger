"use client";
import Link from "next/link";
import { useState } from "react";
import { PageHead } from "@/components/dash";
import { Badge, Empty, Tabs, useRun } from "@/components/ui";
import { closeInquiry, replyInquiry } from "@/lib/actions";
import { cx, formatPhone, timeAgo } from "@/lib/format";
import { useLang } from "@/lib/i18n";
import { scoped } from "@/lib/queries";
import { useApp } from "@/lib/store";

export default function Page() {
  const { db, user } = useApp();
  const { tr, lang, l } = useLang();
  const run = useRun();
  const [tab, setTab] = useState<"all" | "new" | "replied" | "closed">("all");
  const [reply, setReply] = useState<Record<string, string>>({});
  if (!db || !user) return null;
  const all = scoped(db, user).inquiries.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  const items = tab === "all" ? all : all.filter((q) => q.status === tab);
  return (
    <>
      <PageHead title={tr("Лавлагаа", "Customer inquiries")} />
      <Tabs value={tab} onChange={setTab} items={[{ key: "all", label: tr("Бүгд", "All"), count: all.length }, { key: "new", label: tr("Шинэ", "New"), count: all.filter((q) => q.status === "new").length }, { key: "replied", label: tr("Хариулсан", "Replied"), count: all.filter((q) => q.status === "replied").length }, { key: "closed", label: tr("Хаасан", "Closed"), count: all.filter((q) => q.status === "closed").length }]} />
      <div className="mt-4 space-y-4" data-testid="inquiry-list">
        {items.length === 0 && <Empty title={tr("Лавлагаа алга", "No inquiries")} />}
        {items.map((q) => {
          const p = db.properties.find((x) => x.id === q.propertyId);
          const lead = db.leads.find((x) => x.id === q.leadId);
          return (
            <div key={q.id} className="card p-5" data-testid="inquiry-item">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div><div className="flex items-center gap-2 font-semibold">{q.name}<Badge tone={q.status === "new" ? "brass" : q.status === "replied" ? "moss" : "neutral"}>{q.status === "new" ? tr("Шинэ", "New") : q.status === "replied" ? tr("Хариулсан", "Replied") : tr("Хаасан", "Closed")}</Badge></div><div className="text-xs text-ink-3">{formatPhone(q.phone)} · {q.email} · {timeAgo(q.createdAt, lang)}</div></div>
                <div className="text-right text-xs">{p && <Link href={`/properties/${p.id}`} className="font-semibold text-sky hover:underline">{p.code} · {l(p.title)}</Link>}{lead && <div className="mt-0.5"><Link href={`/dashboard/agent/leads?lead=${lead.id}`} className="text-ink-3 underline">{tr("CRM карт", "Open in CRM")}</Link></div>}</div>
              </div>
              <ul className="mt-3 space-y-2">{q.messages.map((m) => <li key={m.id} className={cx("max-w-[85%] rounded-2xl px-3.5 py-2 text-sm", m.from === "agent" ? "ml-auto bg-sky text-white" : "bg-paper-2")}>{m.text}</li>)}</ul>
              {q.status !== "closed" && (
                <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); run(() => { replyInquiry(q.id, reply[q.id] ?? ""); setReply({ ...reply, [q.id]: "" }); }, tr("Хариу илгээгдлээ", "Reply sent")); }}>
                  <input className="input" placeholder={tr("Хариу бичих", "Write a reply")} value={reply[q.id] ?? ""} onChange={(e) => setReply({ ...reply, [q.id]: e.target.value })} data-testid="reply-input" />
                  <button className="btn-primary btn-sm" data-testid="reply-send">{tr("Илгээх", "Reply")}</button>
                  <button type="button" className="btn-ghost btn-sm" onClick={() => run(() => closeInquiry(q.id), tr("Хаагдлаа", "Closed"))}>{tr("Хаах", "Close")}</button>
                </form>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
