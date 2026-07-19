import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { recoveryEmail } from "@/lib/email/transporter";

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL || "https://trainerflow-uy.netlify.app";

// Rate limit: max 3 per email per 10 minutes
const rateLimitMap = new Map<string, number[]>();
const RATE_WINDOW = 10 * 60 * 1000;
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
    const { email } = await request.json();
    if (!email) {
      return NextResponse.json(
        { error: "Email requerido." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    const genericResponse = NextResponse.json({
      message:
        "Si existe una cuenta asociada a ese correo, recibirás un enlace para cambiar la contraseña.",
    });

    if (isRateLimited(normalizedEmail)) {
      return genericResponse;
    }

    const supabaseAdmin = createAdminClient();

    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email: normalizedEmail,
      options: {
        redirectTo: `${APP_URL}/auth/callback?type=recovery`,
      },
    });

    if (error || !data?.properties?.action_link) {
      console.error("generateLink error:", error?.message, "data:", JSON.stringify(data));
      return genericResponse;
    }

    // Extract token from Supabase's action_link and build a direct link
    // to our callback — bypasses Supabase's redirect which loses params
    const actionUrl = new URL(data.properties.action_link);
    const token = actionUrl.searchParams.get("token");
    const directLink = `${APP_URL}/auth/callback?token=${token}&type=recovery`;

    console.log("Sending recovery email to:", normalizedEmail);
    const emailResult = await recoveryEmail(normalizedEmail, directLink);
    console.log("Email sent, messageId:", emailResult.messageId);

    return genericResponse;
  } catch (err) {
    console.error("Forgot password error:", err);
    return NextResponse.json({
      message:
        "Si existe una cuenta asociada a ese correo, recibirás un enlace para cambiar la contraseña.",
    });
  }
}
