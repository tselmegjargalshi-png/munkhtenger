"use client";
import { Plus } from "lucide-react";
import { useState } from "react";
import { PageHead } from "@/components/dash";
import { Badge, Empty, Field, Modal, Tabs, useRun } from "@/components/ui";
import { ScheduleModal, toLocal } from "@/components/schedule-modal";
import { updateViewingStatus } from "@/lib/actions";
import { formatDateTime, formatPhone } from "@/lib/format";
import { useLang } from "@/lib/i18n";
import { VIEWING_STATUS_LABELS } from "@/lib/labels";
import { scoped } from "@/lib/queries";
import { useApp } from "@/lib/store";
import type { ViewingStatus } from "@/lib/types";

export default function Page() {
  const { db, user } = useApp();
  const { tr, lang, l } = useLang();
  const run = useRun();
  const [tab, setTab] = useState<"all" | ViewingStatus>("all");
  const [open, setOpen] = useState(false);
  const [resched, setResched] = useState<{ id: string; date: string } | null>(null);
  if (!db || !user) return null;
  const all = scoped(db, user).viewings.sort((a, b) => +new Date(a.date) - +new Date(b.date));
  const items = tab === "all" ? all : all.filter((v) => v.status === tab);
  const tone = { requested: "brass", confirmed: "moss", completed: "neutral", cancelled: "rust" } as const;
  const cnt = (s: ViewingStatus) => all.filter((v) => v.status === s).length;
  return (
    <>
      <PageHead title={tr("Үзлэг, уулзалт", "Viewings and appointments")} actions={<button className="btn-primary" onClick={() => setOpen(true)} data-testid="schedule-new"><Plus size={16} />{tr("Үзлэг товлох", "Schedule viewing")}</button>} />
      <Tabs value={tab} onChange={setTab} items={[{ key: "all", label: tr("Бүгд", "All"), count: all.length }, { key: "requested", label: VIEWING_STATUS_LABELS.requested[lang], count: cnt("requested") }, { key: "confirmed", label: VIEWING_STATUS_LABELS.confirmed[lang], count: cnt("confirmed") }, { key: "completed", label: VIEWING_STATUS_LABELS.completed[lang], count: cnt("completed") }, { key: "cancelled", label: VIEWING_STATUS_LABELS.cancelled[lang], count: cnt("cancelled") }]} />
      <div className="mt-4">
        {items.length === 0 ? <Empty title={tr("Үзлэг алга", "No viewings")} action={{ label: tr("Үзлэг товлох", "Schedule viewing"), onClick: () => setOpen(true) }} /> : (
          <div className="card overflow-x-auto"><table className="table-x min-w-[720px]" data-testid="viewing-table"><thead><tr><th>{tr("Огноо", "When")}</th><th>{tr("Харилцагч", "Client")}</th><th>{tr("Зар", "Property")}</th><th>{tr("Төлөв", "Status")}</th><th /></tr></thead><tbody>
            {items.map((v) => { const p = db.properties.find((x) => x.id === v.propertyId); return (
              <tr key={v.id} data-testid="viewing-row"><td className="whitespace-nowrap font-medium">{formatDateTime(v.date, lang)}</td><td><div className="font-semibold">{v.name}</div><div className="text-xs text-ink-3">{formatPhone(v.phone)}</div></td><td className="max-w-[240px] truncate text-sm">{p ? `${p.code} · ${l(p.title)}` : ""}</td><td><Badge tone={tone[v.status]}>{VIEWING_STATUS_LABELS[v.status][lang]}</Badge></td>
                <td><div className="flex flex-wrap justify-end gap-1.5">
                  {v.status === "requested" && <button className="btn-primary btn-sm" data-testid="vw-confirm" onClick={() => run(() => updateViewingStatus(v.id, "confirmed"), tr("Баталгаажлаа", "Confirmed"))}>{tr("Батлах", "Confirm")}</button>}
                  {(v.status === "requested" || v.status === "confirmed") && <button className="btn-ghost btn-sm" onClick={() => setResched({ id: v.id, date: toLocal(v.date) })}>{tr("Цаг өөрчлөх", "Reschedule")}</button>}
                  {v.status === "confirmed" && <button className="btn-ghost btn-sm" data-testid="vw-complete" onClick={() => run(() => updateViewingStatus(v.id, "completed"), tr("Үзлэг дууслаа", "Marked completed"))}>{tr("Дууссан", "Complete")}</button>}
                  {(v.status === "requested" || v.status === "confirmed") && <button className="btn-danger btn-sm" onClick={() => run(() => updateViewingStatus(v.id, "cancelled"), tr("Цуцаллаа", "Cancelled"))}>{tr("Цуцлах", "Cancel")}</button>}
                </div></td></tr>); })}
          </tbody></table></div>
        )}
      </div>
      <ScheduleModal open={open} onClose={() => setOpen(false)} />
      <Modal open={!!resched} onClose={() => setResched(null)} title={tr("Цаг өөрчлөх", "Reschedule")}>
        {resched && <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); run(() => { const v = all.find((x) => x.id === resched.id)!; updateViewingStatus(resched.id, v.status === "requested" ? "confirmed" : v.status, resched.date); setResched(null); }, tr("Цаг шинэчлэгдлээ", "Rescheduled")); }}><Field label={tr("Шинэ огноо, цаг", "New date and time")}><input className="input" type="datetime-local" value={resched.date} onChange={(e) => setResched({ ...resched, date: e.target.value })} /></Field><div className="flex justify-end"><button className="btn-primary">{tr("Хадгалах", "Save")}</button></div></form>}
      </Modal>
    </>
  );
}
