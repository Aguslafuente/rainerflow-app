import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ClientForm } from "@/components/ClientForm";
import { updateClientAction } from "../../actions";

export const dynamic = "force-dynamic";

export default async function EditarClientePage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const { data: c } = await supabase
    .from("clients")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!c) notFound();

  const { data: intake } = await supabase
    .from("client_intake")
    .select("*")
    .eq("client_id", params.id)
    .maybeSingle();

  const action = updateClientAction.bind(null, params.id);

  return (
    <>
      <Link href={`/clientes/${params.id}`} className="back-link">
        ← Volver a la ficha
      </Link>
      <div className="page-head">
        <div>
          <h1>Editar cliente</h1>
          <div className="sub">Actualizá los datos de {c.full_name}.</div>
        </div>
      </div>
      <ClientForm
        action={action}
        client={c}
        intake={intake}
        submitLabel="Guardar cambios"
        cancelHref={`/clientes/${params.id}`}
      />
    </>
  );
}
