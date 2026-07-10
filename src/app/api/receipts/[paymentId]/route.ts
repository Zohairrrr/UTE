import { NextResponse, type NextRequest } from "next/server";
import { getCurrentSession } from "@/lib/current-session";
import { prisma } from "@/lib/prisma";
import { paymentBucket, supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ paymentId: string }> }
) {
  const session = await getCurrentSession();
  if (!session) {
    return new NextResponse("Unauthorized", {
      status: 401,
      headers: privateHeaders()
    });
  }

  const { paymentId } = await params;
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    select: { userId: true, storagePath: true }
  });

  if (!payment) {
    return new NextResponse("Payment not found", {
      status: 404,
      headers: privateHeaders()
    });
  }

  // Authorize: must be an ADMIN or the customer who owns the payment
  if (session.role !== "ADMIN" && payment.userId !== session.userId) {
    return new NextResponse("Forbidden", {
      status: 403,
      headers: privateHeaders()
    });
  }

  if (!payment.storagePath || payment.storagePath.startsWith("/") || payment.storagePath.startsWith("seed/")) {
    return new NextResponse("Payment screenshot unavailable", {
      status: 404,
      headers: privateHeaders()
    });
  }

  const { data, error } = await supabaseAdmin()
    .storage
    .from(paymentBucket())
    .createSignedUrl(payment.storagePath, 60);

  if (error || !data?.signedUrl) {
    return new NextResponse("Payment screenshot unavailable", {
      status: 404,
      headers: privateHeaders()
    });
  }

  return NextResponse.redirect(data.signedUrl, {
    headers: privateHeaders()
  });
}

function privateHeaders() {
  return {
    "Cache-Control": "private, no-store, max-age=0",
    "Referrer-Policy": "no-referrer"
  };
}
