import { CODING_FOOTERS, CODING_TASKS, CODING_TITLES } from "./coding-es.ts";
import { ES } from "./catalog.ts";

export type Locale = "en" | "es";

const SCALES: Record<string, string> = {
  Extraverted: "Extravertido",
  Introverted: "Introvertido",
  Sensing: "Sensorial",
  Intuitive: "Intuitivo",
  Thinking: "Racional",
  Feeling: "Empático",
  Judging: "Planificador",
  Perceiving: "Flexible",
  Assertive: "Asertivo",
  Turbulent: "Turbulento",
};

const BLURBS: Record<string, string> = {
  "Settles on a known method, then follows it carefully.": "Se queda con un método conocido y lo sigue con cuidado.",
  "Keeps a steady plan and watches how it affects people.": "Mantiene un plan estable y mira cómo afecta a las personas.",
  "Looks for a long pattern and whether people can live with it.": "Busca un patrón largo y si las personas pueden vivir con él.",
  "Wants a principle, a direction, and a plan that can be checked.": "Quiere un principio, una dirección y un plan que se pueda comprobar.",
  "Works from the facts at hand and changes the approach as they change.": "Trabaja con los hechos que tiene y cambia el enfoque cuando cambian.",
  "Stays close to what is actually happening and to the people in it.": "Se queda cerca de lo que está pasando y de las personas que están en ello.",
  "Keeps the purpose open and judges a path by what it means to people.": "Deja el propósito abierto y juzga un camino por lo que significa para las personas.",
  "Takes a principle apart and is willing to leave the plan unfinished.": "Desarma un principio y puede dejar el plan sin cerrar.",
  "Acts on what is in front of the group and adjusts quickly.": "Actúa sobre lo que el grupo tiene delante y se ajusta rápido.",
  "Brings people into the present problem and keeps the next step movable.": "Mete a las personas en el problema presente y deja el siguiente paso movible.",
  "Starts from a possibility and wants other people in the exploration.": "Parte de una posibilidad y quiere a otras personas en la exploración.",
  "Argues the idea in public and resists closing it too early.": "Discute la idea en público y evita cerrarla demasiado pronto.",
  "Wants the group on a decided plan and a standard that can be checked.": "Quiere al grupo en un plan decidido y en un criterio que se pueda comprobar.",
  "Organizes the group and pays attention to whether people are with the plan.": "Organiza al grupo y mira si las personas van con el plan.",
  "Pulls people toward a direction and cares whether they can follow it.": "Lleva a las personas hacia una dirección y le importa si pueden seguirla.",
  "Sets a direction, argues for the principle, and wants the plan closed.": "Fija una dirección, defiende el principio y quiere el plan cerrado.",
};

export function translateText(raw: string, locale: Locale): string {
  if (locale !== "es" || !raw.trim()) return raw;
  const match = raw.match(/^(\s*)([\s\S]*?)(\s*)$/);
  if (!match) return raw;
  const [, lead, core, tail] = match;
  const next = translateCore(core);
  return next === core ? raw : `${lead}${next}${tail}`;
}

function translateCore(text: string): string {
  const exact = ES[text];
  if (exact) return exact;
  return (
    translateMental(text) ??
    translateCoding(text) ??
    translatePersonality(text) ??
    translatePattern(text) ??
    text
  );
}

function translateMental(text: string): string | null {
  let match = text.match(/^What is (\d+) × (\d+)\? Enter the digits only\.$/);
  if (match) return `¿Cuánto es ${match[1]} × ${match[2]}? Escribe solo los dígitos.`;
  match = text.match(/^What is (\d+)% of (\d+)\? Enter the digits only\.$/);
  if (match) return `¿Cuánto es el ${match[1]}% de ${match[2]}? Escribe solo los dígitos.`;
  match = text.match(/^What is (\d+) ÷ (\d+)\? Enter the digits only\.$/);
  if (match) return `¿Cuánto es ${match[1]} ÷ ${match[2]}? Escribe solo los dígitos.`;
  return null;
}

function translateCoding(text: string): string | null {
  const hit = CODING_FOOTERS.find(([english]) => text.endsWith(english));
  if (!hit) return null;
  const body = text.slice(0, text.length - hit[0].length).replace(/\n$/, "");
  const parts = body.match(/^([\s\S]*?)\n\nWrite `([\s\S]+?)`\.\n\n([\s\S]*?)\n\nExample\n([\s\S]*)$/);
  if (!parts) return null;
  const title = CODING_TITLES[parts[1]] ?? parts[1];
  const task = CODING_TASKS[parts[3]] ?? parts[3].replace(/^Topic: /, "Tema: ");
  return `${title}\n\nEscribe \`${parts[2]}\`.\n\n${task}\n\nEjemplo\n${parts[4]}\n\n${hit[1]}`;
}

function translatePersonality(text: string): string | null {
  const typed = text.match(/^([A-Z]{4})\. (.+)$/);
  if (typed && BLURBS[typed[2]]) return `${typed[1]}. ${BLURBS[typed[2]]}`;
  const tied = text.match(/^Tied between (.+) and (.+)\.$/);
  if (tied && SCALES[tied[1]] && SCALES[tied[2]]) return `Empate entre ${SCALES[tied[1]]} y ${SCALES[tied[2]]}.`;
  const side = text.match(/^(.+), (\d+) of (\d+) toward that side\.$/);
  if (side && SCALES[side[1]]) return `${SCALES[side[1]]}, ${side[2]} de ${side[3]} hacia ese lado.`;
  return null;
}

function translatePattern(text: string): string | null {
  const rules: Array<[RegExp, (...parts: string[]) => string]> = [
    [/^(\d+) of (\d+) answered$/, (done, total) => `${done} de ${total} respondidas`],
    [/^(\d+) pt$/, (points) => `${points} ptos`],
    [/^Answer every question before submitting\. (\d+) still open\.$/, (left) => `Responde todas las preguntas antes de enviar. Aún quedan ${left}.`],
    [/^(\d+) applications$/, (count) => `${count} solicitudes`],
    [/^Continue with (.+)$/, (name) => `Continuar con ${name}`],
    [/^Timezone (.+)\. Counts come from records in this company only\.$/, (zone) => `Zona horaria ${zone}. Los conteos salen solo de los registros de esta empresa.`],
    [/^Status (.+)\. The public page uses the last published revision, not unsaved draft edits\.$/, (status) => `Estado ${status}. La página pública usa la última revisión publicada, no los cambios sin guardar.`],
    [/^External calendar: ([^.]+)\.(.*)$/, (status, rest) => `Calendario externo: ${status}.${rest}`],
    [/^(.+) · (.+) · version (\d+)$/, (job, stage, version) => `${job} · ${stage} · versión ${version}`],
    [/^Rank (\d+)$/, (rank) => `Puesto ${rank}`],
    [/^(.+), (\d+) of (\d+) toward that side\.$/, (name, score, max) => `${SCALES[name] ?? name}, ${score} de ${max} hacia ese lado.`],
  ];
  for (const [pattern, build] of rules) {
    const match = text.match(pattern);
    if (match) return build(...match.slice(1));
  }
  return null;
}
