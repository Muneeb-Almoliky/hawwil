"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface ReceiverPayoutSelectorProps {
  referenceId: string;
  recipientName: string;
  recipientCountry: string;
  isLocked: boolean;
}

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

const CASH_PICKUP_LOCATIONS: Record<string, string[]> = {
  Yemen: ["Sana'a - Main Branch", "Aden - Crater Branch", "Taiz - City Center", "Mukalla - Downtown"],
  Jordan: ["Amman - Abdali", "Irbid - Downtown", "Zarqa - Main Street"],
  Egypt: ["Cairo - Nasr City", "Alexandria - Sidi Gaber", "Giza - Dokki"],
  Syria: ["Damascus - Baramkeh", "Aleppo - Aziziyah", "Homs - City Center"],
};

const WALLET_PROVIDERS: Record<string, string[]> = {
  Yemen: ["Yemen Wallet", "Jawali", "Cash Mobile", "Other"],
  Jordan: ["Zain Cash", "Dinarak", "Orange Money", "Other"],
  Egypt: ["Vodafone Cash", "Orange Cash", "Etisalat Cash", "Other"],
  Syria: ["Syriatel Cash", "MTN Cash", "Cham Wallet", "Other"],
};

const BANK_OPTIONS: Record<string, string[]> = {
  Yemen: ["Yemen Kuwait Bank", "Tadhamon Bank", "CAC Bank", "Other"],
  Jordan: ["Arab Bank", "Bank of Jordan", "Cairo Amman Bank", "Other"],
  Egypt: ["National Bank of Egypt", "Banque Misr", "CIB", "Other"],
  Syria: ["Commercial Bank of Syria", "Banque Bemo", "Byblos Bank Syria", "Other"],
};

const COUNTRY_DIAL_CODES: Record<string, string> = {
  Yemen: "+967",
  Jordan: "+962",
  Egypt: "+20",
  Syria: "+963",
};

export function ReceiverPayoutSelector({
  referenceId,
  recipientName,
  recipientCountry,
  isLocked,
}: ReceiverPayoutSelectorProps) {
  const router = useRouter();
  const [method, setMethod] = useState<PayoutMethod>("cash_pickup");
  const [pickupCity, setPickupCity] = useState("");
  const [walletProvider, setWalletProvider] = useState("");
  const [walletPhone, setWalletPhone] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountHolder, setAccountHolder] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const pickupLocationOptions =
    CASH_PICKUP_LOCATIONS[recipientCountry] ?? ["Main payout branch", "Other"];
  const walletProviderOptions =
    WALLET_PROVIDERS[recipientCountry] ?? ["Primary wallet", "Other"];
  const bankNameOptions =
    BANK_OPTIONS[recipientCountry] ?? ["Primary partner bank", "Other"];
  const phonePrefix = COUNTRY_DIAL_CODES[recipientCountry] ?? "+";

  const isDetailsValid = (() => {
    if (method === "cash_pickup") {
      return pickupCity.trim().length >= 2;
    }
    if (method === "mobile_wallet") {
      return walletProvider.trim().length >= 2 && walletPhone.trim().length >= 8;
    }
    return (
      bankName.trim().length >= 2 &&
      accountHolder.trim().length >= 3 &&
      accountNumber.trim().length >= 8
    );
  })();

  function getPayoutDetailsPayload(): PayoutDetailsPayload {
    if (method === "cash_pickup") {
      return {
        pickupCity: pickupCity.trim(),
        receiverFullName: recipientName,
      };
    }

    if (method === "mobile_wallet") {
      return {
        walletProvider: walletProvider.trim(),
        walletPhone: walletPhone.trim(),
      };
    }

    return {
      bankName: bankName.trim(),
      accountHolder: accountHolder.trim(),
      accountNumber: accountNumber.trim(),
    };
  }

  if (isLocked) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-stone-200 bg-white shadow-sm p-5 flex flex-col gap-3">
      <p className="text-sm font-bold text-stone-950">Choose how to receive funds</p>
      <p className="text-xs text-stone-500">
        Select the payout method that works best for you.
      </p>

      <div className="rounded-xl border border-stone-200 bg-stone-50 p-1 grid grid-cols-3 gap-1">
        {[
          { id: "cash_pickup", label: "Cash" },
          { id: "mobile_wallet", label: "Wallet" },
          { id: "bank_account", label: "Bank" },
        ].map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => setMethod(option.id as PayoutMethod)}
            className={[
              "rounded-lg py-2 text-xs font-bold transition-colors",
              method === option.id
                ? "bg-emerald-600 text-white"
                : "bg-white text-stone-700 hover:bg-stone-100",
            ].join(" ")}
          >
            {option.label}
          </button>
        ))}
      </div>

      {method === "cash_pickup" && (
        <div className="grid grid-cols-1 gap-2">
          <div className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-stone-500">
              Receiver
            </p>
            <p className="text-sm font-semibold text-stone-900 mt-0.5">{recipientName}</p>
          </div>
          <select
            value={pickupCity}
            onChange={(event) => setPickupCity(event.target.value)}
            className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm text-stone-950 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
          >
            <option value="">Select pickup branch</option>
            {pickupLocationOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      )}

      {method === "mobile_wallet" && (
        <div className="grid grid-cols-1 gap-2">
          <select
            value={walletProvider}
            onChange={(event) => setWalletProvider(event.target.value)}
            className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm text-stone-950 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
          >
            <option value="">Select wallet provider</option>
            {walletProviderOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <input
            value={walletPhone}
            onChange={(event) => setWalletPhone(event.target.value)}
            placeholder={`${phonePrefix}XXXXXXXX`}
            className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm text-stone-950 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
          />
        </div>
      )}

      {method === "bank_account" && (
        <div className="grid grid-cols-1 gap-2">
          <select
            value={bankName}
            onChange={(event) => setBankName(event.target.value)}
            className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm text-stone-950 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
          >
            <option value="">Select bank</option>
            {bankNameOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <input
            value={accountHolder}
            onChange={(event) => setAccountHolder(event.target.value)}
            placeholder="Account holder full name"
            className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm text-stone-950 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
          />
          <input
            value={accountNumber}
            onChange={(event) => setAccountNumber(event.target.value)}
            placeholder="Bank account number / IBAN"
            className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm text-stone-950 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
          />
        </div>
      )}

      <button
        type="button"
        disabled={isSubmitting || !isDetailsValid}
        onClick={async () => {
          setIsSubmitting(true);
          setStatusMessage(null);
          try {
            const response = await fetch("/api/receiver/select-payout", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                referenceId,
                payoutMethod: method,
                payoutDetails: getPayoutDetailsPayload(),
              }),
            });
            const result = (await response.json()) as { message?: string };
            if (!response.ok) {
              setStatusMessage(result.message ?? "Could not save payout method.");
              return;
            }
            setStatusMessage("Payout method saved.");
            router.refresh();
          } catch {
            setStatusMessage("Network error while saving payout method.");
          } finally {
            setIsSubmitting(false);
          }
        }}
        className="rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-stone-200 disabled:text-stone-400 text-white font-bold py-2.5 text-sm"
      >
        {isSubmitting ? "Saving..." : "Confirm payout method"}
      </button>

      {statusMessage && <p className="text-xs text-stone-600">{statusMessage}</p>}
    </div>
  );
}
