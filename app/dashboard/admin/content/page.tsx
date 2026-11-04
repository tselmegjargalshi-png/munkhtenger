"use client";
import { useEffect, useState } from "react";
import { PageHead } from "@/components/dash";
import { Field, useRun } from "@/components/ui";
import { adminUpdateContent } from "@/lib/actions";
import { useLang } from "@/lib/i18n";
import { useApp } from "@/lib/store";

export default function Page() {
  const { db } = useApp();
  const { tr } = useLang();
  const run = useRun();
  const [c, setC] = useState(db?.content);
  useEffect(() => setC(db?.content), [db?.seededAt]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!db || !c) return null;
  const two = (label: string, key: "heroTitle" | "heroSubtitle" | "announcement" | "aboutText", area?: boolean) => (
    <div className="grid gap-4 sm:grid-cols-2">{(["mn", "en"] as const).map((lg) => <Field key={lg} label={`${label} (${lg === "mn" ? tr("монгол", "Mongolian") : tr("англи", "English")})`}>{area ? <textarea className="input min-h-20" value={c[key][lg]} onChange={(e) => setC({ ...c, [key]: { ...c[key], [lg]: e.target.value } })} data-testid={`ct-${key}-${lg}`} /> : <input className="input" value={c[key][lg]} onChange={(e) => setC({ ...c, [key]: { ...c[key], [lg]: e.target.value } })} data-testid={`ct-${key}-${lg}`} />}</Field>)}</div>
  );
  return (
    <>
      <PageHead title={tr("Вэбсайтын агуулга", "Website content")} sub={tr("Нүүр хуудас, зарлал, холбоо барих мэдээлэл", "Homepage text, announcement bar and contact details")} />
      <form className="card space-y-5 p-6" data-testid="content-form" onSubmit={(e) => { e.preventDefault(); run(() => adminUpdateContent(c), tr("Агуулга хадгалагдлаа", "Content saved")); }}>
        {two(tr("Нүүрний гарчиг", "Hero headline"), "heroTitle")}
        {two(tr("Нүүрний дэд гарчиг", "Hero subtitle"), "heroSubtitle")}
        {two(tr("Зарлалын мөр", "Announcement bar"), "announcement")}
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4 accent-[#1E3A5F]" checked={c.announcementOn} onChange={(e) => setC({ ...c, announcementOn: e.target.checked })} />{tr("Зарлалын мөрийг харуулах", "Show the announcement bar")}</label>
        {two(tr("Бидний тухай", "About text"), "aboutText", true)}
        <div className="grid gap-4 sm:grid-cols-2"><Field label={tr("Утас", "Phone")}><input className="input" value={c.contactPhone} onChange={(e) => setC({ ...c, contactPhone: e.target.value })} /></Field><Field label={tr("Имэйл", "Email")}><input className="input" value={c.contactEmail} onChange={(e) => setC({ ...c, contactEmail: e.target.value })} /></Field></div>
        <button className="btn-primary" data-testid="content-save">{tr("Хадгалах", "Save content")}</button>
      </form>
    </>
  );
}
