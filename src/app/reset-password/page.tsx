import type { Metadata } from "next";
import { ResetPasswordClient } from "@/components/password-reset-client";
import { getSearchParam } from "@/lib/page-props";

export const metadata: Metadata = {
  title: "Choose New Password",
  robots: {
    index: false,
    follow: false
  }
};

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const token = getSearchParam(await searchParams, "token");
  return <ResetPasswordClient token={token} />;
}
