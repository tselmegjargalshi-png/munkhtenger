"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { LogoMark } from "@/components/brand";
import { Field, toast, useRun } from "@/components/ui";
import { login } from "@/lib/actions";
import { useLang } from "@/lib/i18n";
import { ROLE_LABELS } from "@/lib/labels";
import { dashboardPath } from "@/lib/perms";
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from "@/lib/seed";
import { useApp } from "@/lib/store";

export function LoginClient() {
  const { lang, tr } = useLang();
  const { user, ready } = useApp();
  const router = useRouter();
  const sp = useSearchParams();
  const run = useRun();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const next = sp.get("next");
  useEffect(() => {
    if (ready && user) router.replace(next && next.startsWith("/") ? next : dashboardPath(user.role));
  }, [ready, user, next, router]);

  const submit = (em: string, pw: string) =>
    run(() => {
      const u = login(em, pw);
      toast(tr(`Тавтай морил, ${u.name}`, `Welcome back, ${u.name}`));
      router.replace(next && next.startsWith("/") ? next : dashboardPath(u.role));
    });

  return (
    <div className="container-x grid gap-10 py-14 lg:grid-cols-2">
      <div className="mx-auto w-full max-w-md">
        <LogoMark size={44} />
        <h1 className="h-display mt-5 text-4xl">{tr("Нэвтрэх", "Sign in")}</h1>
        <p className="mt-1 text-sm text-ink-3">{tr("Өөрийн хаягаараа нэвтэрнэ үү.", "Use your account to continue.")}</p>
        <form className="mt-6 space-y-4" onSubmit={(e) => { e.preventDefault(); submit(email, password); }} data-testid="login-form">
          <Field label={tr("Имэйл", "Email")}><input className="input" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} data-testid="login-email" /></Field>
          <Field label={tr("Нууц үг", "Password")}><input className="input" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} data-testid="login-password" /></Field>
          <button className="btn-primary w-full" data-testid="login-submit">{tr("Нэвтрэх", "Sign in")}</button>
        </form>
        <p className="mt-5 text-sm text-ink-3">{tr("Бүртгэлгүй юу?", "No account yet?")} <Link href="/register" className="font-semibold text-sky">{tr("Бүртгүүлэх", "Create one")}</Link></p>
      </div>
      <div className="card h-fit p-6" data-testid="demo-accounts">
        <span className="badge bg-brass-soft text-[#7C5B2B]">{tr("ДЕМО", "DEMO")}</span>
        <h2 className="h-display mt-3 text-2xl">{tr("Демо хаягууд", "Demo accounts")}</h2>
        <p className="mt-1 text-sm text-ink-3">{tr("Бүх хаягийн нууц үг:", "Every account uses the password:")} <code className="rounded bg-paper-2 px-1.5 py-0.5 font-mono text-ink">{DEMO_PASSWORD}</code>. {tr("Дарж шууд нэвтэрнэ.", "Click to sign in instantly.")}</p>
        <ul className="mt-4 divide-y divide-paper-3/70">
          {DEMO_ACCOUNTS.map((a) => (
            <li key={a.email}>
              <button onClick={() => submit(a.email, DEMO_PASSWORD)} data-testid={`demo-login-${a.role}`} className="flex w-full items-center justify-between gap-3 py-3 text-left transition hover:bg-paper-2/60 sm:px-2">
                <span><span className="block text-sm font-semibold">{ROLE_LABELS[a.role][lang]}</span><span className="block text-xs text-ink-3">{a.email}</span></span>
                <span className="text-xs font-semibold text-sky">{tr("Нэвтрэх", "Sign in")}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
