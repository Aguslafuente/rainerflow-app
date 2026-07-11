import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTrainerMpToken, calcCommission, type PlanId } from "@/lib/mp";

const SITE =
  process.env.NEXT_PUBLIC_SITE_URL || "https://trainerflow-uy.netlify.app";

/**
 * Genera un Checkout Pro para que el cliente pague su cuota mensual.
 *
 * Si el entrenador tiene MP conectado (marketplace):
 *   → El pago va al entrenador, con marketplace_fee del 5% para TrainerFlow.
 * Si no tiene MP conectado:
 *   → Fallback: el pago va a la cuenta de TrainerFlow (como antes).
 */
export async function GET(req: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(new URL("/login", SITE));
  }

  const clientParam = req.nextUrl.searchParams.get("client");
  let q = supabase
    .from("clients")
    .select("id, full_name, monthly_fee, currency, trainer_id, user_id");
  q = clientParam ? q.eq("id", clientParam) : q.eq("user_id", user.id);
  const { data: client } = await q.maybeSingle();

  if (!client) {
    return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
  }
  if (client.trainer_id !== user.id && client.user_id !== user.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  if (!client.monthly_fee || Number(client.monthly_fee) <= 0) {
    return NextResponse.json(
      { error: "Este cliente no tiene una cuota mensual definida." },
      { status: 400 }
    );
  }

  const fee = Number(client.monthly_fee);
  const period = new Date().toISOString().slice(0, 7);

  // Intentar usar token del entrenador (marketplace mode)
  const trainerToken = await getTrainerMpToken(client.trainer_id);
  const platformToken =
    process.env.MERCADOPAGO_ACCESS_TOKEN || process.env.MP_ACCESS_TOKEN;

  const useMarketplace = !!trainerToken;
  const token = trainerToken || platformToken;

  if (!token) {
    return NextResponse.json(
      {
        error:
          "Falta configurar MercadoPago. El entrenador debe conectar su cuenta.",
      },
      { status: 500 }
    );
  }

  const preference: any = {
    items: [
      {
        title: `Cuota ${period} · ${client.full_name}`,
        quantity: 1,
        unit_price: fee,
        currency_id: client.currency || "UYU",
      },
    ],
    external_reference: `${client.id}|${period}`,
    back_urls: {
      success: `${SITE}/pago-exito`,
      failure: `${SITE}/pago-error`,
      pending: `${SITE}/pago-pendiente`,
    },
    auto_return: "approved",
    notification_url: `${SITE}/api/mp/webhook`,
  };

  // Si es marketplace, agregar comisión según plan del trainer
  if (useMarketplace) {
    // Obtener plan del trainer para aplicar comisión correcta
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("plan")
      .eq("trainer_id", client.trainer_id)
      .maybeSingle();
    const trainerPlan: PlanId = (sub?.plan === "team" ? "team" : "pro");
    preference.marketplace_fee = calcCommission(fee, trainerPlan);
    preference.marketplace = process.env.MP_APP_ID || undefined;
  }

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
    return NextResponse.json(
      { error: "No se pudo generar el cobro en MercadoPago.", detail: data },
      { status: 502 }
    );
  }

  return NextResponse.redirect(data.init_point);
}
