import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const g = (n: number) => (n % 1 === 0 ? String(n) : n.toFixed(1));

export default async function PortalNutricion({
  searchParams,
}: {
  searchParams?: { dia?: string };
}) {
  const dia = searchParams?.dia === "descanso" ? "descanso" : "entreno";
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: client } = await supabase
    .from("clients")
    .select("id")
    .eq("user_id", user!.id)
    .single();

  const { data: plan } = await supabase
    .from("nutrition_plans")
    .select("*")
    .eq("client_id", client!.id)
    .maybeSingle();

  let meals: any[] = [];
  if (plan) {
    const { data } = await supabase
      .from("meals")
      .select("*, meal_items(*)")
      .eq("plan_id", plan.id)
      .eq("day_type", dia)
      .order("position");
    meals = (data ?? []).map((m: any) => ({
      ...m,
      meal_items: (m.meal_items ?? []).sort(
        (a: any, b: any) => a.position - b.position
      ),
    }));
  }

  if (!plan) {
    return (
      <>
        <div className="page-head">
          <div>
            <h1>Mi nutrición</h1>
            <div className="sub">Tu plan de alimentación</div>
          </div>
        </div>
        <div className="panel">
          <div className="empty" style={{ padding: "48px 20px" }}>
            <div className="big">Tu plan de nutrición todavía no está cargado</div>
            Tu entrenador lo va a preparar pronto.
          </div>
        </div>
      </>
    );
  }

  const target =
    dia === "entreno"
      ? {
          p: Number(plan.target_protein) || 0,
          c: Number(plan.target_carbs) || 0,
          f: Number(plan.target_fat) || 0,
          k: Number(plan.target_kcal) || 0,
        }
      : {
          p: Number(plan.rest_protein) || 0,
          c: Number(plan.rest_carbs) || 0,
          f: Number(plan.rest_fat) || 0,
          k: Number(plan.rest_kcal) || 0,
        };

  const macros = [
    { key: "p" as const, label: "Proteína", unit: "g" },
    { key: "c" as const, label: "Carbohidratos", unit: "g" },
    { key: "f" as const, label: "Grasas", unit: "g" },
    { key: "k" as const, label: "Calorías", unit: "kcal" },
  ];

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Mi nutrición</h1>
          <div className="sub">Tu plan de alimentación</div>
        </div>
      </div>

      <div className="segmented" style={{ marginBottom: 18 }}>
        <Link
          href="/portal/nutricion?dia=entreno"
          className={dia === "entreno" ? "active" : ""}
        >
          Día de entreno
        </Link>
        <Link
          href="/portal/nutricion?dia=descanso"
          className={dia === "descanso" ? "active" : ""}
        >
          Día de descanso
        </Link>
      </div>

      <div className="stats" style={{ marginBottom: 22 }}>
        {macros.map((m) => (
          <div className="stat" key={m.key}>
            <div className="l">{m.label}</div>
            <div className="v">
              {g(target[m.key])}{" "}
              <span style={{ fontSize: 14, color: "var(--gray-light)", fontWeight: 500 }}>
                {m.unit}
              </span>
            </div>
            <div className="h">objetivo del día</div>
          </div>
        ))}
      </div>

      {meals.length === 0 ? (
        <div className="panel">
          <div className="empty" style={{ padding: "40px 20px" }}>
            No hay comidas cargadas para este día.
          </div>
        </div>
      ) : (
        meals.map((meal) => (
          <div className="panel" style={{ marginBottom: 16 }} key={meal.id}>
            <div className="panel-head">{meal.name}</div>
            <table className="list">
              <thead>
                <tr>
                  <th>Alimento</th>
                  <th>Cantidad</th>
                  <th>P</th>
                  <th>C</th>
                  <th>G</th>
                  <th>Kcal</th>
                </tr>
              </thead>
              <tbody>
                {meal.meal_items.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ color: "var(--gray-light)" }}>
                      Sin alimentos.
                    </td>
                  </tr>
                )}
                {meal.meal_items.map((it: any) => (
                  <tr key={it.id}>
                    <td style={{ fontWeight: 500 }}>{it.food}</td>
                    <td style={{ color: "var(--gray)" }}>{it.quantity || "—"}</td>
                    <td>{g(Number(it.protein))}</td>
                    <td>{g(Number(it.carbs))}</td>
                    <td>{g(Number(it.fat))}</td>
                    <td>{g(Number(it.kcal))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))
      )}
    </>
  );
}
