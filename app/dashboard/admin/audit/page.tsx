"use client";
import { PageHead } from "@/components/dash";
import { Empty, Pagination } from "@/components/ui";
import { formatDateTime } from "@/lib/format";
import { useLang } from "@/lib/i18n";
import { useApp } from "@/lib/store";
import { useState } from "react";

export default function Page() {
  const { db } = useApp();
  const { tr, lang } = useLang();
  const [page, setPage] = useState(1);
  if (!db) return null;
  const pages = Math.max(1, Math.ceil(db.audit.length / 20));
  const view = db.audit.slice((Math.min(page, pages) - 1) * 20, Math.min(page, pages) * 20);
  return (
    <>
      <PageHead title={tr("Аудитын бүртгэл", "Audit log")} sub={tr("Админы чухал үйлдэл бүр бүртгэгдэнэ", "Every important admin action is recorded")} />
      {view.length === 0 ? <Empty title={tr("Бүртгэл алга", "No entries yet")} /> : <div className="card overflow-x-auto"><table className="table-x min-w-[640px]" data-testid="audit-table"><thead><tr><th>{tr("Цаг", "Time")}</th><th>{tr("Админ", "Actor")}</th><th>{tr("Үйлдэл", "Action")}</th><th>{tr("Дэлгэрэнгүй", "Details")}</th></tr></thead><tbody>{view.map((a) => <tr key={a.id}><td className="whitespace-nowrap text-xs">{formatDateTime(a.at, lang)}</td><td>{db.users.find((u) => u.id === a.actorId)?.name}</td><td className="font-mono text-xs">{a.action}</td><td className="max-w-[320px] truncate text-sm text-ink-3">{a.details}</td></tr>)}</tbody></table></div>}
      <Pagination page={Math.min(page, pages)} pages={pages} onPage={setPage} />
    </>
  );
}
