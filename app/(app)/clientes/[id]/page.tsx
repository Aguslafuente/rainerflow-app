import { HelpButton } from "@/components/HelpButton";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DeleteClientButton } from "@/components/DeleteClientButton";
import { ClientTabs } from "@/components/ClientTabs";
import { InviteBox } from "@/components/InviteBox";
import { PaymentForm } from "@/components/PaymentForm";
import { ConfirmSubmit } from "@/components/ConfirmSubmit";
import { recordPaymentAction, deletePaymentAction } from "../../pagos/actions";
import {
  currentPeriod,
  periodLabel,
  fmtMoney,
  METHOD_LABELS,
} from "@/lib/format";
import { INTAKE_SECTIONS } from "@/lib/intakeFields";

export const dynamic = "force-dynamic";

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function waLink(phone: string) {
  const digits = phone.replace(/[^0-9]/g, "");
  return `https://wa.me/${digits}`;
}

export default async function ClienteDetailPage({
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

  const { data: assigned } = await supabase
    .from("client_routines")
    .select("id, assigned_at, routines(id, name, description)")
    .eq("client_id", params.id)
    .order("assigned_at", { ascending: false });
  const routines = (assigned ?? []) as any[];

  const { data: pays } = await supabase
    .from("payments")
    .select("id, amount, currency, method, period, paid_on")
    .eq("client_id", params.id)
    .order("paid_on", { ascending: false })
    .limit(12);
  const payments = (pays ?? []) as any[];
  const period = currentPeriod();
  const paidThisMonth = payments.some((p) => p.period === period);

  const { data: intakeRow } = await supabase
    .from("client_intake")
    .select("*")
    .eq("client_id", params.id)
    .maybeSingle();
  const intake = intakeRow as Record<string, string | null> | null;
  const intakeFilled = INTAKE_SECTIONS.map((s) => ({
    title: s.title,
    rows: s.fields
      .filter((f) => intake?.[f.name])
      .map((f) => ({ label: f.label, value: intake![f.name] as string })),
  })).filter((s) => s.rows.length > 0);

  return (
    <>
      <Link href="/clientes" className="back-link">
        ← Volver a clientes
      </Link>

      <div className="page-head">
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span className="avatar" style={{ width: 52, height: 52, fontSize: 18 }}>
            {initials(c.full_name)}
          </span>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}><h1>{c.full_name}</h1><HelpButton page="cliente-detalle" /></div>
            <div className="sub">
              <span className={`badge ${c.status}`}>{c.status}</span>
              {c.goal ? `  ·  ${c.goal}` : ""}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Link
            href={`/clientes/${c.id}/editar`}
            className="btn btn-ghost btn-sm"
          >
            Editar
          </Link>
          <DeleteClientButton id={c.id} />
        </div>
      </div>

      <ClientTabs clientId={c.id} />

      <div className="panel" style={{ marginBottom: 20 }}>
        <div className="panel-head">
          Acceso del cliente
          {c.user_id && <span className="badge activo">Activo</span>}
        </div>
        <div style={{ padding: "16px 20px" }}>
          {c.user_id ? (
            <p style={{ fontSize: 14, color: "var(--gray)" }}>
              Este cliente ya activó su acceso: puede ver su plan y chatear con
              vos.
            </p>
          ) : (
            <InviteBox
              token={c.invite_token}
              phone={c.phone}
              clientName={c.full_name}
            />
          )}
        </div>
      </div>

      <div className="detail-grid">
        <div className="panel">
          <div className="panel-head">Información</div>
          <div style={{ padding: "6px 20px 16px" }}>
            <div className="info-row">
              <span className="k">Teléfono / WhatsApp</span>
              <span className="val">
                {c.phone ? (
                  <a
                    className="link"
                    href={waLink(c.phone)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {c.phone}
                  </a>
                ) : (
                  "—"
                )}
              </span>
            </div>
            <div className="info-row">
              <span className="k">Email</span>
              <span className="val">{c.email || "—"}</span>
            </div>
            <div className="info-row">
              <span className="k">Objetivo</span>
              <span className="val">{c.goal || "—"}</span>
            </div>
            <div className="info-row">
              <span className="k">Estado</span>
              <span className="val">
                <span className={`badge ${c.status}`}>{c.status}</span>
              </span>
            </div>
            <div className="info-row">
              <span className="k">Cliente desde</span>
              <span className="val">
                {new Date(c.created_at).toLocaleDateString("es-UY")}
              </span>
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="panel-head">Notas</div>
          <div
            style={{
              padding: 20,
              fontSize: 14,
              color: c.notes ? "var(--dark)" : "var(--gray)",
              whiteSpace: "pre-wrap",
              lineHeight: 1.55,
            }}
          >
            {c.notes || "Sin notas todavía."}
          </div>
        </div>
      </div>

      {/* FICHA DE PRESENTACIÓN */}
      <div className="panel" style={{ marginTop: 20 }}>
        <div className="panel-head">
          Ficha de presentación
          <Link
            href={`/clientes/${c.id}/editar`}
            className="link"
            style={{ fontSize: 13 }}
          >
            {intakeFilled.length ? "Editar" : "Completar"}
          </Link>
        </div>
        {intakeFilled.length === 0 ? (
          <div className="empty" style={{ padding: "40px 20px" }}>
            Sin ficha cargada. Tocá &quot;Completar&quot; para registrar datos
            personales, de salud, nutrición y entrenamiento.
          </div>
        ) : (
          <div style={{ padding: "4px 20px 16px" }}>
            {intakeFilled.map((sec) => (
              <div key={sec.title}>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    color: "var(--violet)",
                    margin: "16px 0 4px",
                  }}
                >
                  {sec.title}
                </div>
                {sec.rows.map((r) => (
                  <div
                    key={r.label}
                    className="info-row"
                    style={{ alignItems: "flex-start", gap: 16 }}
                  >
                    <span className="k" style={{ maxWidth: "52%" }}>
                      {r.label}
                    </span>
                    <span
                      className="val"
                      style={{ whiteSpace: "pre-wrap" }}
                    >
                      {r.value}
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* PAGOS */}
      <div className="detail-grid" style={{ marginTop: 20 }}>
        <div className="panel">
          <div className="panel-head">
            Historial de pagos
            <Link href="/pagos" className="link" style={{ fontSize: 13 }}>
              Ver todos
            </Link>
          </div>
          {payments.length === 0 ? (
            <div className="empty" style={{ padding: "40px 20px" }}>
              Sin pagos registrados todavía.
            </div>
          ) : (
            <table className="list">
              <thead>
                <tr>
                  <th>Monto</th>
                  <th>Medio</th>
                  <th>Período</th>
                  <th>Fecha</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 500 }}>
                      {fmtMoney(Number(p.amount), p.currency)}
                    </td>
                    <td style={{ color: "var(--gray)" }}>
                      {METHOD_LABELS[p.method] ?? p.method}
                    </td>
                    <td style={{ color: "var(--gray)" }}>
                      {periodLabel(p.period)}
                    </td>
                    <td style={{ color: "var(--gray)" }}>
                      {new Date(p.paid_on).toLocaleDateString("es-UY")}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <ConfirmSubmit
                        action={deletePaymentAction.bind(null, p.id, c.id)}
                        confirmText="¿Eliminar este pago?"
                        className="btn btn-danger btn-sm"
                      >
                        Eliminar
                      </ConfirmSubmit>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div>
          {c.monthly_fee && (
            <div
              className="panel"
              style={{ marginBottom: 20, padding: "16px 20px" }}
            >
              <div style={{ fontSize: 13, color: "var(--gray)" }}>
                Cuota mensual
              </div>
              <div style={{ fontSize: 24, fontWeight: 700 }}>
                {fmtMoney(Number(c.monthly_fee), c.currency)}
              </div>
              <div style={{ marginTop: 8 }}>
                <span className={`badge ${paidThisMonth ? "activo" : "pausa"}`}>
                  {paidThisMonth
                    ? `Al día · ${periodLabel(period)}`
                    : `Pendiente · ${periodLabel(period)}`}
                </span>
              </div>
            </div>
          )}
          <div className="form-card">
            <h3 style={{ fontSize: 17, marginBottom: 16 }}>Registrar pago</h3>
            <PaymentForm
              action={recordPaymentAction}
              clientId={c.id}
              defaultAmount={c.monthly_fee}
              defaultCurrency={c.currency}
              compact
            />
          </div>
        </div>
      </div>

      <div className="panel" style={{ marginTop: 20 }}>
        <div className="panel-head">
          Rutinas asignadas ({routines.length})
          <Link href="/rutinas" className="link" style={{ fontSize: 13 }}>
            Ir a rutinas
          </Link>
        </div>
        {routines.length === 0 ? (
          <div className="empty" style={{ padding: "40px 20px" }}>
            Este cliente no tiene rutinas asignadas. Asignale una desde la
            sección Rutinas.
          </div>
        ) : (
          <table className="list">
            <thead>
              <tr>
                <th>Rutina</th>
                <th>Asignada</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {routines.map((r) => (
                <tr key={r.id}>
                  <td style={{ fontWeight: 500 }}>
                    {r.routines?.name ?? "—"}
                    {r.routines?.description && (
                      <span
                        style={{
                          display: "block",
                          color: "var(--gray)",
                          fontSize: 13,
                          fontWeight: 400,
                        }}
                      >
                        {r.routines.description}
                      </span>
                    )}
                  </td>
                  <td style={{ color: "var(--gray)" }}>
                    {new Date(r.assigned_at).toLocaleDateString("es-UY")}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    {r.routines?.id && (
                      <Link
                        href={`/rutinas/${r.routines.id}`}
                        className="link"
                        style={{ fontSize: 13 }}
                      >
                        Ver
                      </Link>
                    )}
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
