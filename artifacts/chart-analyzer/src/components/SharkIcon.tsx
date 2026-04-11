import React from 'react';

interface SharkIconProps {
  className?: string;
}

export function SharkIcon({ className }: SharkIconProps) {
  return (
    <svg
      viewBox="0 0 80 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="ChartAttack shark logo"
    >
      {/* ─── SHARK faces LEFT — open mouth is on the LEFT ─── */}

      {/* Tail: forked, angular (right side) */}
      <path d="M74 32 L80 14 L66 28 Z" fill="currentColor" />
      <path d="M74 32 L80 50 L66 36 Z" fill="currentColor" />

      {/* Dorsal fin: tall blade */}
      <path d="M48 18 L54 2 L60 18 Z" fill="currentColor" />

      {/* Lower pectoral fin */}
      <path d="M46 48 L44 62 L56 50 Z" fill="currentColor" />

      {/* ── BODY ── torpedo outline */}
      <path
        d="M66 32
           C66 22 56 15 42 14
           C28 13 12 18 6 26
           L2 32
           L6 38
           C12 46 28 51 42 50
           C56 49 66 42 66 32 Z"
        fill="currentColor"
      />

      {/* ── MOUTH: cut out the snout as a wide open gape ── */}
      {/* Upper jaw (above mid-line on left) */}
      <path
        d="M2 32 L6 22 C10 18 16 16 22 16 L22 32 Z"
        fill="currentColor"
      />
      {/* Lower jaw (below mid-line on left) */}
      <path
        d="M2 32 L6 42 C10 46 16 48 22 48 L22 32 Z"
        fill="currentColor"
      />

      {/* Mouth cavity (background shows through = open mouth) */}
      <path
        d="M4 32 C4 23 12 17 22 17 L22 47 C12 47 4 41 4 32 Z"
        fill="white"
        opacity="0.13"
      />

      {/* ── UPPER TEETH ── large triangles pointing down from upper jaw */}
      <g>
        <polygon points="5,25  11,25  8,36"  fill="white" />
        <polygon points="11,21 17,21 14,33" fill="white" />
        <polygon points="17,19 23,19 20,31" fill="white" />
      </g>

      {/* ── LOWER TEETH ── large triangles pointing up from lower jaw */}
      <g opacity="0.92">
        <polygon points="5,39  11,39  8,28"  fill="white" />
        <polygon points="11,43 17,43 14,31" fill="white" />
        <polygon points="17,45 23,45 20,33" fill="white" />
      </g>

      {/* ── GILL SLITS ── */}
      <path d="M28 18 L26 46" stroke="white" strokeWidth="1.2" opacity="0.18" strokeLinecap="round" />
      <path d="M34 17 L32 47" stroke="white" strokeWidth="1.2" opacity="0.18" strokeLinecap="round" />

      {/* ── EYE ── bold and visible */}
      <circle cx="54" cy="23" r="5.5" fill="white" opacity="0.95" />
      <circle cx="55" cy="23.8" r="3" fill="#05101f" />
      <circle cx="56.3" cy="22.5" r="1.2" fill="white" />
    </svg>
  );
}
