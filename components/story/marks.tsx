import { forwardRef } from "react";

/**
 * Pure SVG geometry for the cinematic intro and the wider marketing site.
 *
 * Everything here is presentational only — no animation logic. The needle
 * and thread shapes are drawn in a local, origin-centered coordinate space
 * so `CinematicIntro` can move, scale and rotate them as single continuous
 * actors across the whole scroll timeline (GSAP applies transforms on top
 * of these static shapes; nothing here is ever swapped or cross-faded at
 * the DOM level for the needle/thread themselves).
 *
 * The needle + thread gesture reproduces the actual Fine Ligne Studio mark
 * (see public/branding/mark.svg) rather than inventing a new symbol.
 */

/** The needle: a tapered, filled silhouette with a cut eye near the top.
 *  Local space: x in [-6,6], y in [-70,70], point at +y, eye near -y. */
export function NeedleShape({ id, className }: { id: string; className?: string }) {
  const maskId = `${id}-eye-mask`;
  return (
    <g className={className}>
      <mask id={maskId}>
        <rect x="-40" y="-90" width="80" height="180" fill="white" />
        <ellipse cx="0" cy="-50" rx="2.1" ry="5.4" fill="black" />
      </mask>
      <path d="M -4 -70 C -5.4 -64 -5.2 58 -3.1 65.5 L 0 70.5 L 3.1 65.5 C 5.2 58 5.4 -64 4 -70 C 4 -72.6 -4 -72.6 -4 -70 Z" mask={`url(#${maskId})`} />
    </g>
  );
}

export function NeedleBarShape({ className }: { className?: string }) {
  return <path className={className} d="M -3.4 -58 C -4.4 -53 -4.2 48 -2.6 54 L 0 58 L 2.6 54 C 4.2 48 4.4 -53 3.4 -58 C 3.4 -60.2 -3.4 -60.2 -3.4 -58 Z" />;
}

/** The actual Fine Ligne Studio thread gesture. */
export const ThreadSwirl = forwardRef<SVGPathElement, { id: string; className?: string; style?: React.CSSProperties }>(
  function ThreadSwirl({ id, className, style }, ref) {
    return <path ref={ref} id={id} className={className} style={style} pathLength={1} fill="none" strokeLinecap="round" d="M 0 -50 C -18 -78 -70 -82 -96 -55 C -118 -32 -110 -6 -82 2 C -60 8 -46 -6 -58 -20 C -66 -30 -80 -26 -78 -14" />;
  },
);

export function MonogramGlyph({ id, className }: { id: string; className?: string }) {
  return (
    <g id={id} className={className} fill="none" strokeLinecap="round" strokeWidth={2.6}>
      <g transform="scale(0.29)">
        <NeedleShape id={`${id}-needle`} className="fill-current stroke-none" />
        <ThreadSwirl id={`${id}-thread`} className="stroke-current" />
      </g>
    </g>
  );
}

/** Stacked wordmark — FINE / LIGNE / STUDIO with flanking hairlines. */
export function WordmarkGroup({ id, className }: { id: string; className?: string }) {
  return (
    <g id={id} className={className} textAnchor="middle" fill="currentColor">
      <text x="0" y="0" fontFamily="var(--font-fl-serif)" fontSize="64" fontWeight={500} letterSpacing="0.08em">FINE</text>
      <text x="0" y="70" fontFamily="var(--font-fl-serif)" fontSize="64" fontWeight={500} letterSpacing="0.08em">LIGNE</text>
      <line x1="-64" y1="100" x2="-30" y2="100" strokeWidth="1" stroke="currentColor" />
      <text x="0" y="105" fontFamily="var(--font-geist-sans)" fontSize="16" letterSpacing="0.42em">STUDIO</text>
      <line x1="30" y1="100" x2="64" y2="100" strokeWidth="1" stroke="currentColor" />
    </g>
  );
}

/** Full lockup using the Fine Ligne Studio wordmark. */
export function LogoLockup({ id, className, showThread = true }: { id: string; className?: string; showThread?: boolean }) {
  return (
    <g id={id} className={className}>
      <g transform="translate(0,-58) scale(0.62)" style={{ strokeWidth: 2.4 }}>
        <NeedleShape id={`${id}-needle`} className="fill-current stroke-none" />
        {showThread && <ThreadSwirl id={`${id}-thread`} className="stroke-current" />}
      </g>
      <WordmarkGroup id={`${id}-wordmark`} />
    </g>
  );
}

export function MachineHousing({ id, count = 15, spacing = 42, className }: { id: string; count?: number; spacing?: number; className?: string }) {
  const width = spacing * (count - 1) + 96;
  const cones = Array.from({ length: count }, (_, i) => i - (count - 1) / 2);
  const coneTones = ["#B68A3D", "#D9C7A0", "#726A5C", "#181613", "#CBA968"];
  return (
    <g id={id} className={className}>
      <rect x={-width / 2} y="-128" width={width} height="64" rx="10" className="fill-[url(#machine-metal)] stroke-fl-charcoal" strokeWidth="1.5" />
      <rect x={-width / 2 + 14} y="-150" width={width - 28} height="18" rx="4" className="fill-[url(#machine-metal)] stroke-fl-charcoal" strokeWidth="1.5" />
      {cones.map((slot, i) => (
        <g key={i} transform={`translate(${slot * spacing},-176)`}>
          <path d="M -6 18 L 6 18 L 4 -2 L -4 -2 Z" fill={coneTones[i % coneTones.length]} />
          <ellipse cx="0" cy="-2" rx="4" ry="1.6" fill={coneTones[i % coneTones.length]} opacity={0.85} />
        </g>
      ))}
    </g>
  );
}

export function HoopFabricShape({ id, className }: { id: string; className?: string }) {
  return (
    <g id={id} className={className}>
      <defs><pattern id={`${id}-weave`} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(0)"><path d="M0 0 L6 0 M0 3 L6 3" stroke="#E2D8C2" strokeWidth="0.6" /></pattern></defs>
      <ellipse cx="0" cy="0" rx="158" ry="158" fill={`url(#${id}-weave)`} className="fill-fl-paper" stroke="none" />
      <ellipse cx="0" cy="0" rx="158" ry="158" fill={`url(#${id}-weave)`} />
      <ellipse cx="0" cy="0" rx="172" ry="172" fill="none" className="stroke-fl-brass" strokeWidth="10" />
      <ellipse cx="0" cy="0" rx="158" ry="158" fill="none" className="stroke-fl-charcoal" strokeWidth="2" opacity={0.35} />
      <rect x="150" y="-14" width="34" height="28" rx="4" className="fill-fl-brass" />
      <circle cx="176" cy="0" r="4" className="fill-fl-charcoal" opacity={0.4} />
    </g>
  );
}

export function ShirtShape({ id, className }: { id: string; className?: string }) {
  return (
    <g id={id} className={className}>
      <path d="M -120 -140 L -58 -168 L -20 -140 L 0 -152 L 20 -140 L 58 -168 L 120 -140 L 96 -84 L 60 -100 L 60 190 L -60 190 L -60 -100 L -96 -84 Z" className="fill-fl-paper stroke-fl-charcoal" strokeWidth="2" strokeLinejoin="round" />
      <path d="M 0 -152 L -6 190 M 0 -152 L 6 190" className="stroke-fl-line" strokeWidth="1.5" fill="none" />
      {[-40, 10, 60, 110, 160].map((y, i) => <circle key={i} cx="0" cy={y} r="2.4" className="fill-fl-ink-faint" />)}
    </g>
  );
}

export function TowelStackShape({ id, className }: { id: string; className?: string }) {
  return <g id={id} className={className}><rect x="-100" y="20" width="200" height="34" rx="6" className="fill-fl-cream stroke-fl-charcoal" strokeWidth="1.5" /><rect x="-92" y="-14" width="184" height="34" rx="6" className="fill-fl-ivory stroke-fl-charcoal" strokeWidth="1.5" /><rect x="-84" y="-48" width="168" height="34" rx="6" className="fill-fl-paper stroke-fl-charcoal" strokeWidth="1.5" /></g>;
}

export function ToteShape({ id, className }: { id: string; className?: string }) {
  return <g id={id} className={className}><path d="M -66 -70 C -66 -104 66 -104 66 -70" className="stroke-fl-charcoal" strokeWidth="4" fill="none" strokeLinecap="round" /><path d="M -84 -66 L 84 -66 L 72 96 L -72 96 Z" className="fill-fl-cream stroke-fl-charcoal" strokeWidth="2" strokeLinejoin="round" /></g>;
}

export function NapkinShape({ id, className }: { id: string; className?: string }) {
  return <g id={id} className={className}><path d="M -80 60 L 0 -60 L 80 60 Z" className="fill-fl-paper stroke-fl-charcoal" strokeWidth="1.5" strokeLinejoin="round" /></g>;
}
