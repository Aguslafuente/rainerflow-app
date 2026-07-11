"use client";

import Link from "next/link";
import { LogoMark } from "@/components/Logo";
import { useEffect, useRef, useState } from "react";

/* ── FAQ data ── */
const faqs = [
  {
    q: "¿Necesito tarjeta de crédito para registrarme?",
    a: "No. Creás tu cuenta gratis y podés explorar la plataforma sin ingresar datos de pago. Solo pagás cuando estés listo.",
  },
  {
    q: "¿Cómo cobro a mis clientes?",
    a: "TrainerFlow se integra con MercadoPago. Tus clientes pagan directamente desde su portal y el dinero va a tu cuenta. Vos solo configurás el monto.",
  },
  {
    q: "¿Mis clientes necesitan descargar una app?",
    a: "No. Los clientes acceden desde el navegador de su celular como una app (PWA). No necesitan descargar nada del App Store.",
  },
  {
    q: "¿Puedo migrar mis clientes actuales?",
    a: "Sí. Podés cargar clientes manualmente o invitarlos por link. Ellos crean su cuenta y ya tienen acceso a su portal personalizado.",
  },
  {
    q: "¿Qué incluye el plan Team?",
    a: "Todo lo del plan Pro más: hasta 5 entrenadores bajo un mismo gimnasio, panel de administración, métricas consolidadas, asignación de clientes entre trainers y branding personalizado del gimnasio.",
  },
  {
    q: "¿Puedo cancelar en cualquier momento?",
    a: "Sí, sin compromiso. Podés cancelar tu suscripción cuando quieras y seguís teniendo acceso hasta el fin del período facturado.",
  },
];

/* ── FAQ Accordion Item ── */
function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`home-faq-item ${open ? "home-faq-open" : ""}`}>
      <button className="home-faq-trigger" onClick={() => setOpen(!open)}>
        <span>{q}</span>
        <svg
          viewBox="0 0 24 24"
          width="20"
          height="20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={`home-faq-chevron ${open ? "home-faq-chevron-open" : ""}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      <div className={`home-faq-body ${open ? "home-faq-body-open" : ""}`}>
        <p>{a}</p>
      </div>
    </div>
  );
}

/* ── Scroll animation hook ── */
function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("home-visible");
          observer.unobserve(el);
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return ref;
}

function Reveal({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useScrollReveal();
  return (
    <div ref={ref} className={`home-reveal ${className}`}>
      {children}
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="home-wrap">
      {/* Background effects */}
      <div className="home-glow home-glow-1" />
      <div className="home-glow home-glow-2" />
      <div className="home-glow home-glow-3" />
      <div className="home-grid" />

      {/* ── Nav ── */}
      <nav className="home-nav">
        <div className="home-nav-inner">
          <div className="home-nav-brand">
            <LogoMark size={32} radius={8} />
            <span className="home-nav-name">
              Trainer<span className="home-nav-accent">Flow</span>
            </span>
          </div>
          <div className="home-nav-links">
            <a href="#features">Funciones</a>
            <a href="#pricing">Precios</a>
            <a href="#faq">FAQ</a>
          </div>
          <div className="home-nav-actions">
            <Link href="/login" className="home-btn-ghost">
              Iniciar sesión
            </Link>
            <Link href="/login" className="home-btn-primary">
              Empezar gratis
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="home-hero">
        <div className="home-badge">
          <span className="home-badge-dot" />
          Plataforma para entrenadores en Uruguay
        </div>
        <h1 className="home-h1">
          Tu negocio de
          <br />
          entrenamiento,{" "}
          <span className="home-gradient-text">todo en uno</span>
        </h1>
        <p className="home-subtitle">
          Gestioná clientes, rutinas, nutrición, pagos y progreso desde una sola
          plataforma. Profesionalizá tu servicio y ahorrá horas cada semana.
        </p>
        <div className="home-hero-actions">
          <Link href="/login" className="home-btn-primary home-btn-lg">
            Crear cuenta gratis
            <svg viewBox="0 0 20 20" width="18" height="18" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z"
              />
            </svg>
          </Link>
          <a href="#features" className="home-btn-ghost home-btn-lg">
            Ver funciones
          </a>
        </div>
        <p className="home-hero-note">
          Sin tarjeta de crédito · Configurás en 5 minutos
        </p>
      </section>

      {/* ── Preview mockup ── */}
      <section className="home-preview">
        <div className="home-preview-window">
          <div className="home-preview-topbar">
            <div className="home-preview-dots">
              <span />
              <span />
              <span />
            </div>
            <span className="home-preview-url">trainerflow-uy.netlify.app</span>
          </div>
          <div className="home-preview-content">
            <div className="home-preview-sidebar">
              <div className="home-preview-sidebar-item active" />
              <div className="home-preview-sidebar-item" />
              <div className="home-preview-sidebar-item" />
              <div className="home-preview-sidebar-item" />
              <div className="home-preview-sidebar-item" />
            </div>
            <div className="home-preview-main">
              <div className="home-preview-kpi-row">
                <div className="home-preview-kpi">
                  <div className="home-preview-kpi-label">Clientes</div>
                  <div className="home-preview-kpi-value">24</div>
                </div>
                <div className="home-preview-kpi">
                  <div className="home-preview-kpi-label">Ingresos</div>
                  <div className="home-preview-kpi-value">$48k</div>
                </div>
                <div className="home-preview-kpi">
                  <div className="home-preview-kpi-label">Retención</div>
                  <div className="home-preview-kpi-value">92%</div>
                </div>
              </div>
              <div className="home-preview-chart" />
              <div className="home-preview-table">
                <div className="home-preview-row" />
                <div className="home-preview-row" />
                <div className="home-preview-row" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats / Social proof ── */}
      <Reveal>
        <section className="home-stats">
          <div className="home-stats-grid">
            <div className="home-stat">
              <span className="home-stat-number">100+</span>
              <span className="home-stat-label">Clientes gestionados</span>
            </div>
            <div className="home-stat-divider" />
            <div className="home-stat">
              <span className="home-stat-number">400+</span>
              <span className="home-stat-label">Rutinas creadas</span>
            </div>
            <div className="home-stat-divider" />
            <div className="home-stat">
              <span className="home-stat-number">95%</span>
              <span className="home-stat-label">Satisfacción</span>
            </div>
            <div className="home-stat-divider" />
            <div className="home-stat">
              <span className="home-stat-number">10h</span>
              <span className="home-stat-label">Ahorradas por semana</span>
            </div>
          </div>
        </section>
      </Reveal>

      {/* ── Features ── */}
      <Reveal>
        <section className="home-section" id="features">
          <div className="home-section-header">
            <span className="home-section-tag">Funciones</span>
            <h2 className="home-h2">
              Todo lo que necesitás para{" "}
              <span className="home-gradient-text">escalar tu negocio</span>
            </h2>
            <p className="home-section-sub">
              Dejá de usar 5 apps distintas. TrainerFlow integra todo en un solo
              lugar.
            </p>
          </div>

          <div className="home-features-grid">
            <div className="home-feature-card">
              <div className="home-feature-icon">
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <h3>Gestión de clientes</h3>
              <p>Fichas completas con datos, mediciones, historial de pagos y comunicación directa por chat.</p>
            </div>

            <div className="home-feature-card">
              <div className="home-feature-icon">
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                </svg>
              </div>
              <h3>Rutinas personalizadas</h3>
              <p>Creá rutinas con ejercicios, series, repeticiones y videos. Asignalas a cada cliente en segundos.</p>
            </div>

            <div className="home-feature-card">
              <div className="home-feature-icon">
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 20V10" /><path d="M12 20V4" /><path d="M6 20v-6" />
                </svg>
              </div>
              <h3>Progreso visual</h3>
              <p>Gráficos de peso, mediciones y fotos de progreso. Tu cliente ve sus avances en tiempo real.</p>
            </div>

            <div className="home-feature-card">
              <div className="home-feature-icon">
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2a10 10 0 1 0 10 10H12V2z" />
                  <path d="M20.66 15.47A10 10 0 0 0 15.47 20.66" />
                </svg>
              </div>
              <h3>Plan nutricional</h3>
              <p>Definí macros y comidas para cada cliente. El cliente ve su plan completo desde su portal.</p>
            </div>

            <div className="home-feature-card">
              <div className="home-feature-icon">
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                  <line x1="1" y1="10" x2="23" y2="10" />
                </svg>
              </div>
              <h3>Cobros con MercadoPago</h3>
              <p>Tus clientes pagan desde su portal. El dinero va directo a tu cuenta. Todo automático.</p>
            </div>

            <div className="home-feature-card">
              <div className="home-feature-icon">
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                </svg>
              </div>
              <h3>Landing pública</h3>
              <p>Tu página profesional con servicios y WhatsApp. Compartila en redes y conseguí nuevos clientes.</p>
            </div>
          </div>
        </section>
      </Reveal>

      {/* ── How it works ── */}
      <Reveal>
        <section className="home-section">
          <div className="home-section-header">
            <span className="home-section-tag">Cómo funciona</span>
            <h2 className="home-h2">Arrancá en 3 pasos</h2>
          </div>

          <div className="home-steps">
            <div className="home-step">
              <div className="home-step-number">1</div>
              <h3>Creá tu cuenta</h3>
              <p>Registrate gratis en 2 minutos. No necesitás tarjeta.</p>
            </div>
            <div className="home-step-line" />
            <div className="home-step">
              <div className="home-step-number">2</div>
              <h3>Cargá tus clientes</h3>
              <p>Agregá clientes e invitalos. Ellos acceden a su portal personal.</p>
            </div>
            <div className="home-step-line" />
            <div className="home-step">
              <div className="home-step-number">3</div>
              <h3>Gestioná todo</h3>
              <p>Rutinas, nutrición, pagos y progreso. Todo desde un solo lugar.</p>
            </div>
          </div>
        </section>
      </Reveal>

      {/* ── Testimonials ── */}
      <Reveal>
        <section className="home-section" id="testimonials">
          <div className="home-section-header">
            <span className="home-section-tag">Testimonios</span>
            <h2 className="home-h2">
              Lo que dicen los{" "}
              <span className="home-gradient-text">entrenadores</span>
            </h2>
          </div>

          <div className="home-testimonials-grid">
            <div className="home-testimonial-card">
              <div className="home-testimonial-stars">★★★★★</div>
              <p className="home-testimonial-quote">
                &ldquo;Antes usaba WhatsApp, Excel y una app de pagos. Ahora
                todo está en TrainerFlow. Mis clientes notan la diferencia y yo
                ahorro horas por semana.&rdquo;
              </p>
              <div className="home-testimonial-author">
                <div className="home-testimonial-avatar">MR</div>
                <div>
                  <div className="home-testimonial-name">Martín Rodríguez</div>
                  <div className="home-testimonial-role">
                    Personal Trainer · Montevideo
                  </div>
                </div>
              </div>
            </div>

            <div className="home-testimonial-card">
              <div className="home-testimonial-stars">★★★★★</div>
              <p className="home-testimonial-quote">
                &ldquo;El portal del cliente es increíble. Mis alumnos ven sus
                rutinas, su progreso y pagan todo desde el celular. Super
                profesional.&rdquo;
              </p>
              <div className="home-testimonial-author">
                <div className="home-testimonial-avatar">LS</div>
                <div>
                  <div className="home-testimonial-name">Lucía Silva</div>
                  <div className="home-testimonial-role">
                    Coach de fuerza · Punta del Este
                  </div>
                </div>
              </div>
            </div>

            <div className="home-testimonial-card">
              <div className="home-testimonial-stars">★★★★★</div>
              <p className="home-testimonial-quote">
                &ldquo;Pasé de tener todo en la cabeza a tener un negocio
                organizado. La landing pública me trajo 8 clientes nuevos en el
                primer mes.&rdquo;
              </p>
              <div className="home-testimonial-author">
                <div className="home-testimonial-avatar">DF</div>
                <div>
                  <div className="home-testimonial-name">Diego Fernández</div>
                  <div className="home-testimonial-role">
                    Entrenador funcional · Maldonado
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </Reveal>

      {/* ── Pricing ── */}
      <Reveal>
        <section className="home-section" id="pricing">
          <div className="home-section-header">
            <span className="home-section-tag">Precios</span>
            <h2 className="home-h2">Simple y transparente</h2>
            <p className="home-section-sub">
              Elegí el plan que se adapta a tu negocio. Sin sorpresas.
            </p>
          </div>

          <div className="home-pricing-grid">
            {/* Plan Pro */}
            <div className="home-pricing-card">
              <div className="home-pricing-header">
                <span className="home-pricing-badge">Pro</span>
                <p className="home-pricing-desc">Para entrenadores independientes</p>
                <div className="home-pricing-price">
                  <span className="home-pricing-currency">USD</span>
                  <span className="home-pricing-amount">19.99</span>
                  <span className="home-pricing-period">/mes</span>
                </div>
              </div>

              <ul className="home-pricing-features">
                <li><span className="home-check">✓</span> Clientes ilimitados</li>
                <li><span className="home-check">✓</span> Rutinas con videos</li>
                <li><span className="home-check">✓</span> Plan nutricional</li>
                <li><span className="home-check">✓</span> Seguimiento de progreso</li>
                <li><span className="home-check">✓</span> Chat con clientes</li>
                <li><span className="home-check">✓</span> Cobros con MercadoPago</li>
                <li><span className="home-check">✓</span> Landing pública</li>
                <li><span className="home-check">✓</span> Portal del cliente (PWA)</li>
              </ul>

              <Link href="/login" className="home-btn-primary home-btn-lg" style={{ width: "100%", justifyContent: "center" }}>
                Empezar ahora
              </Link>
              <p className="home-pricing-note">5% de comisión en cobros vía MercadoPago</p>
            </div>

            {/* Plan Team */}
            <div className="home-pricing-card home-pricing-featured">
              <div className="home-pricing-popular">Más popular</div>
              <div className="home-pricing-header">
                <span className="home-pricing-badge home-pricing-badge-team">Team</span>
                <p className="home-pricing-desc">Para gimnasios y equipos de trainers</p>
                <div className="home-pricing-price">
                  <span className="home-pricing-currency">USD</span>
                  <span className="home-pricing-amount">49.99</span>
                  <span className="home-pricing-period">/mes</span>
                </div>
              </div>

              <ul className="home-pricing-features">
                <li><span className="home-check">✓</span> Todo lo del plan Pro</li>
                <li><span className="home-check home-check-team">✓</span> Hasta 5 entrenadores</li>
                <li><span className="home-check home-check-team">✓</span> Panel del gimnasio</li>
                <li><span className="home-check home-check-team">✓</span> Métricas consolidadas</li>
                <li><span className="home-check home-check-team">✓</span> Asignación de clientes</li>
                <li><span className="home-check home-check-team">✓</span> Marca del gimnasio en portal</li>
                <li><span className="home-check home-check-team">✓</span> Soporte prioritario</li>
                <li><span className="home-check home-check-team">✓</span> Comisión reducida: 3%</li>
              </ul>

              <Link href="/login" className="home-btn-primary home-btn-lg home-btn-team" style={{ width: "100%", justifyContent: "center" }}>
                Empezar con Team
              </Link>
              <p className="home-pricing-note">3% de comisión en cobros vía MercadoPago</p>
            </div>
          </div>
        </section>
      </Reveal>

      {/* ── FAQ ── */}
      <Reveal>
        <section className="home-section" id="faq">
          <div className="home-section-header">
            <span className="home-section-tag">Preguntas frecuentes</span>
            <h2 className="home-h2">¿Tenés dudas?</h2>
            <p className="home-section-sub">
              Acá respondemos las consultas más comunes.
            </p>
          </div>

          <div className="home-faq-list">
            {faqs.map((f, i) => (
              <FaqItem key={i} q={f.q} a={f.a} />
            ))}
          </div>
        </section>
      </Reveal>

      {/* ── Final CTA ── */}
      <section className="home-cta-section">
        <div className="home-cta-glow" />
        <h2 className="home-h2">
          Llevá tu negocio al{" "}
          <span className="home-gradient-text">siguiente nivel</span>
        </h2>
        <p className="home-subtitle" style={{ maxWidth: 500 }}>
          Únite a los entrenadores que ya profesionalizaron su servicio con
          TrainerFlow.
        </p>
        <Link href="/login" className="home-btn-primary home-btn-xl">
          Crear cuenta gratis
          <svg viewBox="0 0 20 20" width="20" height="20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z"
            />
          </svg>
        </Link>
      </section>

      {/* ── Footer ── */}
      <footer className="home-footer">
        <div className="home-footer-inner">
          <div className="home-footer-brand">
            <LogoMark size={24} radius={6} />
            <span>TrainerFlow</span>
          </div>
          <div className="home-footer-links">
            <a href="#features">Funciones</a>
            <a href="#pricing">Precios</a>
            <a href="#faq">FAQ</a>
            <a href="#testimonials">Testimonios</a>
          </div>
          <div className="home-footer-links">
            <Link href="/terminos">Términos</Link>
            <Link href="/privacidad">Privacidad</Link>
          </div>
          <span className="home-footer-copy">
            © {new Date().getFullYear()} TrainerFlow · Hecho en Uruguay
          </span>
        </div>
      </footer>
    </div>
  );
}
