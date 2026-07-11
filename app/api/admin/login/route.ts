import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const ADMIN_EMAIL = "admin@admin.com";
const ADMIN_PASSWORD = "Agustin10";
const ADMIN_TOKEN = "tf-admin-" + Buffer.from(ADMIN_EMAIL + ADMIN_PASSWORD).toString("base64");

export async function POST(req: NextRequest) {
  const body = await req.json();

  if (body.email === ADMIN_EMAIL && body.password === ADMIN_PASSWORD) {
    const cookieStore = cookies();
    cookieStore.set("tf_admin", ADMIN_TOKEN, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
}
