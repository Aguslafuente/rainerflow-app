const MESES = [
  "ene", "feb", "mar", "abr", "may", "jun",
  "jul", "ago", "sep", "oct", "nov", "dic",
];

export function currentPeriod(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function periodLabel(p: string | null | undefined): string {
  if (!p) return "—";
  const [y, m] = p.split("-").map(Number);
  if (!y || !m) return p;
  return `${MESES[m - 1]} ${y}`;
}

export function fmtMoney(amount: number, currency: string = "UYU"): string {
  try {
    return new Intl.NumberFormat("es-UY", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${Math.round(amount)}`;
  }
}

export const METHOD_LABELS: Record<string, string> = {
  efectivo: "Efectivo",
  transferencia: "Transferencia",
  mercadopago: "MercadoPago",
  abitab: "Abitab",
  redpagos: "Red Pagos",
  otro: "Otro",
};

export const APPT_STATUS: Record<string, string> = {
  programado: "Programado",
  completado: "Completado",
  cancelado: "Cancelado",
  ausente: "No asistió",
};

// Fechas: guardamos y mostramos en UTC para que la hora que carga el
// entrenador se vea igual (sin corrimientos de zona horaria).
export function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("es-UY", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  });
}

export function fmtDayLabel(iso: string): string {
  return new Date(iso).toLocaleDateString("es-UY", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });
}

export function dayKey(iso: string): string {
  return new Date(iso).toISOString().slice(0, 10);
}

// Normaliza el valor de un input datetime-local a un ISO en UTC.
export function toUtcIso(datetimeLocal: string): string {
  let v = datetimeLocal.trim();
  if (!v) return v;
  if (v.length === 16) v += ":00"; // agrega segundos si faltan
  return v + "Z";
}

export function waLink(phone: string, message: string): string {
  const digits = phone.replace(/[^0-9]/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
