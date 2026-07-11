"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

function num(v: FormDataEntryValue | null): number {
  const n = Number(String(v ?? "").replace(",", ".").trim());
  return Number.isFinite(n) ? n : 0;
}

async function ensurePlanId(
  supabase: ReturnType<typeof createClient>,
  clientId: string
): Promise<string> {
  const { data: existing } = await supabase
    .from("nutrition_plans")
    .select("id")
    .eq("client_id", clientId)
    .maybeSingle();
  if (existing) return existing.id;
  const { data, error } = await supabase
    .from("nutrition_plans")
    .insert({ client_id: clientId })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return data!.id;
}

export async function saveTargetsAction(clientId: string, formData: FormData) {
  const supabase = createClient();
  const values = {
    client_id: clientId,
    target_protein: num(formData.get("target_protein")),
    target_fat: num(formData.get("target_fat")),
    target_carbs: num(formData.get("target_carbs")),
    target_kcal: num(formData.get("target_kcal")),
    rest_protein: num(formData.get("rest_protein")),
    rest_fat: num(formData.get("rest_fat")),
    rest_carbs: num(formData.get("rest_carbs")),
    rest_kcal: num(formData.get("rest_kcal")),
    notes: String(formData.get("notes") ?? "").trim() || null,
    updated_at: new Date().toISOString(),
  };
  const { error } = await supabase
    .from("nutrition_plans")
    .upsert(values, { onConflict: "client_id" });
  if (error) throw new Error(error.message);
  revalidatePath(`/clientes/${clientId}/nutricion`);
}

export async function addMealAction(
  clientId: string,
  dayType: string,
  position: number,
  formData: FormData
) {
  const supabase = createClient();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  const planId = await ensurePlanId(supabase, clientId);
  const { error } = await supabase
    .from("meals")
    .insert({ plan_id: planId, day_type: dayType, name, position });
  if (error) throw new Error(error.message);
  revalidatePath(`/clientes/${clientId}/nutricion`);
}

export async function deleteMealAction(mealId: string, clientId: string) {
  const supabase = createClient();
  const { error } = await supabase.from("meals").delete().eq("id", mealId);
  if (error) throw new Error(error.message);
  revalidatePath(`/clientes/${clientId}/nutricion`);
}

export async function addItemAction(
  mealId: string,
  clientId: string,
  position: number,
  formData: FormData
) {
  const supabase = createClient();
  const food = String(formData.get("food") ?? "").trim();
  if (!food) return;
  const { error } = await supabase.from("meal_items").insert({
    meal_id: mealId,
    food,
    quantity: String(formData.get("quantity") ?? "").trim() || null,
    protein: num(formData.get("protein")),
    fat: num(formData.get("fat")),
    carbs: num(formData.get("carbs")),
    kcal: num(formData.get("kcal")),
    position,
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/clientes/${clientId}/nutricion`);
}

export async function deleteItemAction(itemId: string, clientId: string) {
  const supabase = createClient();
  const { error } = await supabase.from("meal_items").delete().eq("id", itemId);
  if (error) throw new Error(error.message);
  revalidatePath(`/clientes/${clientId}/nutricion`);
}
