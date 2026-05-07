import { redirect } from "next/navigation";
import { TransferFlow } from "@/features/transfer/TransferFlow";
import { getAuthenticatedProfile } from "@/lib/data-access";

interface TransferPageProps {
  searchParams: Promise<{ peerUserId?: string }>;
}

export default async function TransferPage({ searchParams }: TransferPageProps) {
  const params = await searchParams;
  const peerUserId = params.peerUserId?.trim() ?? "";
  const nextPath = peerUserId
    ? `/transfer?peerUserId=${encodeURIComponent(peerUserId)}`
    : "/transfer";

  const profile = await getAuthenticatedProfile();
  if (!profile) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }

  return (
    <TransferFlow
      initialPeerUserId={peerUserId || null}
      sender={{
        name: profile.name,
        country: profile.country,
      }}
    />
  );
}

