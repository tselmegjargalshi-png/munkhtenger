"use client";
import { CalendarPlus, Phone, Plus } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { PageHead } from "@/components/dash";
import { ScheduleModal } from "@/components/schedule-modal";
import { Badge, Empty, Field, Modal, useRun } from "@/components/ui";
import { addLeadNote, addReminder, assignLead, createLead, logContact, setLeadStage, toggleReminder } from "@/lib/actions";
import { cx, formatDateTime, formatMNTShort, formatPhone, timeAgo } from "@/lib/format";
import { useLang } from "@/lib/i18n";
import { LEAD_SOURCE_LABELS, LEAD_STAGES, LEAD_STAGE_LABELS, VIEWING_STATUS_LABELS } from "@/lib/labels";
import { scoped } from "@/lib/queries";
import { useApp } from "@/lib/store";
import type { Lead, LeadSource, LeadStage } from "@/lib/types";

const STAGE_TONE: Record<LeadStage, string> = { new: "border-t-sky", contacted: "border-t-[#6B8FB5]", interested: "border-t-brass", viewing: "border-t-[#8B6BB5]", negotiation: "border-t-[#D08A3B]", successful: "border-t-moss", lost: "border-t-rust" };

export function LeadsClient() {
  const { db, user } = useApp();
  const { tr, lang, l } = useLang();
  const run = useRun();
  const router = useRouter();
  const sp = useSearchParams();
  const [view, setView] = useState<"board" | "list">("board");
  const [q, setQ] = useState("");
  const [source, setSource] = useState("");
  const [adding, setAdding] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const openId = sp.get("lead");
  if (!db || !user) return null;
  const s = scoped(db, user);
  const leads = s.leads.filter((x) => (!source || x.source === source) && (!q || `${x.name} ${x.phone} ${x.email}`.toLowerCase().includes(q.toLowerCase()))).sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt));
  const open = openId ? s.leads.find((x) => x.id === openId) : null;
  const setOpen = (id: string | null) => router.replace(id ? `/dashboard/agent/leads?lead=${id}` : "/dashboard/agent/leads", { scroll: false });
  const agentName = (id: string) => db.users.find((u) => u.id === id)?.name ?? "";
  const stageLabel = (st: LeadStage) => LEAD_STAGE_LABELS[st][lang];

  return (
    <>
      <PageHead title={tr("Харилцагчийн удирдлага (CRM)", "Lead management (CRM)")} sub={`${s.leads.length} ${tr("харилцагч", "leads")}`} actions={<button className="btn-primary" onClick={() => setAdding(true)} data-testid="add-lead"><Plus size={16} />{tr("Харилцагч нэмэх", "Add lead")}</button>} />
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <input className="input !w-56" placeholder={tr("Нэр, утас, имэйл", "Name, phone, email")} value={q} onChange={(e) => setQ(e.target.value)} data-testid="lead-search" />
        <select className="input !w-44" value={source} onChange={(e) => setSource(e.target.value)} aria-label={tr("Эх сурвалж", "Source")}><option value="">{tr("Бүх эх сурвалж", "All sources")}</option>{(Object.keys(LEAD_SOURCE_LABELS) as LeadSource[]).map((k) => <option key={k} value={k}>{LEAD_SOURCE_LABELS[k][lang]}</option>)}</select>
        <div className="ml-auto flex rounded-full border border-paper-3 bg-white p-0.5">{(["board", "list"] as const).map((v) => <button key={v} onClick={() => setView(v)} data-testid={`lead-view-${v}`} className={cx("rounded-full px-3.5 py-1.5 text-xs font-semibold", view === v ? "bg-ink text-white" : "text-ink-3")}>{v === "board" ? tr("Самбар", "Pipeline") : tr("Жагсаалт", "List")}</button>)}</div>
      </div>

      {leads.length === 0 ? <Empty title={tr("Харилцагч олдсонгүй", "No leads found")} text={tr("Вэбсайтаас ирсэн лавлагаа автоматаар энд бүртгэгдэнэ.", "Website inquiries are added here automatically.")} /> : view === "board" ? (
        <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-4 lg:mx-0 lg:px-0" data-testid="lead-board">
          {LEAD_STAGES.map((st) => {
            const col = leads.filter((x) => x.stage === st);
            return (
              <div key={st} data-testid={`col-${st}`} onDragOver={(e) => e.preventDefault()} onDrop={() => { if (dragId) { const id = dragId; setDragId(null); run(() => setLeadStage(id, st)); } }} className={cx("w-[250px] shrink-0 rounded-2xl border-t-4 bg-paper-2/70 p-2.5", STAGE_TONE[st])}>
                <div className="mb-2 flex items-center justify-between px-1 text-xs font-bold uppercase tracking-wide text-ink-2"><span>{stageLabel(st)}</span><span className="text-ink-4">{col.length}</span></div>
                <div className="space-y-2">
                  {col.map((x) => (
                    <button key={x.id} draggable onDragStart={() => setDragId(x.id)} onClick={() => setOpen(x.id)} data-testid="lead-card" className="block w-full rounded-xl border border-paper-3/70 bg-white p-3 text-left shadow-card transition hover:shadow-lift">
                      <div className="font-semibold">{x.name}</div>
                      <div className="text-xs text-ink-3">{formatPhone(x.phone)}</div>
                      <div className="mt-2 flex flex-wrap items-center gap-1.5"><Badge>{LEAD_SOURCE_LABELS[x.source][lang]}</Badge>{x.reminders.some((r) => !r.done && new Date(r.due) < new Date(Date.now() + 864e5)) && <Badge tone="rust">{tr("Сануулга", "Due")}</Badge>}</div>
                      {user.role === "agency_owner" && <div className="mt-1.5 text-[11px] text-ink-4">{agentName(x.agentId)}</div>}
                    </button>
                  ))}
                  {col.length === 0 && <div className="rounded-xl border border-dashed border-paper-3 py-6 text-center text-xs text-ink-4">{tr("Хоосон", "Empty")}</div>}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card overflow-x-auto"><table className="table-x min-w-[760px]" data-testid="lead-table"><thead><tr><th>{tr("Нэр", "Name")}</th><th>{tr("Холбоо барих", "Contact")}</th><th>{tr("Эх сурвалж", "Source")}</th><th>{tr("Шат", "Stage")}</th><th>{tr("Агент", "Agent")}</th><th>{tr("Шинэчилсэн", "Updated")}</th></tr></thead><tbody>
          {leads.map((x) => <tr key={x.id} className="cursor-pointer hover:bg-paper-2/50" onClick={() => setOpen(x.id)}><td className="font-semibold">{x.name}</td><td className="text-xs text-ink-3">{formatPhone(x.phone)}<br />{x.email}</td><td><Badge>{LEAD_SOURCE_LABELS[x.source][lang]}</Badge></td><td><Badge tone={x.stage === "successful" ? "moss" : x.stage === "lost" ? "rust" : "sky"}>{stageLabel(x.stage)}</Badge></td><td className="text-sm">{agentName(x.agentId)}</td><td className="text-xs text-ink-3">{timeAgo(x.updatedAt, lang)}</td></tr>)}
        </tbody></table></div>
      )}

      {open && <LeadDetail lead={open} onClose={() => setOpen(null)} />}
      <AddLead open={adding} onClose={() => setAdding(false)} />
    </>
  );
}

function AddLead({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { tr, lang } = useLang();
  const run = useRun();
  const [f, setF] = useState({ name: "", phone: "", email: "", source: "phone" as LeadSource });
  return (
    <Modal open={open} onClose={onClose} title={tr("Харилцагч нэмэх", "Add a lead")}>
      <form className="space-y-4" data-testid="add-lead-form" onSubmit={(e) => { e.preventDefault(); run(() => { createLead(f); onClose(); setF({ name: "", phone: "", email: "", source: "phone" }); }, tr("Харилцагч нэмэгдлээ", "Lead added")); }}>
        <Field label={tr("Нэр", "Name")}><input className="input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} data-testid="al-name" /></Field>
        <div className="grid gap-4 sm:grid-cols-2"><Field label={tr("Утас", "Phone")}><input className="input" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} data-testid="al-phone" /></Field><Field label={tr("Имэйл", "Email")}><input className="input" type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field></div>
        <Field label={tr("Эх сурвалж", "Source")}><select className="input" value={f.source} onChange={(e) => setF({ ...f, source: e.target.value as LeadSource })}>{(Object.keys(LEAD_SOURCE_LABELS) as LeadSource[]).map((k) => <option key={k} value={k}>{LEAD_SOURCE_LABELS[k][lang]}</option>)}</select></Field>
        <div className="flex justify-end gap-2"><button type="button" className="btn-ghost" onClick={onClose}>{tr("Болих", "Cancel")}</button><button className="btn-primary" data-testid="al-submit">{tr("Нэмэх", "Add")}</button></div>
      </form>
    </Modal>
  );
}

function LeadDetail({ lead, onClose }: { lead: Lead; onClose: () => void }) {
  const { db, user } = useApp();
  const { tr, lang, l } = useLang();
  const run = useRun();
  const [note, setNote] = useState("");
  const [rem, setRem] = useState({ text: "", due: "" });
  const [sched, setSched] = useState(false);
  const [contact, setContact] = useState("");
  if (!db || !user) return null;
  const s = scoped(db, user);
  const props = lead.propertyIds.map((id) => db.properties.find((p) => p.id === id)).filter(Boolean) as typeof db.properties;
  const viewings = db.viewings.filter((v) => v.leadId === lead.id).sort((a, b) => +new Date(b.date) - +new Date(a.date));
  const team = user.role === "agency_owner" || user.role === "platform_admin" || user.role === "super_admin" ? db.users.filter((u) => (u.role === "agent" || u.role === "agency_owner") && (user.role === "agency_owner" ? u.agencyId === user.agencyId : true)) : [];
  const deals = db.deals.filter((d) => d.leadId === lead.id);
  void s;
  const histLabel = (h: Lead["history"][number]) => (h.type === "stage" ? `${tr("Шат", "Stage")}: ${LEAD_STAGE_LABELS[h.text as LeadStage]?.[lang] ?? h.text}` : h.type === "assign" ? `${tr("Хуваарилсан", "Assigned to")} ${h.text}` : h.text);
  return (
    <Modal open onClose={onClose} title={lead.name} wide>
      <div className="grid gap-6 md:grid-cols-[1fr_1fr]" data-testid="lead-detail">
        <div className="space-y-5">
          <div className="rounded-xl bg-paper-2 p-3.5 text-sm">
            <div className="flex items-center justify-between"><span className="font-semibold">{formatPhone(lead.phone)}</span><a href={`tel:+976${lead.phone}`} className="btn-ghost btn-sm"><Phone size={13} />{tr("Залгах", "Call")}</a></div>
            <div className="mt-1 text-ink-3">{lead.email || tr("Имэйл байхгүй", "No email")}</div>
            <div className="mt-2 flex gap-2"><Badge>{LEAD_SOURCE_LABELS[lead.source][lang]}</Badge>{lead.budget ? <Badge tone="brass">{tr("Төсөв", "Budget")} {formatMNTShort(lead.budget, lang)}</Badge> : null}</div>
          </div>
          <Field label={tr("Шат", "Pipeline stage")}>
            <select className="input" value={lead.stage} onChange={(e) => run(() => setLeadStage(lead.id, e.target.value as LeadStage), tr("Шат шинэчлэгдлээ", "Stage updated"))} data-testid="lead-stage">{LEAD_STAGES.map((st) => <option key={st} value={st}>{LEAD_STAGE_LABELS[st][lang]}</option>)}</select>
          </Field>
          {team.length > 0 && <Field label={tr("Хариуцсан агент", "Assigned agent")}><select className="input" value={lead.agentId} onChange={(e) => run(() => assignLead(lead.id, e.target.value), tr("Хуваарилагдлаа", "Lead assigned"))} data-testid="lead-assign">{team.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}</select></Field>}
          <div><div className="label">{tr("Холбогдсон зарууд", "Linked properties")}</div>{props.length === 0 ? <p className="text-sm text-ink-3">{tr("Зар холбоогүй", "None yet")}</p> : <ul className="space-y-1 text-sm">{props.map((p) => <li key={p.id}>{p.code} · {l(p.title)}</li>)}</ul>}</div>
          {deals.length > 0 && <div><div className="label">{tr("Гүйлгээ", "Deals")}</div><ul className="text-sm">{deals.map((d) => <li key={d.id}>{d.status === "completed" ? tr("Хаагдсан", "Completed") : d.status === "active" ? tr("Идэвхтэй", "Active") : tr("Цуцлагдсан", "Cancelled")}: {d.amount.toLocaleString("en-US")} ₮</li>)}</ul></div>}
          <div className="flex flex-wrap gap-2"><button className="btn-brass btn-sm" onClick={() => setSched(true)} data-testid="lead-schedule"><CalendarPlus size={14} />{tr("Үзлэг товлох", "Schedule viewing")}</button></div>
          <div><div className="label">{tr("Үзлэгийн түүх", "Viewing history")}</div>{viewings.length === 0 ? <p className="text-sm text-ink-3">{tr("Үзлэг алга", "No viewings")}</p> : <ul className="space-y-1 text-sm" data-testid="lead-viewings">{viewings.map((v) => <li key={v.id}>{formatDateTime(v.date, lang)} · {VIEWING_STATUS_LABELS[v.status][lang]}</li>)}</ul>}</div>
        </div>
        <div className="space-y-5">
          <div>
            <div className="label">{tr("Дотоод тэмдэглэл", "Internal notes")}</div>
            <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); run(() => { addLeadNote(lead.id, note); setNote(""); }, tr("Тэмдэглэл нэмэгдлээ", "Note added")); }}><input className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder={tr("Тэмдэглэл бичих", "Add a note")} data-testid="note-input" /><button className="btn-primary btn-sm" data-testid="note-add">{tr("Нэмэх", "Add")}</button></form>
            <ul className="mt-2 space-y-2" data-testid="notes">{lead.notes.map((n) => <li key={n.id} className="rounded-xl bg-brass-soft/60 px-3 py-2 text-sm">{n.text}<div className="text-[10px] text-ink-4">{timeAgo(n.at, lang)}</div></li>)}</ul>
          </div>
          <div>
            <div className="label">{tr("Дагаж холбогдох сануулга", "Follow up reminders")}</div>
            <form className="grid grid-cols-[1fr_auto] gap-2" onSubmit={(e) => { e.preventDefault(); run(() => { addReminder(lead.id, rem.text, rem.due); setRem({ text: "", due: "" }); }, tr("Сануулга нэмэгдлээ", "Reminder added")); }}><input className="input" value={rem.text} onChange={(e) => setRem({ ...rem, text: e.target.value })} placeholder={tr("Юу хийх вэ?", "What to follow up?")} data-testid="rem-text" /><button className="btn-ghost btn-sm" data-testid="rem-add">{tr("Нэмэх", "Add")}</button><input className="input col-span-2" type="datetime-local" value={rem.due} onChange={(e) => setRem({ ...rem, due: e.target.value })} data-testid="rem-due" /></form>
            <ul className="mt-2 space-y-1.5">{lead.reminders.map((r) => <li key={r.id}><label className="flex cursor-pointer items-start gap-2 text-sm"><input type="checkbox" className="mt-1 h-4 w-4 accent-[#1E3A5F]" checked={r.done} onChange={() => run(() => toggleReminder(lead.id, r.id))} /><span className={cx(r.done && "text-ink-4 line-through")}>{r.text}<span className="block text-[11px] text-ink-4">{formatDateTime(r.due, lang)}</span></span></label></li>)}</ul>
          </div>
          <div>
            <div className="label">{tr("Харилцааны түүх", "Contact history")}</div>
            <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); run(() => { logContact(lead.id, contact); setContact(""); }, tr("Бүртгэгдлээ", "Logged")); }}><input className="input" value={contact} onChange={(e) => setContact(e.target.value)} placeholder={tr("Залгасан, мессеж бичсэн гэх мэт", "Called, messaged, met in person")} /><button className="btn-ghost btn-sm">{tr("Бүртгэх", "Log")}</button></form>
            <ul className="mt-2 max-h-56 space-y-2 overflow-y-auto border-l-2 border-paper-3 pl-3" data-testid="history">{[...lead.history].reverse().map((h, i) => <li key={i} className="text-sm"><span className="text-ink-2">{histLabel(h)}</span><span className="block text-[11px] text-ink-4">{timeAgo(h.at, lang)}</span></li>)}</ul>
          </div>
        </div>
      </div>
      <ScheduleModal open={sched} onClose={() => setSched(false)} leadId={lead.id} />
    </Modal>
  );
}
