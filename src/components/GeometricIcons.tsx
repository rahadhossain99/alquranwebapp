import React from 'react';

interface AyahRosetteProps {
  label: string;
  active?: boolean;
  size?: number;
}

export const AyahRosette: React.FC<AyahRosetteProps> = ({
  label,
  active = false,
  size = 40,
}) => {
  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 select-none transition-transform duration-200 ${
        active ? 'scale-105' : ''
      }`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 48 48"
        width={size}
        height={size}
        aria-hidden="true"
        className={`transition-colors duration-200 ${
          active
            ? 'text-[var(--neu-accent)]'
            : 'text-[var(--neu-gold)] opacity-85'
        }`}
      >
        {/* Outer rotated squares forming 8-pointed Rub el Hizb */}
        <rect
          x="10"
          y="10"
          width="28"
          height="28"
          rx="3"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
        />
        <rect
          x="10"
          y="10"
          width="28"
          height="28"
          rx="3"
          transform="rotate(45 24 24)"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
        />
        <circle
          cx="24"
          cy="24"
          r="10.5"
          fill={active ? 'var(--neu-accent-soft)' : 'var(--neu-gold-soft)'}
          stroke="currentColor"
          strokeWidth="1.1"
        />
      </svg>
      <span
        className={`absolute inset-0 flex items-center justify-center text-[11px] font-semibold tabular-nums ${
          active
            ? 'text-[var(--neu-accent)]'
            : 'text-[var(--neu-text-primary)]'
        }`}
      >
        {label}
      </span>
    </div>
  );
};

export const NoorEmblem: React.FC<{ size?: number }> = ({ size = 34 }) => (
  <svg
    viewBox="0 0 40 40"
    width={size}
    height={size}
    aria-hidden="true"
    className="shrink-0"
  >
    <rect
      x="7"
      y="7"
      width="26"
      height="26"
      rx="5"
      fill="none"
      stroke="var(--neu-accent)"
      strokeWidth="1.6"
    />
    <rect
      x="7"
      y="7"
      width="26"
      height="26"
      rx="5"
      transform="rotate(45 20 20)"
      fill="none"
      stroke="var(--neu-gold)"
      strokeWidth="1.4"
      opacity="0.85"
    />
    <path
      d="M22.2 14.2a6.4 6.4 0 1 0 3.6 10.7 5.3 5.3 0 0 1-3.6-10.7Z"
      fill="var(--neu-accent)"
    />
  </svg>
);

export const ArabesqueDivider: React.FC = () => (
  <div className="flex items-center justify-center gap-4 my-5 select-none" aria-hidden="true">
    <div className="h-px flex-1 max-w-[120px] bg-gradient-to-r from-transparent to-[var(--neu-divider)]" />
    <svg viewBox="0 0 64 20" width="56" height="18" className="text-[var(--neu-gold)] opacity-80">
      <path
        d="M32 2 L38 10 L32 18 L26 10 Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <circle cx="32" cy="10" r="2.2" fill="currentColor" />
      <path d="M4 10 H22 M42 10 H60" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
      <circle cx="15" cy="10" r="1.4" fill="currentColor" opacity="0.65" />
      <circle cx="49" cy="10" r="1.4" fill="currentColor" opacity="0.65" />
    </svg>
    <div className="h-px flex-1 max-w-[120px] bg-gradient-to-l from-transparent to-[var(--neu-divider)]" />
  </div>
);

export const NeuWaveform: React.FC<{ isPlaying: boolean }> = ({ isPlaying }) => {
  const heights = [42, 78, 56, 94, 64, 82, 48];
  return (
    <div className="flex items-center gap-[3px] h-5" aria-hidden="true">
      {heights.map((h, idx) => (
        <span
          key={idx}
          className={`w-[3px] rounded-full transition-all duration-300 ${
            isPlaying
              ? 'bg-[var(--neu-accent)] animate-pulse'
              : 'bg-[var(--neu-text-muted)] opacity-45'
          }`}
          style={{
            height: isPlaying ? `${h}%` : '30%',
            animationDelay: `${idx * 110}ms`,
          }}
        />
      ))}
    </div>
  );
};
