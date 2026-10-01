import { chevronPoints, CORNER_R, MARK_COLORS, MARK_H, MARK_W, roundedPath } from "@/brand/markGeometry";

/** SVG trace of the official mark (geometry measured from public/mark.png). Fallback when WebGL is unavailable. */
export function MarkSvg({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox={`0 0 ${MARK_W} ${MARK_H}`} aria-hidden="true">
      {MARK_COLORS.map((c, i) => (
        <path key={c} d={roundedPath(chevronPoints(i), CORNER_R)} fill={c} />
      ))}
    </svg>
  );
}
