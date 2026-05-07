import { NextResponse } from "next/server";
import { isEmailVerified } from "@/lib/auth/email-verification";
import { getAuthenticatedProfile, getUserTransfers } from "@/lib/data-access";
import { buildTransfersCsv } from "@/lib/transfers-export-csv";
import { createClient } from "@/lib/supabase/server";

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
  const csv = buildTransfersCsv(records);
  const stamp = new Date().toISOString().slice(0, 10);

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="hawwil-transfers-${stamp}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
