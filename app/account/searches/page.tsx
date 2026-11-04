"use client";
import Link from "next/link";
import { PageHead } from "@/components/dash";
import { Empty, useRun } from "@/components/ui";
import { deleteSavedSearch, toggleSavedSearchNotify } from "@/lib/actions";
import { formatDate } from "@/lib/format";
import { useLang } from "@/lib/i18n";
import { parseFilters, searchProperties } from "@/lib/search";
import { useApp } from "@/lib/store";

export default function Page() {
  const { db, user } = useApp();
  const { tr, lang } = useLang();
  const run = useRun();
  if (!db || !user) return null;
  const items = db.savedSearches.filter((s) => s.userId === user.id);
  return (
    <>
      <PageHead title={tr("Хадгалсан хайлтууд", "Saved searches")} />
      {items.length === 0 ? <Empty title={tr("Хадгалсан хайлт алга", "No saved searches")} text={tr("Хайлтын хуудаснаас шүүлтүүрээ хадгална уу.", "Save your filters from the search page.")} action={{ label: tr("Хайх", "Search"), href: "/properties" }} /> : (
        <ul className="card divide-y divide-paper-3/70" data-testid="saved-searches">
          {items.map((s) => {
            const n = searchProperties(db, parseFilters(new URLSearchParams(s.query))).length;
            return (
              <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div><Link href={`/properties?${s.query}`} className="font-semibold hover:underline">{s.name}</Link><div className="text-xs text-ink-3">{n} {tr("зар тохирч байна", "matching listings")} · {formatDate(s.createdAt, lang)}</div></div>
                <div className="flex items-center gap-3 text-sm">
                  <label className="flex items-center gap-2"><input type="checkbox" className="h-4 w-4 accent-[#1E3A5F]" checked={s.notify} onChange={() => toggleSavedSearchNotify(s.id)} />{tr("Мэдэгдэх", "Notify me")}</label>
                  <button className="btn-danger btn-sm" onClick={() => run(() => deleteSavedSearch(s.id), tr("Устгалаа", "Deleted"))}>{tr("Устгах", "Delete")}</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
