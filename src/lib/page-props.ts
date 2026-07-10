import { getCurrentSession } from "@/lib/current-session";
import { getPublicContent } from "@/lib/public-content";

export async function publicPageProps() {
  const [session, content] = await Promise.all([getCurrentSession(), getPublicContent()]);
  return {
    ...content,
    signedIn: Boolean(session)
  };
}

export function getSearchParam(params: Record<string, string | string[] | undefined>, key: string) {
  const value = params[key];
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}
