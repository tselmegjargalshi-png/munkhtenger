"use client";
import AgentLayout from "../agent/layout";
import { Guard } from "@/components/guard";

/** Same workspace chrome as agents, but the agency management area is for agency owners only. */
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AgentLayout>
      <Guard roles={["agency_owner"]}>{children}</Guard>
    </AgentLayout>
  );
}
