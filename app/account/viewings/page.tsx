"use client";
import Link from "next/link";
import { PageHead } from "@/components/dash";
import { Badge, Empty, useRun } from "@/components/ui";
import { updateViewingStatus } from "@/lib/actions";
import { formatDateTime } from "@/lib/format";
import { useLang } from "@/lib/i18n";
import { VIEWING_STATUS_LABELS } from "@/lib/labels";
import { useApp } from "@/lib/store";

export default function Page() {
  const { db, user } = useApp();
  const { tr, lang, l } = useLang();
  const run = useRun();
  if (!db || !user) return null;
  const items = db.viewings.filter((v) => v.customerId === user.id).sort((a, b) => +new Date(b.date) - +new Date(a.date));
  const tone = { requested: "brass", confirmed: "moss", completed: "neutral", cancelled: "rust" } as const;
  return (
    <>
      <PageHead title={tr("Үзлэгийн хуваарь", "My viewings")} sub={tr("Хүсэлтийн төлөвийг эндээс хянана.", "Track the status of your viewing requests.")} />
      {items.length === 0 ? <Empty title={tr("Үзлэг товлоогүй байна", "No viewings yet")} text={tr("Зарын хуудсан дээрх \"Үзлэг товлох\" товчийг ашиглана уу.", "Use \"Schedule a viewing\" on any listing.")} action={{ label: tr("Зар хайх", "Browse properties"), href: "/properties" }} /> : (
        <ul className="card divide-y divide-paper-3/70" data-testid="my-viewings">
          {items.map((v) => { const p = db.properties.find((x) => x.id === v.propertyId); const a = db.users.find((u) => u.id === v.agentId); return (
            <li key={v.id} className="flex flex-wrap items-center justify-between gap-3 p-4" data-testid="viewing-row">
              <div><Link href={`/properties/${v.propertyId}`} className="font-semibold hover:underline">{p ? l(p.title) : ""}</Link><div className="text-sm text-ink-3">{formatDateTime(v.date, lang)} · {a?.name}</div></div>
              <div className="flex items-center gap-2"><Badge tone={tone[v.status]}>{VIEWING_STATUS_LABELS[v.status][lang]}</Badge>{(v.status === "requested" || v.status === "confirmed") && <button className="btn-danger btn-sm" onClick={() => run(() => updateViewingStatus(v.id, "cancelled"), tr("Үзлэг цуцлагдлаа", "Viewing cancelled"))}>{tr("Цуцлах", "Cancel")}</button>}</div>
            </li>); })}
        </ul>
      )}
    </>
  );
}
