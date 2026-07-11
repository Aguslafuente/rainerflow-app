import Link from "next/link";
import { ClientForm } from "@/components/ClientForm";
import { createClientAction } from "../actions";

export default function NuevoClientePage() {
  return (
    <>
      <Link href="/clientes" className="back-link">
        ← Volver a clientes
      </Link>
      <div className="page-head">
        <div>
          <h1>Nuevo cliente</h1>
          <div className="sub">Cargá los datos de tu cliente.</div>
        </div>
      </div>
      <ClientForm
        action={createClientAction}
        submitLabel="Guardar cliente"
        cancelHref="/clientes"
      />
    </>
  );
}
