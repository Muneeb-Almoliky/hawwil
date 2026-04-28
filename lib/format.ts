import type { CorridorCurrency } from "@/data/recipients";

const CURRENCY_DECIMALS: Record<CorridorCurrency | "SAR", number> = {
  SAR: 0,
  YER: 0,
  JOD: 2,
  EGP: 0,
  SYP: 0,
};

export function formatMoney(
  value: number,
  currency: CorridorCurrency | "SAR"
): string {
  const decimals = CURRENCY_DECIMALS[currency];
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

let refCounter = 1;

export function generateReferenceId(): string {
  const datePart = new Date().toISOString().slice(0, 10);
  const seq = String(refCounter++).padStart(3, "0");
  return `HAW-${datePart}-${seq}`;
}

export function resetReferenceCounter(): void {
  refCounter = 1;
}
