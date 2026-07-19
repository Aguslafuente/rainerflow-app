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
  if (!entityId || !["trainer", "client"].includes(role)) {
    return NextResponse.json({ error: "Invalid target" }, { status: 400 });
  }
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "File too large" }, { status: 413 });
  }

  const extensions: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
  };
  const ext = extensions[file.type];
  if (!ext) {
    return NextResponse.json({ error: "Unsupported image type" }, { status: 415 });
  }

  if (role === "trainer" && entityId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (role === "client") {
    const { data: client } = await supabase
      .from("clients")
      .select("trainer_id, user_id")
      .eq("id", entityId)
      .maybeSingle();
    if (!client || (client.trainer_id !== user.id && client.user_id !== user.id)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const path = `avatars/${entityId}.${ext}`;

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
  let updateError;
  if (role === "trainer") {
    const { error } = await supabase
      .from("profiles")
      .update({ avatar_url: url })
      .eq("id", entityId);
    updateError = error;
  } else {
    const { error } = await supabase
      .from("clients")
      .update({ avatar_url: url })
      .eq("id", entityId);
    updateError = error;
  }

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ url });
}
