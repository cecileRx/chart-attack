import React from 'react';

interface SharkIconProps {
  className?: string;
}

export function SharkIcon({ className }: SharkIconProps) {
  return (
    <svg
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="ChartAttack shark logo"
    >
      {/* ─── FRONT-FACING SHARK HEAD ─── */}

      {/* Outer head / crown */}
      <ellipse cx="40" cy="36" rx="32" ry="28" fill="currentColor" />

      {/* Snout protrusion — pointed tip at bottom */}
      <path
        d="M26 52 C26 60 32 66 40 68 C48 66 54 60 54 52 L26 52 Z"
        fill="currentColor"
      />

      {/* Dorsal fin / top fin coming toward viewer — center top */}
      <path d="M34 10 L40 2 L46 10 Z" fill="currentColor" />

      {/* Side fins spreading left and right */}
      <path d="M8 38 L2 28 L16 40 Z" fill="currentColor" />
      <path d="M72 38 L78 28 L64 40 Z" fill="currentColor" />

      {/* ── EYES ── */}
      {/* Left eye */}
      <circle cx="28" cy="30" r="7" fill="white" opacity="0.95" />
      <circle cx="28.8" cy="31" r="4" fill="#04111f" />
      <circle cx="30.5" cy="29.5" r="1.5" fill="white" />

      {/* Right eye */}
      <circle cx="52" cy="30" r="7" fill="white" opacity="0.95" />
      <circle cx="52.8" cy="31" r="4" fill="#04111f" />
      <circle cx="54.5" cy="29.5" r="1.5" fill="white" />

      {/* Nostril slits */}
      <ellipse cx="37" cy="44" rx="2" ry="1.2" fill="#04111f" opacity="0.4" />
      <ellipse cx="43" cy="44" rx="2" ry="1.2" fill="#04111f" opacity="0.4" />

      {/* ── MOUTH — wide gaping open ── */}
      {/* Mouth cavity (dark throat) */}
      <path
        d="M22 54 C22 62 30 70 40 72 C50 70 58 62 58 54 L22 54 Z"
        fill="#04111f"
      />

      {/* Tongue hint */}
      <ellipse cx="40" cy="66" rx="8" ry="4" fill="#1a0a0a" opacity="0.6" />

      {/* ── UPPER TEETH ── row along top of mouth */}
      <g fill="white">
        {/* Center large tooth */}
        <polygon points="37,54  43,54  40,46" />
        {/* Left of center */}
        <polygon points="30,55  36,55  33,47" />
        {/* Far left */}
        <polygon points="23,57  29,57  26,50" />
        {/* Right of center */}
        <polygon points="44,55  50,55  47,47" />
        {/* Far right */}
        <polygon points="51,57  57,57  54,50" />
      </g>

      {/* ── LOWER TEETH ── row along bottom of mouth, pointing up */}
      <g fill="white" opacity="0.88">
        {/* Center */}
        <polygon points="37,66  43,66  40,57" />
        {/* Left */}
        <polygon points="29,64  35,64  32,56" />
        {/* Far left */}
        <polygon points="22,61  27,61  24.5,53" />
        {/* Right */}
        <polygon points="45,64  51,64  48,56" />
        {/* Far right */}
        <polygon points="53,61  58,61  55.5,53" />
      </g>

      {/* Gill lines — subtle arcs on the sides */}
      <path d="M14 38 C16 34 16 42 14 44" stroke="white" strokeWidth="1.2" opacity="0.2" strokeLinecap="round" fill="none" />
      <path d="M18 36 C20 32 20 44 18 46" stroke="white" strokeWidth="1.2" opacity="0.2" strokeLinecap="round" fill="none" />
      <path d="M66 38 C64 34 64 42 66 44" stroke="white" strokeWidth="1.2" opacity="0.2" strokeLinecap="round" fill="none" />
      <path d="M62 36 C60 32 60 44 62 46" stroke="white" strokeWidth="1.2" opacity="0.2" strokeLinecap="round" fill="none" />

      {/* Head center line / subtle shading */}
      <path d="M40 10 L40 48" stroke="white" strokeWidth="0.8" opacity="0.06" />
    </svg>
  );
}
