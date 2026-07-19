import { NextRequest, NextResponse } from "next/server";
import { createHash, timingSafeEqual } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const SITE =
  process.env.NEXT_PUBLIC_SITE_URL || "https://trainerflow-uy.netlify.app";

function sameValue(left: string, right: string) {
  const hash = (value: string) => createHash("sha256").update(value).digest();
  return timingSafeEqual(hash(left), hash(right));
}

function redirectWithoutState(path: string) {
  const response = NextResponse.redirect(new URL(path, SITE));
  response.cookies.set("mp_oauth_state", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}

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
  const expectedState = req.cookies.get("mp_oauth_state")?.value;

  if (!code) {
    return redirectWithoutState("/configuracion?mp_error=no_code");
  }

  if (!state || !expectedState || !sameValue(state, expectedState)) {
    return redirectWithoutState("/configuracion?mp_error=state_mismatch");
  }

  const appId = process.env.MP_APP_ID;
  const appSecret = process.env.MP_APP_SECRET;
  const redirectUri = `${SITE}/api/mp/callback`;

  if (!appId || !appSecret) {
    return redirectWithoutState("/configuracion?mp_error=config");
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
    return redirectWithoutState("/configuracion?mp_error=token_exchange");
  }

  // Guardar credenciales (upsert por trainer_id único)
  const expiresAt = tokenData.expires_in
    ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
    : null;

  const supabaseAdmin = createAdminClient();
  const { error: credentialsError } = await supabaseAdmin.from("mp_credentials").upsert(
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
  if (credentialsError) {
    console.error("MP credential storage error:", credentialsError);
    return redirectWithoutState("/configuracion?mp_error=storage");
  }

  // Marcar perfil como conectado
  const { error: profileError } = await supabaseAdmin
    .from("profiles")
    .update({ mp_connected: true })
    .eq("id", user.id);
  if (profileError) {
    console.error("MP profile update error:", profileError);
    return redirectWithoutState("/configuracion?mp_error=storage");
  }

  return redirectWithoutState("/configuracion?mp_success=true");
}
