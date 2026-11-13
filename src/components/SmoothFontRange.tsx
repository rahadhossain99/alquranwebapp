import React, { useEffect, useRef, useState } from 'react';
import { FontSettingKey, getLiveFontCssVars, toBengaliDigits } from '../utils/quranLogic';

interface SmoothFontRangeProps {
  id: string;
  label: string;
  ariaLabel: string;
  settingKey: FontSettingKey;
  value: number;
  min: number;
  max: number;
  step: number;
  isBn: boolean;
  onCommit: (nextValue: number) => void;
}

export function applyLiveFontVar(key: FontSettingKey, px: number): void {
  if (typeof document === 'undefined') return;
  const pairs = getLiveFontCssVars(key, px);
  for (const [varName, cssVal] of pairs) {
    document.documentElement.style.setProperty(varName, cssVal);
  }
}

export const SmoothFontRange: React.FC<SmoothFontRangeProps> = ({
  id,
  label,
  ariaLabel,
  settingKey,
  value,
  min,
  max,
  step,
  isBn,
  onCommit,
}) => {
  const [draft, setDraft] = useState<number>(value);
  const timerRef = useRef<number | null>(null);
  const latestRef = useRef<number>(value);

  useEffect(() => {
    setDraft(value);
    latestRef.current = value;
  }, [value]);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);

  const flushCommit = (nextVal: number) => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (nextVal !== value) {
      onCommit(nextVal);
    }
  };

  const handleDragChange = (nextVal: number) => {
    setDraft(nextVal);
    latestRef.current = nextVal;
    applyLiveFontVar(settingKey, nextVal);

    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
    }
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null;
      onCommit(latestRef.current);
    }, 140);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <label
          htmlFor={id}
          className="text-xs font-bold text-[var(--neu-text-primary)] font-bengali"
        >
          {label}
        </label>
        <span className="text-xs font-bold text-[var(--neu-accent)] tabular-nums">
          {isBn ? `${toBengaliDigits(draft)}px` : `${draft}px`}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={draft}
        onChange={(e) => handleDragChange(Number(e.target.value))}
        onPointerUp={() => flushCommit(latestRef.current)}
        onTouchEnd={() => flushCommit(latestRef.current)}
        onBlur={() => flushCommit(latestRef.current)}
        aria-label={ariaLabel}
        className="neu-range w-full"
      />
    </div>
  );
};
