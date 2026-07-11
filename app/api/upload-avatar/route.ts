import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No auth" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("avatar") as File | null;
  const role = formData.get("role") as string; // "trainer" | "client"
  const entityId = formData.get("entityId") as string; // profile id or client id

  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

  const ext = file.name.split(".").pop() || "jpg";
  const path = `${entityId}.${ext}`;

  // Upload (upsert)
  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, file, { upsert: true, contentType: file.type });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("avatars").getPublicUrl(path);

  // Add cache-busting param
  const url = `${publicUrl}?v=${Date.now()}`;

  // Update the correct table
  if (role === "trainer") {
    await supabase.from("profiles").update({ avatar_url: url }).eq("id", entityId);
  } else {
    await supabase.from("clients").update({ avatar_url: url }).eq("id", entityId);
  }

  return NextResponse.json({ url });
}
