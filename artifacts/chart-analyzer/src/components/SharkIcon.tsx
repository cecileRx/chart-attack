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
      {/* ── Upper jaw arc ── */}
      <path
        d="M8 30 C8 16 22 8 40 8 C58 8 72 16 72 30"
        fill="currentColor"
        strokeLinecap="round"
      />

      {/* ── Lower jaw arc ── */}
      <path
        d="M8 50 C8 64 22 72 40 72 C58 72 72 64 72 50"
        fill="currentColor"
        strokeLinecap="round"
      />

      {/* ── Dark throat / inner mouth ── */}
      <ellipse cx="40" cy="40" rx="32" ry="12" fill="#04111f" />

      {/* ── Upper teeth (pointing down into the mouth) ── */}
      <g fill="white">
        <polygon points="18,30  25,30  21.5,46" />
        <polygon points="27,28  34,28  30.5,45" />
        <polygon points="36,27  44,27  40,45" />
        <polygon points="46,28  53,28  49.5,45" />
        <polygon points="55,30  62,30  58.5,46" />
      </g>

      {/* ── Lower teeth (pointing up into the mouth) ── */}
      <g fill="white">
        <polygon points="18,50  25,50  21.5,34" />
        <polygon points="27,52  34,52  30.5,35" />
        <polygon points="36,53  44,53  40,35" />
        <polygon points="46,52  53,52  49.5,35" />
        <polygon points="55,50  62,50  58.5,34" />
      </g>
    </svg>
  );
}
