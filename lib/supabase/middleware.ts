import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
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
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isPublic =
    path === "/" ||
    path.startsWith("/login") ||
    path.startsWith("/auth") ||
    path.startsWith("/invitacion") ||
    path.startsWith("/api/mp") ||
    path.startsWith("/api/admin") ||
    path.startsWith("/api/auth") ||
    path.startsWith("/admin") ||
    path.startsWith("/pago-") ||
    path.startsWith("/suscripcion") ||
    path.startsWith("/recuperar-contrasena") ||
    path.startsWith("/cuenta-desactivada") ||
    path.startsWith("/t/") ||
    path.startsWith("/aceptar-gym") ||
    path.startsWith("/gym/aceptar");

  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Check email verification FIRST — before any profile queries
  if (
    user &&
    !isPublic &&
    !user.email_confirmed_at &&
    !path.startsWith("/auth/verificar-correo")
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/verificar-correo";
    return NextResponse.redirect(url);
  }

  if (user && (path.startsWith("/login") || path === "/")) {
    const { data: prof } = await supabase
      .from("profiles")
      .select("account_type")
      .eq("id", user.id)
      .single();

    const url = request.nextUrl.clone();
    url.pathname = prof?.account_type === "gym" ? "/gym" : "/dashboard";
    return NextResponse.redirect(url);
  }

  // Block gym users from trainer routes and vice versa
  // Only redirect if we get a valid profile — prevent redirect loops on query failure
  if (user && !isPublic && !path.startsWith("/portal") && !path.startsWith("/api/")) {
    const isGymRoute = path.startsWith("/gym");
    const isTrainerRoute = !isGymRoute && (
      path.startsWith("/dashboard") || path.startsWith("/clientes") ||
      path.startsWith("/rutinas") || path.startsWith("/ejercicios") ||
      path.startsWith("/alimentos") || path.startsWith("/pagos") ||
      path.startsWith("/agenda") || path.startsWith("/configuracion")
    );

    if (isGymRoute || isTrainerRoute) {
      const { data: prof } = await supabase
        .from("profiles")
        .select("account_type")
        .eq("id", user.id)
        .single();

      // Only redirect if we successfully loaded the profile
      if (prof) {
        if (isGymRoute && prof.account_type !== "gym") {
          const url = request.nextUrl.clone();
          url.pathname = "/dashboard";
          return NextResponse.redirect(url);
        }
        if (isTrainerRoute && prof.account_type === "gym") {
          const url = request.nextUrl.clone();
          url.pathname = "/gym";
          return NextResponse.redirect(url);
        }
      }
    }
  }

  // Pass pathname to layouts via header
  supabaseResponse.headers.set("x-pathname", path);

  // Check subscription/trial for authenticated trainers on protected routes
  if (user && !isPublic && !path.startsWith("/mi-plan") && !path.startsWith("/api/") && !path.startsWith("/portal") && !path.startsWith("/cuenta-desactivada") && !path.startsWith("/gym")) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("subscription_status, trial_ends_at, subscription_expires_at")
      .eq("id", user.id)
      .single();

    if (profile) {
      const now = new Date();
      const inTrial =
        profile.trial_ends_at && new Date(profile.trial_ends_at) > now;

      const subActive =
        profile.subscription_status === "active" &&
        profile.subscription_expires_at &&
        new Date(profile.subscription_expires_at) > now;

      if (!subActive && !inTrial) {
        if (
          profile.subscription_status === "active" &&
          profile.subscription_expires_at &&
          new Date(profile.subscription_expires_at) <= now
        ) {
          await supabase
            .from("profiles")
            .update({ subscription_status: "expired" })
            .eq("id", user.id);
        }

        const url = request.nextUrl.clone();
        url.pathname = "/suscripcion";
        return NextResponse.redirect(url);
      }

      if (subActive && profile.subscription_expires_at) {
        const daysLeft = Math.ceil(
          (new Date(profile.subscription_expires_at).getTime() - now.getTime()) /
            (1000 * 60 * 60 * 24)
        );
        if (daysLeft <= 5) {
          supabaseResponse.headers.set("x-sub-days-left", String(daysLeft));
        }
      }
    }
  }

  return supabaseResponse;
}
