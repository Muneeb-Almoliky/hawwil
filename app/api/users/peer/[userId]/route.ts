import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const runtime = "nodejs";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

interface PeerRouteContext {
  params: Promise<{ userId: string }>;
}

export async function GET(_request: Request, context: PeerRouteContext) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { code: "SUPABASE_NOT_CONFIGURED", message: "Supabase is not configured." },
      { status: 503 }
    );
  }

  const { userId } = await context.params;
  const trimmed = userId?.trim() ?? "";
  if (!trimmed || !UUID_RE.test(trimmed)) {
    return NextResponse.json(
      { code: "INVALID_USER_ID", message: "Invalid user id." },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json(
      { code: "UNAUTHORIZED", message: "Please sign in again." },
      { status: 401 }
    );
  }

  if (trimmed === user.id) {
    return NextResponse.json(
      { code: "INVALID_PEER", message: "You cannot send to your own account." },
      { status: 400 }
    );
  }

  const { data, error } = await supabase.rpc("resolve_peer_profile_by_id", {
    p_peer_id: trimmed,
  });

  if (error) {
    return NextResponse.json(
      { code: "RESOLVE_FAILED", message: "Could not look up that user." },
      { status: 400 }
    );
  }

  const row = Array.isArray(data) ? data[0] : null;
  if (!row || typeof row.peer_id !== "string") {
    return NextResponse.json(
      { code: "PEER_NOT_FOUND", message: "No Hawwil account found for that user." },
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
