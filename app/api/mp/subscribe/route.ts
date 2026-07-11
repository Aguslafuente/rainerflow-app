import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { PLANS, type PlanId } from "@/lib/mp";

const SITE =
  process.env.NEXT_PUBLIC_SITE_URL || "https://trainerflow-uy.netlify.app";

/**
 * Crea una suscripción recurrente para el entrenador.
 * Acepta ?plan=pro (default) o ?plan=team
 */
export async function GET(req: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", SITE));
  }

  const token =
    process.env.MERCADOPAGO_ACCESS_TOKEN || process.env.MP_ACCESS_TOKEN;
  if (!token) {
    return NextResponse.json(
      { error: "Falta MERCADOPAGO_ACCESS_TOKEN." },
      { status: 500 }
    );
  }

  // Plan desde query param
  const planParam = req.nextUrl.searchParams.get("plan") || "pro";
  const planId: PlanId = planParam === "team" ? "team" : "pro";
  const plan = PLANS[planId];

  // Verificar si ya tiene suscripción activa
  const { data: existing } = await supabase
    .from("subscriptions")
    .select("id, status, mp_preapproval_id, plan")
    .eq("trainer_id", user.id)
    .maybeSingle();

  if (existing?.status === "active") {
    // Si quiere cambiar de plan, permitirlo (cancelar viejo, crear nuevo)
    if (existing.plan === planId) {
      return NextResponse.redirect(
        new URL("/configuracion?sub=already_active", SITE)
      );
    }
    // Cancelar suscripción vieja en MP
    if (existing.mp_preapproval_id) {
      await fetch(
        `https://api.mercadopago.com/preapproval/${existing.mp_preapproval_id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: "cancelled" }),
        }
      );
    }
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  // Crear preapproval (suscripción sin plan asociado)
  const preapproval = {
    reason: plan.reason,
    auto_recurring: {
      frequency: 1,
      frequency_type: "months",
      transaction_amount: plan.price,
      currency_id: "USD",
    },
    back_url: `${SITE}/configuracion?sub=done`,
    external_reference: `${user.id}|${planId}`,
    payer_email: user.email,
    status: "pending",
  };

  const res = await fetch("https://api.mercadopago.com/preapproval", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(preapproval),
  });

  const data = await res.json();

  if (!res.ok || !data.init_point) {
    console.error("MP Subscription error:", data);
    return NextResponse.json(
      { error: "No se pudo crear la suscripción.", detail: data },
      { status: 502 }
    );
  }

  // Guardar/actualizar suscripción en DB
  await supabase.from("subscriptions").upsert(
    {
      trainer_id: user.id,
      plan: planId,
      price_usd: plan.price,
      status: "pending",
      mp_preapproval_id: data.id,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "trainer_id" }
  );

  return NextResponse.redirect(data.init_point);
}
