export const LIKERT_OPTIONS = [
  { id: "agree", label: "Agree", weight: 2 },
  { id: "slightly-agree", label: "Slightly agree", weight: 1 },
  { id: "middle", label: "In the middle", weight: 0 },
  { id: "slightly-disagree", label: "Slightly disagree", weight: -1 },
  { id: "disagree", label: "Disagree", weight: -2 },
] as const;

const PAIRS = {
  mind: ["E", "I", "Extraverted", "Introverted"],
  information: ["S", "N", "Sensing", "Intuitive"],
  decisions: ["T", "F", "Thinking", "Feeling"],
  structure: ["J", "P", "Judging", "Perceiving"],
  identity: ["A", "T", "Assertive", "Turbulent"],
} as const;

export type PersonalityDimension = keyof typeof PAIRS;

export type PersonalityItem = {
  key: string;
  dimension: PersonalityDimension;
  toward: "E" | "I" | "S" | "N" | "T" | "F" | "J" | "P" | "A";
  prompt: string;
};

/** Original statements in the five-scale shape. Not the 16Personalities item bank. */
export const PERSONALITY_ITEMS: PersonalityItem[] = [
  { key: "mind-group", dimension: "mind", toward: "E", prompt: "I get energy from talking a new idea through with other people." },
  { key: "mind-alone", dimension: "mind", toward: "I", prompt: "I do my best thinking after I have had time alone." },
  { key: "mind-room", dimension: "mind", toward: "E", prompt: "I would rather decide in a group than sit with the decision by myself." },
  { key: "mind-meetings", dimension: "mind", toward: "I", prompt: "A day full of meetings leaves me drained even when the meetings went well." },
  { key: "mind-aloud", dimension: "mind", toward: "E", prompt: "I often know what I think only after I have said it out loud." },
  { key: "info-proven", dimension: "information", toward: "S", prompt: "I trust a plan more when it is based on what has already worked." },
  { key: "info-example", dimension: "information", toward: "S", prompt: "I want a concrete example before I take a general theory seriously." },
  { key: "info-pattern", dimension: "information", toward: "N", prompt: "I get impatient with details once the larger pattern is clear." },
  { key: "info-untried", dimension: "information", toward: "N", prompt: "I would rather try an untested approach than repeat a proven one." },
  { key: "info-facts", dimension: "information", toward: "S", prompt: "I start from the facts in front of me, not from a possibility I cannot yet point to." },
  { key: "decide-accurate", dimension: "decisions", toward: "T", prompt: "When accuracy and agreement conflict, I would rather be accurate." },
  { key: "decide-principle", dimension: "decisions", toward: "T", prompt: "A decision should follow the principle even if someone is disappointed." },
  { key: "decide-people", dimension: "decisions", toward: "F", prompt: "I judge a choice by how it will land on the people involved." },
  { key: "decide-harmony", dimension: "decisions", toward: "F", prompt: "Keeping the team on good terms matters more to me than winning the argument." },
  { key: "decide-check", dimension: "decisions", toward: "T", prompt: "I want a decision I can check, even if the check feels cold." },
  { key: "struct-settle", dimension: "structure", toward: "J", prompt: "I like to settle the plan and then follow it." },
  { key: "struct-open", dimension: "structure", toward: "J", prompt: "An open deadline makes me uneasy." },
  { key: "struct-options", dimension: "structure", toward: "P", prompt: "I prefer to keep options open until the last useful moment." },
  { key: "struct-draft", dimension: "structure", toward: "P", prompt: "A schedule is a draft, and I expect to change it." },
  { key: "struct-list", dimension: "structure", toward: "J", prompt: "I am more comfortable after the list is closed than while it is still being rearranged." },
  { key: "ident-decided", dimension: "identity", toward: "A", prompt: "Once I have decided, I rarely keep second-guessing myself." },
  { key: "ident-criticism", dimension: "identity", toward: "A", prompt: "Criticism bothers me in the moment, and then I move on." },
  { key: "ident-replay", dimension: "identity", toward: "A", prompt: "I can leave a mistake behind without replaying it for the rest of the day." },
  { key: "ident-bar", dimension: "identity", toward: "A", prompt: "A high bar does not leave me feeling behind once the work is done." },
  { key: "ident-sure", dimension: "identity", toward: "A", prompt: "I can be unsure how I am doing and still feel steady." },
];

const BLURBS: Record<string, string> = {
  ISTJ: "Settles on a known method, then follows it carefully.",
  ISFJ: "Keeps a steady plan and watches how it affects people.",
  INFJ: "Looks for a long pattern and whether people can live with it.",
  INTJ: "Wants a principle, a direction, and a plan that can be checked.",
  ISTP: "Works from the facts at hand and changes the approach as they change.",
  ISFP: "Stays close to what is actually happening and to the people in it.",
  INFP: "Keeps the purpose open and judges a path by what it means to people.",
  INTP: "Takes a principle apart and is willing to leave the plan unfinished.",
  ESTP: "Acts on what is in front of the group and adjusts quickly.",
  ESFP: "Brings people into the present problem and keeps the next step movable.",
  ENFP: "Starts from a possibility and wants other people in the exploration.",
  ENTP: "Argues the idea in public and resists closing it too early.",
  ESTJ: "Wants the group on a decided plan and a standard that can be checked.",
  ESFJ: "Organizes the group and pays attention to whether people are with the plan.",
  ENFJ: "Pulls people toward a direction and cares whether they can follow it.",
  ENTJ: "Sets a direction, argues for the principle, and wants the plan closed.",
};

export type PersonalityScale = {
  name: string;
  result: string;
  letter: string | null;
  score: number;
  max: number;
};

export type PersonalityResult = {
  kind: "personality";
  code: string | null;
  letters: string | null;
  identity: string | null;
  title: string;
  group: string;
  summary: string;
  note: string;
  answered: number;
  scales: PersonalityScale[];
};

export function readPersonality(value: unknown): PersonalityResult | null {
  const record = value && typeof value === "object" ? value as PersonalityResult : null;
  if (!record || record.kind !== "personality" || !Array.isArray(record.scales)) return null;
  return {
    kind: "personality",
    code: typeof record.code === "string" ? record.code : null,
    letters: typeof record.letters === "string" ? record.letters : lettersFrom(typeof record.code === "string" ? record.code : null),
    identity: typeof record.identity === "string" ? record.identity : identityFrom(typeof record.code === "string" ? record.code : null),
    title: String(record.title ?? ""),
    group: typeof record.group === "string" && record.group ? record.group : groupFor(typeof record.code === "string" ? record.code : null),
    summary: String(record.summary ?? ""),
    note: String(record.note ?? ""),
    answered: Number(record.answered ?? 0),
    scales: record.scales.map((scale) => ({
      name: String(scale.name ?? ""),
      result: String(scale.result ?? ""),
      letter: typeof scale.letter === "string" ? scale.letter : null,
      score: Number(scale.score ?? 0),
      max: Number(scale.max ?? 0),
    })),
  };
}

const NOTE =
  "These 25 statements are original. They use the same five-scale shape as a 16-type questionnaire: mind, information, decisions, structure, and identity. This is not the 16Personalities test and not the Myers-Briggs Type Indicator. A type summarizes these answers. It is not a hiring decision and not a clinical result.";

export function likertWeight(optionId: string | null | undefined): number | null {
  if (!optionId) return null;
  const found = LIKERT_OPTIONS.find((option) => option.id === optionId);
  return found ? found.weight : null;
}

export function scorePersonality(
  answers: { dimension: string; toward: string; optionId: string | null }[],
): PersonalityResult {
  const scales: PersonalityScale[] = [];
  let answered = 0;
  for (const dimension of Object.keys(PAIRS) as PersonalityDimension[]) {
    const [first, second, firstName, secondName] = PAIRS[dimension];
    const rows = answers.filter((answer) => answer.dimension === dimension);
    let sum = 0;
    let used = 0;
    for (const row of rows) {
      const weight = likertWeight(row.optionId);
      if (weight == null) continue;
      used += 1;
      answered += 1;
      const sign = row.toward === first ? 1 : row.toward === second ? -1 : 0;
      sum += sign * weight;
    }
    const max = used * 2;
    if (used === 0) {
      scales.push({ name: dimension, result: "No answers on this scale.", letter: null, score: 0, max: 0 });
      continue;
    }
    if (sum === 0) {
      scales.push({ name: dimension, result: `Tied between ${firstName} and ${secondName}.`, letter: null, score: 0, max });
      continue;
    }
    const letter = sum > 0 ? first : second;
    const name = sum > 0 ? firstName : secondName;
    scales.push({
      name: dimension,
      result: `${name}, ${Math.abs(sum)} of ${max} toward that side.`,
      letter,
      score: sum,
      max,
    });
  }
  const letters = scales.slice(0, 4).map((scale) => scale.letter);
  const identity = scales[4]?.letter ?? null;
  const code = letters.every(Boolean) ? `${letters.join("")}${identity ? `-${identity}` : ""}` : null;
  const four = letters.every(Boolean) ? letters.join("") : null;
  const group = groupFor(four);
  const title = four
    ? `${four}. ${BLURBS[four] ?? "Read the scales rather than a nickname."}`
    : answered === 0
      ? "No type. No preferences were saved."
      : "No four-letter type. At least one scale was tied or unanswered.";
  const summary = scales.map((scale) => `${scale.name}: ${scale.result}`).join(" ");
  return {
    kind: "personality",
    code,
    letters: four,
    identity: identity === "A" ? "Assertive" : identity === "T" ? "Turbulent" : null,
    title,
    group,
    summary,
    note: NOTE,
    answered,
    scales,
  };
}

function lettersFrom(code: string | null): string | null {
  if (!code || code.length < 4) return null;
  return code.slice(0, 4);
}

function identityFrom(code: string | null): string | null {
  if (!code) return null;
  if (code.endsWith("-A")) return "Assertive";
  if (code.endsWith("-T")) return "Turbulent";
  return null;
}

/** Four groups from the letter pairs. Original wording, not a published instrument's names. */
export function groupFor(code: string | null): string {
  if (!code || code.length < 4) return "No group. A group needs all four letters.";
  const letters = code.slice(0, 4);
  if (letters.includes("N") && letters.includes("T")) return "Pattern and principle";
  if (letters.includes("N") && letters.includes("F")) return "Pattern and people";
  if (letters.includes("S") && letters.includes("J")) return "Known method and a closed plan";
  if (letters.includes("S") && letters.includes("P")) return "What is happening, kept movable";
  return "No group. A group needs all four letters.";
}
