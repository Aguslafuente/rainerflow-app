import { HelpButton } from "@/components/HelpButton";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ClientTabs } from "@/components/ClientTabs";
import { ConfirmSubmit } from "@/components/ConfirmSubmit";
import { FoodSearch } from "@/components/FoodSearch";
import {
  saveTargetsAction,
  addMealAction,
  deleteMealAction,
  addItemAction,
  deleteItemAction,
} from "./actions";

export const dynamic = "force-dynamic";

const g = (n: number) => (n % 1 === 0 ? String(n) : n.toFixed(1));

export default async function NutricionPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams?: { dia?: string };
}) {
  const clientId = params.id;
  const dia = searchParams?.dia === "descanso" ? "descanso" : "entreno";
  const supabase = createClient();

  const { data: c } = await supabase
    .from("clients")
    .select("id, full_name")
    .eq("id", clientId)
    .single();
  if (!c) notFound();

  const { data: plan } = await supabase
    .from("nutrition_plans")
    .select("*")
    .eq("client_id", clientId)
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

  const target = plan
    ? dia === "entreno"
      ? {
          p: Number(plan.target_protein) || 0,
          f: Number(plan.target_fat) || 0,
          c: Number(plan.target_carbs) || 0,
          k: Number(plan.target_kcal) || 0,
        }
      : {
          p: Number(plan.rest_protein) || 0,
          f: Number(plan.rest_fat) || 0,
          c: Number(plan.rest_carbs) || 0,
          k: Number(plan.rest_kcal) || 0,
        }
    : { p: 0, f: 0, c: 0, k: 0 };

  const total = { p: 0, f: 0, c: 0, k: 0 };
  for (const m of meals) {
    for (const it of m.meal_items) {
      total.p += Number(it.protein) || 0;
      total.f += Number(it.fat) || 0;
      total.c += Number(it.carbs) || 0;
      total.k += Number(it.kcal) || 0;
    }
  }

  const macros: { key: "p" | "f" | "c" | "k"; label: string; unit: string }[] = [
    { key: "p", label: "Proteína", unit: "g" },
    { key: "c", label: "Carbohidratos", unit: "g" },
    { key: "f", label: "Grasas", unit: "g" },
    { key: "k", label: "Calorías", unit: "kcal" },
  ];

  return (
    <>
      <Link href="/clientes" className="back-link">
        ← Volver a clientes
      </Link>
      <div className="page-head">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}><h1>{c.full_name}</h1><HelpButton page="nutricion" /></div>
          <div className="sub">Plan de nutrición</div>
        </div>
      </div>
      <ClientTabs clientId={clientId} />

      {/* Toggle día */}
      <div className="segmented" style={{ marginBottom: 18 }}>
        <Link
          href={`/clientes/${clientId}/nutricion?dia=entreno`}
          className={dia === "entreno" ? "active" : ""}
        >
          Día de entreno
        </Link>
        <Link
          href={`/clientes/${clientId}/nutricion?dia=descanso`}
          className={dia === "descanso" ? "active" : ""}
        >
          Día de descanso
        </Link>
      </div>

      {/* Macros: total vs objetivo */}
      <div className="stats" style={{ marginBottom: 22 }}>
        {macros.map((m) => {
          const t = total[m.key];
          const goal = target[m.key];
          const diff = goal - t;
          return (
            <div className="stat" key={m.key}>
              <div className="l">{m.label}</div>
              <div className="v">
                {g(t)}
                <span
                  style={{
                    fontSize: 14,
                    color: "var(--gray-light)",
                    fontWeight: 500,
                  }}
                >
                  {" "}
                  / {g(goal)} {m.unit}
                </span>
              </div>
              <div
                className="h"
                style={{
                  color:
                    goal === 0
                      ? "var(--gray-light)"
                      : Math.abs(diff) <= goal * 0.05
                      ? "var(--green)"
                      : "var(--amber)",
                }}
              >
                {goal === 0
                  ? "sin objetivo"
                  : diff >= 0
                  ? `faltan ${g(diff)} ${m.unit}`
                  : `+${g(-diff)} ${m.unit}`}
              </div>
            </div>
          );
        })}
      </div>

      {/* Comidas */}
      {meals.map((meal) => {
        const mt = { p: 0, f: 0, c: 0, k: 0 };
        for (const it of meal.meal_items) {
          mt.p += Number(it.protein) || 0;
          mt.f += Number(it.fat) || 0;
          mt.c += Number(it.carbs) || 0;
          mt.k += Number(it.kcal) || 0;
        }
        return (
          <div className="panel" style={{ marginBottom: 16 }} key={meal.id}>
            <div className="panel-head">
              {meal.name}
              <span style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <span style={{ fontSize: 13, color: "var(--gray)", fontWeight: 500 }}>
                  {g(mt.p)}P · {g(mt.c)}C · {g(mt.f)}G · {g(mt.k)} kcal
                </span>
                <ConfirmSubmit
                  action={deleteMealAction.bind(null, meal.id, clientId)}
                  confirmText="¿Eliminar esta comida?"
                  className="btn btn-danger btn-sm"
                >
                  ✕
                </ConfirmSubmit>
              </span>
            </div>
            <table className="list">
              <thead>
                <tr>
                  <th>Alimento</th>
                  <th>Cant.</th>
                  <th>P</th>
                  <th>C</th>
                  <th>G</th>
                  <th>Kcal</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {meal.meal_items.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ color: "var(--gray-light)" }}>
                      Sin alimentos todavía.
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
                    <td style={{ textAlign: "right" }}>
                      <ConfirmSubmit
                        action={deleteItemAction.bind(null, it.id, clientId)}
                        className="btn btn-danger btn-sm"
                      >
                        ✕
                      </ConfirmSubmit>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <FoodSearch
              mealId={meal.id}
              clientId={clientId}
              position={meal.meal_items.length}
            />
          </div>
        );
      })}

      {/* Agregar comida */}
      <div className="form-card" style={{ marginBottom: 22 }}>
        <h3 style={{ fontSize: 16, marginBottom: 12 }}>
          Agregar comida ({dia === "entreno" ? "día de entreno" : "día de descanso"})
        </h3>
        <form
          action={addMealAction.bind(null, clientId, dia, meals.length)}
          style={{ display: "flex", gap: 10 }}
        >
          <input
            name="name"
            placeholder="Ej: Comida 1 - Desayuno"
            required
            style={{ flex: 1 }}
          />
          <button className="btn btn-primary" style={{ width: "auto" }}>
            Agregar
          </button>
        </form>
      </div>

      {/* Objetivos de macros */}
      <details className="intake-section">
        <summary>Objetivos de macros (editar)</summary>
        <div className="intake-body">
          <form action={saveTargetsAction.bind(null, clientId)}>
            <div style={{ fontWeight: 600, fontSize: 13, margin: "4px 0 8px" }}>
              Día de entreno
            </div>
            <div className="macro-grid">
              <div className="field">
                <label>Proteína (g)</label>
                <input name="target_protein" defaultValue={plan?.target_protein ?? ""} inputMode="decimal" />
              </div>
              <div className="field">
                <label>Carbohidratos (g)</label>
                <input name="target_carbs" defaultValue={plan?.target_carbs ?? ""} inputMode="decimal" />
              </div>
              <div className="field">
                <label>Grasas (g)</label>
                <input name="target_fat" defaultValue={plan?.target_fat ?? ""} inputMode="decimal" />
              </div>
              <div className="field">
                <label>Calorías</label>
                <input name="target_kcal" defaultValue={plan?.target_kcal ?? ""} inputMode="decimal" />
              </div>
            </div>
            <div style={{ fontWeight: 600, fontSize: 13, margin: "10px 0 8px" }}>
              Día de descanso
            </div>
            <div className="macro-grid">
              <div className="field">
                <label>Proteína (g)</label>
                <input name="rest_protein" defaultValue={plan?.rest_protein ?? ""} inputMode="decimal" />
              </div>
              <div className="field">
                <label>Carbohidratos (g)</label>
                <input name="rest_carbs" defaultValue={plan?.rest_carbs ?? ""} inputMode="decimal" />
              </div>
              <div className="field">
                <label>Grasas (g)</label>
                <input name="rest_fat" defaultValue={plan?.rest_fat ?? ""} inputMode="decimal" />
              </div>
              <div className="field">
                <label>Calorías</label>
                <input name="rest_kcal" defaultValue={plan?.rest_kcal ?? ""} inputMode="decimal" />
              </div>
            </div>
            <button className="btn btn-primary" style={{ width: "auto", marginTop: 4 }}>
              Guardar objetivos
            </button>
          </form>
        </div>
      </details>
    </>
  );
}
