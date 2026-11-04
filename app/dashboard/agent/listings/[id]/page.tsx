"use client";
import { useParams } from "next/navigation";
import { PageHead } from "@/components/dash";
import { PropertyForm } from "@/components/property-form";
import { Empty } from "@/components/ui";
import { useLang } from "@/lib/i18n";
import { canManageProperty } from "@/lib/perms";
import { useApp } from "@/lib/store";

export default function Page() {
  const { id } = useParams<{ id: string }>();
  const { db, user } = useApp();
  const { tr } = useLang();
  const p = db?.properties.find((x) => x.id === id);
  if (!db || !user) return null;
  if (!p || !canManageProperty(user, p)) return <Empty title={tr("Зар олдсонгүй эсвэл эрх алга", "Listing not found or no access")} action={{ label: tr("Миний зарууд", "My listings"), href: "/dashboard/agent/listings" }} />;
  return (<><PageHead title={tr("Зар засах", "Edit listing")} sub={p.code} />{p.status === "rejected" && <div className="mb-4 rounded-xl bg-rust-soft p-3 text-sm text-rust">{tr("Татгалзсан шалтгаан:", "Rejected:")} {p.rejectionReason}</div>}<PropertyForm key={p.id} existing={p} /></>);
}
