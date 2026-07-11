"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { REVIEW_FIELD_NAMES } from "@/lib/reviewFields";

export async function addReviewAction(clientId: string, formData: FormData) {
  const supabase = createClient();
  const values: Record<string, unknown> = {
    client_id: clientId,
    period: new Date().toISOString().slice(0, 7),
  };
  for (const n of REVIEW_FIELD_NAMES) {
    values[n] = String(formData.get(n) ?? "").trim() || null;
  }
  if (!REVIEW_FIELD_NAMES.some((n) => values[n])) return;
  const { error } = await supabase.from("reviews").insert(values);
  if (error) throw new Error(error.message);
  revalidatePath(`/clientes/${clientId}/revisiones`);
}

export async function deleteReviewAction(id: string, clientId: string) {
  const supabase = createClient();
  const { error } = await supabase.from("reviews").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/clientes/${clientId}/revisiones`);
}
