"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const HABIT_FIELDS = [
  "entrenamiento",
  "alimentacion",
  "hidratacion",
  "descanso",
  "mindset",
] as const;

export async function toggleHabitAction(
  clientId: string,
  date: string,
  field: string,
  value: boolean
) {
  if (!HABIT_FIELDS.includes(field as any)) return;
  const supabase = createClient();
  const { error } = await supabase
    .from("habit_logs")
    .upsert(
      { client_id: clientId, date, [field]: value },
      { onConflict: "client_id,date" }
    );
  if (error) throw new Error(error.message);
  revalidatePath(`/clientes/${clientId}/habitos`);
}

function intOrNull(v: FormDataEntryValue | null): number | null {
  const s = String(v ?? "").trim();
  if (!s) return null;
  const n = parseInt(s, 10);
  return Number.isFinite(n) ? n : null;
}

export async function addCheckinAction(clientId: string, formData: FormData) {
  const supabase = createClient();
  const values: Record<string, unknown> = {
    client_id: clientId,
    energia: intOrNull(formData.get("energia")),
    motivacion: intOrNull(formData.get("motivacion")),
    estres: intOrNull(formData.get("estres")),
    sueno: intOrNull(formData.get("sueno")),
    logro: String(formData.get("logro") ?? "").trim() || null,
    dificultad: String(formData.get("dificultad") ?? "").trim() || null,
    foco: String(formData.get("foco") ?? "").trim() || null,
  };
  const date = String(formData.get("date") ?? "").trim();
  if (date) values.date = date;
  const { error } = await supabase.from("checkins").insert(values);
  if (error) throw new Error(error.message);
  revalidatePath(`/clientes/${clientId}/habitos`);
}

export async function deleteCheckinAction(id: string, clientId: string) {
  const supabase = createClient();
  const { error } = await supabase.from("checkins").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/clientes/${clientId}/habitos`);
}
