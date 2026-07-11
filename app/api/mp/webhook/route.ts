import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// MercadoPago llama a esta URL cuando cambia el estado de un pago o suscripción.
export async function POST(req: NextRequest) {
  const token =
    process.env.MERCADOPAGO_ACCESS_TOKEN || process.env.MP_ACCESS_TOKEN;
  if (!token) return NextResponse.json({ ok: true });

  const url = new URL(req.url);
  let type =
    url.searchParams.get("type") || url.searchParams.get("topic") || "";
  let resourceId =
    url.searchParams.get("data.id") || url.searchParams.get("id") || "";

  try {
    const body = await req.json();
    if (body?.type) type = body.type;
    if (body?.action && String(body.action).startsWith("payment")) type = "payment";
    if (body?.action && String(body.action).startsWith("subscription")) type = "subscription_preapproval";
    if (body?.data?.id) resourceId = String(body.data.id);
  } catch {
    /* body no-JSON */
  }

  if (!resourceId) return NextResponse.json({ ok: true });

  const supabase = createClient();

  // ── Pagos de cuotas ──
  if (type === "payment" || (!type && resourceId)) {
    await handlePayment(resourceId, token, supabase);
  }

  // ── Suscripciones (preapproval) ──
  if (type === "subscription_preapproval" || type === "preapproval") {
    await handleSubscription(resourceId, token, supabase);
  }

  return NextResponse.json({ ok: true });
}

async function handlePayment(paymentId: string, token: string, supabase: any) {
  const res = await fetch(
    `https://api.mercadopago.com/v1/payments/${paymentId}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) return;
  const p = await res.json();

  if (p.status !== "approved") return;

  const [clientId, period] = String(p.external_reference || "").split("|");
  if (!clientId) return;

  // Si tiene marketplace_fee, registrar comisión
  await supabase.rpc("record_mp_payment", {
    p_client: clientId,
    p_amount: p.transaction_amount,
    p_currency: p.currency_id || "UYU",
    p_period: period || null,
    p_mp_id: String(p.id),
    p_status: p.status,
    p_paid: p.date_approved ? String(p.date_approved).slice(0, 10) : null,
  });

  // Registrar comisión si hubo marketplace_fee
  if (p.marketplace_fee || p.fee_details?.length) {
    const fee = p.marketplace_fee || 0;
    if (fee > 0) {
      // Buscar trainer_id del cliente
      const { data: client } = await supabase
        .from("clients")
        .select("trainer_id")
        .eq("id", clientId)
        .single();

      if (client) {
        await supabase.from("commissions").insert({
          trainer_id: client.trainer_id,
          client_id: clientId,
          mp_payment_id: String(p.id),
          amount: fee,
          currency: p.currency_id || "UYU",
          rate: 0.05,
        });
      }
    }
  }
}

async function handleSubscription(
  preapprovalId: string,
  token: string,
  supabase: any
) {
  const res = await fetch(
    `https://api.mercadopago.com/preapproval/${preapprovalId}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) return;
  const sub = await res.json();

  // external_reference puede ser "trainerId" o "trainerId|plan"
  const refParts = String(sub.external_reference || "").split("|");
  const trainerId = refParts[0];
  const plan = refParts[1] || undefined;
  if (!trainerId) return;

  // Mapear status de MP a nuestro status
  let status = "pending";
  if (sub.status === "authorized") status = "active";
  else if (sub.status === "paused") status = "paused";
  else if (sub.status === "cancelled") status = "cancelled";

  const updateData: any = {
    status,
    mp_preapproval_id: preapprovalId,
    updated_at: new Date().toISOString(),
  };
  if (plan) updateData.plan = plan;

  await supabase
    .from("subscriptions")
    .update(updateData)
    .eq("trainer_id", trainerId);

  await supabase
    .from("profiles")
    .update({ subscription_status: status })
    .eq("id", trainerId);
}

// Algunos avisos de MP llegan como GET de verificación
export async function GET() {
  return NextResponse.json({ ok: true });
}
