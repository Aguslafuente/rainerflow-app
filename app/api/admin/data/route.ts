import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { ADMIN_COOKIE, validateAdminSession } from "@/lib/admin-auth";

type JsonRecord = Record<string, unknown>;

const LEAD_FIELDS = [
  "first_name",
  "last_name",
  "email",
  "phone",
  "instagram",
  "whatsapp",
  "city",
  "country",
  "specialty",
  "student_count",
  "trainer_count",
  "origin",
  "status",
  "priority",
  "notes",
  "next_followup_at",
  "last_contact_at",
] as const;

const TICKET_FIELDS = [
  "subject",
  "body",
  "reporter_name",
  "reporter_email",
  "priority",
  "status",
  "resolution",
] as const;

function pick(source: JsonRecord, fields: readonly string[]) {
  return Object.fromEntries(
    fields.filter((field) => field in source).map((field) => [field, source[field]])
  );
}
function record(value: unknown): JsonRecord {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonRecord)
    : {};
}

function idFrom(payload: JsonRecord, key = "id") {
  const value = payload[key];
  return typeof value === "string" && value.length > 0 && value.length < 100
    ? value
    : null;
}

function failure(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function data(value: unknown = null) {
  return NextResponse.json({ data: value });
}

export async function POST(request: Request) {
  const token = cookies().get(ADMIN_COOKIE)?.value;
  if (!validateAdminSession(token)) return failure("No autorizado", 401);

  let body: JsonRecord;
  try {
    body = record(await request.json());
  } catch {
    return failure("Solicitud inválida");
  }

  const action = typeof body.action === "string" ? body.action : "";
  const payload = record(body.payload);
  const supabase = createAdminClient();

  try {
    switch (action) {
      case "stats": {
        const { data: stats, error } = await supabase.rpc("admin_stats");
        if (error) throw error;
        return data(stats);
      }

      case "notifications_mark_read": {
        const ids = Array.isArray(payload.ids)
          ? payload.ids.filter((id): id is string => typeof id === "string")
          : [];
        if (ids.length === 0) return data();
        const { error } = await supabase
          .from("admin_notifications")
          .update({ read: true })
          .in("id", ids);
        if (error) throw error;
        return data();
      }

      case "leads_list": {
        const { data: leads, error } = await supabase
          .from("admin_leads")
          .select("*")
          .order("created_at", { ascending: false });
        if (error) throw error;
        return data(leads ?? []);
      }

      case "lead_save": {
        const lead = record(payload.lead);
        const id = typeof lead.id === "string" ? lead.id : null;
        const values = pick(lead, LEAD_FIELDS);
        if (!values.first_name) return failure("El nombre es requerido");

        const query = id
          ? supabase.from("admin_leads").update(values).eq("id", id)
          : supabase.from("admin_leads").insert(values);
        const { error } = await query;
        if (error) throw error;
        return data();
      }

      case "lead_status": {
        const id = idFrom(payload);
        if (!id || typeof payload.status !== "string") return failure("Datos inválidos");
        const { error } = await supabase
          .from("admin_leads")
          .update({ status: payload.status })
          .eq("id", id);
        if (error) throw error;
        return data();
      }

      case "lead_detail": {
        const id = idFrom(payload);
        if (!id) return failure("Lead inválido");
        const [leadResult, notesResult, tasksResult] = await Promise.all([
          supabase.from("admin_leads").select("*").eq("id", id).single(),
          supabase
            .from("admin_lead_notes")
            .select("*")
            .eq("lead_id", id)
            .order("created_at", { ascending: false }),
          supabase
            .from("admin_lead_tasks")
            .select("*")
            .eq("lead_id", id)
            .order("due_date", { ascending: true }),
        ]);
        if (leadResult.error) throw leadResult.error;
        if (notesResult.error) throw notesResult.error;
        if (tasksResult.error) throw tasksResult.error;
        return data({
          lead: leadResult.data,
          notes: notesResult.data ?? [],
          tasks: tasksResult.data ?? [],
        });
      }

      case "lead_add_note": {
        const id = idFrom(payload, "leadId");
        const note = record(payload.note);
        if (!id || typeof note.body !== "string" || !note.body.trim()) {
          return failure("Nota inválida");
        }
        const { error } = await supabase.from("admin_lead_notes").insert({
          lead_id: id,
          type: typeof note.type === "string" ? note.type : "nota",
          body: note.body.trim(),
        });
        if (error) throw error;
        await supabase
          .from("admin_leads")
          .update({ last_contact_at: new Date().toISOString() })
          .eq("id", id);
        return data();
      }

      case "lead_add_task": {
        const id = idFrom(payload, "leadId");
        if (!id || typeof payload.title !== "string" || !payload.title.trim()) {
          return failure("Tarea inválida");
        }
        const { error } = await supabase.from("admin_lead_tasks").insert({
          lead_id: id,
          title: payload.title.trim(),
        });
        if (error) throw error;
        return data();
      }

      case "lead_task_status": {
        const id = idFrom(payload);
        if (!id || typeof payload.completed !== "boolean") return failure("Tarea inválida");
        const { error } = await supabase
          .from("admin_lead_tasks")
          .update({ completed: payload.completed })
          .eq("id", id);
        if (error) throw error;
        return data();
      }

      case "lead_followup": {
        const id = idFrom(payload);
        if (!id) return failure("Lead inválido");
        const nextFollowup =
          typeof payload.nextFollowup === "string" && payload.nextFollowup
            ? payload.nextFollowup
            : null;
        const { error } = await supabase
          .from("admin_leads")
          .update({ next_followup_at: nextFollowup })
          .eq("id", id);
        if (error) throw error;
        return data();
      }

      case "lead_delete": {
        const id = idFrom(payload);
        if (!id) return failure("Lead inválido");
        const [notesResult, tasksResult] = await Promise.all([
          supabase.from("admin_lead_notes").delete().eq("lead_id", id),
          supabase.from("admin_lead_tasks").delete().eq("lead_id", id),
        ]);
        if (notesResult.error) throw notesResult.error;
        if (tasksResult.error) throw tasksResult.error;
        const { error } = await supabase.from("admin_leads").delete().eq("id", id);
        if (error) throw error;
        return data();
      }

      case "tickets_list": {
        const { data: tickets, error } = await supabase
          .from("admin_tickets")
          .select("*")
          .order("created_at", { ascending: false });
        if (error) throw error;
        return data(tickets ?? []);
      }

      case "ticket_messages": {
        const id = idFrom(payload, "ticketId");
        if (!id) return failure("Ticket inválido");
        const { data: messages, error } = await supabase
          .from("admin_ticket_messages")
          .select("*")
          .eq("ticket_id", id)
          .order("created_at", { ascending: true });
        if (error) throw error;
        return data(messages ?? []);
      }

      case "ticket_reply": {
        const id = idFrom(payload, "ticketId");
        if (!id || typeof payload.body !== "string" || !payload.body.trim()) {
          return failure("Respuesta inválida");
        }
        const { error } = await supabase.from("admin_ticket_messages").insert({
          ticket_id: id,
          sender: "admin",
          body: payload.body.trim(),
        });
        if (error) throw error;
        const { error: ticketError } = await supabase
          .from("admin_tickets")
          .update({ status: "pendiente" })
          .eq("id", id);
        if (ticketError) throw ticketError;
        return data();
      }

      case "ticket_resolve": {
        const id = idFrom(payload, "ticketId");
        if (!id) return failure("Ticket inválido");
        const { error } = await supabase
          .from("admin_tickets")
          .update({ status: "resuelto", resolution: "Resuelto por admin" })
          .eq("id", id);
        if (error) throw error;
        return data();
      }

      case "ticket_create": {
        const ticket = pick(record(payload.ticket), TICKET_FIELDS);
        if (!ticket.subject) return failure("El asunto es requerido");
        const { error } = await supabase.from("admin_tickets").insert(ticket);
        if (error) throw error;
        return data();
      }

      default:
        return failure("Operación no soportada", 404);
    }
  } catch (error) {
    console.error("Admin data error:", action, error);
    return failure("No se pudo completar la operación", 500);
  }
}
