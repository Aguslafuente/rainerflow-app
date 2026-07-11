import Link from "next/link";
import { LogoMark } from "@/components/Logo";

export default function PagoError() {
  return (
    <div className="pago-result">
      <LogoMark size={54} radius={14} />
      <div className="pago-emoji" style={{ color: "var(--red)" }}>
        ✕
      </div>
      <h1>No se pudo completar el pago</h1>
      <p>
        El pago no se procesó. Podés volver a intentarlo o hablar con tu
        entrenador.
      </p>
      <Link href="/portal" className="btn btn-ghost" style={{ width: "auto" }}>
        Volver
      </Link>
    </div>
  );
}
