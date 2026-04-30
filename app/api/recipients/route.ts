import { NextResponse } from "next/server";
import {
  getCorridorByCountry,
  maskPhone,
  type CorridorCurrency,
} from "@/data/recipients";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

interface RecipientRecord {
  id: string;
  full_name: string;
  country: string;
  country_code: string;
  currency: CorridorCurrency;
  phone: string;
  masked_phone: string;
}

interface CreateRecipientPayload {
  name: string;
  country: string;
  phone: string;
}

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ code: "SUPABASE_NOT_CONFIGURED", recipients: [] });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ code: "UNAUTHORIZED", message: "Please sign in again." }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("recipients")
    .select("id, full_name, country, country_code, currency, phone, masked_phone")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  if (error || !data) {
    return NextResponse.json({ code: "RECIPIENTS_FETCH_FAILED", recipients: [] }, { status: 500 });
  }

  const recipients = data.map((record) => ({
    id: record.id,
    name: record.full_name,
    country: record.country,
    countryCode: record.country_code,
    currency: record.currency,
    phone: record.phone,
    maskedPhone: record.masked_phone,
  }));

  return NextResponse.json({ recipients });
}

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { code: "SUPABASE_NOT_CONFIGURED", message: "Supabase is not configured." },
      { status: 503 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ code: "UNAUTHORIZED", message: "Please sign in again." }, { status: 401 });
  }

  let payload: CreateRecipientPayload;
  try {
    payload = (await request.json()) as CreateRecipientPayload;
  } catch {
    return NextResponse.json({ code: "INVALID_BODY", message: "Invalid request body." }, { status: 400 });
  }

  const name = payload.name?.trim();
  const country = payload.country?.trim();
  const phone = payload.phone?.trim();

  if (!name || !country || !phone) {
    return NextResponse.json(
      { code: "INVALID_FIELDS", message: "Name, country, and phone are required." },
      { status: 400 }
    );
  }

  const corridor = getCorridorByCountry(country);
  if (!corridor) {
    return NextResponse.json({ code: "UNSUPPORTED_COUNTRY", message: "Unsupported recipient country." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("recipients")
    .insert({
      user_id: user.id,
      full_name: name,
      country: corridor.country,
      country_code: corridor.countryCode,
      currency: corridor.currency,
      phone,
      masked_phone: maskPhone(phone),
    })
    .select("id, full_name, country, country_code, currency, phone, masked_phone")
    .single();

  if (error || !data) {
    return NextResponse.json(
      { code: "RECIPIENT_CREATE_FAILED", message: "Could not add recipient." },
      { status: 500 }
    );
  }

  const recipientRecord = data as RecipientRecord;
  return NextResponse.json({
    recipient: {
      id: recipientRecord.id,
      name: recipientRecord.full_name,
      country: recipientRecord.country,
      countryCode: recipientRecord.country_code,
      currency: recipientRecord.currency,
      phone: recipientRecord.phone,
      maskedPhone: recipientRecord.masked_phone,
    },
  });
}
