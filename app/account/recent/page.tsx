"use client";
import { PageHead } from "@/components/dash";
import { PropertyCard } from "@/components/property";
import { Empty } from "@/components/ui";
import { useLang } from "@/lib/i18n";
import { useApp } from "@/lib/store";

export default function Page() {
  const { db, user } = useApp();
  const { tr } = useLang();
  if (!db || !user) return null;
  const items = user.recentlyViewed.map((id) => db.properties.find((p) => p.id === id && p.status === "published")).filter(Boolean) as typeof db.properties;
  return (
    <>
      <PageHead title={tr("Саяхан үзсэн зарууд", "Recently viewed")} />
      {items.length === 0 ? <Empty title={tr("Үзсэн зар алга", "Nothing viewed yet")} action={{ label: tr("Зар хайх", "Browse properties"), href: "/properties" }} /> : <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{items.map((p) => <PropertyCard key={p.id} p={p} db={db} />)}</div>}
    </>
  );
}
