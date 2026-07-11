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

  const { data: client } = await supabase
    .from("clients")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  // Si no está vinculado como cliente, es un entrenador → a su panel.
  if (!client) redirect("/dashboard");

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
