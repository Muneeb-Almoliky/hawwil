import { FEE_RATE, FX_RATES } from "@/data/fxRates";
import type { CorridorCurrency } from "@/data/recipients";

export interface ConversionResult {
  amountSar: number;
  feeSar: number;
  afterFeesSar: number;
  rate: number;
  receiverAmount: number;
  receiverCurrency: CorridorCurrency;
}

/** Returns fee in SAR rounded to one decimal, minimum 0.5 SAR */
export function computeFee(amountSar: number): number {
  return Math.max(0.5, Math.round(amountSar * FEE_RATE * 10) / 10);
}

export function convert(
  amountSar: number,
  currency: CorridorCurrency,
  options?: { feeSar?: number }
): ConversionResult {
  const rate = FX_RATES[currency];
  const feeSar = options?.feeSar ?? computeFee(amountSar);
  const afterFeesSar = Math.max(0, amountSar - feeSar);
  const receiverAmount = afterFeesSar * rate;
  return {
    amountSar,
    feeSar,
    afterFeesSar,
    rate,
    receiverAmount,
    receiverCurrency: currency,
  };
}
