/**
 * Static drawing of the trust boundary for browsers without WebGL: the
 * company volume with its data, the boundary, the other company, and the
 * three access paths stopping where they must.
 */
export function TrustFallback({ className }: { className?: string }) {
  const dots = [
    [92, 128], [104, 140], [86, 150], [118, 122], [150, 176], [162, 188], [140, 190], [176, 170],
    [212, 120], [226, 134], [204, 138], [236, 118], [214, 196], [230, 184], [200, 206], [124, 196],
  ];
  return (
    <svg className={className} viewBox="0 0 420 300" aria-hidden="true" fill="none">
      <rect x="60" y="80" width="210" height="150" rx="10" fill="var(--accent-fill)" fillOpacity="0.06" stroke="var(--accent-ink)" strokeOpacity="0.55" />
      {dots.map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="3" fill="var(--stage-3)" />
      ))}
      <circle cx="222" cy="170" r="5" fill="var(--stage-2)" />
      <circle cx="222" cy="170" r="11" stroke="var(--stage-2)" strokeOpacity="0.6" />
      <rect x="80" y="74" width="54" height="14" rx="3" fill="var(--surface)" stroke="var(--stage-1)" />
      <line x1="298" y1="60" x2="298" y2="250" stroke="var(--line-strong)" strokeDasharray="4 6" />
      <rect x="318" y="118" width="74" height="80" rx="8" stroke="var(--line-strong)" />
      <circle cx="342" cy="146" r="2.5" fill="var(--ink-3)" />
      <circle cx="360" cy="166" r="2.5" fill="var(--ink-3)" />
      <circle cx="350" cy="180" r="2.5" fill="var(--ink-3)" />
      <path d="M20 30 C 60 40, 90 50, 107 74" stroke="var(--stage-1)" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M150 290 C 170 250, 196 216, 222 176" stroke="var(--stage-2)" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M10 170 C 30 168, 50 160, 70 156 C 110 150, 150 140, 210 128" stroke="var(--stage-3)" strokeWidth="2" strokeLinecap="round" />
      <path d="M70 156 C 100 170, 130 186, 150 184" stroke="var(--stage-3)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
