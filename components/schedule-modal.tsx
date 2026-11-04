"use client";
import { useState } from "react";
import { Field, Modal, useRun } from "@/components/ui";
import { scheduleViewing } from "@/lib/actions";
import { formatPhone } from "@/lib/format";
import { useLang } from "@/lib/i18n";
import { scoped } from "@/lib/queries";
import { useApp } from "@/lib/store";

export const toLocal = (iso: string) => new Date(new Date(iso).getTime() - new Date().getTimezoneOffset() * 6e4).toISOString().slice(0, 16);

export function ScheduleModal({ open, onClose, leadId: lockedLead }: { open: boolean; onClose: () => void; leadId?: string }) {
  const { db, user } = useApp();
  const { tr, l } = useLang();
  const run = useRun();
  const [leadId, setLeadId] = useState(lockedLead ?? "");
  const [propertyId, setPropertyId] = useState("");
  const [date, setDate] = useState("");
  const [note, setNote] = useState("");
  if (!db || !user) return null;
  const s = scoped(db, user);
  const lid = lockedLead ?? leadId;
  const lead = s.leads.find((x) => x.id === lid);
  const props = s.properties.filter((p) => p.status === "published");
  const sorted = lead ? [...props].sort((a, b) => Number(lead.propertyIds.includes(b.id)) - Number(lead.propertyIds.includes(a.id))) : props;
  return (
    <Modal open={open} onClose={onClose} title={tr("Үзлэг товлох", "Schedule a viewing")}>
      <form className="space-y-4" data-testid="schedule-form" onSubmit={(e) => { e.preventDefault(); run(() => { scheduleViewing({ leadId: lid, propertyId: propertyId || sorted[0]?.id, date, note }); onClose(); setDate(""); setNote(""); }, tr("Үзлэг товлогдлоо. Харилцагчид мэдэгдэл очлоо.", "Viewing scheduled. The customer was notified.")); }}>
        {!lockedLead && <Field label={tr("Харилцагч", "Lead")}><select className="input" value={leadId} onChange={(e) => setLeadId(e.target.value)} data-testid="sv-lead"><option value="">{tr("Сонгох", "Choose")}</option>{s.leads.map((x) => <option key={x.id} value={x.id}>{x.name} · {formatPhone(x.phone)}</option>)}</select></Field>}
        <Field label={tr("Зар", "Property")}><select className="input" value={propertyId || sorted[0]?.id || ""} onChange={(e) => setPropertyId(e.target.value)} data-testid="sv-property">{sorted.map((p) => <option key={p.id} value={p.id}>{p.code} · {l(p.title)}</option>)}</select></Field>
        <Field label={tr("Огноо, цаг", "Date and time")}><input className="input" type="datetime-local" value={date} min={toLocal(new Date().toISOString())} onChange={(e) => setDate(e.target.value)} data-testid="sv-date" /></Field>
        <Field label={tr("Тэмдэглэл", "Note")}><input className="input" value={note} onChange={(e) => setNote(e.target.value)} data-testid="sv-note" /></Field>
        <div className="flex justify-end gap-2"><button type="button" className="btn-ghost" onClick={onClose}>{tr("Болих", "Cancel")}</button><button className="btn-primary" data-testid="sv-submit" disabled={!lid}>{tr("Товлох", "Schedule")}</button></div>
      </form>
    </Modal>
  );
}

