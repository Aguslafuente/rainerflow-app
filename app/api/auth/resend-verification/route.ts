import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verificationEmail } from "@/lib/email/transporter";

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL || "https://trainerflow-uy.netlify.app";

// Rate limit: max 2 per email per 3 minutes
const rateLimitMap = new Map<string, number[]>();
const RATE_WINDOW = 3 * 60 * 1000;
const RATE_MAX = 2;

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
    const { email } = await request.json();
    if (!email) {
      return NextResponse.json(
        { error: "Email requerido." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Always respond generically
    const genericResponse = NextResponse.json({
      message:
        "Si existe una cuenta pendiente de verificación, recibirás un nuevo correo.",
    });

    if (isRateLimited(normalizedEmail)) {
      return genericResponse;
    }

    const supabaseAdmin = createAdminClient();

    // Generate a new signup link — for an existing unconfirmed user this
    // creates a fresh confirmation token without changing the password.
    // For confirmed or non-existent users it will error, which is fine
    // (we return genericResponse either way).
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: "signup",
      email: normalizedEmail,
      password: "placeholder-will-not-overwrite",
      options: {
        redirectTo: `${APP_URL}/auth/callback`,
      },
    });

    if (error || !data?.properties?.action_link) {
      return genericResponse;
    }

    // Extract token and build direct link to our callback
    // (bypasses Supabase's redirect which can lose query params)
    const parsedLink = new URL(data.properties.action_link);
    const token = parsedLink.searchParams.get("token");
    const directLink = `${APP_URL}/auth/callback?token=${token}&type=signup`;

    await verificationEmail(normalizedEmail, directLink);

    return genericResponse;
  } catch (err) {
    console.error("Resend verification error:", err);
    return NextResponse.json(
      { message: "Si existe una cuenta pendiente de verificación, recibirás un nuevo correo." }
    );
  }
}
