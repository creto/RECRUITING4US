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
  // Extended item bank (~100 more). Same dimensions, toward polarity, and scoring. Original wording.
  { key: "mind-host", dimension: "mind", toward: "E", prompt: "I am usually the one who starts the conversation in a room of people I do not know well." },
  { key: "mind-crowd", dimension: "mind", toward: "E", prompt: "A lively crowd after work restores me more than a quiet evening at home." },
  { key: "mind-network", dimension: "mind", toward: "E", prompt: "I build ideas faster when I can bounce them off several people in the same hour." },
  { key: "mind-spotlight", dimension: "mind", toward: "E", prompt: "I do not mind being the person others look to when a discussion stalls." },
  { key: "mind-open-door", dimension: "mind", toward: "E", prompt: "An unexpected visit from a colleague usually feels welcome rather than disruptive." },
  { key: "mind-retreat", dimension: "mind", toward: "I", prompt: "I need a stretch of uninterrupted solitude before I can give a complex problem a fair answer." },
  { key: "mind-small", dimension: "mind", toward: "I", prompt: "I prefer one deep conversation to several short ones in the same afternoon." },
  { key: "mind-observe", dimension: "mind", toward: "I", prompt: "In a large meeting I would rather listen first and speak when I have something finished to say." },
  { key: "mind-recharge", dimension: "mind", toward: "I", prompt: "After a social stretch I look for quiet the way other people look for company." },
  { key: "mind-write", dimension: "mind", toward: "I", prompt: "I often draft my thoughts in writing before I am ready to argue them out loud." },
  { key: "mind-party", dimension: "mind", toward: "E", prompt: "I leave a gathering later than I planned because the talk is still going somewhere." },
  { key: "mind-inbox", dimension: "mind", toward: "I", prompt: "A full calendar of calls feels heavier to me than a full list of tasks I can do alone." },
  { key: "mind-warmup", dimension: "mind", toward: "E", prompt: "I warm up to a new team by talking with them, not by watching from the side." },
  { key: "mind-depth", dimension: "mind", toward: "I", prompt: "I would rather know a few people well than keep a wide circle of light acquaintances." },
  { key: "mind-idle", dimension: "mind", toward: "E", prompt: "Idle silence in a group makes me want to fill it with a question or a story." },
  { key: "mind-buffer", dimension: "mind", toward: "I", prompt: "I protect gaps in my day so I can think without having to respond to anyone." },
  { key: "mind-circle", dimension: "mind", toward: "E", prompt: "Working in a circle of voices helps me more than working through a document by myself." },
  { key: "mind-solo-trip", dimension: "mind", toward: "I", prompt: "A long stretch alone on a tough problem usually leaves me clearer, not lonelier." },
  { key: "mind-intro", dimension: "mind", toward: "E", prompt: "I am comfortable introducing myself to strangers when the work needs a new contact." },
  { key: "mind-signal", dimension: "mind", toward: "I", prompt: "Too many simultaneous conversations leave me looking for a quieter signal to follow." },

  { key: "info-step", dimension: "information", toward: "S", prompt: "I want the next concrete step before I commit to a long vision." },
  { key: "info-record", dimension: "information", toward: "S", prompt: "I trust a process that has a clear record of what was tried and what failed." },
  { key: "info-senses", dimension: "information", toward: "S", prompt: "I notice small changes in the current setup before I invent a new model for them." },
  { key: "info-manual", dimension: "information", toward: "S", prompt: "A plain manual with examples helps me more than a slide about the philosophy." },
  { key: "info-today", dimension: "information", toward: "S", prompt: "I judge a plan by whether it fits the facts we have today." },
  { key: "info-horizon", dimension: "information", toward: "N", prompt: "I am drawn to what could be true in a year more than to what is already settled." },
  { key: "info-metaphor", dimension: "information", toward: "N", prompt: "A good metaphor moves me further than another row of numbers." },
  { key: "info-gap", dimension: "information", toward: "N", prompt: "I look for the gap in the current story before I polish the details that are already known." },
  { key: "info-invent", dimension: "information", toward: "N", prompt: "I would rather invent a new frame than stretch an old one past its usefulness." },
  { key: "info-signal-weak", dimension: "information", toward: "N", prompt: "A weak signal of change interests me even when the evidence is still thin." },
  { key: "info-checklist", dimension: "information", toward: "S", prompt: "I keep a checklist of what must be true before I call a decision ready." },
  { key: "info-sketch", dimension: "information", toward: "N", prompt: "A rough sketch of a future state helps me more than a finished inventory of today." },
  { key: "info-measure", dimension: "information", toward: "S", prompt: "I want something I can measure before I debate what it might mean later." },
  { key: "info-analogy", dimension: "information", toward: "N", prompt: "I connect this problem to another domain before I finish listing its local facts." },
  { key: "info-precedent", dimension: "information", toward: "S", prompt: "A close precedent carries more weight with me than a clever unused idea." },
  { key: "info-possibility", dimension: "information", toward: "N", prompt: "I stay interested in a possibility longer than others do, even after the first plan works." },
  { key: "info-field", dimension: "information", toward: "S", prompt: "I would rather walk the floor and see the work than hear another theory about it." },
  { key: "info-reshape", dimension: "information", toward: "N", prompt: "I enjoy reshaping the question itself when the current wording feels too small." },
  { key: "info-verify", dimension: "information", toward: "S", prompt: "I verify a claim against something I can point to before I pass it along." },
  { key: "info-thread", dimension: "information", toward: "N", prompt: "I follow a thin thread of meaning across several projects even when others stay local." },

  { key: "decide-trade", dimension: "decisions", toward: "T", prompt: "I am willing to name an unpleasant trade-off out loud so the group can decide on the merits." },
  { key: "decide-logic", dimension: "decisions", toward: "T", prompt: "A clear chain of reasons matters more to me than how comfortable the room feels." },
  { key: "decide-score", dimension: "decisions", toward: "T", prompt: "I want a score or a criterion I can apply the same way tomorrow." },
  { key: "decide-critique", dimension: "decisions", toward: "T", prompt: "I take a hard critique of the idea as useful even when it stings the person who brought it." },
  { key: "decide-detach", dimension: "decisions", toward: "T", prompt: "I can set personal liking aside when the better option is the colder one." },
  { key: "decide-care", dimension: "decisions", toward: "F", prompt: "I ask who will carry the cost of a choice before I call it the right one." },
  { key: "decide-tone", dimension: "decisions", toward: "F", prompt: "The tone of a decision meeting matters to me almost as much as the outcome." },
  { key: "decide-loyalty", dimension: "decisions", toward: "F", prompt: "Loyalty to the people in the room can outweigh a slightly cleaner abstract answer." },
  { key: "decide-listen", dimension: "decisions", toward: "F", prompt: "I slow a decision down when someone important has not been heard yet." },
  { key: "decide-compassion", dimension: "decisions", toward: "F", prompt: "A fair process that protects dignity beats a faster process that leaves someone out." },
  { key: "decide-test", dimension: "decisions", toward: "T", prompt: "I want a decision we can test against a stated rule rather than against a mood." },
  { key: "decide-impact", dimension: "decisions", toward: "F", prompt: "I weigh how a choice will feel to the people who live with it day to day." },
  { key: "decide-debate", dimension: "decisions", toward: "T", prompt: "A blunt debate that reaches a clear answer is better than a polite one that stays vague." },
  { key: "decide-relate", dimension: "decisions", toward: "F", prompt: "I would rather preserve a working relationship than win a point that costs trust." },
  { key: "decide-standard", dimension: "decisions", toward: "T", prompt: "I hold the same standard for people I like and people I do not." },
  { key: "decide-empathy", dimension: "decisions", toward: "F", prompt: "Understanding how someone will receive the news is part of making the decision, not an add-on." },
  { key: "decide-evidence", dimension: "decisions", toward: "T", prompt: "I change my mind when the evidence changes, even if the group liked my earlier stance." },
  { key: "decide-include", dimension: "decisions", toward: "F", prompt: "I look for a version of the plan that more people can live with, even if it is less sharp." },
  { key: "decide-rank", dimension: "decisions", toward: "T", prompt: "I am comfortable ranking options from best to worst in public." },
  { key: "decide-support", dimension: "decisions", toward: "F", prompt: "Supporting a teammate through a hard choice matters as much to me as picking the optimal one." },

  { key: "struct-close", dimension: "structure", toward: "J", prompt: "I feel better once a decision is closed and written down." },
  { key: "struct-agenda", dimension: "structure", toward: "J", prompt: "A meeting without an agenda wastes energy I would rather spend on the work." },
  { key: "struct-deadline", dimension: "structure", toward: "J", prompt: "A firm deadline helps me more than an open invitation to keep refining." },
  { key: "struct-order", dimension: "structure", toward: "J", prompt: "I like finishing one thread before I open three new ones." },
  { key: "struct-plan-first", dimension: "structure", toward: "J", prompt: "I would rather agree the plan first and adjust it later than start without one." },
  { key: "struct-flex", dimension: "structure", toward: "P", prompt: "I keep spare capacity for surprises instead of packing the day to the edges." },
  { key: "struct-browse", dimension: "structure", toward: "P", prompt: "I am fine browsing several approaches in parallel before I pick one." },
  { key: "struct-late", dimension: "structure", toward: "P", prompt: "I often do my best work close to the deadline when the constraints are finally clear." },
  { key: "struct-pivot", dimension: "structure", toward: "P", prompt: "Changing direction midstream feels natural when new information arrives." },
  { key: "struct-loose", dimension: "structure", toward: "P", prompt: "A loose outline is enough for me to start; the details can wait." },
  { key: "struct-tick", dimension: "structure", toward: "J", prompt: "Crossing items off a list is how I know the day moved forward." },
  { key: "struct-wander", dimension: "structure", toward: "P", prompt: "I am comfortable letting the work wander a bit before I force it into a box." },
  { key: "struct-commit", dimension: "structure", toward: "J", prompt: "I push the group to commit even when a few people still want more options." },
  { key: "struct-hold", dimension: "structure", toward: "P", prompt: "I hold decisions open longer than others because a better option may still appear." },
  { key: "struct-calendar", dimension: "structure", toward: "J", prompt: "I trust a shared calendar more than a verbal promise to find time later." },
  { key: "struct-improv", dimension: "structure", toward: "P", prompt: "Improvising against a rough goal suits me better than executing a fixed script." },
  { key: "struct-sequence", dimension: "structure", toward: "J", prompt: "I want a clear sequence of owners and dates before I call a project launched." },
  { key: "struct-optional", dimension: "structure", toward: "P", prompt: "I prefer optional milestones to hard gates when the work is still exploratory." },
  { key: "struct-tidy", dimension: "structure", toward: "J", prompt: "A tidy backlog with closed items is more calming to me than a creative pile of maybes." },
  { key: "struct-reopen", dimension: "structure", toward: "P", prompt: "I am willing to reopen a settled plan when the situation has clearly changed." },

  { key: "ident-steady", dimension: "identity", toward: "A", prompt: "I stay steady under pressure instead of replaying every risk in my head." },
  { key: "ident-own", dimension: "identity", toward: "A", prompt: "I own a call I made even when the result is mixed." },
  { key: "ident-thick", dimension: "identity", toward: "A", prompt: "Harsh feedback keeps its useful part and loses its sting before the day ends." },
  { key: "ident-forward", dimension: "identity", toward: "A", prompt: "I move to the next task without needing reassurance that the last one was enough." },
  { key: "ident-calm", dimension: "identity", toward: "A", prompt: "Uncertainty about how I am doing does not usually shake how I show up at work." },
  { key: "ident-doubt", dimension: "identity", toward: "T", prompt: "I keep checking whether I am falling behind even when the scores look fine." },
  { key: "ident-replay-hard", dimension: "identity", toward: "T", prompt: "A mistake can occupy my thoughts long after the meeting where it happened." },
  { key: "ident-compare", dimension: "identity", toward: "T", prompt: "I compare myself to the strongest person in the room more often than I admit." },
  { key: "ident-tense", dimension: "identity", toward: "T", prompt: "Praise helps for a moment, then I start watching for the next place I might slip." },
  { key: "ident-restless", dimension: "identity", toward: "T", prompt: "Finishing a goal rarely feels final; I already feel the next bar rising." },
  { key: "ident-bounce", dimension: "identity", toward: "A", prompt: "I bounce back to normal speed after a setback without needing a long recovery." },
  { key: "ident-worry", dimension: "identity", toward: "T", prompt: "I prepare for the version of events where things go wrong more than for the smooth one." },
  { key: "ident-sure-call", dimension: "identity", toward: "A", prompt: "Once I pick a lane I can explain it without hedging every sentence." },
  { key: "ident-second", dimension: "identity", toward: "T", prompt: "I second-guess a finished draft overnight even when nobody asked for another pass." },
  { key: "ident-resilient", dimension: "identity", toward: "A", prompt: "A public miss does not redefine how I see my whole week." },
  { key: "ident-strain", dimension: "identity", toward: "T", prompt: "I feel strain when I cannot tell whether I am meeting a silent standard." },
  { key: "ident-settle", dimension: "identity", toward: "A", prompt: "I can leave a good-enough outcome alone instead of polishing it past the point of value." },
  { key: "ident-uneasy", dimension: "identity", toward: "T", prompt: "Quiet from a manager makes me uneasy until I get a clearer signal." },
  { key: "ident-grounded", dimension: "identity", toward: "A", prompt: "I trust my own read of a situation enough to act without a crowd confirming it." },
  { key: "ident-pressure", dimension: "identity", toward: "T", prompt: "Outside pressure to be impressive often crowds out the quieter work I know I should do." },
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
  "These statements are original. They use the same five-scale shape as a 16-type questionnaire: mind, information, decisions, structure, and identity. This is not the 16Personalities test and not the Myers-Briggs Type Indicator. A type summarizes these answers. It is not a hiring decision and not a clinical result.";

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
