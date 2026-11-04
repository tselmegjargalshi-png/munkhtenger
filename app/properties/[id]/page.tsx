import { DetailClient } from "./detail-client";

export const metadata = { title: "Зарын дэлгэрэнгүй" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <DetailClient id={id} />;
}
