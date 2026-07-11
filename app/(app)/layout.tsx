import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/Sidebar";
import { MobileHeader } from "@/components/MobileHeader";
import { MobileNav } from "@/components/MobileNav";
import { TrialBanner } from "@/components/TrialBanner";
import { LogoMark } from "@/components/Logo";
import { PaywallScreen } from "@/components/PaywallScreen";

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

  // Get trial & subscription info
  const { data: profile } = await supabase
    .from("profiles")
    .select("trial_ends_at, subscription_status, full_name")
    .eq("id", user.id)
    .single();

  const subStatus = profile?.subscription_status ?? "none";
  const trialEndsAt = profile?.trial_ends_at;
  const trialExpired = trialEndsAt && new Date(trialEndsAt) < new Date();
  const isBlocked = trialExpired && subStatus !== "active";

  // If trial expired and no active subscription → block everything except payment
  if (isBlocked) {
    return <PaywallScreen name={profile?.full_name?.split(" ")[0] || ""} />;
  }

  return (
    <div className="shell">
      <Sidebar email={user.email ?? ""} />
      <MobileHeader />
      <main className="main">
        <TrialBanner
          trialEndsAt={profile?.trial_ends_at ?? null}
          subscriptionStatus={subStatus}
        />
        {children}
      </main>
      <MobileNav />
    </div>
  );
}
