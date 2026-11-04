import { Suspense } from "react";
import { LoginClient } from "./login-client";
export const metadata = { title: "Нэвтрэх" };
export default function Page() {
  return (
    <Suspense>
      <LoginClient />
    </Suspense>
  );
}
