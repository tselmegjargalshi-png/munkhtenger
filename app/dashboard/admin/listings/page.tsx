import { Suspense } from "react";
import { PageLoading } from "@/components/ui";
import { AdminListings } from "./client";

export default function Page() {
  return (
    <Suspense fallback={<PageLoading />}>
      <AdminListings />
    </Suspense>
  );
}
