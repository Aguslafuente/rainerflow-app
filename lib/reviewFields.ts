export type ReviewField = { name: string; label: string };

export const REVIEW_QUESTIONS: ReviewField[] = [
  {
    name: "satisfaccion",
    label: "¿Qué tan satisfecho/a estás con tu progreso hasta ahora? ¿Por qué?",
  },
  {
    name: "apoyo",
    label: "¿Sentís que tenés el apoyo necesario de mi parte para alcanzar tu objetivo?",
  },
  {
    name: "cumplimiento",
    label:
      "¿Pudiste seguir el plan de entrenamiento y nutrición al 100%? Si no, ¿qué te lo impidió?",
  },
  {
    name: "ajustes",
    label: "¿Hay algo del plan que te gustaría ajustar o mejorar?",
  },
  {
    name: "alimentacion",
    label: "¿Las comidas fueron satisfactorias y te dieron energía durante el día y el entrenamiento?",
  },
  {
    name: "comentarios",
    label: "¿Hay algo más que quieras compartir o preguntar sobre tu progreso?",
  },
];

export const REVIEW_FIELD_NAMES = REVIEW_QUESTIONS.map((q) => q.name);
