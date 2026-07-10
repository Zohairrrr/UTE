import type { Metadata } from "next";
import { ForgotPasswordClient } from "@/components/password-reset-client";

export const metadata: Metadata = {
  title: "Reset Password",
  robots: {
    index: false,
    follow: false
  }
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordClient />;
}
