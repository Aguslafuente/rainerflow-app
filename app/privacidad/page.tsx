import Link from "next/link";
import { LogoMark } from "@/components/Logo";

export const metadata = {
  title: "Política de Privacidad — TrainerFlow",
};

export default function PrivacidadPage() {
  return (
    <div className="legal-wrap">
      <nav className="legal-nav">
        <Link href="/" className="legal-brand">
          <LogoMark size={28} radius={7} />
          <span>Trainer<b>Flow</b></span>
        </Link>
      </nav>

      <article className="legal-content">
        <h1>Política de Privacidad</h1>
        <p className="legal-updated">Última actualización: julio 2026</p>

        <h2>1. Información que recopilamos</h2>
        <p>Recopilamos la siguiente información cuando usás TrainerFlow:</p>
        <ul>
          <li><strong>Datos de cuenta:</strong> nombre, email, contraseña (encriptada)</li>
          <li><strong>Datos de perfil del entrenador:</strong> nombre del negocio, teléfono, especialidades</li>
          <li><strong>Datos de clientes:</strong> nombre, contacto, objetivos, mediciones corporales, historial de entrenamientos</li>
          <li><strong>Datos de uso:</strong> páginas visitadas, acciones realizadas dentro de la plataforma</li>
          <li><strong>Datos de pago:</strong> procesados por MercadoPago; TrainerFlow no almacena datos de tarjetas</li>
        </ul>

        <h2>2. Cómo usamos tu información</h2>
        <p>Usamos tus datos para:</p>
        <ul>
          <li>Brindarte el servicio de gestión de clientes y entrenamiento</li>
          <li>Procesar pagos y suscripciones</li>
          <li>Enviarte comunicaciones sobre tu cuenta</li>
          <li>Mejorar la plataforma y corregir errores</li>
          <li>Cumplir con obligaciones legales</li>
        </ul>

        <h2>3. Compartir información</h2>
        <p>No vendemos ni compartimos tus datos con terceros, excepto:</p>
        <ul>
          <li><strong>MercadoPago:</strong> para procesar pagos</li>
          <li><strong>Supabase:</strong> como proveedor de infraestructura (almacenamiento de datos)</li>
          <li><strong>Netlify:</strong> como proveedor de hosting</li>
          <li><strong>Obligaciones legales:</strong> si la ley lo requiere</li>
        </ul>

        <h2>4. Datos de los clientes del entrenador</h2>
        <p>
          Los entrenadores son responsables de obtener el consentimiento de sus clientes para
          almacenar sus datos en TrainerFlow. Los clientes pueden solicitar la eliminación de
          sus datos contactando a su entrenador o directamente a TrainerFlow.
        </p>

        <h2>5. Seguridad</h2>
        <p>
          Implementamos medidas de seguridad estándar de la industria: encriptación en tránsito
          (HTTPS/TLS), contraseñas hasheadas, autenticación segura, y políticas de acceso a
          nivel de fila (RLS) en la base de datos para que cada entrenador solo acceda a sus
          propios datos.
        </p>

        <h2>6. Retención de datos</h2>
        <p>
          Conservamos tus datos mientras tu cuenta esté activa. Si cancelás tu cuenta, eliminamos
          tus datos dentro de los 90 días siguientes, salvo que la ley requiera conservarlos por
          más tiempo.
        </p>

        <h2>7. Tus derechos</h2>
        <p>Tenés derecho a:</p>
        <ul>
          <li>Acceder a tus datos personales</li>
          <li>Corregir datos incorrectos</li>
          <li>Solicitar la eliminación de tus datos</li>
          <li>Exportar tus datos en un formato estándar</li>
          <li>Oponerte al procesamiento de tus datos</li>
        </ul>
        <p>
          Para ejercer estos derechos, contactanos a{" "}
          <a href="mailto:soporte@trainerflow.com">soporte@trainerflow.com</a>.
        </p>

        <h2>8. Cookies</h2>
        <p>
          TrainerFlow usa cookies esenciales para mantener tu sesión activa. No usamos cookies
          de tracking ni de publicidad.
        </p>

        <h2>9. Menores de edad</h2>
        <p>
          TrainerFlow no está dirigido a menores de 18 años. No recopilamos intencionalmente
          información de menores. Si un entrenador trabaja con clientes menores de edad, es
          responsable de obtener el consentimiento de los padres o tutores.
        </p>

        <h2>10. Cambios</h2>
        <p>
          Podemos actualizar esta política. Te notificaremos sobre cambios significativos por
          email. La fecha de última actualización se indica al inicio de este documento.
        </p>

        <h2>11. Contacto</h2>
        <p>
          Para consultas sobre privacidad, escribinos a{" "}
          <a href="mailto:soporte@trainerflow.com">soporte@trainerflow.com</a>.
        </p>
      </article>

      <footer className="legal-footer">
        <Link href="/">← Volver al inicio</Link>
        <Link href="/terminos">Términos y condiciones</Link>
      </footer>
    </div>
  );
}
