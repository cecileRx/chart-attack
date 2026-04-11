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
      {/* ─── UPPER JAW — thick arc at the top ─── */}
      <path
        d="M6 22 C6 10 22 2 40 2 C58 2 74 10 74 22 L74 26 C74 14 58 6 40 6 C22 6 6 14 6 26 Z"
        fill="currentColor"
      />
      {/* Upper jaw solid block */}
      <path
        d="M6 22 C6 10 22 2 40 2 C58 2 74 10 74 22"
        stroke="currentColor"
        strokeWidth="10"
        strokeLinecap="round"
        fill="none"
      />

      {/* ─── UPPER TEETH — long triangles pointing DOWN from upper jaw ─── */}
      <g fill="white">
        <polygon points="11,26  19,26  15,42" />
        <polygon points="21,24  29,24  25,41" />
        <polygon points="32,22  40,22  36,40" />
        <polygon points="40,22  48,22  44,40" />
        <polygon points="51,24  59,24  55,41" />
        <polygon points="61,26  69,26  65,42" />
      </g>

      {/* ─── LOWER JAW — thick arc at the bottom ─── */}
      <path
        d="M6 58 C6 70 22 78 40 78 C58 78 74 70 74 58"
        stroke="currentColor"
        strokeWidth="10"
        strokeLinecap="round"
        fill="none"
      />

      {/* ─── LOWER TEETH — long triangles pointing UP from lower jaw ─── */}
      <g fill="white">
        <polygon points="11,54  19,54  15,38" />
        <polygon points="21,56  29,56  25,39" />
        <polygon points="32,58  40,58  36,40" />
        <polygon points="40,58  48,58  44,40" />
        <polygon points="51,56  59,56  55,39" />
        <polygon points="61,54  69,54  65,38" />
      </g>
    </svg>
  );
}
