import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_COOKIE,
  createAdminSessionToken,
  isAdminConfigured,
  validateAdminCredentials,
} from "@/lib/admin-auth";

const attempts = new Map<string, { count: number; resetAt: number }>();
const RATE_WINDOW = 10 * 60 * 1000;
const RATE_MAX = 8;

function isRateLimited(key: string) {
  const now = Date.now();
  const current = attempts.get(key);
  if (!current || current.resetAt <= now) {
    attempts.set(key, { count: 1, resetAt: now + RATE_WINDOW });
    return false;
  }
  current.count += 1;
  return current.count > RATE_MAX;
}

export async function POST(req: NextRequest) {
  if (!isAdminConfigured()) {
    return NextResponse.json(
      { error: "Admin authentication is not configured" },
      { status: 503 }
    );
  }

  const key = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (isRateLimited(key)) {
    return NextResponse.json({ error: "Too many attempts" }, { status: 429 });
  }

  const body = await req.json().catch(() => ({}));
  const email = typeof body.email === "string" ? body.email : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (validateAdminCredentials(email, password)) {
    const res = NextResponse.json({ ok: true });
    res.cookies.set(ADMIN_COOKIE, createAdminSessionToken(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 12,
    });
    return res;
  }

  return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
  return response;
}
