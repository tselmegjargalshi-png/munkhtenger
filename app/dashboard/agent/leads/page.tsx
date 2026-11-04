import { Suspense } from "react";
import { PageLoading } from "@/components/ui";
import { LeadsClient } from "./leads-client";

export default function Page() {
  return (
    <Suspense fallback={<PageLoading />}>
      <LeadsClient />
    </Suspense>
  );
}
