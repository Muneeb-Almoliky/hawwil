import { NextResponse } from "next/server";
import { isEmailVerified } from "@/lib/auth/email-verification";
import { getAuthenticatedProfile, getUserTransfers } from "@/lib/data-access";
import { buildTransfersPdfBuffer } from "@/lib/transfers-export-pdf";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET() {
  const profile = await getAuthenticatedProfile();
  if (!profile) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user && !isEmailVerified(user)) {
      return NextResponse.json(
        { code: "EMAIL_NOT_VERIFIED", message: "Verify your email to export transfers." },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { code: "UNAUTHORIZED", message: "Please sign in again." },
      { status: 401 }
    );
  }

  const records = await getUserTransfers(undefined);
  const buffer = await buildTransfersPdfBuffer(profile, records);
  const stamp = new Date().toISOString().slice(0, 10);

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="hawwil-transfers-${stamp}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
