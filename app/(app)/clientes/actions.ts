"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { INTAKE_FIELD_NAMES } from "@/lib/intakeFields";

function parseIntake(formData: FormData): Record<string, string | null> {
  const obj: Record<string, string | null> = {};
  for (const name of INTAKE_FIELD_NAMES) {
    const v = String(formData.get(name) ?? "").trim();
    obj[name] = v || null;
  }
  return obj;
}

function hasIntakeData(intake: Record<string, string | null>): boolean {
  return Object.values(intake).some((v) => v);
}

function parse(formData: FormData) {
  const feeRaw = String(formData.get("monthly_fee") ?? "").replace(",", ".").trim();
  const fee = feeRaw ? Number(feeRaw) : null;
  const dayRaw = String(formData.get("billing_day") ?? "").trim();
  const day = dayRaw ? Number(dayRaw) : null;
  return {
    full_name: String(formData.get("full_name") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim() || null,
    phone: String(formData.get("phone") ?? "").trim() || null,
    goal: String(formData.get("goal") ?? "").trim() || null,
    status: String(formData.get("status") ?? "activo"),
    notes: String(formData.get("notes") ?? "").trim() || null,
    monthly_fee: fee && !Number.isNaN(fee) ? fee : null,
    currency: String(formData.get("currency") ?? "UYU"),
    billing_day: day && !Number.isNaN(day) ? day : null,
  };
}

export async function createClientAction(formData: FormData) {
  const supabase = createClient();
  const values = parse(formData);
  if (!values.full_name) return;

  const { data, error } = await supabase
    .from("clients")
    .insert(values)
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  const intake = parseIntake(formData);
  if (hasIntakeData(intake)) {
    await supabase
      .from("client_intake")
      .insert({ client_id: data!.id, ...intake });
  }

  revalidatePath("/clientes");
  revalidatePath("/dashboard");
  redirect(`/clientes/${data!.id}`);
}

export async function updateClientAction(id: string, formData: FormData) {
  const supabase = createClient();
  const values = parse(formData);

  const { error } = await supabase.from("clients").update(values).eq("id", id);
  if (error) throw new Error(error.message);

  const intake = parseIntake(formData);
  const { error: intakeErr } = await supabase
    .from("client_intake")
    .upsert(
      { client_id: id, ...intake, updated_at: new Date().toISOString() },
      { onConflict: "client_id" }
    );
  if (intakeErr) throw new Error(intakeErr.message);

  revalidatePath("/clientes");
  revalidatePath(`/clientes/${id}`);
  revalidatePath("/dashboard");
  redirect(`/clientes/${id}`);
}

export async function toggleClientActiveAction(clientId: string, isActive: boolean) {
  const supabase = createClient();
  // RLS ensures trainer can only update their own clients
  const { error } = await supabase
    .from("clients")
    .update({ is_active: isActive })
    .eq("id", clientId);
  if (error) throw new Error(error.message);

  revalidatePath(`/clientes/${clientId}`);
  revalidatePath("/clientes");
}

export async function deleteClientAction(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("clients").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/clientes");
  revalidatePath("/dashboard");
  redirect("/clientes");
}
