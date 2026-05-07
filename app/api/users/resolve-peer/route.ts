import { NextResponse } from "next/server";
import { requireVerifiedUser } from "@/lib/auth/require-verified-user";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const runtime = "nodejs";

interface ResolvePeerBody {
  email?: string;
}

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { code: "SUPABASE_NOT_CONFIGURED", message: "Supabase is not configured." },
      { status: 503 }
    );
  }

  let body: ResolvePeerBody;
  try {
    body = (await request.json()) as ResolvePeerBody;
  } catch {
    return NextResponse.json(
      { code: "INVALID_BODY", message: "Invalid request body." },
      { status: 400 }
    );
  }

  const email = typeof body.email === "string" ? normalizeEmail(body.email) : "";
  if (!email || !email.includes("@")) {
    return NextResponse.json(
      { code: "INVALID_EMAIL", message: "Enter a valid email address." },
      { status: 400 }
    );
  }

  const auth = await requireVerifiedUser();
  if ("response" in auth) {
    return auth.response;
  }
  const { user, supabase } = auth;

  const { data, error } = await supabase.rpc("resolve_peer_profile_by_email", {
    p_email: email,
  });

  if (error) {
    const message = error.message.includes("Invalid email")
      ? "Enter a valid email address."
      : "Could not look up that user.";
    return NextResponse.json({ code: "RESOLVE_FAILED", message }, { status: 400 });
  }

  const row = Array.isArray(data) ? data[0] : null;
  if (!row || typeof row.peer_id !== "string") {
    return NextResponse.json(
      { code: "PEER_NOT_FOUND", message: "No Hawwil account found for that email." },
      { status: 404 }
    );
  }

  return NextResponse.json({
    peer: {
      id: row.peer_id as string,
      fullName: row.full_name as string,
      country: row.country as string,
    },
  });
}
