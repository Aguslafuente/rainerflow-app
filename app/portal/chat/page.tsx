import { createClient } from "@/lib/supabase/server";
import { Chat } from "@/components/Chat";

export const dynamic = "force-dynamic";

export default async function PortalChat() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: client } = await supabase
    .from("clients")
    .select("id, trainer_id")
    .eq("user_id", user!.id)
    .single();

  const { data: trainer } = await supabase
    .from("profiles")
    .select("full_name, business_name")
    .eq("id", client!.trainer_id)
    .maybeSingle();

  const trainerName =
    trainer?.business_name || trainer?.full_name || "tu entrenador";

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Chat</h1>
          <div className="sub">Conversación con {trainerName}</div>
        </div>
      </div>

      <div className="panel chat-panel">
        <Chat clientId={client!.id} meRole="client" otherName={trainerName} />
      </div>
    </>
  );
}
