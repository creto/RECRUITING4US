/** Synthetic résumés for the search demo. Not real people. */
export type ResumeField = "skills" | "titles" | "education" | "locations" | "years" | "history";
export const FIELD_ORDER: ResumeField[] = ["skills", "titles", "education", "locations", "years", "history"];

export type Resume = { id: string; label: string; fields: Record<ResumeField, string[]> };

export const RESUMES: Resume[] = [
  {
    id: "r1",
    label: "CV de ejemplo 1",
    fields: {
      skills: ["SQL", "Python", "machine learning", "Power BI"],
      titles: ["Data analyst", "Intern de BI"],
      education: ["Ingeniería de sistemas"],
      locations: ["Bogotá"],
      years: ["5 years"],
      history: ["Modelos de machine learning para estimar la demanda de inventario", "Intern de BI en retail"],
    },
  },
  {
    id: "r2",
    label: "CV de ejemplo 2",
    fields: {
      skills: ["Python", "PyTorch", "machine learning", "Docker"],
      titles: ["ML engineer", "Data engineer"],
      education: ["Maestría en ciencia de datos"],
      locations: ["Medellín", "Remoto"],
      years: ["7 years"],
      history: ["Sistema de recomendación en producción", "Pipelines de datos en la nube"],
    },
  },
  {
    id: "r3",
    label: "CV de ejemplo 3",
    fields: {
      skills: ["React", "TypeScript", "Vue", "SQL"],
      titles: ["Frontend developer"],
      education: ["Tecnología en desarrollo de software"],
      locations: ["Cali"],
      years: ["4 years"],
      history: ["Portal de pacientes en React", "Migración de Vue a TypeScript"],
    },
  },
];
