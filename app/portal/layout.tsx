import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PortalHeader } from "@/components/PortalHeader";
import { PortalNav } from "@/components/PortalNav";

export const dynamic = "force-dynamic";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Check email verification
  if (!user.email_confirmed_at) {
    redirect("/auth/verificar-correo");
  }

  const { data: client } = await supabase
    .from("clients")
    .select("id, is_active")
    .eq("user_id", user.id)
    .maybeSingle();

  // Si no está vinculado como cliente, es un entrenador → a su panel.
  if (!client) redirect("/dashboard");

  // Check is_active — redirect to standalone page outside portal layout
  if (!client.is_active) {
    redirect("/cuenta-desactivada");
  }

  return (
    <div className="portal">
      <PortalHeader />
      <main className="portal-main">
        <PortalNav />
        {children}
      </main>
    </div>
  );
}
