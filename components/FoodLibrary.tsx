"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Food = {
  id: string;
  category: string;
  name: string;
  base_quantity: number;
  unit: string;
  protein: number;
  fat: number;
  carbs: number;
  kcal: number;
  is_global: boolean;
};

const CATEGORIES = ["TODAS", "PROTEÍNAS", "CARBOHIDRATOS", "GRASAS"];

export function FoodLibrary({ initialFoods }: { initialFoods: Food[] }) {
  const supabase = createClient();
  const [foods, setFoods] = useState(initialFoods);
  const [filter, setFilter] = useState("TODAS");
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [form, setForm] = useState({
    name: "",
    category: "PROTEÍNAS",
    base_quantity: "100",
    unit: "g",
    protein: "",
    fat: "",
    carbs: "",
    kcal: "",
  });

  const filtered = foods.filter((f) => {
    const matchCat = filter === "TODAS" || f.category === filter;
    const matchSearch =
      !search || f.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const { data, error } = await supabase
      .from("foods")
      .insert({
        name: form.name.toUpperCase().trim(),
        category: form.category,
        base_quantity: parseFloat(form.base_quantity) || 100,
        unit: form.unit,
        protein: parseFloat(form.protein) || 0,
        fat: parseFloat(form.fat) || 0,
        carbs: parseFloat(form.carbs) || 0,
        kcal: parseFloat(form.kcal) || 0,
        is_global: false,
      })
      .select()
      .single();

    if (!error && data) {
      setFoods([...foods, data]);
      setForm({
        name: "",
        category: "PROTEÍNAS",
        base_quantity: "100",
        unit: "g",
        protein: "",
        fat: "",
        carbs: "",
        kcal: "",
      });
      setShowAdd(false);
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este alimento?")) return;
    const { error } = await supabase.from("foods").delete().eq("id", id);
    if (!error) setFoods(foods.filter((f) => f.id !== id));
  }

  return (
    <>
      {/* Filtros */}
      <div
        style={{
          display: "flex",
          gap: 10,
          marginBottom: 16,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar alimento..."
          style={{ flex: 1, minWidth: 180 }}
        />
        <div className="segmented">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              className={filter === cat ? "active" : ""}
              onClick={() => setFilter(cat)}
            >
              {cat === "TODAS"
                ? "Todas"
                : cat === "PROTEÍNAS"
                ? "Proteínas"
                : cat === "CARBOHIDRATOS"
                ? "Carbos"
                : "Grasas"}
            </button>
          ))}
        </div>
        <button
          className="btn btn-primary"
          style={{ width: "auto" }}
          onClick={() => setShowAdd(!showAdd)}
        >
          {showAdd ? "Cancelar" : "+ Agregar alimento"}
        </button>
      </div>

      {/* Form agregar */}
      {showAdd && (
        <form
          onSubmit={handleAdd}
          className="panel"
          style={{ marginBottom: 16 }}
        >
          <div className="panel-head">Nuevo alimento personalizado</div>
          <div
            style={{
              padding: 20,
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
              gap: 12,
            }}
          >
            <div className="field" style={{ gridColumn: "1 / -1" }}>
              <label>Nombre</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ej: POLLO GRILLADO"
                required
              />
            </div>
            <div className="field">
              <label>Categoría</label>
              <select
                value={form.category}
                onChange={(e) =>
                  setForm({ ...form, category: e.target.value })
                }
              >
                <option value="PROTEÍNAS">Proteínas</option>
                <option value="CARBOHIDRATOS">Carbohidratos</option>
                <option value="GRASAS">Grasas</option>
              </select>
            </div>
            <div className="field">
              <label>Cantidad base</label>
              <input
                value={form.base_quantity}
                onChange={(e) =>
                  setForm({ ...form, base_quantity: e.target.value })
                }
                inputMode="decimal"
              />
            </div>
            <div className="field">
              <label>Unidad</label>
              <select
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
              >
                <option value="g">g</option>
                <option value="ml">ml</option>
                <option value="unidad">unidad</option>
              </select>
            </div>
            <div className="field">
              <label>Proteínas (g)</label>
              <input
                value={form.protein}
                onChange={(e) => setForm({ ...form, protein: e.target.value })}
                inputMode="decimal"
                placeholder="0"
              />
            </div>
            <div className="field">
              <label>Grasas (g)</label>
              <input
                value={form.fat}
                onChange={(e) => setForm({ ...form, fat: e.target.value })}
                inputMode="decimal"
                placeholder="0"
              />
            </div>
            <div className="field">
              <label>Carbos (g)</label>
              <input
                value={form.carbs}
                onChange={(e) => setForm({ ...form, carbs: e.target.value })}
                inputMode="decimal"
                placeholder="0"
              />
            </div>
            <div className="field">
              <label>Kcal</label>
              <input
                value={form.kcal}
                onChange={(e) => setForm({ ...form, kcal: e.target.value })}
                inputMode="decimal"
                placeholder="0"
              />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <button
                className="btn btn-primary"
                disabled={saving}
                style={{ width: "auto" }}
              >
                {saving ? "Guardando..." : "Guardar alimento"}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Tabla */}
      <div className="panel">
        <div className="panel-head">
          {filtered.length} alimento{filtered.length !== 1 ? "s" : ""}
        </div>
        <div style={{ overflowX: "auto" }}>
          <table className="list">
            <thead>
              <tr>
                <th>Alimento</th>
                <th>Categoría</th>
                <th>Cant.</th>
                <th>P (g)</th>
                <th>G (g)</th>
                <th>C (g)</th>
                <th>Kcal</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ color: "var(--gray-light)" }}>
                    No se encontraron alimentos.
                  </td>
                </tr>
              )}
              {filtered.map((f) => (
                <tr key={f.id}>
                  <td style={{ fontWeight: 500 }}>{f.name}</td>
                  <td>
                    <span
                      className={`badge ${
                        f.category === "PROTEÍNAS"
                          ? "activo"
                          : f.category === "CARBOHIDRATOS"
                          ? "pendiente"
                          : "pausa"
                      }`}
                    >
                      {f.category === "PROTEÍNAS"
                        ? "Proteína"
                        : f.category === "CARBOHIDRATOS"
                        ? "Carbo"
                        : "Grasa"}
                    </span>
                  </td>
                  <td>
                    {f.base_quantity}
                    {f.unit}
                  </td>
                  <td>{f.protein}</td>
                  <td>{f.fat}</td>
                  <td>{f.carbs}</td>
                  <td>{f.kcal}</td>
                  <td style={{ textAlign: "right" }}>
                    {!f.is_global && (
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(f.id)}
                      >
                        ✕
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
