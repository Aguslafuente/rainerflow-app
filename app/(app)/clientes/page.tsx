import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { HelpButton } from "@/components/HelpButton";

export const dynamic = "force-dynamic";

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default async function ClientesPage() {
  const supabase = createClient();
  const { data: clients } = await supabase
    .from("clients")
    .select("id, full_name, email, phone, goal, status")
    .order("full_name");

  const all = clients ?? [];

  return (
    <>
      <div className="page-head">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}><h1>Clientes</h1><HelpButton page="clientes" /></div>
          <div className="sub">
            {all.length} {all.length === 1 ? "cliente" : "clientes"} en tu
            cartera.
          </div>
        </div>
        <Link
          href="/clientes/nuevo"
          className="btn btn-primary btn-sm"
          style={{ width: "auto" }}
        >
          + Nuevo cliente
        </Link>
      </div>

      <div className="panel">
        {all.length === 0 ? (
          <div className="empty">
            <div className="big">Todavía no tenés clientes</div>
            Agregá tu primer cliente para empezar a gestionarlo.
            <div style={{ marginTop: 16 }}>
              <Link
                href="/clientes/nuevo"
                className="btn btn-primary btn-sm"
                style={{ width: "auto", display: "inline-flex" }}
              >
                + Agregar cliente
              </Link>
            </div>
          </div>
        ) : (
          <table className="list">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Contacto</th>
                <th>Objetivo</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {all.map((c) => (
                <tr key={c.id} className="row">
                  <td>
                    <Link href={`/clientes/${c.id}`} className="cell-name">
                      <span className="avatar">{initials(c.full_name)}</span>
                      {c.full_name}
                    </Link>
                  </td>
                  <td style={{ color: "var(--gray)" }}>
                    {c.phone || c.email || "—"}
                  </td>
                  <td style={{ color: "var(--gray)" }}>{c.goal || "—"}</td>
                  <td>
                    <span className={`badge ${c.status}`}>{c.status}</span>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <Link href={`/clientes/${c.id}`} className="link" style={{ fontSize: 13 }}>
                      Ver ficha
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
