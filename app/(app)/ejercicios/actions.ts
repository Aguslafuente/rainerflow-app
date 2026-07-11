"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createExerciseAction(formData: FormData) {
  const supabase = createClient();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  const values = {
    name,
    muscle_group: String(formData.get("muscle_group") ?? "").trim() || null,
    notes: String(formData.get("notes") ?? "").trim() || null,
  };
  const { error } = await supabase.from("exercises").insert(values);
  if (error) throw new Error(error.message);
  revalidatePath("/ejercicios");
}

export async function deleteExerciseAction(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("exercises").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/ejercicios");
}
