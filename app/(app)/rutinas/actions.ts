"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function createRoutineAction(formData: FormData) {
  const supabase = createClient();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  const values = {
    name,
    description: String(formData.get("description") ?? "").trim() || null,
  };
  const { data, error } = await supabase
    .from("routines")
    .insert(values)
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  revalidatePath("/rutinas");
  redirect(`/rutinas/${data!.id}`);
}

export async function deleteRoutineAction(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("routines").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/rutinas");
  redirect("/rutinas");
}

export async function addRoutineExerciseAction(
  routineId: string,
  formData: FormData
) {
  const supabase = createClient();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  const values = {
    routine_id: routineId,
    name,
    day_label: String(formData.get("day_label") ?? "").trim() || null,
    sets: String(formData.get("sets") ?? "").trim() || null,
    reps: String(formData.get("reps") ?? "").trim() || null,
    rir: String(formData.get("rir") ?? "").trim() || null,
    rest: String(formData.get("rest") ?? "").trim() || null,
    weight: String(formData.get("weight") ?? "").trim() || null,
    notes: String(formData.get("notes") ?? "").trim() || null,
    position: Number(formData.get("position") ?? 0),
  };
  const { error } = await supabase.from("routine_exercises").insert(values);
  if (error) throw new Error(error.message);
  revalidatePath(`/rutinas/${routineId}`);
}

export async function deleteRoutineExerciseAction(
  id: string,
  routineId: string
) {
  const supabase = createClient();
  const { error } = await supabase
    .from("routine_exercises")
    .delete()
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/rutinas/${routineId}`);
}

export async function assignRoutineAction(
  routineId: string,
  formData: FormData
) {
  const supabase = createClient();
  const clientId = String(formData.get("client_id") ?? "");
  if (!clientId) return;
  const { error } = await supabase
    .from("client_routines")
    .insert({ routine_id: routineId, client_id: clientId });
  // Ignore duplicate assignment errors (unique constraint)
  if (error && !error.message.toLowerCase().includes("duplicate")) {
    throw new Error(error.message);
  }
  revalidatePath(`/rutinas/${routineId}`);
  revalidatePath(`/clientes/${clientId}`);
}

export async function unassignRoutineAction(
  assignmentId: string,
  paths: { routineId?: string; clientId?: string }
) {
  const supabase = createClient();
  const { error } = await supabase
    .from("client_routines")
    .delete()
    .eq("id", assignmentId);
  if (error) throw new Error(error.message);
  if (paths.routineId) revalidatePath(`/rutinas/${paths.routineId}`);
  if (paths.clientId) revalidatePath(`/clientes/${paths.clientId}`);
}
