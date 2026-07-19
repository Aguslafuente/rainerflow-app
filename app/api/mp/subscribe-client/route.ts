import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { currentPeriod, periodLabel } from "@/lib/format";

const SITE =
  process.env.NEXT_PUBLIC_SITE_URL || "https://trainerflow-uy.netlify.app";

/**
 * Genera un link de pago (Checkout Pro) para cobrar la cuota del cliente.
 * Redirige al checkout de MercadoPago.
 *
 * GET /api/mp/subscribe-client?client=CLIENT_ID
 *
 * Nota: MercadoPago no soporta débito automático (preapproval) en Uruguay,
 * por lo que usamos Checkout Pro para cada cobro mensual.
 */
export async function GET(req: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", SITE));
  }

  const clientId = req.nextUrl.searchParams.get("client");
  if (!clientId) {
    return NextResponse.json(
      { error: "Falta parámetro client" },
      { status: 400 }
    );
  }

  const { data: client } = await supabase
    .from("clients")
    .select("id, full_name, monthly_fee, currency, trainer_id")
    .eq("id", clientId)
    .single();

  if (!client || client.trainer_id !== user.id) {
    return NextResponse.json(
      { error: "Cliente no encontrado o no autorizado" },
      { status: 403 }
    );
  }

  if (!client.monthly_fee || Number(client.monthly_fee) <= 0) {
    return NextResponse.json(
      { error: "Este cliente no tiene cuota mensual definida." },
      { status: 400 }
    );
  }

  const token =
    process.env.MERCADOPAGO_ACCESS_TOKEN || process.env.MP_ACCESS_TOKEN;
  if (!token) {
    return NextResponse.json(
      { error: "Falta MERCADOPAGO_ACCESS_TOKEN." },
      { status: 500 }
    );
  }

  const fee = Number(client.monthly_fee);
  const period = currentPeriod();

  const preference = {
    items: [
      {
        title: `Cuota ${periodLabel(period)} · ${client.full_name}`,
        quantity: 1,
        unit_price: fee,
        currency_id: "UYU",
      },
    ],
    external_reference: `client|${clientId}|${user.id}`,
    back_urls: {
      success: `${SITE}/clientes/${clientId}?pago=ok`,
      failure: `${SITE}/clientes/${clientId}?pago=error`,
      pending: `${SITE}/clientes/${clientId}?pago=pending`,
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
    console.error("MP Client Payment error:", data);
    return NextResponse.json(
      { error: "No se pudo generar el checkout.", detail: data },
      { status: 502 }
    );
  }

  return NextResponse.redirect(data.init_point);
}
