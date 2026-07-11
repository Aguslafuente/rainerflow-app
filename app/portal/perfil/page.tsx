import { createClient } from "@/lib/supabase/server";
import { ClientProfileForm } from "@/components/ProfileForm";

export const dynamic = "force-dynamic";

export default async function PortalPerfilPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: client } = await supabase
    .from("clients")
    .select("id, full_name, phone, bio, avatar_url, goal, email")
    .eq("user_id", user!.id)
    .single();

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Mi perfil</h1>
          <div className="sub">Editá tu información personal</div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">Datos personales</div>
        <div style={{ padding: "20px" }}>
          <ClientProfileForm
            client={{
              id: client!.id,
              full_name: client!.full_name || "",
              phone: client!.phone,
              bio: client!.bio,
              avatar_url: client!.avatar_url,
              goal: client!.goal,
              email: client!.email || user!.email || "",
            }}
          />
        </div>
      </div>
    </>
  );
}
