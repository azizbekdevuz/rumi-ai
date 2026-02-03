import { Suspense } from "react";
import LoginPageClient from "./LoginPageClient";
import LoginFallback from "./LoginFallback";

export default function Page() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginPageClient />
    </Suspense>
  );
}