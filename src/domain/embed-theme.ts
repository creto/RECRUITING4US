export type EmbedTheme = {
  background: string;
  ink: string;
  accent: string;
  accentInk: string;
};

export const DEFAULT_EMBED_THEME: EmbedTheme = {
  background: "#ffffff",
  ink: "#14221b",
  accent: "#cefa90",
  accentInk: "#14221b",
};

export const PRODUCT_THEME: EmbedTheme = {
  background: "#f4f7f5",
  ink: "#14221b",
  accent: "#cefa90",
  accentInk: "#14221b",
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

/** Careers page and the company workspace. The sign-in page stays the product colors. */
export function companyCssVars(input?: Partial<EmbedTheme> | null): Record<string, string> {
  const theme = embedTheme(input);
  const light = luminance(theme.background) > 0.55;
  return {
    ...embedCssVars(theme),
    "--color-bg": light ? "#f4f7f5" : theme.background,
    "--color-surface": light ? "#ffffff" : mix(theme.ink, theme.background, 0.08),
    "--color-sidebar": light ? "#ffffff" : mix(theme.ink, theme.background, 0.92),
    "--color-sidebar-fg": light ? theme.ink : theme.background,
    "--color-sidebar-muted": light ? theme.muted : mix(theme.background, theme.ink, 0.55),
  };
}

/** WCAG contrast. Below 4.5, body text on that background is hard to read. */
export function contrastRatio(a: string, b: string): number {
  const left = luminance(normalizeHex(a, "#000000"));
  const right = luminance(normalizeHex(b, "#ffffff"));
  const [hi, lo] = left > right ? [left, right] : [right, left];
  return (hi + 0.05) / (lo + 0.05);
}

function luminance(hex: string): number {
  const [r, g, b] = channels(hex).map((channel) => {
    const value = channel / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
