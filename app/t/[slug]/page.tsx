import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import { LogoMark } from "@/components/Logo";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { db: { schema: "public" }, global: { headers: { "Cache-Control": "no-cache" } } }
  );
}

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const { data: profile } = await getSupabase()
    .from("profiles")
    .select("full_name, business_name, tagline")
    .eq("slug", params.slug)
    .eq("public_visible", true)
    .single();

  if (!profile) return { title: "TrainerFlow" };

  const name = profile.business_name || profile.full_name || "Trainer";
  return {
    title: `${name} | TrainerFlow`,
    description:
      profile.tagline || `Entrenamiento personalizado con ${name}`,
  };
}

export default async function TrainerLanding({
  params,
}: {
  params: { slug: string };
}) {
  const { data: profile } = await getSupabase()
    .from("profiles")
    .select(
      "id, full_name, business_name, bio, tagline, services, avatar_url, social_instagram, social_twitter, phone"
    )
    .eq("slug", params.slug)
    .eq("public_visible", true)
    .single();

  if (!profile) notFound();

  const name = profile.business_name || profile.full_name || "Trainer";
  const servicesList = profile.services
    ? profile.services.split("\n").filter(Boolean)
    : [];

  return (
    <div className="landing-wrap">
      {/* Background effects */}
      <div className="landing-glow landing-glow-1" />
      <div className="landing-glow landing-glow-2" />
      <div className="landing-grid" />

      {/* Header */}
      <header className="landing-header">
        <LogoMark size={28} radius={7} />
        <span className="landing-powered">TrainerFlow</span>
      </header>

      {/* Hero */}
      <section className="landing-hero">
        {profile.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt={profile.full_name || "Trainer"}
            className="landing-avatar"
          />
        ) : (
          <div className="landing-avatar landing-avatar-fallback">
            {initials(profile.full_name || "T")}
          </div>
        )}

        <h1 className="landing-name">{name}</h1>

        {profile.tagline && (
          <p className="landing-tagline">{profile.tagline}</p>
        )}

        {profile.bio && <p className="landing-bio">{profile.bio}</p>}

        {/* CTA */}
        <div className="landing-cta-group">
          {profile.phone && (
            <a
              href={`https://wa.me/${profile.phone.replace(/\D/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary landing-cta"
            >
              <svg
                viewBox="0 0 24 24"
                width="20"
                height="20"
                fill="currentColor"
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.111.546 4.093 1.502 5.818L0 24l6.335-1.488A11.955 11.955 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818c-1.907 0-3.72-.515-5.313-1.49l-.38-.228-3.96.93.975-3.842-.25-.394A9.778 9.778 0 012.182 12c0-5.423 4.395-9.818 9.818-9.818S21.818 6.577 21.818 12 17.423 21.818 12 21.818z" />
              </svg>
              Contactar por WhatsApp
            </a>
          )}
          {profile.social_instagram && (
            <a
              href={`https://instagram.com/${profile.social_instagram.replace("@", "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-ghost landing-cta"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
              </svg>
              @{profile.social_instagram.replace("@", "")}
            </a>
          )}
        </div>
      </section>

      {/* Services */}
      {servicesList.length > 0 && (
        <section className="landing-section">
          <h2 className="landing-section-title">Servicios</h2>
          <div className="landing-services">
            {servicesList.map((s: string, i: number) => (
              <div key={i} className="landing-service-card">
                <span className="landing-service-icon">
                  {s.includes("Online") || s.includes("online")
                    ? "🌐"
                    : s.includes("grupal") || s.includes("Grupal")
                    ? "👥"
                    : s.includes("nutri") || s.includes("Nutri")
                    ? "🥗"
                    : "💪"}
                </span>
                <span>{s}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="landing-footer">
        <div className="landing-footer-inner">
          <LogoMark size={22} radius={5} />
          <span>
            Potenciado por{" "}
            <a
              href="https://trainerflow-uy.netlify.app"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "var(--violet2)" }}
            >
              TrainerFlow
            </a>
          </span>
        </div>
      </footer>
    </div>
  );
}
