import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { PLANS, type PlanId } from "@/lib/mp";

function validWebhookSignature(req: NextRequest, dataId: string) {
  const secret = process.env.MP_WEBHOOK_SECRET;
  if (!secret) return true;

  const signatureHeader = req.headers.get("x-signature") || "";
  const requestId = req.headers.get("x-request-id") || "";
  const values = Object.fromEntries(
    signatureHeader.split(",").map((part) => {
      const [key, ...rest] = part.trim().split("=");
      return [key, rest.join("=")];
    })
  );
  const timestamp = values.ts;
  const signature = values.v1;
  if (!timestamp || !signature) return false;

  const manifest = [
    dataId ? `id:${dataId.toLowerCase()};` : "",
    requestId ? `request-id:${requestId};` : "",
    `ts:${timestamp};`,
  ].join("");
  const expected = createHmac("sha256", secret).update(manifest).digest("hex");

  try {
    return timingSafeEqual(Buffer.from(signature, "hex"), Buffer.from(expected, "hex"));
  } catch {
    return false;
  }
}

// MercadoPago llama a esta URL cuando cambia el estado de un pago o suscripción.
export async function POST(req: NextRequest) {
  const token =
    process.env.MERCADOPAGO_ACCESS_TOKEN || process.env.MP_ACCESS_TOKEN;
  if (!token) {
    return NextResponse.json({ error: "MercadoPago no configurado" }, { status: 503 });
  }

  const url = new URL(req.url);
  const signedDataId =
    url.searchParams.get("data.id") || url.searchParams.get("id") || "";
  if (!validWebhookSignature(req, signedDataId)) {
    return NextResponse.json({ error: "Firma inválida" }, { status: 401 });
  }

  let type =
    url.searchParams.get("type") || url.searchParams.get("topic") || "";
  let resourceId = signedDataId;

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

  const supabase = createAdminClient();

  try {
    // ── Pagos de cuotas ──
    if (type === "payment" || (!type && resourceId)) {
      await handlePayment(resourceId, token, supabase);
    }

    // ── Suscripciones (preapproval) ──
    if (type === "subscription_preapproval" || type === "preapproval") {
      await handleSubscription(resourceId, token, supabase);
    }
  } catch (error) {
    console.error("MercadoPago webhook error:", error);
    return NextResponse.json({ error: "No se pudo procesar" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

async function handlePayment(
  paymentId: string,
  token: string,
  supabase: SupabaseClient
) {
  const res = await fetch(
    `https://api.mercadopago.com/v1/payments/${paymentId}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) throw new Error(`MercadoPago payment lookup failed: ${res.status}`);
  const p = await res.json();

  if (p.status !== "approved") return;

  const ref = String(p.external_reference || "");
  const refParts = ref.split("|");

  // Pago de suscripción del TRAINER a TrainerFlow: "trainer_sub|trainerId|planId"
  if (refParts[0] === "trainer_sub") {
    const trainerId = refParts[1];
    const planId: PlanId = refParts[2] === "team" ? "team" : "pro";
    if (trainerId) {
      const expectedPlan = PLANS[planId];
      if (
        p.currency_id !== "UYU" ||
        Number(p.transaction_amount) !== expectedPlan.price
      ) {
        throw new Error("El pago de suscripción no coincide con el plan");
      }

      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          subscription_status: "active",
          subscription_expires_at: expiresAt,
        })
        .eq("id", trainerId);
      if (profileError) throw profileError;

      const { error: subscriptionError } = await supabase.from("subscriptions").upsert(
        {
          trainer_id: trainerId,
          plan: planId,
          status: "active",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "trainer_id" }
      );
      if (subscriptionError) throw subscriptionError;

      // Si el plan es Team y el usuario es trainer, upgrade a gym
      if (planId === "team") {
        const { data: prof } = await supabase
          .from("profiles")
          .select("account_type, full_name, business_name")
          .eq("id", trainerId)
          .single();

        if (prof && prof.account_type !== "gym") {
          const { error: accountError } = await supabase
            .from("profiles")
            .update({ account_type: "gym" })
            .eq("id", trainerId);
          if (accountError) throw accountError;

          // Crear registro de gym si no existe
          const { data: existingGym } = await supabase
            .from("gyms")
            .select("id")
            .eq("owner_id", trainerId)
            .maybeSingle();

          if (!existingGym) {
            const { error: gymError } = await supabase.from("gyms").insert({
              owner_id: trainerId,
              name: prof.business_name || prof.full_name || "Mi Gym",
            });
            if (gymError) throw gymError;
          }
        }
      }
    }
    return;
  }

  // Suscripción de cliente: "client|clientId|trainerId"
  let clientId: string;
  let period: string | null;
  if (refParts[0] === "client") {
    clientId = refParts[1];
    period = new Date().toISOString().slice(0, 7); // auto-generate period
  } else {
    clientId = refParts[0];
    period = refParts[1] || null;
  }
  if (!clientId) return;

  // Si tiene marketplace_fee, registrar comisión
  const { error: paymentError } = await supabase.rpc("record_mp_payment", {
    p_client: clientId,
    p_amount: p.transaction_amount,
    p_currency: p.currency_id || "UYU",
    p_period: period || null,
    p_mp_id: String(p.id),
    p_status: p.status,
    p_paid: p.date_approved ? String(p.date_approved).slice(0, 10) : null,
  });
  if (paymentError) throw paymentError;

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
        const { error: commissionError } = await supabase.from("commissions").insert({
          trainer_id: client.trainer_id,
          client_id: clientId,
          mp_payment_id: String(p.id),
          amount: fee,
          currency: p.currency_id || "UYU",
          rate: 0.05,
        });
        if (commissionError && commissionError.code !== "23505") {
          throw commissionError;
        }
      }
    }
  }
}

async function handleSubscription(
  preapprovalId: string,
  token: string,
  supabase: SupabaseClient
) {
  const res = await fetch(
    `https://api.mercadopago.com/preapproval/${preapprovalId}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) throw new Error(`MercadoPago subscription lookup failed: ${res.status}`);
  const sub = await res.json();

  const ref = String(sub.external_reference || "");
  const refParts = ref.split("|");

  // ── Suscripción de CLIENTE (débito automático mensual) ──
  if (refParts[0] === "client") {
    const clientId = refParts[1];
    const trainerId = refParts[2];
    if (!clientId) return;

    let status = "pending";
    if (sub.status === "authorized") status = "active";
    else if (sub.status === "paused") status = "paused";
    else if (sub.status === "cancelled") status = "none";

    const { error } = await supabase
      .from("clients")
      .update({
        mp_subscription_id: preapprovalId,
        mp_subscription_status: status,
      })
      .eq("id", clientId);
    if (error) throw error;

    return;
  }

  // ── Suscripción de TRAINER (SaaS) ──
  const trainerId = refParts[0];
  const plan = refParts[1] || undefined;
  if (!trainerId) return;

  let status = "pending";
  if (sub.status === "authorized") status = "active";
  else if (sub.status === "paused") status = "paused";
  else if (sub.status === "cancelled") status = "cancelled";

  const updateData: Record<string, unknown> = {
    status,
    mp_preapproval_id: preapprovalId,
    updated_at: new Date().toISOString(),
  };
  if (plan) updateData.plan = plan;

  const { error: subscriptionError } = await supabase
    .from("subscriptions")
    .update(updateData)
    .eq("trainer_id", trainerId);
  if (subscriptionError) throw subscriptionError;

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ subscription_status: status })
    .eq("id", trainerId);
  if (profileError) throw profileError;
}

// Algunos avisos de MP llegan como GET de verificación
export async function GET() {
  return NextResponse.json({ ok: true });
}
