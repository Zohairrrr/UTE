import { cookies } from "next/headers";
import { verifySessionToken } from "@/lib/session";

export async function getCurrentSession() {
  const store = await cookies();
  const token = store.get("urban_session")?.value;
  return token ? verifySessionToken(token) : null;
}
