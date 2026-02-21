import { UserDetailsClient } from "@/components/v2/users/UserDetailsClient";

interface UserDetailsPageProps {
  params: Promise<{ id: string }>;
}

export default async function UserDetailsPage({ params }: UserDetailsPageProps) {
  const { id } = await params;
  return <UserDetailsClient id={id} />;
}
