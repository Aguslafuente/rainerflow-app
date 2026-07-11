import { HelpButton } from "@/components/HelpButton";
import { createClient } from "@/lib/supabase/server";
import { PaymentForm } from "@/components/PaymentForm";
import { ConfirmSubmit } from "@/components/ConfirmSubmit";
import { StatCard } from "@/components/StatCard";
import {
  recordPaymentAction,
  deletePaymentAction,
  chargeMonthlyFeeAction,
} from "./actions";
import { currentPeriod, periodLabel, fmtMoney, METHOD_LABELS } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function PagosPage() {
  const supabase = createClient();
  const period = currentPeriod();

  const [{ data: clients }, { data: periodPayments }, { data: recent }] =
    await Promise.all([
      supabase
        .from("clients")
        .select("id, full_name, monthly_fee, currency, status")
        .order("full_name"),
      supabase
        .from("payments")
        .select("id, amount, currency, client_id")
        .eq("period", period),
      supabase
        .from("payments")
        .select("id, amount, currency, method, paid_on, period, client_id, clients(full_name)")
        .order("paid_on", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(15),
    ]);

  const clientList = clients ?? [];
  const paid = periodPayments ?? [];
  const recentList = (recent ?? []) as any[];

  // Totales del mes por moneda
  const totalUYU = paid
    .filter((p) => p.currency === "UYU")
    .reduce((s, p) => s + Number(p.amount), 0);
  const totalUSD = paid
    .filter((p) => p.currency === "USD")
    .reduce((s, p) => s + Number(p.amount), 0);

  const paidIds = new Set(paid.map((p) => p.client_id));
  const pending = clientList.filter(
    (c) =>
      c.status === "activo" &&
      c.monthly_fee &&
      Number(c.monthly_fee) > 0 &&
      !paidIds.has(c.id)
  );

  return (
    <>
      <div className="page-head">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}><h1>Pagos</h1><HelpButton page="pagos" /></div>
          <div className="sub">Cobros de {periodLabel(period)}.</div>
        </div>
      </div>

      <div className="stats">
        <StatCard
          icon="wallet"
          tone="green"
          value={fmtMoney(totalUYU, "UYU")}
          label="Cobrado este mes"
          hint={totalUSD > 0 ? `+ ${fmtMoney(totalUSD, "USD")}` : undefined}
        />
        <StatCard
          icon="receipt"
          tone="violet"
          value={paid.length}
          label="Pagos registrados"
          hint={`en ${periodLabel(period)}`}
        />
        <StatCard
          icon="check"
          tone="cyan"
          value={paidIds.size}
          label="Clientes al día"
          hint="pagaron este mes"
        />
        <StatCard
          icon="alert"
          tone="amber"
          value={pending.length}
          valueColor={pending.length ? "var(--amber)" : undefined}
          label="Pendientes"
          hint="con cuota sin pagar"
        />
      </div>

      <div className="detail-grid">
        {/* Pendientes */}
        <div className="panel">
          <div className="panel-head">Pendientes de {periodLabel(period)}</div>
          {pending.length === 0 ? (
            <div className="empty" style={{ padding: "40px 20px" }}>
              {clientList.some((c) => c.monthly_fee)
                ? "¡Todos los clientes con cuota están al día! 🎉"
                : "Definí la cuota mensual de tus clientes (en su ficha) para ver acá quién debe."}
            </div>
          ) : (
            <table className="list">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Cuota</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {pending.map((c) => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 500 }}>{c.full_name}</td>
                    <td style={{ color: "var(--gray)" }}>
                      {fmtMoney(Number(c.monthly_fee), c.currency)}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <ConfirmSubmit
                        action={chargeMonthlyFeeAction.bind(null, c.id)}
                        confirmText={`Registrar el pago de ${fmtMoney(
                          Number(c.monthly_fee),
                          c.currency
                        )} de ${c.full_name}?`}
                        className="btn btn-primary btn-sm"
                      >
                        Cobrar
                      </ConfirmSubmit>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Registrar pago */}
        <div>
          <div className="form-card">
            <h3 style={{ fontSize: 17, marginBottom: 16 }}>Registrar un pago</h3>
            {clientList.length === 0 ? (
              <p style={{ fontSize: 13, color: "var(--gray)" }}>
                Primero cargá clientes en la sección Clientes.
              </p>
            ) : (
              <PaymentForm action={recordPaymentAction} clients={clientList} compact />
            )}
          </div>
        </div>
      </div>

      {/* Últimos pagos */}
      <div className="panel" style={{ marginTop: 20 }}>
        <div className="panel-head">Últimos pagos</div>
        {recentList.length === 0 ? (
          <div className="empty" style={{ padding: "40px 20px" }}>
            Todavía no registraste pagos.
          </div>
        ) : (
          <table className="list">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Monto</th>
                <th>Medio</th>
                <th>Período</th>
                <th>Fecha</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {recentList.map((p) => (
                <tr key={p.id}>
                  <td style={{ fontWeight: 500 }}>{p.clients?.full_name ?? "—"}</td>
                  <td>{fmtMoney(Number(p.amount), p.currency)}</td>
                  <td style={{ color: "var(--gray)" }}>
                    {METHOD_LABELS[p.method] ?? p.method}
                  </td>
                  <td style={{ color: "var(--gray)" }}>{periodLabel(p.period)}</td>
                  <td style={{ color: "var(--gray)" }}>
                    {new Date(p.paid_on).toLocaleDateString("es-UY")}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <ConfirmSubmit
                      action={deletePaymentAction.bind(null, p.id, p.client_id)}
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
    </>
  );
}
