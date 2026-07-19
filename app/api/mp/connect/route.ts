import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { createClient } from "@/lib/supabase/server";

const SITE =
  process.env.NEXT_PUBLIC_SITE_URL || "https://trainerflow-uy.netlify.app";

/**
 * Redirige al entrenador a MercadoPago para autorizar la app (OAuth).
 * Después de autorizar, MP redirige a /api/mp/callback con el code.
 */
export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", SITE));
  }

  const appId = process.env.MP_APP_ID;
  if (!appId) {
    return NextResponse.json(
      { error: "Falta MP_APP_ID en variables de entorno." },
      { status: 500 }
    );
  }

  const redirectUri = `${SITE}/api/mp/callback`;
  const state = randomBytes(32).toString("hex");
  const authUrl = `https://auth.mercadopago.com/authorization?response_type=code&client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`;

  const response = NextResponse.redirect(authUrl);
  response.cookies.set("mp_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 10 * 60,
  });
  return response;
}
