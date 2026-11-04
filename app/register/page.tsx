import { Suspense } from "react";
import { RegisterClient } from "./register-client";
export const metadata = { title: "Бүртгүүлэх" };
export default function Page() {
  return (
    <Suspense>
      <RegisterClient />
    </Suspense>
  );
}
