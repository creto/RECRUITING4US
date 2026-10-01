/** Small line glyphs for the interview, schedule and offer illustrations. */
const P = { fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round", strokeLinejoin: "round" } as const;

export const ChevronLeft = () => (
  <svg viewBox="0 0 20 20" aria-hidden="true">
    <path {...P} d="M12 4.5 6.5 10l5.5 5.5" />
  </svg>
);

export const ChevronRight = () => (
  <svg viewBox="0 0 20 20" aria-hidden="true">
    <path {...P} d="M8 4.5 13.5 10 8 15.5" />
  </svg>
);

export const Check = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 20 20" aria-hidden="true" className={className}>
    <path {...P} strokeWidth={2} d="m4.5 10.5 3.6 3.6 7.4-8.2" />
  </svg>
);

/** Padlock whose shackle closes when the parent sets data-locked. */
export const Lock = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
    <path {...P} data-shackle="" d="M8 11V8a4 4 0 0 1 8 0v3" />
    <rect {...P} x="5" y="11" width="14" height="10" rx="2.6" />
    <path {...P} d="M12 15v2.2" />
  </svg>
);

export const LinkGlyph = () => (
  <svg viewBox="0 0 20 20" aria-hidden="true">
    <path {...P} d="M8.6 11.4a3 3 0 0 0 4.2 0l2.6-2.6a3 3 0 0 0-4.2-4.2l-1 1" />
    <path {...P} d="M11.4 8.6a3 3 0 0 0-4.2 0l-2.6 2.6a3 3 0 0 0 4.2 4.2l1-1" />
  </svg>
);

export const Download = () => (
  <svg viewBox="0 0 20 20" aria-hidden="true">
    <path {...P} d="M10 3.5v9M6.2 9 10 12.8 13.8 9M4 16.5h12" />
  </svg>
);

export const CalendarPlus = () => (
  <svg viewBox="0 0 20 20" aria-hidden="true">
    <rect {...P} x="3" y="4.5" width="14" height="12" rx="2.5" />
    <path {...P} d="M3 8.5h14M7 3v3M13 3v3M10 10.5v4M8 12.5h4" />
  </svg>
);

export const Refresh = () => (
  <svg viewBox="0 0 20 20" aria-hidden="true">
    <path {...P} d="M15.5 8A6 6 0 0 0 4.7 6.5M4.5 12a6 6 0 0 0 10.8 1.5" />
    <path {...P} d="M4.5 3.5v3h3M15.5 16.5v-3h-3" />
  </svg>
);
