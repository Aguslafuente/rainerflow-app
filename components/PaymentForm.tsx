import { currentPeriod } from "@/lib/format";

type ClientOpt = { id: string; full_name: string };

export function PaymentForm({
  action,
  clients,
  clientId,
  defaultAmount,
  defaultCurrency = "UYU",
  compact = false,
}: {
  action: (formData: FormData) => void;
  clients?: ClientOpt[];
  clientId?: string;
  defaultAmount?: number | null;
  defaultCurrency?: string;
  compact?: boolean;
}) {
  const today = new Date().toISOString().slice(0, 10);

  return (
    <form action={action} className={compact ? "" : "form-card"}>
      {clients ? (
        <div className="field">
          <label>Cliente *</label>
          <select name="client_id" required defaultValue="">
            <option value="">Elegí un cliente…</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.full_name}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <input type="hidden" name="client_id" value={clientId} />
      )}

      <div className="row2">
        <div className="field">
          <label>Monto *</label>
          <input
            name="amount"
            inputMode="decimal"
            defaultValue={defaultAmount ? String(defaultAmount) : ""}
            placeholder="2500"
            required
          />
        </div>
        <div className="field">
          <label>Moneda</label>
          <select name="currency" defaultValue={defaultCurrency}>
            <option value="UYU">Pesos (UYU)</option>
            <option value="USD">Dólares (USD)</option>
          </select>
        </div>
      </div>

      <div className="row2">
        <div className="field">
          <label>Medio de pago</label>
          <select name="method" defaultValue="efectivo">
            <option value="efectivo">Efectivo</option>
            <option value="transferencia">Transferencia</option>
            <option value="mercadopago">MercadoPago</option>
            <option value="abitab">Abitab</option>
            <option value="redpagos">Red Pagos</option>
            <option value="otro">Otro</option>
          </select>
        </div>
        <div className="field">
          <label>Fecha</label>
          <input type="date" name="paid_on" defaultValue={today} />
        </div>
      </div>

      <div className="row2">
        <div className="field">
          <label>Período (mes que cubre)</label>
          <input name="period" defaultValue={currentPeriod()} placeholder="2026-07" />
        </div>
        <div className="field">
          <label>Notas</label>
          <input name="notes" placeholder="Opcional" />
        </div>
      </div>

      <button className="btn btn-primary">Registrar pago</button>
    </form>
  );
}
