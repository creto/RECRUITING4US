const COLORS = ["var(--stage-1)", "var(--stage-2)", "var(--stage-3)", "var(--stage-4)"];

/** Section marker on the hiring journey. `tone` 1–4 follows the mark's chevrons. */
export function StageTag({ label, step, total = 8, tone = 2 }: { label: string; step?: number; total?: number; tone?: 1 | 2 | 3 | 4 }) {
  return (
    <p className="stage-tag" style={{ ["--tag-color" as string]: COLORS[tone - 1] }}>
      <span>{label}</span>
      {step !== undefined && (
        <span className="of">
          {step}/{total}
        </span>
      )}
    </p>
  );
}
