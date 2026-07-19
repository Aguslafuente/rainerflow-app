import { createClient } from "@/lib/supabase/server";
import { GymSidebar } from "@/components/GymSidebar";
import { MobileHeader } from "@/components/MobileHeader";
import { GymMobileNav } from "@/components/GymMobileNav";
import { TrialBanner } from "@/components/TrialBanner";
import { PaywallScreen } from "@/components/PaywallScreen";

export default async function GymLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Middleware already handles auth + account_type routing.
  if (!user) {
    return <>{children}</>;
  }

  const [{ data: gym }, { data: profile }] = await Promise.all([
    supabase.from("gyms").select("name").eq("owner_id", user.id).single(),
    supabase
      .from("profiles")
      .select("trial_ends_at, subscription_status, subscription_expires_at, full_name, avatar_url")
      .eq("id", user.id)
      .single(),
  ]);

  const subStatus = profile?.subscription_status ?? "none";
  const trialEndsAt = profile?.trial_ends_at;
  const subExpiresAt = profile?.subscription_expires_at;
  const now = new Date();

  const trialExpired = trialEndsAt && new Date(trialEndsAt) < now;
  const subExpired = subExpiresAt && new Date(subExpiresAt) < now;

  const isBlockedTrial = trialExpired && subStatus !== "active";
  const isBlockedSub = subStatus === "active" && subExpired;

  if (isBlockedTrial) {
    return <PaywallScreen name={profile?.full_name?.split(" ")[0] || ""} reason="trial" accountType="gym" />;
  }

  if (isBlockedSub) {
    return <PaywallScreen name={profile?.full_name?.split(" ")[0] || ""} reason="expired" accountType="gym" />;
  }

  return (
    <div className="shell">
      <GymSidebar email={user.email ?? ""} gymName={gym?.name ?? "Mi Gym"} avatarUrl={profile?.avatar_url} fullName={profile?.full_name} />
      <MobileHeader />
      <main className="main">
        <TrialBanner
          trialEndsAt={profile?.trial_ends_at ?? null}
          subscriptionStatus={subStatus}
          subscriptionExpiresAt={profile?.subscription_expires_at ?? null}
          configPath="/gym/configuracion"
        />
        {children}
      </main>
      <GymMobileNav />
    </div>
  );
}
