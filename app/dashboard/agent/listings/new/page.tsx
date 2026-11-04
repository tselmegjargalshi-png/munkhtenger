"use client";
import { PageHead } from "@/components/dash";
import { PropertyForm } from "@/components/property-form";
import { useLang } from "@/lib/i18n";

export default function Page() {
  const { tr } = useLang();
  return (<><PageHead title={tr("Шинэ зар нэмэх", "Create a new listing")} sub={tr("Зар админы хяналтаар баталгаажсаны дараа нийтлэгдэнэ.", "Listings go live after an admin approves them.")} /><PropertyForm /></>);
}
