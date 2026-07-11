"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { toUtcIso } from "@/lib/format";

export async function createAppointmentAction(formData: FormData) {
  const supabase = createClient();
  const startsRaw = String(formData.get("starts_at") ?? "").trim();
  if (!startsRaw) return;

  const values = {
    client_id: String(formData.get("client_id") ?? "") || null,
    title: String(formData.get("title") ?? "").trim() || null,
    starts_at: toUtcIso(startsRaw),
    duration_min: Number(formData.get("duration_min") ?? 60) || 60,
    notes: String(formData.get("notes") ?? "").trim() || null,
  };
  const { error } = await supabase.from("appointments").insert(values);
  if (error) throw new Error(error.message);

  revalidatePath("/agenda");
  revalidatePath("/dashboard");
  if (values.client_id) revalidatePath(`/clientes/${values.client_id}`);
}

export async function setAppointmentStatusAction(
  id: string,
  status: string,
  clientId?: string
) {
  const supabase = createClient();
  const { error } = await supabase
    .from("appointments")
    .update({ status })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/agenda");
  revalidatePath("/dashboard");
  if (clientId) revalidatePath(`/clientes/${clientId}`);
}

export async function deleteAppointmentAction(id: string, clientId?: string) {
  const supabase = createClient();
  const { error } = await supabase.from("appointments").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/agenda");
  revalidatePath("/dashboard");
  if (clientId) revalidatePath(`/clientes/${clientId}`);
}
