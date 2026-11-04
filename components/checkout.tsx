"use client";
import { Banknote, Building2, CreditCard, QrCode } from "lucide-react";
import { useState } from "react";
import { Modal, toast, useRun } from "./ui";
import { cancelPayment, confirmSimulatedPayment, createPayment } from "@/lib/actions";
import { cx, formatMNT } from "@/lib/format";
import { useLang } from "@/lib/i18n";
import { PAYMENT_METHOD_LABELS } from "@/lib/labels";
import { useApp } from "@/lib/store";
import type { PaymentMethod, Plan } from "@/lib/types";

function FakeQr({ seed }: { seed: string }) {
  const cells: boolean[] = [];
  let h = 7;
  for (const c of seed) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  for (let i = 0; i < 21 * 21; i++) {
    h = (h * 1664525 + 1013904223) >>> 0;
    cells.push(h % 3 !== 0);
  }
  const finder = (x: number, y: number) => (x < 7 && y < 7) || (x > 13 && y < 7) || (x < 7 && y > 13);
  return (
    <svg viewBox="0 0 21 21" className="h-44 w-44 rounded-xl border border-paper-3 bg-white p-2" aria-label="Demo QR placeholder" shapeRendering="crispEdges">
      {cells.map((on, i) => {
        const x = i % 21, y = Math.floor(i / 21);
        const fin = finder(x, y);
        const edge = fin && (x % 14 === 0 || x % 14 === 6 || y % 14 === 0 || y % 14 === 6 || ((x % 14) >= 2 && (x % 14) <= 4 && (y % 14) >= 2 && (y % 14) <= 4));
        const fill = fin ? edge : on;
        return fill ? <rect key={i} x={x} y={y} width="1" height="1" fill="#15181E" /> : null;
      })}
    </svg>
  );
}

/** Simulated checkout. No real gateway is called; see README for the QPay and SocialPay integration notes. */
export function CheckoutModal({ plan, propertyId, open, onClose, onDone }: { plan: Plan | null; propertyId?: string; open: boolean; onClose: () => void; onDone?: () => void }) {
  const { lang, tr, l } = useLang();
  const { db } = useApp();
  const run = useRun();
  const [method, setMethod] = useState<PaymentMethod>("qpay");
  const [payId, setPayId] = useState<string | null>(null);
  const pay = payId ? db?.payments.find((p) => p.id === payId) : null;
  const reset = () => { setPayId(null); onClose(); };
  if (!plan) return null;
  const icons: Record<PaymentMethod, React.ReactNode> = { qpay: <QrCode size={18} />, socialpay: <CreditCard size={18} />, bank: <Building2 size={18} />, cash: <Banknote size={18} /> };
  return (
    <Modal open={open} onClose={reset} title={tr("Төлбөр хийх", "Checkout")}>
      <div className="mb-4 rounded-xl bg-brass-soft px-3.5 py-2.5 text-xs font-semibold text-[#7C5B2B]" data-testid="payment-demo-note">
        {tr("ДЕМО ТӨЛБӨР. Бодит мөнгө шилжихгүй, ямар ч төлбөрийн системтэй холбогдоогүй.", "DEMO PAYMENT. No real money moves and no payment gateway is connected.")}
      </div>
      <div className="flex items-center justify-between rounded-xl border border-paper-3 p-3.5">
        <div><div className="font-semibold">{l(plan.name)}</div><div className="text-xs text-ink-3">{plan.periodDays} {tr("хоног", "days")}</div></div>
        <div className="font-display text-2xl font-semibold">{formatMNT(plan.price)}</div>
      </div>
      {!pay ? (
        <>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {(["qpay", "socialpay", "bank", "cash"] as PaymentMethod[]).map((m) => (
              <button key={m} data-testid={`pay-${m}`} onClick={() => setMethod(m)} className={cx("flex items-center gap-2 rounded-xl border p-3 text-left text-sm font-semibold", method === m ? "border-sky bg-sky-soft text-sky" : "border-paper-3 hover:border-ink-4")}>{icons[m]}{PAYMENT_METHOD_LABELS[m][lang]}</button>
            ))}
          </div>
          <p className="mt-3 text-xs text-ink-3">
            {method === "qpay" || method === "socialpay" ? tr("Демо QR дэлгэц гарч ирнэ. Төлбөрийг дарж баталгаажуулна.", "A demo QR screen will open. Confirm the payment with one click.") : method === "bank" ? tr("Банкны шилжүүлгийг админ гараар баталгаажуулна.", "An admin confirms bank transfers manually.") : tr("Бэлэн төлбөрийг оффис дээр админ баталгаажуулна.", "An admin confirms cash payments at the office.")}
          </p>
          <div className="mt-5 flex justify-end gap-2">
            <button className="btn-ghost" onClick={reset}>{tr("Болих", "Cancel")}</button>
            <button className="btn-primary" data-testid="pay-continue" onClick={() => run(() => { const p = createPayment({ planId: plan.id, method, propertyId }); setPayId(p.id); })}>{tr("Үргэлжлүүлэх", "Continue")}</button>
          </div>
        </>
      ) : pay.status === "paid" ? (
        <div className="mt-6 text-center" data-testid="pay-success"><div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-moss-soft text-moss">✓</div><h3 className="mt-3 text-lg font-semibold">{tr("Төлбөр амжилттай (демо)", "Payment successful (demo)")}</h3><p className="text-sm text-ink-3">{tr("Лавлах дугаар", "Reference")}: {pay.reference}</p><button className="btn-primary mt-5" onClick={() => { onDone?.(); reset(); }}>{tr("Болсон", "Done")}</button></div>
      ) : pay.method === "qpay" || pay.method === "socialpay" ? (
        <div className="mt-5 flex flex-col items-center gap-3 text-center" data-testid="pay-gateway">
          <FakeQr seed={pay.reference} />
          <div className="text-xs text-ink-3">{PAYMENT_METHOD_LABELS[pay.method][lang]} · {tr("Лавлах дугаар", "Reference")} {pay.reference}</div>
          <p className="max-w-xs text-xs text-ink-4">{tr("Энэ бол жинхэнэ QR биш. Доорх товчоор төлбөр хийгдсэнийг дуурайна.", "This is not a real QR code. The button below simulates the gateway callback.")}</p>
          <div className="flex gap-2"><button className="btn-ghost" onClick={() => { cancelPayment(pay.id); reset(); }}>{tr("Цуцлах", "Cancel")}</button><button className="btn-brass" data-testid="pay-simulate" onClick={() => run(() => { confirmSimulatedPayment(pay.id); }, tr("Төлбөр баталгаажлаа (демо)", "Payment confirmed (demo)"))}>{tr("Төлбөр хийснийг дуурайх", "Simulate payment")}</button></div>
        </div>
      ) : (
        <div className="mt-5 text-sm" data-testid="pay-pending">
          {pay.method === "bank" && <div className="rounded-xl border border-paper-3 p-3.5 text-ink-2"><div className="text-xs font-semibold uppercase text-ink-3">{tr("Демо дансны мэдээлэл", "Demo account details")}</div><div className="mt-1">{tr("Банк: Демо банк", "Bank: Demo Bank")}</div><div>{tr("Данс", "Account")}: 0000 0000 00</div><div>{tr("Гүйлгээний утга", "Transfer note")}: {pay.reference}</div></div>}
          <p className="mt-3 text-ink-3">{tr("Хүсэлт бүртгэгдлээ. Админ баталгаажуулмагц багц идэвхжинэ. Төлөв: хүлээгдэж байна.", "Your request is recorded. It activates once an admin confirms it. Status: pending.")}</p>
          <button className="btn-primary mt-4" onClick={() => { toast(tr("Хүсэлт илгээгдлээ", "Request submitted")); onDone?.(); reset(); }}>{tr("Ойлголоо", "Got it")}</button>
        </div>
      )}
    </Modal>
  );
}
