import type { CorridorCurrency } from "./recipients";

/** 1.5 % of send amount, rounded to one decimal place */
export const FEE_RATE = 0.015;

export const FX_RATES: Record<CorridorCurrency, number> = {
  YER: 140,
  JOD: 0.19,
  EGP: 13,
  SYP: 3400,
};

export const CURRENCY_LABELS: Record<CorridorCurrency, string> = {
  YER: "Yemeni Rial",
  JOD: "Jordanian Dinar",
  EGP: "Egyptian Pound",
  SYP: "Syrian Pound",
};
