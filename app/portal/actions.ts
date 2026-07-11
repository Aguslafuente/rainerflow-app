"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { REVIEW_FIELD_NAMES } from "@/lib/reviewFields";

async function myClientId(): Promise<{ supabase: ReturnType<typeof createClient>; clientId: string | null }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, clientId: null };
  const { data } = await supabase
    .from("clients")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  return { supabase, clientId: data?.id ?? null };
}

function numOrNull(v: FormDataEntryValue | null): number | null {
  const s = String(v ?? "").replace(",", ".").trim();
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function intOrNull(v: FormDataEntryValue | null): number | null {
  const s = String(v ?? "").trim();
  if (!s) return null;
  const n = parseInt(s, 10);
  return Number.isFinite(n) ? n : null;
}

export async function portalAddMeasurement(formData: FormData) {
  const { supabase, clientId } = await myClientId();
  if (!clientId) return;
  const values: Record<string, unknown> = {
    client_id: clientId,
    weight: numOrNull(formData.get("weight")),
    cintura: numOrNull(formData.get("cintura")),
    cadera: numOrNull(formData.get("cadera")),
    pecho: numOrNull(formData.get("pecho")),
    brazo: numOrNull(formData.get("brazo")),
    muslo: numOrNull(formData.get("muslo")),
  };
  const date = String(formData.get("date") ?? "").trim();
  if (date) values.date = date;
  const { error } = await supabase.from("measurements").insert(values);
  if (error) throw new Error(error.message);
  revalidatePath("/portal/progreso");
}

const HABIT_FIELDS = [
  "entrenamiento",
  "alimentacion",
  "hidratacion",
  "descanso",
  "mindset",
];

export async function portalToggleHabit(
  date: string,
  field: string,
  value: boolean
) {
  if (!HABIT_FIELDS.includes(field)) return;
  const { supabase, clientId } = await myClientId();
  if (!clientId) return;
  const { error } = await supabase
    .from("habit_logs")
    .upsert(
      { client_id: clientId, date, [field]: value },
      { onConflict: "client_id,date" }
    );
  if (error) throw new Error(error.message);
  revalidatePath("/portal/habitos");
}

export async function portalAddReview(formData: FormData) {
  const { supabase, clientId } = await myClientId();
  if (!clientId) return;
  const values: Record<string, unknown> = { client_id: clientId };
  for (const name of REVIEW_FIELD_NAMES) {
    values[name] = String(formData.get(name) ?? "").trim() || null;
  }
  values.period = new Date().toISOString().slice(0, 7);
  if (!REVIEW_FIELD_NAMES.some((n) => values[n])) return;
  const { error } = await supabase.from("reviews").insert(values);
  if (error) throw new Error(error.message);
  revalidatePath("/portal/revision");
}

export async function portalAddCheckin(formData: FormData) {
  const { supabase, clientId } = await myClientId();
  if (!clientId) return;
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
  const { error } = await supabase.from("checkins").insert(values);
  if (error) throw new Error(error.message);
  revalidatePath("/portal/habitos");
}
