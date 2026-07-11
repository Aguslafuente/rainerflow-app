import Link from "next/link";
import { LogoMark } from "@/components/Logo";

export default function PagoExito() {
  return (
    <div className="pago-result">
      <LogoMark size={54} radius={14} />
      <div className="pago-emoji" style={{ color: "var(--green)" }}>
        ✓
      </div>
      <h1>¡Pago recibido!</h1>
      <p>
        Tu cuota se registró correctamente. Ya podés cerrar esta ventana. ¡Gracias!
      </p>
      <Link href="/portal" className="btn btn-primary" style={{ width: "auto" }}>
        Ir a mi espacio
      </Link>
    </div>
  );
}
