export type EmbedTheme = {
  background: string;
  ink: string;
  accent: string;
  accentInk: string;
};

export const DEFAULT_EMBED_THEME: EmbedTheme = {
  background: "#ffffff",
  ink: "#14221b",
  accent: "#036145",
  accentInk: "#ffffff",
};

export const EMBED_HEX = /^#[0-9a-fA-F]{6}$/;

export function normalizeHex(value: string | null | undefined, fallback: string): string {
  const trimmed = (value ?? "").trim();
  return EMBED_HEX.test(trimmed) ? trimmed.toLowerCase() : fallback;
}

function channels(hex: string): [number, number, number] {
  return [
    Number.parseInt(hex.slice(1, 3), 16),
    Number.parseInt(hex.slice(3, 5), 16),
    Number.parseInt(hex.slice(5, 7), 16),
  ];
}

function mix(ink: string, background: string, inkWeight: number): string {
  const left = channels(ink);
  const right = channels(background);
  const channel = (index: number) =>
    Math.round(left[index] * inkWeight + right[index] * (1 - inkWeight))
      .toString(16)
      .padStart(2, "0");
  return `#${channel(0)}${channel(1)}${channel(2)}`;
}

export function embedTheme(input?: Partial<EmbedTheme> | null): EmbedTheme & { muted: string; line: string } {
  const background = normalizeHex(input?.background, DEFAULT_EMBED_THEME.background);
  const ink = normalizeHex(input?.ink, DEFAULT_EMBED_THEME.ink);
  const accent = normalizeHex(input?.accent, DEFAULT_EMBED_THEME.accent);
  const accentInk = normalizeHex(input?.accentInk, DEFAULT_EMBED_THEME.accentInk);
  return {
    background,
    ink,
    accent,
    accentInk,
    muted: mix(ink, background, 0.62),
    line: mix(ink, background, 0.18),
  };
}

/** CSS variables the apply box reads. Invalid stored colors fall back to white. */
export function embedCssVars(input?: Partial<EmbedTheme> | null): Record<string, string> {
  const theme = embedTheme(input);
  return {
    background: theme.background,
    color: theme.ink,
    "--color-bg": theme.background,
    "--color-surface": theme.background,
    "--color-ink": theme.ink,
    "--color-muted": theme.muted,
    "--color-line": theme.line,
    "--color-accent": theme.accent,
    "--color-accent-ink": theme.accentInk,
  };
}
