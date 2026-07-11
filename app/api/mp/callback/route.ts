import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const SITE =
  process.env.NEXT_PUBLIC_SITE_URL || "https://trainerflow-uy.netlify.app";

/**
 * Callback de OAuth de MercadoPago.
 * Recibe el authorization code y lo intercambia por access_token.
 * Guarda las credenciales en mp_credentials.
 */
export async function GET(req: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", SITE));
  }

  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");

  if (!code) {
    return NextResponse.redirect(
      new URL("/configuracion?mp_error=no_code", SITE)
    );
  }

  // Verificar que el state coincida con el user
  if (state && state !== user.id) {
    return NextResponse.redirect(
      new URL("/configuracion?mp_error=state_mismatch", SITE)
    );
  }

  const appId = process.env.MP_APP_ID;
  const appSecret = process.env.MP_APP_SECRET;
  const redirectUri = `${SITE}/api/mp/callback`;

  if (!appId || !appSecret) {
    return NextResponse.redirect(
      new URL("/configuracion?mp_error=config", SITE)
    );
  }

  // Intercambiar code por access_token
  const tokenRes = await fetch("https://api.mercadopago.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: appId,
      client_secret: appSecret,
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    }),
  });

  const tokenData = await tokenRes.json();

  if (!tokenRes.ok || !tokenData.access_token) {
    console.error("MP OAuth error:", tokenData);
    return NextResponse.redirect(
      new URL("/configuracion?mp_error=token_exchange", SITE)
    );
  }

  // Guardar credenciales (upsert por trainer_id único)
  const expiresAt = tokenData.expires_in
    ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
    : null;

  await supabase.from("mp_credentials").upsert(
    {
      trainer_id: user.id,
      mp_user_id: String(tokenData.user_id),
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token || null,
      public_key: tokenData.public_key || null,
      expires_at: expiresAt,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "trainer_id" }
  );

  // Marcar perfil como conectado
  await supabase
    .from("profiles")
    .update({ mp_connected: true })
    .eq("id", user.id);

  return NextResponse.redirect(
    new URL("/configuracion?mp_success=true", SITE)
  );
}
