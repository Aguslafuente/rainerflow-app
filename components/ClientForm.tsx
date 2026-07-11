import Link from "next/link";
import { INTAKE_SECTIONS } from "@/lib/intakeFields";

type ClientValues = {
  full_name?: string;
  email?: string | null;
  phone?: string | null;
  goal?: string | null;
  status?: string;
  notes?: string | null;
  monthly_fee?: number | null;
  currency?: string | null;
  billing_day?: number | null;
};

export function ClientForm({
  action,
  client,
  intake,
  submitLabel,
  cancelHref,
}: {
  action: (formData: FormData) => void;
  client?: ClientValues;
  intake?: Record<string, string | null> | null;
  submitLabel: string;
  cancelHref: string;
}) {
  return (
    <form action={action} className="form-card">
      <div className="field">
        <label>Nombre completo *</label>
        <input
          name="full_name"
          defaultValue={client?.full_name ?? ""}
          placeholder="Camila Rodríguez"
          autoFocus
          required
        />
      </div>

      <div className="row2">
        <div className="field">
          <label>Teléfono / WhatsApp</label>
          <input
            name="phone"
            defaultValue={client?.phone ?? ""}
            placeholder="099 123 456"
          />
        </div>
        <div className="field">
          <label>Email</label>
          <input
            name="email"
            type="email"
            defaultValue={client?.email ?? ""}
            placeholder="cami@email.com"
          />
        </div>
      </div>

      <div className="row2">
        <div className="field">
          <label>Objetivo</label>
          <input
            name="goal"
            defaultValue={client?.goal ?? ""}
            placeholder="Bajar de peso"
          />
        </div>
        <div className="field">
          <label>Estado</label>
          <select name="status" defaultValue={client?.status ?? "activo"}>
            <option value="activo">Activo</option>
            <option value="pausa">En pausa</option>
            <option value="baja">Baja</option>
          </select>
        </div>
      </div>

      <div className="row2">
        <div className="field">
          <label>Cuota mensual</label>
          <input
            name="monthly_fee"
            inputMode="decimal"
            defaultValue={client?.monthly_fee ?? ""}
            placeholder="2500"
          />
        </div>
        <div className="field">
          <label>Moneda</label>
          <select name="currency" defaultValue={client?.currency ?? "UYU"}>
            <option value="UYU">Pesos (UYU)</option>
            <option value="USD">Dólares (USD)</option>
          </select>
        </div>
      </div>

      <div className="field">
        <label>Día de vencimiento (opcional)</label>
        <input
          name="billing_day"
          inputMode="numeric"
          defaultValue={client?.billing_day ?? ""}
          placeholder="10"
        />
      </div>

      <div className="field">
        <label>Notas</label>
        <textarea
          name="notes"
          defaultValue={client?.notes ?? ""}
          placeholder="Lesiones, preferencias, disponibilidad…"
        />
      </div>

      <div className="intake-intro">
        <div className="intake-intro-title">Ficha de presentación</div>
        <div className="intake-intro-sub">
          Opcional. Tocá cada sección para completar lo que quieras conocer del
          cliente. Podés dejar todo en blanco y cargarlo más adelante.
        </div>
      </div>

      {INTAKE_SECTIONS.map((section) => (
        <details className="intake-section" key={section.title}>
          <summary>{section.title}</summary>
          <div className="intake-body">
            {section.fields.map((f) => (
              <div className="field" key={f.name}>
                <label>{f.label}</label>
                {f.long ? (
                  <textarea
                    name={f.name}
                    defaultValue={intake?.[f.name] ?? ""}
                    placeholder={f.placeholder}
                  />
                ) : (
                  <input
                    name={f.name}
                    defaultValue={intake?.[f.name] ?? ""}
                    placeholder={f.placeholder}
                  />
                )}
              </div>
            ))}
          </div>
        </details>
      ))}

      <div className="actions-row">
        <button className="btn btn-primary" style={{ width: "auto" }}>
          {submitLabel}
        </button>
        <Link href={cancelHref} className="btn btn-ghost">
          Cancelar
        </Link>
      </div>
    </form>
  );
}
