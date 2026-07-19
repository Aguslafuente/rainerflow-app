import { createAdminClient } from "@/lib/supabase/admin";

const COMMISSION_RATE = 0.05; // 5% default (Pro)
const COMMISSION_RATE_TEAM = 0.03; // 3% (Team)

export const PLANS = {
  pro: { label: "Pro", price: 1200, commission: 0.05, reason: "TrainerFlow Pro · Suscripción mensual" },
  team: { label: "Team", price: 2500, commission: 0.03, reason: "TrainerFlow Team · Suscripción mensual" },
} as const;

export type PlanId = keyof typeof PLANS;

/**
 * Obtiene el access_token de MP del entrenador.
 * Si está vencido, lo refresca automáticamente.
 */
export async function getTrainerMpToken(trainerId: string): Promise<string | null> {
  const supabase = createAdminClient();

  const { data: cred } = await supabase
    .from("mp_credentials")
    .select("*")
    .eq("trainer_id", trainerId)
    .single();

  if (!cred) return null;

  // Si no venció, devolver directamente
  if (cred.expires_at && new Date(cred.expires_at) > new Date()) {
    return cred.access_token;
  }

  // Intentar refresh
  if (!cred.refresh_token) return null;

  const appId = process.env.MP_APP_ID;
  const appSecret = process.env.MP_APP_SECRET;
  if (!appId || !appSecret) return null;

  const res = await fetch("https://api.mercadopago.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: appId,
      client_secret: appSecret,
      grant_type: "refresh_token",
      refresh_token: cred.refresh_token,
    }),
  });

  const data = await res.json();
  if (!res.ok || !data.access_token) return null;

  const expiresAt = data.expires_in
    ? new Date(Date.now() + data.expires_in * 1000).toISOString()
    : null;

  await supabase
    .from("mp_credentials")
    .update({
      access_token: data.access_token,
      refresh_token: data.refresh_token || cred.refresh_token,
      public_key: data.public_key || cred.public_key,
      expires_at: expiresAt,
      updated_at: new Date().toISOString(),
    })
    .eq("trainer_id", trainerId);

  return data.access_token;
}

/**
 * Calcula la comisión de TrainerFlow sobre un monto.
 * Acepta plan para usar la tasa correcta.
 */
export function calcCommission(amount: number, plan: PlanId = "pro"): number {
  const rate = PLANS[plan]?.commission ?? COMMISSION_RATE;
  return Math.round(amount * rate * 100) / 100;
}

export { COMMISSION_RATE, COMMISSION_RATE_TEAM };
