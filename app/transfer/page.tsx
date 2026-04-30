import { redirect } from "next/navigation";
import { TransferFlow } from "@/features/transfer/TransferFlow";
import { getAuthenticatedProfile } from "@/lib/data-access";

export default async function TransferPage() {
  const profile = await getAuthenticatedProfile();
  if (!profile) {
    redirect("/login?next=/transfer");
  }

  return (
    <TransferFlow
      sender={{
        name: profile.name,
        country: profile.country,
      }}
    />
  );
}
