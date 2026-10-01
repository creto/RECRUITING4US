/** Dock glyphs: 20px, 1.6 stroke, drawn for this site (no icon library). */
const P = { fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round", strokeLinejoin: "round" } as const;

export const DockIcon = ({ id }: { id: string }) => {
  switch (id) {
    case "inicio":
      return (
        <svg viewBox="0 0 20 20" aria-hidden="true">
          <path {...P} d="M3 5l3 5-3 5M8 5l3 5-3 5M13 5l3 5-3 5" />
        </svg>
      );
    case "vacantes":
      return (
        <svg viewBox="0 0 20 20" aria-hidden="true">
          <rect {...P} x="3" y="6" width="14" height="10" rx="2.5" />
          <path {...P} d="M7.5 6V4.8c0-.7.6-1.3 1.3-1.3h2.4c.7 0 1.3.6 1.3 1.3V6M3 10.5h14" />
        </svg>
      );
    case "pipeline":
      return (
        <svg viewBox="0 0 20 20" aria-hidden="true">
          <path {...P} d="M3.5 4v12M10 4v12M16.5 4v12" />
          <rect {...P} x="5.2" y="6" width="3.2" height="3" rx="1" />
          <rect {...P} x="11.7" y="10.5" width="3.2" height="3" rx="1" />
        </svg>
      );
    case "evaluaciones":
      return (
        <svg viewBox="0 0 20 20" aria-hidden="true">
          <rect {...P} x="4" y="3" width="12" height="14" rx="2.5" />
          <path {...P} d="M7 7.5l1.3 1.3L11 6.2M7 12.5h6" />
        </svg>
      );
    case "entrevistas":
      return (
        <svg viewBox="0 0 20 20" aria-hidden="true">
          <path {...P} d="M3 5.5A2.5 2.5 0 0 1 5.5 3h5A2.5 2.5 0 0 1 13 5.5v2A2.5 2.5 0 0 1 10.5 10H7l-2.5 2V10A2.5 2.5 0 0 1 3 7.5z" />
          <path {...P} d="M15 8.2a2.3 2.3 0 0 1 2 2.3v2a2.5 2.5 0 0 1-2.5 2.5v2l-2.5-2H10a2.5 2.5 0 0 1-2.3-1.5" />
        </svg>
      );
    case "ofertas":
      return (
        <svg viewBox="0 0 20 20" aria-hidden="true">
          <path {...P} d="M5 3h7l3 3v11H5z" />
          <path {...P} d="M12 3v3h3M7.5 12l1.8 1.8 3.4-3.6" />
        </svg>
      );
    case "confianza":
      return (
        <svg viewBox="0 0 20 20" aria-hidden="true">
          <rect {...P} x="3" y="3" width="14" height="14" rx="3.5" />
          <path {...P} d="M3 10h4M13 10h4M10 3v4" />
          <circle {...P} cx="10" cy="11" r="2.2" />
        </svg>
      );
    case "demo":
      return (
        <svg viewBox="0 0 20 20" aria-hidden="true">
          <rect {...P} x="3" y="4.5" width="14" height="12" rx="2.5" />
          <path {...P} d="M3 8.5h14M7 3v3M13 3v3M8.5 12.5h3" />
        </svg>
      );
    default:
      return null;
  }
};
