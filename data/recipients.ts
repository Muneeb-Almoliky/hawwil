export type CorridorCurrency = "YER" | "JOD" | "EGP" | "SYP";

export interface Recipient {
  id: string;
  name: string;
  country: string;
  countryCode: string;
  currency: CorridorCurrency;
  phone: string;
  maskedPhone: string;
}

export const recipients: Recipient[] = [
  {
    id: "r-ammar-ye",
    name: "Mohammed Al-Mekhlafi",
    country: "Yemen",
    countryCode: "YE",
    currency: "YER",
    phone: "+96771234512",
    maskedPhone: "+967 ••• ••12",
  },
  {
    id: "r-layla-jo",
    name: "Ismail Al-Sharihi",
    country: "Jordan",
    countryCode: "JO",
    currency: "JOD",
    phone: "+96279876543",
    maskedPhone: "+962 ••• ••43",
  },
  {
    id: "r-omar-eg",
    name: "Khalid Al-Rashidi",
    country: "Egypt",
    countryCode: "EG",
    currency: "EGP",
    phone: "+201012345678",
    maskedPhone: "+20 ••• ••78",
  },
  {
    id: "r-yasmin-sy",
    name: "Omar Al-Halabi",
    country: "Syria",
    countryCode: "SY",
    currency: "SYP",
    phone: "+963991234567",
    maskedPhone: "+963 ••• ••67",
  },
];

export function getRecipientById(id: string): Recipient | undefined {
  return recipients.find((r) => r.id === id);
}
