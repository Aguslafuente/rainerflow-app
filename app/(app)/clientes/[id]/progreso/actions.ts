"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

function numOrNull(v: FormDataEntryValue | null): number | null {
  const s = String(v ?? "").replace(",", ".").trim();
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

export async function addMeasurementAction(
  clientId: string,
  formData: FormData
) {
  const supabase = createClient();
  const values: Record<string, unknown> = {
    client_id: clientId,
    weight: numOrNull(formData.get("weight")),
    cintura: numOrNull(formData.get("cintura")),
    cadera: numOrNull(formData.get("cadera")),
    pecho: numOrNull(formData.get("pecho")),
    brazo: numOrNull(formData.get("brazo")),
    muslo: numOrNull(formData.get("muslo")),
    notes: String(formData.get("notes") ?? "").trim() || null,
  };
  const date = String(formData.get("date") ?? "").trim();
  if (date) values.date = date;
  const { error } = await supabase.from("measurements").insert(values);
  if (error) throw new Error(error.message);
  revalidatePath(`/clientes/${clientId}/progreso`);
}

export async function deleteMeasurementAction(id: string, clientId: string) {
  const supabase = createClient();
  const { error } = await supabase.from("measurements").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/clientes/${clientId}/progreso`);
}
