"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { currentPeriod } from "@/lib/format";

// Cobro de un clic: registra la cuota mensual del cliente para el período actual.
export async function chargeMonthlyFeeAction(clientId: string) {
  const supabase = createClient();
  const { data: client } = await supabase
    .from("clients")
    .select("monthly_fee, currency")
    .eq("id", clientId)
    .single();
  if (!client?.monthly_fee) return;

  const { error } = await supabase.from("payments").insert({
    client_id: clientId,
    amount: client.monthly_fee,
    currency: client.currency ?? "UYU",
    method: "efectivo",
    period: currentPeriod(),
  });
  if (error) throw new Error(error.message);

  revalidatePath("/pagos");
  revalidatePath("/dashboard");
  revalidatePath(`/clientes/${clientId}`);
}

export async function recordPaymentAction(formData: FormData) {
  const supabase = createClient();
  const client_id = String(formData.get("client_id") ?? "");
  const amount = Number(String(formData.get("amount") ?? "").replace(",", "."));
  if (!client_id || !amount || amount <= 0) return;

  const values: Record<string, unknown> = {
    client_id,
    amount,
    currency: String(formData.get("currency") ?? "UYU"),
    method: String(formData.get("method") ?? "efectivo"),
    period: String(formData.get("period") ?? "").trim() || null,
    notes: String(formData.get("notes") ?? "").trim() || null,
  };
  const paidOn = String(formData.get("paid_on") ?? "").trim();
  if (paidOn) values.paid_on = paidOn;

  const { error } = await supabase.from("payments").insert(values);
  if (error) throw new Error(error.message);

  revalidatePath("/pagos");
  revalidatePath("/dashboard");
  revalidatePath(`/clientes/${client_id}`);
}

export async function deletePaymentAction(id: string, clientId?: string) {
  const supabase = createClient();
  const { error } = await supabase.from("payments").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/pagos");
  revalidatePath("/dashboard");
  if (clientId) revalidatePath(`/clientes/${clientId}`);
}
