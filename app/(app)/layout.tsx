import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/Sidebar";
import { MobileHeader } from "@/components/MobileHeader";
import { MobileNav } from "@/components/MobileNav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Si el usuario está vinculado como cliente, va a su portal (no al panel del entrenador).
  const { data: asClient } = await supabase
    .from("clients")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (asClient) redirect("/portal");

  return (
    <div className="shell">
      <Sidebar email={user.email ?? ""} />
      <MobileHeader />
      <main className="main">{children}</main>
      <MobileNav />
    </div>
  );
}
