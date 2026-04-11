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
      {/* ─── UPPER JAW — smooth rounded crescent arc ─── */}
      <path
        d="M8 28 C8 12 22 4 40 4 C58 4 72 12 72 28"
        stroke="currentColor"
        strokeWidth="12"
        strokeLinecap="round"
        fill="none"
      />

      {/* ─── UPPER TEETH — sharp triangles pointing down ─── */}
      <g fill="white">
        <polygon points="11,27  18,27  14.5,43" />
        <polygon points="21,24  28,24  24.5,41" />
        <polygon points="33,22  40,22  36.5,40" />
        <polygon points="40,22  47,22  43.5,40" />
        <polygon points="52,24  59,24  55.5,41" />
        <polygon points="62,27  69,27  65.5,43" />
      </g>

      {/* ─── LOWER JAW — smooth rounded crescent arc ─── */}
      <path
        d="M8 52 C8 68 22 76 40 76 C58 76 72 68 72 52"
        stroke="currentColor"
        strokeWidth="12"
        strokeLinecap="round"
        fill="none"
      />

      {/* ─── LOWER TEETH — sharp triangles pointing up ─── */}
      <g fill="white">
        <polygon points="11,53  18,53  14.5,37" />
        <polygon points="21,56  28,56  24.5,39" />
        <polygon points="33,58  40,58  36.5,40" />
        <polygon points="40,58  47,58  43.5,40" />
        <polygon points="52,56  59,56  55.5,39" />
        <polygon points="62,53  69,53  65.5,37" />
      </g>
    </svg>
  );
}
