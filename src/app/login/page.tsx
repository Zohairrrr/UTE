import { Suspense } from "react";
import type { Metadata } from "next";
import { LoginClient } from "@/components/login-client";

export const metadata: Metadata = {
  title: "Account Access",
  description: "Customer account access for URBAN TIFFIN AND EVENTS.",
  robots: {
    index: false,
    follow: false
  }
};

export default function LoginPage() {
  return (
    <Suspense>
      <LoginClient />
    </Suspense>
  );
}
