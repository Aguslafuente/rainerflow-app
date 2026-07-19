import { redirect } from "next/navigation";

export default function OldAcceptPage({
  searchParams,
}: {
  searchParams: { gym?: string; email?: string };
}) {
  const params = new URLSearchParams();
  if (searchParams.gym) params.set("gym", searchParams.gym);
  if (searchParams.email) params.set("email", searchParams.email);
  redirect(`/aceptar-gym?${params.toString()}`);
}
