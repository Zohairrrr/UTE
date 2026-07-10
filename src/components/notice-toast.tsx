"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

export function NoticeToast() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const notice = searchParams.get("notice");

  useEffect(() => {
    if (!notice) return;
    toast.success(notice);

    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete("notice");
    const query = nextParams.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [notice, pathname, router, searchParams]);

  return null;
}
