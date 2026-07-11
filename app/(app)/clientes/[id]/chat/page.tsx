import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ClientTabs } from "@/components/ClientTabs";
import { Chat } from "@/components/Chat";

export const dynamic = "force-dynamic";

export default async function ChatPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const { data: c } = await supabase
    .from("clients")
    .select("id, full_name, user_id")
    .eq("id", params.id)
    .single();
  if (!c) notFound();

  const firstName = c.full_name?.split(" ")[0] ?? c.full_name;

  return (
    <>
      <Link href="/clientes" className="back-link">
        ← Volver a clientes
      </Link>
      <div className="page-head">
        <div>
          <h1>{c.full_name}</h1>
          <div className="sub">Chat</div>
        </div>
      </div>
      <ClientTabs clientId={params.id} />

      {!c.user_id && (
        <div className="notice" style={{ marginBottom: 16 }}>
          Este cliente todavía no activó su acceso. Podés enviarle mensajes
          igual: los va a ver cuando entre con su invitación (pestaña Ficha →
          Invitar).
        </div>
      )}

      <div className="panel chat-panel">
        <div className="panel-head">Conversación con {firstName}</div>
        <Chat clientId={params.id} meRole="trainer" otherName={firstName} />
      </div>
    </>
  );
}
