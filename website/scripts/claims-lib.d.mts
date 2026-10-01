export interface ClaimRule {
  id: string;
  level: "block" | "warn";
  topic: string;
  source: string;
  re: RegExp;
}

export interface ClaimHit {
  id: string;
  level: "block" | "warn";
  topic: string;
  match: string;
  index: number;
}

export const CLAIMS_DOC: string;
export function parseRules(markdown: string): ClaimRule[];
export function loadRules(docPath?: string): ClaimRule[];
export function findClaims(text: string, rules: ClaimRule[]): ClaimHit[];
export function isCommentLine(line: string): boolean;
