"use client";
import { useEffect, useRef, useState } from "react";
import { PageHead } from "@/components/dash";
import { Avatar } from "@/components/shell";
import { Field, toast, useRun } from "@/components/ui";
import { changePassword, updateProfile } from "@/lib/actions";
import { compressImage } from "@/lib/images";
import { useLang } from "@/lib/i18n";
import { ROLE_LABELS } from "@/lib/labels";
import { useApp } from "@/lib/store";

export default function Page() {
  const { user } = useApp();
  const { tr, lang } = useLang();
  const run = useRun();
  const file = useRef<HTMLInputElement>(null);
  const [f, setF] = useState({ name: "", phone: "", email: "", titleMn: "", titleEn: "", bioMn: "", bioEn: "" });
  const [pw, setPw] = useState({ old: "", next: "" });
  useEffect(() => {
    if (user) setF({ name: user.name, phone: user.phone, email: user.email, titleMn: user.title?.mn ?? "", titleEn: user.title?.en ?? "", bioMn: user.bio?.mn ?? "", bioEn: user.bio?.en ?? "" });
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!user) return null;
  const pro = user.role !== "customer";
  return (
    <>
      <PageHead title={tr("Профайл", "Profile")} sub={ROLE_LABELS[user.role][lang]} />
      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <form className="card space-y-4 p-6" data-testid="profile-form" onSubmit={(e) => { e.preventDefault(); run(() => updateProfile({ name: f.name, phone: f.phone, email: f.email, ...(pro ? { title: { mn: f.titleMn, en: f.titleEn }, bio: { mn: f.bioMn, en: f.bioEn } } : {}) }), tr("Профайл хадгалагдлаа", "Profile saved")); }}>
          <div className="flex items-center gap-4">
            <Avatar name={user.name} color={user.avatarColor} src={user.avatar} size={72} />
            <div className="flex flex-col gap-1.5">
              <button type="button" className="btn-ghost btn-sm" onClick={() => file.current?.click()} data-testid="avatar-pick">{tr("Зураг солих", "Change photo")}</button>
              {user.avatar && <button type="button" className="text-xs text-rust" onClick={() => run(() => updateProfile({ avatar: "" }))}>{tr("Зураг устгах", "Remove photo")}</button>}
              <input ref={file} type="file" hidden accept="image/png,image/jpeg,image/webp" data-testid="avatar-input" onChange={async (e) => { const fl = e.target.files?.[0]; if (!fl) return; try { const d = await compressImage(fl, 320, 0.8); updateProfile({ avatar: d }); toast(tr("Зураг шинэчлэгдлээ", "Photo updated")); } catch { toast(tr("Зургийг уншиж чадсангүй", "Could not read that image"), "err"); } }} />
            </div>
          </div>
          <Field label={tr("Овог нэр", "Full name")}><input className="input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} data-testid="profile-name" /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={tr("Утас", "Phone")}><input className="input" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} data-testid="profile-phone" /></Field>
            <Field label={tr("Имэйл", "Email")}><input className="input" type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} data-testid="profile-email" /></Field>
          </div>
          {pro && (<>
            <div className="grid gap-4 sm:grid-cols-2"><Field label={tr("Албан тушаал (монгол)", "Title (Mongolian)")}><input className="input" value={f.titleMn} onChange={(e) => setF({ ...f, titleMn: e.target.value })} /></Field><Field label={tr("Албан тушаал (англи)", "Title (English)")}><input className="input" value={f.titleEn} onChange={(e) => setF({ ...f, titleEn: e.target.value })} /></Field></div>
            <Field label={tr("Танилцуулга (монгол)", "Bio (Mongolian)")}><textarea className="input min-h-20" value={f.bioMn} onChange={(e) => setF({ ...f, bioMn: e.target.value })} /></Field>
            <Field label={tr("Танилцуулга (англи)", "Bio (English)")}><textarea className="input min-h-20" value={f.bioEn} onChange={(e) => setF({ ...f, bioEn: e.target.value })} /></Field>
          </>)}
          <button className="btn-primary" data-testid="profile-save">{tr("Хадгалах", "Save changes")}</button>
        </form>
        <form className="card h-fit space-y-4 p-6" onSubmit={(e) => { e.preventDefault(); run(() => { changePassword(pw.old, pw.next); setPw({ old: "", next: "" }); }, tr("Нууц үг солигдлоо", "Password changed")); }}>
          <h2 className="h-display text-2xl">{tr("Нууц үг солих", "Change password")}</h2>
          <Field label={tr("Одоогийн нууц үг", "Current password")}><input className="input" type="password" value={pw.old} onChange={(e) => setPw({ ...pw, old: e.target.value })} /></Field>
          <Field label={tr("Шинэ нууц үг", "New password")}><input className="input" type="password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} /></Field>
          <button className="btn-ghost">{tr("Солих", "Update password")}</button>
        </form>
      </div>
    </>
  );
}
