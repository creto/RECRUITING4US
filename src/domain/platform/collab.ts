export function applyDocument(current: { revision: number; body: string }, incoming: { baseRevision: number; body: string }):
  | { ok: true; revision: number; body: string }
  | { ok: false; revision: number; body: string; reason: string } {
  if (incoming.baseRevision !== current.revision) {
    return {
      ok: false,
      revision: current.revision,
      body: current.body,
      reason: "Someone else saved first. The editor reloaded their version. Yours was not overwritten.",
    };
  }
  const body = incoming.body.slice(0, 60_000);
  return { ok: true, revision: current.revision + 1, body };
}

export function canSeeNote(role: "CANDIDATE" | "INTERVIEWER", privateNote: boolean): boolean {
  if (!privateNote) return true;
  return role === "INTERVIEWER";
}

export type Edit = { at: number; del: number; insert: string };

export function clampEdit(body: string, edit: Edit): Edit {
  const at = Math.max(0, Math.min(body.length, Math.trunc(edit.at) || 0));
  const del = Math.max(0, Math.min(body.length - at, Math.trunc(edit.del) || 0));
  return { at, del, insert: edit.insert.slice(0, 8_000) };
}

export function applyEdit(body: string, edit: Edit): string {
  const next = clampEdit(body, edit);
  return (body.slice(0, next.at) + next.insert + body.slice(next.at + next.del)).slice(0, 60_000);
}

/**
 * Transform `incoming` as if `applied` already landed on the same base.
 * Non-overlapping edits move. An overlap keeps the incoming insert and drops the overlapping delete.
 */
export function transformEdit(applied: Edit, incoming: Edit): Edit {
  const left = clampEdit(" ".repeat(Math.max(applied.at + applied.del, incoming.at + incoming.del, 1)), applied);
  const right = incoming;
  if (right.at + right.del <= left.at) return right;
  if (right.at >= left.at + left.del) {
    return { ...right, at: right.at + left.insert.length - left.del };
  }
  return { at: left.at, del: 0, insert: right.insert };
}

/** Smallest edit that turns `before` into `after`. */
export function diffEdit(before: string, after: string): Edit {
  if (before === after) return { at: before.length, del: 0, insert: "" };
  let start = 0;
  const max = Math.min(before.length, after.length);
  while (start < max && before[start] === after[start]) start += 1;
  let endBefore = before.length;
  let endAfter = after.length;
  while (endBefore > start && endAfter > start && before[endBefore - 1] === after[endAfter - 1]) {
    endBefore -= 1;
    endAfter -= 1;
  }
  return { at: start, del: endBefore - start, insert: after.slice(start, endAfter) };
}

export function applyOpChain(body: string, ops: Edit[], incoming: Edit): { body: string; edit: Edit } {
  let edit = incoming;
  for (const op of ops) edit = transformEdit(op, edit);
  return { body: applyEdit(body, edit), edit };
}