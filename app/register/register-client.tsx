"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { LogoMark } from "@/components/brand";
import { Field, toast, useRun } from "@/components/ui";
import { register } from "@/lib/actions";
import { cx } from "@/lib/format";
import { useLang } from "@/lib/i18n";
import { dashboardPath } from "@/lib/perms";

export function RegisterClient() {
  const { tr } = useLang();
  const router = useRouter();
  const sp = useSearchParams();
  const run = useRun();
  const initial = sp.get("role") === "agent" ? "agent" : sp.get("role") === "owner" ? "owner" : "customer";
  const [role, setRole] = useState<"customer" | "owner" | "agent">(initial);
  const [f, setF] = useState({ name: "", email: "", phone: "", password: "" });
  const roles: ["customer" | "owner" | "agent", string, string][] = [
    ["customer", tr("Хэрэглэгч", "Customer"), tr("Зар хайх, хадгалах, лавлах", "Search, save and inquire")],
    ["owner", tr("Өмчлөгч", "Property owner"), tr("Өөрийн хөрөнгийг зарах, түрээслэх", "Sell or rent your own property")],
    ["agent", tr("Агент", "Agent"), tr("Зар, харилцагч, үзлэг удирдах", "Manage listings, leads and viewings")],
  ];
  return (
    <div className="container-x py-14">
      <div className="mx-auto w-full max-w-lg">
        <LogoMark size={44} />
        <h1 className="h-display mt-5 text-4xl">{tr("Бүртгүүлэх", "Create your account")}</h1>
        <div className="mt-6 grid gap-2 sm:grid-cols-3">
          {roles.map(([k, label, hint]) => (
            <button key={k} type="button" data-testid={`reg-role-${k}`} onClick={() => setRole(k)} className={cx("rounded-2xl border p-3 text-left transition", role === k ? "border-sky bg-sky-soft" : "border-paper-3 bg-white hover:border-ink-4")}>
              <div className="text-sm font-semibold">{label}</div><div className="mt-0.5 text-[11px] leading-snug text-ink-3">{hint}</div>
            </button>
          ))}
        </div>
        <form className="mt-6 space-y-4" data-testid="register-form" onSubmit={(e) => { e.preventDefault(); run(() => { const u = register({ ...f, role }); toast(tr("Бүртгэл амжилттай үүслээ", "Account created")); router.replace(dashboardPath(u.role)); }); }}>
          <Field label={tr("Овог нэр", "Full name")}><input className="input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} data-testid="reg-name" autoComplete="name" /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={tr("Имэйл", "Email")}><input className="input" type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} data-testid="reg-email" autoComplete="email" /></Field>
            <Field label={tr("Утас", "Phone")} hint="+976 9911 2233"><input className="input" inputMode="tel" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} data-testid="reg-phone" autoComplete="tel" /></Field>
          </div>
          <Field label={tr("Нууц үг", "Password")} hint={tr("Хамгийн багадаа 8 тэмдэгт", "At least 8 characters")}><input className="input" type="password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} data-testid="reg-password" autoComplete="new-password" /></Field>
          <button className="btn-primary w-full" data-testid="reg-submit">{tr("Бүртгүүлэх", "Create account")}</button>
          {role === "agent" && <p className="text-xs text-ink-3">{tr("Агентын бүртгэлийг админ баталгаажуулсны дараа \"Баталгаажсан\" тэмдэг авна.", "Agent profiles receive a Verified badge after an admin reviews them.")}</p>}
        </form>
        <p className="mt-5 text-sm text-ink-3">{tr("Бүртгэлтэй юу?", "Already registered?")} <Link href="/login" className="font-semibold text-sky">{tr("Нэвтрэх", "Sign in")}</Link></p>
      </div>
    </div>
  );
}
