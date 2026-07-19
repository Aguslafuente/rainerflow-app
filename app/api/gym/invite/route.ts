import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { transporter, emailFrom } from "@/lib/email/transporter";

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL || "https://trainerflow-uy.netlify.app";

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autorizado." }, { status: 401 });
    }

    // Verify user is a gym owner
    const { data: gym } = await supabase
      .from("gyms")
      .select("id, name")
      .eq("owner_id", user.id)
      .single();

    if (!gym) {
      return NextResponse.json({ error: "No sos dueño de un gimnasio." }, { status: 403 });
    }

    const { email } = await request.json();
    if (!email) {
      return NextResponse.json({ error: "Email requerido." }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if already invited
    const { data: existing } = await supabase
      .from("gym_trainers")
      .select("id, status")
      .eq("gym_id", gym.id)
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (existing && existing.status !== "removed") {
      return NextResponse.json(
        { error: existing.status === "active" ? "Este entrenador ya está en tu gym." : "Ya hay una invitación pendiente para este email." },
        { status: 400 }
      );
    }

    // Check if the email belongs to an existing trainer
    const supabaseAdmin = createAdminClient();
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(
      (u) => u.email?.toLowerCase() === normalizedEmail
    );

    // Create or update gym_trainer record
    if (existing) {
      await supabase
        .from("gym_trainers")
        .update({ status: "pending", invited_at: new Date().toISOString(), trainer_id: existingUser?.id || null })
        .eq("id", existing.id);
    } else {
      await supabase.from("gym_trainers").insert({
        gym_id: gym.id,
        email: normalizedEmail,
        trainer_id: existingUser?.id || null,
        status: "pending",
      });
    }

    // Send invitation email
    const acceptUrl = `${APP_URL}/aceptar-gym?gym=${gym.id}&email=${encodeURIComponent(normalizedEmail)}`;

    await transporter.sendMail({
      from: emailFrom,
      to: normalizedEmail,
      subject: `${gym.name} te invita a TrainerFlow`,
      html: `
        <div style="font-family:Inter,Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#13131a;color:#e0e0e0;border-radius:12px;">
          <div style="text-align:center;margin-bottom:24px;">
            <div style="display:inline-block;background:#7c6cf0;color:#fff;font-weight:800;font-size:20px;padding:10px 18px;border-radius:10px;">TF</div>
          </div>
          <h2 style="color:#fff;text-align:center;margin-bottom:8px;">Te invitaron a ${gym.name}</h2>
          <p style="color:#a0a0a0;text-align:center;font-size:14px;margin-bottom:24px;">
            ${gym.name} quiere que te unas como entrenador en TrainerFlow.
          </p>
          <div style="text-align:center;margin-bottom:24px;">
            <a href="${acceptUrl}" style="display:inline-block;background:#7c6cf0;color:#fff;font-weight:600;padding:12px 32px;border-radius:8px;text-decoration:none;font-size:15px;">
              Aceptar invitación
            </a>
          </div>
          <p style="color:#666;font-size:12px;text-align:center;">
            Si no conocés este gimnasio, ignorá este mensaje.
          </p>
        </div>
      `,
    });

    return NextResponse.json({ message: "Invitación enviada." });
  } catch (err) {
    console.error("Gym invite error:", err);
    return NextResponse.json({ error: "Error al enviar la invitación." }, { status: 500 });
  }
}
