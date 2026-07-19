"use client";

type AdminPayload = Record<string, unknown>;

export async function adminRequest<T = unknown>(
  action: string,
  payload: AdminPayload = {}
): Promise<T> {
  const response = await fetch("/api/admin/data", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, payload }),
  });

  if (response.status === 401) {
    window.location.assign("/admin/login");
    throw new Error("Sesión de administrador vencida");
  }

  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(result.error || "No se pudo completar la operación");
  }

  return result.data as T;
}

export function loadAdminStats<T = unknown>() {
  return adminRequest<T>("stats");
}
