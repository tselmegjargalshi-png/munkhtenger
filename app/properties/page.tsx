import { Suspense } from "react";
import { PageLoading } from "@/components/ui";
import { SearchClient } from "./search-client";

export const metadata = { title: "Үл хөдлөх хөрөнгө хайх" };

export default function Page() {
  return (
    <Suspense fallback={<PageLoading />}>
      <SearchClient />
    </Suspense>
  );
}
