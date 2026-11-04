"use client";
import { useState } from "react";
import { PageHead } from "@/components/dash";
import { Badge, Field, Modal, useRun } from "@/components/ui";
import { adminAddDistrict, adminUpdateCategory, adminUpdateDistrict } from "@/lib/actions";
import { useLang } from "@/lib/i18n";
import { useApp } from "@/lib/store";

export default function Page() {
  const { db } = useApp();
  const { tr, lang } = useLang();
  const run = useRun();
  const [edit, setEdit] = useState<{ key: string; mn: string; en: string } | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [nd, setNd] = useState({ mn: "", en: "", khoroos: 10 });
  if (!db) return null;
  return (
    <>
      <PageHead title={tr("Ангилал, байршил", "Categories and locations")} actions={<button className="btn-primary btn-sm" onClick={() => setAddOpen(true)} data-testid="add-district">{tr("Дүүрэг нэмэх", "Add district")}</button>} />
      <div className="grid gap-6 xl:grid-cols-2">
        <section><h2 className="h-display mb-3 text-2xl">{tr("Ангилал", "Property categories")}</h2>
          <ul className="card divide-y divide-paper-3/70" data-testid="category-list">{db.categories.map((c) => (
            <li key={c.key} className="flex items-center justify-between gap-3 p-3.5"><div><div className="font-semibold">{c.name[lang]}</div><div className="text-xs text-ink-4">{c.name.mn} / {c.name.en}</div></div>
              <div className="flex items-center gap-2"><button className="btn-ghost btn-sm" onClick={() => setEdit({ key: c.key, mn: c.name.mn, en: c.name.en })}>{tr("Нэр засах", "Rename")}</button><button className={c.enabled ? "btn-ghost btn-sm" : "btn-primary btn-sm"} data-testid={`toggle-cat-${c.key}`} onClick={() => run(() => adminUpdateCategory(c.key, { enabled: !c.enabled }), c.enabled ? tr("Идэвхгүй болголоо", "Disabled") : tr("Идэвхжүүллээ", "Enabled"))}>{c.enabled ? tr("Идэвхгүй болгох", "Disable") : tr("Идэвхжүүлэх", "Enable")}</button></div></li>))}</ul>
        </section>
        <section><h2 className="h-display mb-3 text-2xl">{tr("Дүүрэг, хороо", "Districts and khoroos")}</h2>
          <ul className="card divide-y divide-paper-3/70" data-testid="district-list">{db.districts.map((d) => (
            <li key={d.key} className="flex flex-wrap items-center justify-between gap-3 p-3.5"><div><div className="flex items-center gap-2 font-semibold">{d.name[lang]}{d.popular && <Badge tone="brass">{tr("Алдартай", "Popular")}</Badge>}{!d.enabled && <Badge tone="rust">{tr("Идэвхгүй", "Off")}</Badge>}</div><div className="text-xs text-ink-4">{d.khoroos} {tr("хороо", "khoroos")}</div></div>
              <div className="flex items-center gap-2"><input type="number" min={1} max={99} defaultValue={d.khoroos} className="input !w-20 !py-1.5 text-xs" aria-label="khoroos" onBlur={(e) => Number(e.target.value) !== d.khoroos && run(() => adminUpdateDistrict(d.key, { khoroos: Number(e.target.value) }), tr("Хадгалагдлаа", "Saved"))} /><button className="btn-ghost btn-sm" onClick={() => run(() => adminUpdateDistrict(d.key, { popular: !d.popular }))}>{d.popular ? tr("Алдартай биш", "Unpin") : tr("Алдартай болгох", "Pin popular")}</button><button className={d.enabled ? "btn-ghost btn-sm" : "btn-primary btn-sm"} onClick={() => run(() => adminUpdateDistrict(d.key, { enabled: !d.enabled }))}>{d.enabled ? tr("Идэвхгүй болгох", "Disable") : tr("Идэвхжүүлэх", "Enable")}</button></div></li>))}</ul>
        </section>
      </div>
      <Modal open={!!edit} onClose={() => setEdit(null)} title={tr("Ангиллын нэр засах", "Rename category")}>
        {edit && <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); run(() => { adminUpdateCategory(edit.key, { name: { mn: edit.mn, en: edit.en } }); setEdit(null); }, tr("Хадгалагдлаа", "Saved")); }}><Field label={tr("Монгол нэр", "Mongolian name")}><input className="input" value={edit.mn} onChange={(e) => setEdit({ ...edit, mn: e.target.value })} /></Field><Field label={tr("Англи нэр", "English name")}><input className="input" value={edit.en} onChange={(e) => setEdit({ ...edit, en: e.target.value })} /></Field><div className="flex justify-end"><button className="btn-primary">{tr("Хадгалах", "Save")}</button></div></form>}
      </Modal>
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title={tr("Дүүрэг нэмэх", "Add a district")}>
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); run(() => { adminAddDistrict({ mn: nd.mn, en: nd.en }, nd.khoroos); setAddOpen(false); setNd({ mn: "", en: "", khoroos: 10 }); }, tr("Дүүрэг нэмэгдлээ", "District added")); }}><Field label={tr("Монгол нэр", "Mongolian name")}><input className="input" value={nd.mn} onChange={(e) => setNd({ ...nd, mn: e.target.value })} data-testid="nd-mn" /></Field><Field label={tr("Англи нэр", "English name")}><input className="input" value={nd.en} onChange={(e) => setNd({ ...nd, en: e.target.value })} data-testid="nd-en" /></Field><Field label={tr("Хорооны тоо", "Number of khoroos")}><input className="input" type="number" min={1} max={99} value={nd.khoroos} onChange={(e) => setNd({ ...nd, khoroos: Number(e.target.value) })} /></Field><div className="flex justify-end"><button className="btn-primary" data-testid="nd-submit">{tr("Нэмэх", "Add")}</button></div></form>
      </Modal>
    </>
  );
}
