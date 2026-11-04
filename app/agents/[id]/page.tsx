import { AgentClient } from "./agent-client";
export const metadata = { title: "Агент" };
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AgentClient id={id} />;
}
