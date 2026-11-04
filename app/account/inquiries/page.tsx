"use client";
import Link from "next/link";
import { useState } from "react";
import { PageHead } from "@/components/dash";
import { Empty, useRun } from "@/components/ui";
import { replyInquiry } from "@/lib/actions";
import { cx, timeAgo } from "@/lib/format";
import { useLang } from "@/lib/i18n";
import { useApp } from "@/lib/store";

export default function Page() {
  const { db, user } = useApp();
  const { tr, lang, l } = useLang();
  const run = useRun();
  const [reply, setReply] = useState<Record<string, string>>({});
  if (!db || !user) return null;
  const items = db.inquiries.filter((q) => q.customerId === user.id);
  return (
    <>
      <PageHead title={tr("Лавлагааны түүх", "Inquiry history")} />
      {items.length === 0 ? <Empty title={tr("Лавлагаа илгээгээгүй байна", "No inquiries yet")} action={{ label: tr("Зар хайх", "Browse properties"), href: "/properties" }} /> : (
        <div className="space-y-4" data-testid="my-inquiries">
          {items.map((q) => {
            const p = db.properties.find((x) => x.id === q.propertyId);
            const agent = db.users.find((u) => u.id === q.agentId);
            return (
              <div key={q.id} className="card p-5">
                <div className="flex flex-wrap items-center justify-between gap-2"><Link href={`/properties/${q.propertyId}`} className="font-semibold hover:underline">{p ? l(p.title) : tr("Устгагдсан зар", "Removed listing")}</Link><span className="text-xs text-ink-3">{agent?.name} · {timeAgo(q.createdAt, lang)}</span></div>
                <ul className="mt-3 space-y-2">{q.messages.map((m) => <li key={m.id} className={cx("max-w-[85%] rounded-2xl px-3.5 py-2 text-sm", m.from === "customer" ? "ml-auto bg-sky text-white" : "bg-paper-2")}>{m.text}<div className={cx("mt-0.5 text-[10px]", m.from === "customer" ? "text-white/60" : "text-ink-4")}>{timeAgo(m.at, lang)}</div></li>)}</ul>
                {q.status !== "closed" && <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); run(() => { replyInquiry(q.id, reply[q.id] ?? ""); setReply({ ...reply, [q.id]: "" }); }); }}><input className="input" placeholder={tr("Хариу бичих", "Write a reply")} value={reply[q.id] ?? ""} onChange={(e) => setReply({ ...reply, [q.id]: e.target.value })} /><button className="btn-primary btn-sm">{tr("Илгээх", "Send")}</button></form>}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
