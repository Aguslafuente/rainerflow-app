import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const origin = request.nextUrl.origin;

  // Supabase sends tokens as hash fragment (#) or as query params depending on the flow.
  // generateLink sends: ?token=...&type=signup (or recovery)
  // PKCE flow sends: ?code=...
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash") || searchParams.get("token");
  const type = searchParams.get("type") as string | null;

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.redirect(
            new URL("/dashboard", origin)
          );
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Exchange code or verify token
  if (code) {
    await supabase.auth.exchangeCodeForSession(code);
  } else if (token_hash && type) {
    await supabase.auth.verifyOtp({
      token_hash,
      type: type as any,
    });
  }

  // Now get the user to determine where to redirect
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // Failed to verify — send to login
    return NextResponse.redirect(new URL("/login?error=invalid_link", origin));
  }

  // Determine redirect based on role
  // Check if user is a client
  const { data: clientRow } = await supabase
    .from("clients")
    .select("id, is_active")
    .eq("user_id", user.id)
    .maybeSingle();

  let redirectTo = "/dashboard"; // default for trainers

  if (clientRow) {
    // User is a client
    if (clientRow.is_active) {
      redirectTo = "/portal";
    } else {
      redirectTo = "/cuenta-desactivada";
    }
  }

  // For recovery flow, redirect to reset password page
  if (type === "recovery") {
    redirectTo = "/auth/reset-password";
  }

  // Build redirect response with cookies
  const redirectResponse = NextResponse.redirect(
    new URL(redirectTo, origin)
  );

  // Copy cookies from supabaseResponse
  supabaseResponse.cookies.getAll().forEach((cookie) => {
    redirectResponse.cookies.set(cookie.name, cookie.value);
  });

  return redirectResponse;
}
