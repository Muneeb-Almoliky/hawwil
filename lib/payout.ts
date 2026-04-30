import type { TransferRecord } from "@/data/history";

export function formatPayoutMethod(
  payoutMethod: TransferRecord["payoutMethod"] | undefined
): string {
  if (!payoutMethod) {
    return "Not selected";
  }
  if (payoutMethod === "cash_pickup") {
    return "Cash pickup";
  }
  if (payoutMethod === "mobile_wallet") {
    return "Mobile wallet";
  }
  return "Bank account";
}

export function formatPayoutDetailsSummary(
  payoutMethod: TransferRecord["payoutMethod"] | undefined,
  payoutDetails: TransferRecord["payoutDetails"] | undefined
): string | null {
  if (!payoutMethod || !payoutDetails) {
    return null;
  }

  if (payoutMethod === "cash_pickup") {
    if (!payoutDetails.pickupCity) {
      return null;
    }
    return `Pickup in ${payoutDetails.pickupCity}`;
  }

  if (payoutMethod === "mobile_wallet") {
    if (!payoutDetails.walletProvider || !payoutDetails.walletPhoneMasked) {
      return null;
    }
    return `${payoutDetails.walletProvider} · ${payoutDetails.walletPhoneMasked}`;
  }

  if (!payoutDetails.bankName || !payoutDetails.accountNumberMasked) {
    return null;
  }
  return `${payoutDetails.bankName} · ${payoutDetails.accountNumberMasked}`;
}
