import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/current-session";

export async function requireAdminSession() {
  const session = await getCurrentSession();
  if (session?.role !== "ADMIN") {
    redirect("/login?next=/admin");
  }
  return session;
}
