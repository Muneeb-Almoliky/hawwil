import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

type PayoutMethod = "cash_pickup" | "bank_account" | "mobile_wallet";

interface PayoutDetailsPayload {
  pickupCity?: string;
  receiverFullName?: string;
  walletProvider?: string;
  walletPhone?: string;
  bankName?: string;
  accountHolder?: string;
  accountNumber?: string;
}

interface SelectPayoutPayload {
  referenceId: string;
  payoutMethod: PayoutMethod;
  payoutDetails?: PayoutDetailsPayload;
}

interface ValidatedPayoutDetails {
  pickupCity?: string;
  receiverFullName?: string;
  walletProvider?: string;
  walletPhoneMasked?: string;
  bankName?: string;
  accountHolder?: string;
  accountNumberMasked?: string;
}

function normalizeText(value: string | undefined): string {
  return (value ?? "").trim().replace(/\s+/g, " ");
}

function maskPhone(phone: string): string {
  if (phone.length <= 4) {
    return "****";
  }
  return `${phone.slice(0, 3)}${"*".repeat(Math.max(2, phone.length - 5))}${phone.slice(-2)}`;
}

function maskAccountNumber(accountNumber: string): string {
  const compact = accountNumber.replace(/\s+/g, "");
  if (compact.length <= 4) {
    return "****";
  }
  return `****${compact.slice(-4)}`;
}

function validatePayoutDetails(
  payoutMethod: PayoutMethod,
  payoutDetails: PayoutDetailsPayload | undefined
): { error?: string; details?: ValidatedPayoutDetails } {
  if (payoutMethod === "cash_pickup") {
    const pickupCity = normalizeText(payoutDetails?.pickupCity);
    const receiverFullName = normalizeText(payoutDetails?.receiverFullName);
    if (pickupCity.length < 2) {
      return {
        error: "Provide pickup city for cash pickup.",
      };
    }
    return { details: { pickupCity, receiverFullName } };
  }

  if (payoutMethod === "mobile_wallet") {
    const walletProvider = normalizeText(payoutDetails?.walletProvider);
    const walletPhone = normalizeText(payoutDetails?.walletPhone);
    if (walletProvider.length < 2 || walletPhone.length < 8) {
      return {
        error: "Provide wallet provider and wallet phone number.",
      };
    }
    return {
      details: {
        walletProvider,
        walletPhoneMasked: maskPhone(walletPhone),
      },
    };
  }

  const bankName = normalizeText(payoutDetails?.bankName);
  const accountHolder = normalizeText(payoutDetails?.accountHolder);
  const accountNumber = normalizeText(payoutDetails?.accountNumber);
  if (bankName.length < 2 || accountHolder.length < 3 || accountNumber.length < 8) {
    return {
      error: "Provide bank name, account holder, and account number/IBAN.",
    };
  }
  return {
    details: {
      bankName,
      accountHolder,
      accountNumberMasked: maskAccountNumber(accountNumber),
    },
  };
}

export async function PATCH(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { code: "SUPABASE_NOT_CONFIGURED", message: "Supabase is not configured." },
      { status: 503 }
    );
  }

  let payload: SelectPayoutPayload;
  try {
    payload = (await request.json()) as SelectPayoutPayload;
  } catch {
    return NextResponse.json(
      { code: "INVALID_BODY", message: "Invalid request body." },
      { status: 400 }
    );
  }

  const referenceId = payload.referenceId?.trim();
  const payoutMethod = payload.payoutMethod;
  if (!referenceId || !payoutMethod) {
    return NextResponse.json(
      { code: "INVALID_FIELDS", message: "Reference and payout method are required." },
      { status: 400 }
    );
  }

  const { error: validationError, details } = validatePayoutDetails(
    payoutMethod,
    payload.payoutDetails
  );
  if (validationError || !details) {
    return NextResponse.json(
      { code: "INVALID_FIELDS", message: validationError ?? "Invalid payout details." },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("select_receiver_payout_method", {
    p_reference_id: referenceId,
    p_payout_method: payoutMethod,
    p_payout_details: details,
  });

  if (error || !data) {
    return NextResponse.json(
      {
        code: "PAYOUT_METHOD_FAILED",
        message: error?.message ?? "Could not select payout method.",
      },
      { status: 400 }
    );
  }

  return NextResponse.json({
    referenceId: data.reference_id,
    payoutMethod: data.payout_method,
    payoutDetails: data.payout_details ?? {},
    status: data.status,
  });
}
