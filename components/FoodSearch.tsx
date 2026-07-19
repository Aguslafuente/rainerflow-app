"use client";

import { useState, useEffect, useMemo, useRef } from "react";
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
};

export function FoodSearch({
  mealId,
  clientId,
  position,
}: {
  mealId: string;
  clientId: string;
  position: number;
}) {
  const supabase = useMemo(() => createClient(), []);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Food[]>([]);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Food | null>(null);
  const [quantity, setQuantity] = useState("");
  const [protein, setProtein] = useState("");
  const [fat, setFat] = useState("");
  const [carbs, setCarbs] = useState("");
  const [kcal, setKcal] = useState("");
  const [saving, setSaving] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  // Buscar alimentos
  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const { data } = await supabase
        .from("foods")
        .select("*")
        .ilike("name", `%${query}%`)
        .order("name")
        .limit(10);
      setResults(data ?? []);
      setOpen(true);
    }, 200);
    return () => clearTimeout(debounceRef.current);
  }, [query, supabase]);

  // Cerrar dropdown al click afuera
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function selectFood(food: Food) {
    setSelected(food);
    setQuery(food.name);
    setOpen(false);
    // Calcular macros para cantidad base
    setQuantity(`${food.base_quantity}${food.unit}`);
    setProtein(String(food.protein));
    setFat(String(food.fat));
    setCarbs(String(food.carbs));
    setKcal(String(food.kcal));
  }

  function recalc(newQty: string) {
    setQuantity(newQty);
    if (!selected) return;
    const n = parseFloat(newQty.replace(",", "."));
    if (!n || !Number.isFinite(n)) return;
    const ratio = n / selected.base_quantity;
    setProtein((selected.protein * ratio).toFixed(1));
    setFat((selected.fat * ratio).toFixed(1));
    setCarbs((selected.carbs * ratio).toFixed(1));
    setKcal((selected.kcal * ratio).toFixed(1));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const foodName = query.trim();
    if (!foodName) return;
    setSaving(true);

    const { error } = await supabase.from("meal_items").insert({
      meal_id: mealId,
      food: foodName,
      quantity: quantity || null,
      protein: parseFloat(protein) || 0,
      fat: parseFloat(fat) || 0,
      carbs: parseFloat(carbs) || 0,
      kcal: parseFloat(kcal) || 0,
      food_id: selected?.id || null,
      position,
    });

    if (!error) {
      setQuery("");
      setSelected(null);
      setQuantity("");
      setProtein("");
      setFat("");
      setCarbs("");
      setKcal("");
      // Reload para refrescar server component
      window.location.reload();
    }
    setSaving(false);
  }

  return (
    <form className="item-add" onSubmit={handleSubmit}>
      <div ref={wrapRef} style={{ position: "relative", flex: 2 }}>
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (selected) setSelected(null);
          }}
          placeholder="Buscar alimento..."
          autoComplete="off"
        />
        {open && results.length > 0 && (
          <div className="food-dropdown">
            {results.map((f) => (
              <button
                key={f.id}
                type="button"
                className="food-dropdown-item"
                onClick={() => selectFood(f)}
              >
                <span className="food-dropdown-name">{f.name}</span>
                <span className="food-dropdown-meta">
                  {f.base_quantity}{f.unit} · {f.protein}P {f.carbs}C {f.fat}G · {f.kcal}kcal
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
      <input
        value={quantity}
        onChange={(e) => recalc(e.target.value)}
        placeholder="Cant."
        style={{ width: 70 }}
      />
      <input
        value={protein}
        onChange={(e) => setProtein(e.target.value)}
        placeholder="P"
        inputMode="decimal"
        style={{ width: 50 }}
      />
      <input
        value={carbs}
        onChange={(e) => setCarbs(e.target.value)}
        placeholder="C"
        inputMode="decimal"
        style={{ width: 50 }}
      />
      <input
        value={fat}
        onChange={(e) => setFat(e.target.value)}
        placeholder="G"
        inputMode="decimal"
        style={{ width: 50 }}
      />
      <input
        value={kcal}
        onChange={(e) => setKcal(e.target.value)}
        placeholder="Kcal"
        inputMode="decimal"
        style={{ width: 55 }}
      />
      <button className="btn btn-primary btn-sm" disabled={saving}>
        {saving ? "..." : "+ Agregar"}
      </button>
    </form>
  );
}
