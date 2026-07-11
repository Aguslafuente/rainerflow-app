import Link from "next/link";
import { LogoMark } from "@/components/Logo";

export default function PagoPendiente() {
  return (
    <div className="pago-result">
      <LogoMark size={54} radius={14} />
      <div className="pago-emoji" style={{ color: "var(--amber)" }}>
        ⏳
      </div>
      <h1>Pago en proceso</h1>
      <p>
        Tu pago quedó pendiente de acreditación. Cuando MercadoPago lo confirme,
        se registra solo. Podés cerrar esta ventana.
      </p>
      <Link href="/portal" className="btn btn-ghost" style={{ width: "auto" }}>
        Volver
      </Link>
    </div>
  );
}
