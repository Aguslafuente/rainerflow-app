export type IntakeField = {
  name: string;
  label: string;
  long?: boolean; // textarea
  placeholder?: string;
};

export type IntakeSection = {
  title: string;
  fields: IntakeField[];
};

// Basado en el "Formulario de presentación". Todos los campos son opcionales.
export const INTAKE_SECTIONS: IntakeSection[] = [
  {
    title: "Ficha personal",
    fields: [
      { name: "edad", label: "Edad" },
      { name: "altura", label: "Altura" },
      { name: "peso_actual", label: "Peso actual" },
      {
        name: "ocupacion",
        label: "¿Trabajás o estudiás? Horarios y rutina diaria",
        long: true,
      },
      { name: "frecuencia_actual", label: "¿Con qué frecuencia entrenás actualmente?" },
    ],
  },
  {
    title: "Motivación y mentalidad",
    fields: [
      { name: "motivo_ahora", label: "¿Qué te hizo decidir empezar ahora?", long: true },
      {
        name: "intentos_previos",
        label: "¿Ya intentaste antes? ¿Qué funcionó y qué no?",
        long: true,
      },
      {
        name: "dificultad_sostener",
        label: "¿Qué se te complica sostener? (constancia, alimentación, horarios…)",
        long: true,
      },
      { name: "motivacion_nivel", label: "Motivación para arrancar (1 al 10)" },
      {
        name: "acompanamiento_pref",
        label: "¿Cómo preferís que te acompañe? (exigencia / cercanía / ambas)",
      },
      { name: "meta_3_meses", label: "En 3 meses, ¿cómo te gustaría sentirte o verte?", long: true },
    ],
  },
  {
    title: "Salud",
    fields: [
      { name: "condicion_medica", label: "¿Alguna condición médica a tener en cuenta?", long: true },
      { name: "medicamentos", label: "¿Tomás algún medicamento regularmente?" },
      { name: "limitaciones", label: "¿Alguna limitación de movimiento o dolor persistente?", long: true },
      { name: "lesiones", label: "¿Lesiones recientes o antiguas a considerar?", long: true },
    ],
  },
  {
    title: "Nutrición",
    fields: [
      { name: "comidas_por_dia", label: "¿Cuántas comidas principales hacés al día?" },
      { name: "alimentos_evita", label: "Alimentos que no consumís (preferencia, alergia, intolerancia)", long: true },
      { name: "quien_cocina", label: "¿Cocinás vos o tu familia?" },
      { name: "antojos", label: "¿Antojos frecuentes de algún alimento?" },
      { name: "donde_come", label: "¿Dónde hacés tus comidas? (casa, estudio, trabajo)" },
      { name: "suplementos", label: "¿Consumís algún suplemento?" },
      { name: "frutas_verduras", label: "Frutas y verduras que más te gustan" },
      { name: "dietas_previas", label: "¿Seguiste planes de alimentación o dietas antes?", long: true },
      { name: "balanza_cocina", label: "¿Tenés balanza de cocina? ¿Podrías conseguir una?" },
      { name: "notas_alimentacion", label: "Algo más sobre tu alimentación", long: true },
    ],
  },
  {
    title: "Un día normal de comidas",
    fields: [
      { name: "desayuno", label: "Desayuno", long: true },
      { name: "almuerzo", label: "Almuerzo", long: true },
      { name: "merienda", label: "Merienda", long: true },
      { name: "cena", label: "Cena", long: true },
      { name: "colaciones", label: "Colaciones (si hay)" },
    ],
  },
  {
    title: "Entrenamiento",
    fields: [
      { name: "otro_deporte", label: "¿Hacés otro deporte además del gimnasio?" },
      { name: "tiempo_musculacion", label: "¿Hace cuánto entrenás en sala de musculación?" },
      { name: "dias_semana", label: "¿Cuántos días a la semana te gustaría entrenar?" },
      { name: "horario_pref", label: "¿En qué horario te gusta entrenar? (mañana, tarde, noche)" },
      { name: "grupo_prioridad", label: "¿Qué grupo muscular te gustaría priorizar?" },
      { name: "conocimiento_fuerza", label: "¿Tenés conocimiento sobre entrenamiento de fuerza?" },
      { name: "ejercicios_evitar", label: "¿Ejercicios o movimientos que no puedas o no quieras hacer?", long: true },
      { name: "equipamiento", label: "¿Tu gimnasio tiene equipamiento limitado o completo?" },
    ],
  },
];

export const INTAKE_FIELD_NAMES: string[] = INTAKE_SECTIONS.flatMap((s) =>
  s.fields.map((f) => f.name)
);
