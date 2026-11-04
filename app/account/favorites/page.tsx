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
  const items = user.favorites.map((id) => db.properties.find((p) => p.id === id)).filter(Boolean) as typeof db.properties;
  return (
    <>
      <PageHead title={tr("Хадгалсан зарууд", "Saved properties")} sub={`${items.length}`} />
      {items.length === 0 ? <Empty title={tr("Хадгалсан зар алга", "No saved properties")} text={tr("Зар дээрх зүрхэн тэмдгийг дарж хадгална уу.", "Tap the heart on any listing to save it here.")} action={{ label: tr("Зар хайх", "Browse properties"), href: "/properties" }} /> : <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3" data-testid="favorites-grid">{items.map((p) => <PropertyCard key={p.id} p={p} db={db} />)}</div>}
    </>
  );
}
