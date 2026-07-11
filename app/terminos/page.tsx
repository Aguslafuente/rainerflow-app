import Link from "next/link";
import { LogoMark } from "@/components/Logo";

export const metadata = {
  title: "Términos y Condiciones — TrainerFlow",
};

export default function TerminosPage() {
  return (
    <div className="legal-wrap">
      <nav className="legal-nav">
        <Link href="/" className="legal-brand">
          <LogoMark size={28} radius={7} />
          <span>Trainer<b>Flow</b></span>
        </Link>
      </nav>

      <article className="legal-content">
        <h1>Términos y Condiciones</h1>
        <p className="legal-updated">Última actualización: julio 2026</p>

        <h2>1. Aceptación</h2>
        <p>
          Al registrarte y usar TrainerFlow aceptás estos términos. Si no estás de acuerdo,
          no uses la plataforma.
        </p>

        <h2>2. Descripción del servicio</h2>
        <p>
          TrainerFlow es una plataforma SaaS que permite a entrenadores personales gestionar
          clientes, rutinas, planes de nutrición, pagos y comunicación. Los clientes de los
          entrenadores acceden a un portal web (PWA) personalizado.
        </p>

        <h2>3. Registro y cuenta</h2>
        <p>
          Para usar TrainerFlow necesitás crear una cuenta con un email válido. Sos responsable
          de mantener la seguridad de tu cuenta y contraseña. TrainerFlow no se hace responsable
          por accesos no autorizados a tu cuenta.
        </p>

        <h2>4. Planes y pagos</h2>
        <p>
          TrainerFlow ofrece planes de suscripción mensual. Los precios están publicados en la
          página de inicio. Nos reservamos el derecho de modificar los precios con un aviso previo
          de 30 días. Los pagos se procesan a través de MercadoPago.
        </p>

        <h2>5. Cobros a clientes</h2>
        <p>
          Los entrenadores pueden cobrar a sus clientes a través de la plataforma usando
          MercadoPago. TrainerFlow cobra una comisión sobre cada transacción según el plan
          contratado. El entrenador es el único responsable de la relación comercial con sus
          clientes.
        </p>

        <h2>6. Datos y contenido</h2>
        <p>
          Los datos que subís a TrainerFlow (rutinas, planes, información de clientes) son de
          tu propiedad. Nos otorgás una licencia limitada para almacenar y procesar esos datos
          con el fin de brindarte el servicio. Podés exportar o eliminar tus datos en cualquier
          momento.
        </p>

        <h2>7. Uso aceptable</h2>
        <p>Te comprometés a no:</p>
        <ul>
          <li>Usar la plataforma para actividades ilegales</li>
          <li>Compartir contenido que infrinja derechos de terceros</li>
          <li>Intentar acceder a cuentas de otros usuarios</li>
          <li>Hacer ingeniería inversa del software</li>
          <li>Usar bots o scripts automatizados sin autorización</li>
        </ul>

        <h2>8. Disponibilidad</h2>
        <p>
          Hacemos nuestro mejor esfuerzo para mantener la plataforma disponible 24/7, pero no
          garantizamos disponibilidad ininterrumpida. Podemos realizar mantenimientos programados
          con aviso previo.
        </p>

        <h2>9. Cancelación</h2>
        <p>
          Podés cancelar tu suscripción en cualquier momento desde la configuración de tu cuenta.
          Seguís teniendo acceso hasta el final del período ya facturado. No se realizan reembolsos
          por períodos parciales.
        </p>

        <h2>10. Limitación de responsabilidad</h2>
        <p>
          TrainerFlow se proporciona &ldquo;tal cual&rdquo;. No nos hacemos responsables por
          pérdidas indirectas, lucro cesante, o daños derivados del uso de la plataforma. Nuestra
          responsabilidad máxima se limita al monto que hayas pagado en los últimos 3 meses.
        </p>

        <h2>11. Modificaciones</h2>
        <p>
          Podemos modificar estos términos. Te notificaremos por email sobre cambios significativos
          con al menos 15 días de anticipación. El uso continuado de la plataforma después de los
          cambios implica aceptación.
        </p>

        <h2>12. Jurisdicción</h2>
        <p>
          Estos términos se rigen por las leyes de la República Oriental del Uruguay. Cualquier
          disputa se resolverá ante los tribunales competentes de Montevideo.
        </p>

        <h2>13. Contacto</h2>
        <p>
          Para consultas sobre estos términos, escribinos a{" "}
          <a href="mailto:soporte@trainerflow.com">soporte@trainerflow.com</a>.
        </p>
      </article>

      <footer className="legal-footer">
        <Link href="/">← Volver al inicio</Link>
        <Link href="/privacidad">Política de privacidad</Link>
      </footer>
    </div>
  );
}
