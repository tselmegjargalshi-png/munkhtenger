import { AgencyPublic } from "./agency-client";
export const metadata = { title: "Агентлаг" };
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AgencyPublic id={id} />;
}
