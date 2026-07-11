"use client";

import { useState } from "react";

const GUIDES: Record<string, { title: string; steps: string[] }> = {
  dashboard: {
    title: "Dashboard",
    steps: [
      "Este es tu panel principal. Acá ves un resumen de todo lo que pasa con tu negocio.",
      "Los KPIs de arriba muestran clientes activos, ingresos del mes, pagos pendientes y próximas citas.",
      "Las alertas te avisan sobre cobros vencidos, clientes sin rutina, y citas del día.",
      "Hacé click en cualquier alerta para ir directo a resolverla.",
    ],
  },
  clientes: {
    title: "Clientes",
    steps: [
      "Acá gestionás todos tus clientes. Podés ver su estado, plan y datos de contacto.",
      "Usá '+ Nuevo cliente' para agregar un cliente. Después podés enviarle una invitación por WhatsApp.",
      "Hacé click en un cliente para ver su ficha completa: rutinas, nutrición, progreso, hábitos y chat.",
      "Cada cliente tiene pestañas: General, Nutrición, Progreso, Hábitos, Revisiones y Chat.",
    ],
  },
  "cliente-detalle": {
    title: "Ficha del Cliente",
    steps: [
      "Esta es la ficha completa del cliente. Navegá entre las pestañas para ver toda su información.",
      "En 'General' ves y editás los datos personales, objetivo y cuota mensual.",
      "Podés enviarle la invitación al portal por WhatsApp para que acceda a su plan.",
    ],
  },
  nutricion: {
    title: "Plan de Nutrición",
    steps: [
      "Acá armás el plan nutricional del cliente. Podés tener planes distintos para días de entreno y descanso.",
      "Primero configurá los objetivos de macros (proteína, carbos, grasas, calorías) en la sección de abajo.",
      "Agregá comidas (Desayuno, Almuerzo, etc.) y después buscá alimentos dentro de cada comida.",
      "Al buscar un alimento, seleccionalo de la lista y ajustá la cantidad. Los macros se calculan automáticamente.",
      "Por ejemplo: buscá 'pollo', seleccioná 'PECHUGA DE POLLO', poné 250 y te calcula 55.5P, 15.5G, 0C, 361.5kcal.",
      "La barra de arriba te muestra cuánto falta para llegar al objetivo de cada macro.",
    ],
  },
  rutinas: {
    title: "Rutinas",
    steps: [
      "Acá creás y gestionás las plantillas de rutinas de entrenamiento.",
      "Usá '+ Nueva rutina' para crear una. Podés organizar ejercicios por día (Día A, Día B, etc.).",
      "Cada ejercicio tiene series, repeticiones, RIR, descanso y peso sugerido.",
      "Una vez creada, podés asignar la rutina a uno o varios clientes desde su ficha.",
    ],
  },
  ejercicios: {
    title: "Ejercicios",
    steps: [
      "Esta es tu biblioteca de ejercicios. Tenés más de 120 ejercicios precargados organizados por grupo muscular.",
      "Podés agregar ejercicios personalizados con '+ Nuevo ejercicio'.",
      "Cada ejercicio puede tener un link a video tutorial para que tu cliente lo vea.",
      "Estos ejercicios se usan después al armar las rutinas.",
    ],
  },
  alimentos: {
    title: "Biblioteca de Alimentos",
    steps: [
      "Acá está tu base de datos nutricional con los valores por porción de cada alimento.",
      "Hay 37 alimentos precargados organizados en Proteínas, Carbohidratos y Grasas.",
      "Podés filtrar por categoría o buscar por nombre.",
      "Agregá tus propios alimentos personalizados con '+ Agregar alimento'. Los globales no se pueden borrar.",
      "Estos alimentos aparecen como sugerencias cuando armás un plan de nutrición para un cliente.",
    ],
  },
  pagos: {
    title: "Pagos",
    steps: [
      "Acá registrás y controlás los pagos de tus clientes.",
      "Podés registrar pagos manuales (efectivo, transferencia) o recibir pagos automáticos por MercadoPago.",
      "Filtrá por cliente o período para ver el historial.",
      "Los pagos por MercadoPago se registran automáticamente con la comisión de TrainerFlow incluida.",
    ],
  },
  agenda: {
    title: "Agenda",
    steps: [
      "Tu calendario de citas y sesiones con clientes.",
      "Agregá nuevas citas seleccionando cliente, fecha, hora y duración.",
      "Cada cita puede marcarse como completada, cancelada o ausente.",
      "Las citas del día aparecen también como alerta en el dashboard.",
    ],
  },
  configuracion: {
    title: "Configuración",
    steps: [
      "Acá configurás tu perfil, landing pública, suscripción y conexión con MercadoPago.",
      "En 'Mi perfil' completá tus datos: nombre, teléfono, bio, foto e Instagram.",
      "En 'Landing pública' activá y personalizá tu página para compartir en redes.",
      "En 'Suscripción' elegí tu plan (Pro o Team) y gestioná tu pago mensual.",
      "En 'MercadoPago' conectá tu cuenta para recibir pagos de clientes directamente.",
    ],
  },
  progreso: {
    title: "Progreso",
    steps: [
      "Acá registrás las mediciones físicas del cliente: peso, cintura, cadera, pecho, brazo y muslo.",
      "El gráfico muestra la evolución en el tiempo para que el cliente vea sus resultados.",
      "Agregá mediciones regularmente (semanal o quincenal) para un seguimiento preciso.",
    ],
  },
  habitos: {
    title: "Hábitos",
    steps: [
      "Seguimiento diario de hábitos del cliente: entrenamiento, alimentación, hidratación, descanso y mindset.",
      "El cliente puede marcar sus hábitos desde su portal cada día.",
      "Vos ves el historial acá para saber qué tan adherente está siendo al plan.",
    ],
  },
};

export function HelpButton({ page }: { page: string }) {
  const [open, setOpen] = useState(false);
  const guide = GUIDES[page];
  if (!guide) return null;

  return (
    <>
      <button
        className="help-btn"
        onClick={() => setOpen(true)}
        aria-label="Ayuda"
      >
        ?
      </button>

      {open && (
        <div className="help-overlay" onClick={() => setOpen(false)}>
          <div className="help-modal" onClick={(e) => e.stopPropagation()}>
            <div className="help-modal-head">
              <h3>{guide.title}</h3>
              <button
                className="help-modal-close"
                onClick={() => setOpen(false)}
              >
                ✕
              </button>
            </div>
            <div className="help-modal-body">
              {guide.steps.map((step, i) => (
                <div key={i} className="help-step">
                  <span className="help-step-num">{i + 1}</span>
                  <p>{step}</p>
                </div>
              ))}
            </div>
            <div className="help-modal-foot">
              <button
                className="btn btn-primary"
                onClick={() => setOpen(false)}
                style={{ width: "100%" }}
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
