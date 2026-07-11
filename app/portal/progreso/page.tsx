import { createClient } from "@/lib/supabase/server";
import { portalAddMeasurement } from "../actions";

export const dynamic = "force-dynamic";

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("es-UY", { timeZone: "UTC" });

function WeightChart({ data }: { data: { date: string; weight: number }[] }) {
  if (data.length < 2) return null;
  const W = 720;
  const H = 220;
  const pad = 34;
  const ws = data.map((d) => d.weight);
  const min = Math.min(...ws);
  const max = Math.max(...ws);
  const span = max - min || 1;
  const n = data.length;
  const x = (i: number) => pad + (i / (n - 1)) * (W - 2 * pad);
  const y = (w: number) => H - pad - ((w - min) / span) * (H - 2 * pad);
  const pts = data.map((d, i) => `${x(i)},${y(d.weight)}`).join(" ");
  const area = `${x(0)},${H - pad} ${pts} ${x(n - 1)},${H - pad}`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto" }} preserveAspectRatio="none">
      <defs>
        <linearGradient id="wg2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#6c5ce7" stopOpacity="0.28" />
          <stop offset="1" stopColor="#6c5ce7" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill="url(#wg2)" />
      <polyline points={pts} fill="none" stroke="#6c5ce7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {data.map((d, i) => (
        <g key={i}>
          <circle cx={x(i)} cy={y(d.weight)} r="4" fill="#1a1a1e" stroke="#6c5ce7" strokeWidth="2.5" />
          <text x={x(i)} y={y(d.weight) - 10} textAnchor="middle" fontSize="12" fill="#e4e4e7" fontWeight="600">
            {d.weight}
          </text>
        </g>
      ))}
    </svg>
  );
}

export default async function PortalProgreso() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: client } = await supabase
    .from("clients")
    .select("id")
    .eq("user_id", user!.id)
    .single();

  const { data: rows } = await supabase
    .from("measurements")
    .select("*")
    .eq("client_id", client!.id)
    .order("date", { ascending: true });
  const asc = (rows ?? []) as any[];
  const desc = [...asc].reverse();
  const weights = asc
    .filter((r) => r.weight != null)
    .map((r) => ({ date: r.date, weight: Number(r.weight) }));
  const last = weights[weights.length - 1]?.weight;
  const first = weights[0]?.weight;
  const variation =
    first != null && last != null ? Math.round((last - first) * 10) / 10 : null;

  const cols = [
    { key: "weight", label: "Peso" },
    { key: "cintura", label: "Cintura" },
    { key: "cadera", label: "Cadera" },
    { key: "pecho", label: "Pecho" },
    { key: "brazo", label: "Brazo" },
    { key: "muslo", label: "Muslo" },
  ];
  const today = new Date().toISOString().slice(0, 10);

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Mi progreso</h1>
          <div className="sub">Registrá tu peso y medidas</div>
        </div>
      </div>

      <div className="stats" style={{ marginBottom: 22 }}>
        <div className="stat">
          <div className="l">Peso actual</div>
          <div className="v">{last != null ? `${last} kg` : "—"}</div>
        </div>
        <div className="stat">
          <div className="l">Variación</div>
          <div
            className="v"
            style={{
              color:
                variation == null
                  ? undefined
                  : variation < 0
                  ? "var(--green)"
                  : variation > 0
                  ? "var(--amber)"
                  : undefined,
            }}
          >
            {variation == null ? "—" : `${variation > 0 ? "+" : ""}${variation} kg`}
          </div>
        </div>
      </div>

      <div className="panel" style={{ marginBottom: 20 }}>
        <div className="panel-head">Evolución del peso</div>
        {weights.length < 2 ? (
          <div className="empty" style={{ padding: "40px 20px" }}>
            Cargá al menos 2 registros para ver tu gráfico.
          </div>
        ) : (
          <div style={{ padding: 20 }}>
            <WeightChart data={weights} />
          </div>
        )}
      </div>

      <div className="form-card" style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: 16, marginBottom: 14 }}>Nuevo registro</h3>
        <form action={portalAddMeasurement}>
          <div className="field">
            <label>Fecha</label>
            <input type="date" name="date" defaultValue={today} />
          </div>
          <div className="row2">
            <div className="field">
              <label>Peso (kg)</label>
              <input name="weight" inputMode="decimal" placeholder="80.5" />
            </div>
            <div className="field">
              <label>Cintura (cm)</label>
              <input name="cintura" inputMode="decimal" />
            </div>
          </div>
          <div className="row2">
            <div className="field">
              <label>Cadera (cm)</label>
              <input name="cadera" inputMode="decimal" />
            </div>
            <div className="field">
              <label>Pecho (cm)</label>
              <input name="pecho" inputMode="decimal" />
            </div>
          </div>
          <div className="row2">
            <div className="field">
              <label>Brazo (cm)</label>
              <input name="brazo" inputMode="decimal" />
            </div>
            <div className="field">
              <label>Muslo (cm)</label>
              <input name="muslo" inputMode="decimal" />
            </div>
          </div>
          <button className="btn btn-primary">Guardar</button>
        </form>
      </div>

      <div className="panel">
        <div className="panel-head">Historial</div>
        {desc.length === 0 ? (
          <div className="empty" style={{ padding: "40px 20px" }}>
            Sin registros todavía.
          </div>
        ) : (
          <table className="list">
            <thead>
              <tr>
                <th>Fecha</th>
                {cols.map((c) => (
                  <th key={c.key}>{c.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {desc.map((r) => (
                <tr key={r.id}>
                  <td style={{ fontWeight: 500 }}>{fmtDate(r.date)}</td>
                  {cols.map((c) => (
                    <td key={c.key} style={{ color: "var(--gray)" }}>
                      {r[c.key] != null ? r[c.key] : "—"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
