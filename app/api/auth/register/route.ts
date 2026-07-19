import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verificationEmail } from "@/lib/email/transporter";

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL || "https://trainerflow-uy.netlify.app";

// Simple in-memory rate limit: max 3 requests per email per 5 minutes
const rateLimitMap = new Map<string, number[]>();
const RATE_WINDOW = 5 * 60 * 1000;
const RATE_MAX = 3;

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const timestamps = (rateLimitMap.get(key) ?? []).filter(
    (t) => now - t < RATE_WINDOW
  );
  if (timestamps.length >= RATE_MAX) return true;
  timestamps.push(now);
  rateLimitMap.set(key, timestamps);
  return false;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, full_name, business_name, account_type, referral_code } = body;
    const validAccountType = account_type === "gym" ? "gym" : "trainer";

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email y contraseña son requeridos." },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "La contraseña debe tener al menos 6 caracteres." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (isRateLimited(normalizedEmail)) {
      return NextResponse.json(
        { message: "Si el correo es válido, recibirás un enlace de verificación." },
        { status: 200 }
      );
    }

    const supabaseAdmin = createAdminClient();

    // Generate signup link — Supabase creates the user + generates a secure token
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: "signup",
      email: normalizedEmail,
      password,
      options: {
        redirectTo: `${APP_URL}/auth/callback`,
        data: {
          full_name: full_name || "",
          business_name: business_name || "",
        },
      },
    });

    if (error) {
      // Don't reveal if user already exists
      if (error.message?.includes("already registered") || error.message?.includes("already been registered")) {
        return NextResponse.json({
          message: "Si el correo es válido, recibirás un enlace de verificación.",
        });
      }
      console.error("generateLink error:", error.message);
      return NextResponse.json(
        { error: "No se pudo procesar el registro." },
        { status: 500 }
      );
    }

    const actionLink = data?.properties?.action_link;
    if (!actionLink) {
      return NextResponse.json(
        { error: "No se pudo generar el enlace de verificación." },
        { status: 500 }
      );
    }

    // Create profile if it doesn't exist
    const userId = data.user?.id;
    if (userId) {
      await supabaseAdmin.from("profiles").upsert(
        {
          id: userId,
          full_name: full_name || normalizedEmail.split("@")[0],
          business_name: business_name || null,
          account_type: validAccountType,
        },
        { onConflict: "id" }
      );

      // If gym account, create gym record
      if (validAccountType === "gym" && business_name) {
        await supabaseAdmin.from("gyms").upsert(
          {
            owner_id: userId,
            name: business_name,
          },
          { onConflict: "owner_id" }
        );
      }

      // Handle referral code
      if (referral_code) {
        const code = referral_code.trim().toLowerCase();
        const { data: referrer } = await supabaseAdmin
          .from("profiles")
          .select("id")
          .eq("referral_code", code)
          .maybeSingle();
        if (referrer) {
          await supabaseAdmin
            .from("profiles")
            .update({ referred_by: referrer.id })
            .eq("id", userId);
          await supabaseAdmin.from("referrals").insert({
            referrer_id: referrer.id,
            referred_id: userId,
            code_used: code,
          });
        }
      }
    }

    // Extract token and build direct link to our callback
    // (bypasses Supabase's redirect which can lose query params)
    const parsedLink = new URL(actionLink);
    const token = parsedLink.searchParams.get("token");
    const directLink = `${APP_URL}/auth/callback?token=${token}&type=signup`;

    await verificationEmail(normalizedEmail, directLink);

    return NextResponse.json({
      message: "Te enviamos un correo de verificación. Revisá tu bandeja de entrada.",
    });
  } catch (err) {
    console.error("Register error:", err);
    return NextResponse.json(
      { error: "Error interno del servidor." },
      { status: 500 }
    );
  }
}
