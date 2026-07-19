import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const SITE =
  process.env.NEXT_PUBLIC_SITE_URL || "https://trainerflow-uy.netlify.app";

const PLAN_PRICE_UYU = 1200;

/**
 * Creates a Checkout Pro preference for the trainer to subscribe to TrainerFlow.
 * Excludes Abitab, RedPagos, and other non-card/non-MP methods.
 */
export async function GET() {
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

  const preference = {
    items: [
      {
        title: "TrainerFlow Pro · Suscripción mensual",
        quantity: 1,
        unit_price: PLAN_PRICE_UYU,
        currency_id: "UYU",
      },
    ],
    external_reference: `trainer_sub|${user.id}`,
    back_urls: {
      success: `${SITE}/suscripcion?status=ok`,
      failure: `${SITE}/suscripcion?status=error`,
      pending: `${SITE}/suscripcion?status=pending`,
    },
    auto_return: "approved",
    notification_url: `${SITE}/api/mp/webhook`,
    excluded_payment_methods: [
      { id: "abitab" },
      { id: "redpagos" },
    ],
    excluded_payment_types: [
      { id: "ticket" },      // Abitab, RedPagos, etc.
      { id: "atm" },         // Cajeros
      { id: "bank_transfer" }, // Transferencias bancarias
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
    console.error("Trainer subscribe error:", data);
    return NextResponse.json(
      { error: "No se pudo generar el checkout.", detail: data },
      { status: 502 }
    );
  }

  return NextResponse.redirect(data.init_point);
}
