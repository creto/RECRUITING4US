export const PROCTOR_KINDS = [
  "CAMERA_GRANTED",
  "CAMERA_DENIED",
  "CAMERA_ENDED",
  "TAB_HIDDEN",
  "WINDOW_BLUR",
  "FULLSCREEN_LEFT",
  "PASTE",
  "COPY",
  "NO_FACE",
  "EXTRA_FACE",
  "HEARTBEAT",
] as const;

export type ProctorKind = (typeof PROCTOR_KINDS)[number];

export function proctorKind(value: string): ProctorKind | null {
  return (PROCTOR_KINDS as readonly string[]).includes(value) ? (value as ProctorKind) : null;
}
