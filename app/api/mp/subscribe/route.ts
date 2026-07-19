import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { PLANS, type PlanId } from "@/lib/mp";

const SITE =
  process.env.NEXT_PUBLIC_SITE_URL || "https://trainerflow-uy.netlify.app";

/**
 * Crea un Checkout Pro para la suscripción del entrenador.
 * Acepta ?plan=pro (default) o ?plan=team
 *
 * Nota: No usamos preapproval porque no está disponible en Uruguay.
 * Usamos Checkout Pro (pago único mensual).
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

  const planParam = req.nextUrl.searchParams.get("plan") || "pro";
  const planId: PlanId = planParam === "team" ? "team" : "pro";
  const plan = PLANS[planId];

  const preference = {
    items: [
      {
        title: plan.reason,
        quantity: 1,
        unit_price: plan.price,
        currency_id: "UYU",
      },
    ],
    external_reference: `trainer_sub|${user.id}|${planId}`,
    back_urls: {
      success: planId === "team" ? `${SITE}/gym/configuracion?sub=done` : `${SITE}/configuracion?sub=done`,
      failure: planId === "team" ? `${SITE}/gym/configuracion?sub=error` : `${SITE}/configuracion?sub=error`,
      pending: planId === "team" ? `${SITE}/gym/configuracion?sub=pending` : `${SITE}/configuracion?sub=pending`,
    },
    auto_return: "approved",
    notification_url: `${SITE}/api/mp/webhook`,
    excluded_payment_types: [
      { id: "ticket" },
      { id: "atm" },
      { id: "bank_transfer" },
    ],
  };

  const res = await fetch("https://api.mercadopago.com/checkout/preferences", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(preference),
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
  const { error: subscriptionError } = await supabase.from("subscriptions").upsert(
    {
      trainer_id: user.id,
      plan: planId,
      price_usd: plan.price,
      status: "pending",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "trainer_id" }
  );
  if (subscriptionError) {
    console.error("Subscription pending state error:", subscriptionError);
    return NextResponse.json(
      { error: "No se pudo guardar el estado de la suscripción." },
      { status: 500 }
    );
  }

  return NextResponse.redirect(data.init_point);
}
