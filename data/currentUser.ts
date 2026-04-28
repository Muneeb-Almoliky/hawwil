export interface CurrentUser {
  id: string;
  name: string;
  country: string;
  currency: "SAR";
  verified: boolean;
  balanceSar: number;
}

export const currentUser: CurrentUser = {
  id: "user-muneeb-001",
  name: "Muneeb Almoliky",
  country: "Saudi Arabia",
  currency: "SAR",
  verified: true,
  balanceSar: 12_500,
};
