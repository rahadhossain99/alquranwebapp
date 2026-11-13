import React, { useState } from 'react';
import { BookOpenCheck, Calendar, Clock, Flame, Headphones, RotateCcw } from 'lucide-react';
import { TOTAL_QURAN_AYAHS } from '../data/surahMeta';
import { ListeningStats, UiLanguage } from '../types/quran';
import {
  buildActivitySeries,
  calculateKhatamProgress,
  formatTimeBreakdown,
  toBengaliDigits,
} from '../utils/quranLogic';

interface ProgressViewProps {
  readAyahKeys: string[];
  listeningStats: ListeningStats;
  uiLanguage: UiLanguage;
  onResetStats: () => void;
}

function formatStartedDate(dateKey: string | null, isBn: boolean): string {
  if (!dateKey) {
    return isBn ? 'এখনো শুরু হয়নি' : 'Not started yet';
  }
  const [y, m, d] = dateKey.split('-').map(Number);
  if (!y || !m || !d) return dateKey;
  const date = new Date(y, m - 1, d);
  try {
    return new Intl.DateTimeFormat(isBn ? 'bn-BD' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  } catch {
    return dateKey;
  }
}

function buildSmoothBezierPath(coords: { x: number; y: number }[]): string {
  if (coords.length === 0) return '';
  if (coords.length === 1) return `M ${coords[0].x} ${coords[0].y}`;
  let d = `M ${coords[0].x} ${coords[0].y}`;
  for (let i = 0; i < coords.length - 1; i++) {
    const p0 = coords[i];
    const p1 = coords[i + 1];
    const cx = (p0.x + p1.x) / 2;
    d += ` C ${cx} ${p0.y}, ${cx} ${p1.y}, ${p1.x} ${p1.y}`;
  }
  return d;
}

export const ProgressView: React.FC<ProgressViewProps> = ({
  readAyahKeys,
  listeningStats,
  uiLanguage,
  onResetStats,
}) => {
  const [rangeDays, setRangeDays] = useState<7 | 14>(7);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const isBn = uiLanguage === 'bn';

  const { readCount, percentage } = calculateKhatamProgress(
    readAyahKeys,
    TOTAL_QURAN_AYAHS
  );
  const breakdown = formatTimeBreakdown(listeningStats.totalSeconds);
  const activeDaysCount = listeningStats.activeDates.length;
  const series = buildActivitySeries(listeningStats.dailySeconds, rangeDays);

  const maxMinutes = Math.max(5, ...series.map((p) => Math.ceil(p.minutes)));

  // SVG Chart Geometry
  const chartW = 720;
  const chartH = 210;
  const padL = 40;
  const padR = 18;
  const padT = 22;
  const padB = 34;
  const plotW = chartW - padL - padR;
  const plotH = chartH - padT - padB;
  const barGap = rangeDays === 7 ? 28 : 12;
  const barW = Math.max(
    14,
    Math.min(34, Math.floor((plotW - barGap * (series.length - 1)) / series.length))
  );
  const totalBarsSpan = series.length * barW + (series.length - 1) * barGap;
  const startX = padL + Math.max(0, (plotW - totalBarsSpan) / 2);

  const waveCoords = series.map((pt, i) => {
    const cx = startX + i * (barW + barGap) + barW / 2;
    const ratio = Math.min(1, pt.minutes / maxMinutes);
    const cy = padT + plotH - ratio * plotH;
    return { x: cx, y: cy };
  });

  const smoothLinePath = buildSmoothBezierPath(waveCoords);
  const smoothAreaPath =
    waveCoords.length > 0
      ? `${smoothLinePath} L ${waveCoords[waveCoords.length - 1].x} ${
          padT + plotH
        } L ${waveCoords[0].x} ${padT + plotH} Z`
      : '';

  const hasAnyListening = listeningStats.totalSeconds > 0 || readCount > 0;
  const activePoint = hoveredIdx !== null ? series[hoveredIdx] : null;

  // Radial gauge circumference for Total Ayahs Read
  const ringR = 24;
  const ringC = 2 * Math.PI * ringR;
  const ringOffset = ringC * (1 - Math.min(100, percentage) / 100);

  return (
    <section
      aria-label={isBn ? 'তিলাওয়াত সময় ও অগ্রগতি' : 'Listening Time & Progress'}
      className="max-w-5xl mx-auto space-y-6 animate-neu-enter"
    >
      {/* Journey Overview Header */}
      <div className="neu-raised rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[var(--neu-text-primary)] font-bengali">
              {isBn ? 'তিলাওয়াত ও সময়ের অগ্রগতি' : 'Listening Journey & Activity'}
            </h1>
            <p className="text-sm text-[var(--neu-text-secondary)] mt-1">
              {isBn
                ? 'শুরুর তারিখ থেকে অডিও শোনার মোট সময় (দিন-ঘণ্টা-মিনিট-সেকেন্ড), পঠিত আয়াত এবং দৈনিক ৩ডি গ্রাফ'
                : 'Audio listening duration, Ayahs read, active days, and 3D activity chart'}
            </p>
          </div>

          {hasAnyListening && !confirmReset && (
            <button
              type="button"
              onClick={() => setConfirmReset(true)}
              className="neu-btn px-3.5 py-2 rounded-xl text-xs font-semibold text-[var(--neu-text-secondary)] hover:text-rose-600 inline-flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{isBn ? 'তথ্য রিসেট' : 'Reset Stats'}</span>
            </button>
          )}
        </div>

        {/* Interactive Reset Confirmation Bar */}
        {confirmReset && (
          <div
            role="alertdialog"
            aria-label={isBn ? 'তথ্য রিসেট নিশ্চিতকরণ' : 'Confirm Reset Stats'}
            className="neu-inset rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-drop-from-top"
          >
            <p className="text-xs sm:text-sm font-semibold text-[var(--neu-text-primary)] font-bengali">
              {isBn
                ? 'আপনি কি নিশ্চিতভাবে সকল অগ্রগতি ও সময়ের তথ্য রিসেট করতে চান?'
                : 'Are you sure you want to reset all listening and reading progress?'}
            </p>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  onResetStats();
                  setConfirmReset(false);
                }}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 cursor-pointer"
              >
                {isBn ? 'হ্যাঁ, রিসেট করুন' : 'Yes, Reset'}
              </button>
              <button
                type="button"
                onClick={() => setConfirmReset(false)}
                className="neu-btn px-3.5 py-2 rounded-xl text-xs font-semibold text-[var(--neu-text-primary)] cursor-pointer"
              >
                {isBn ? 'বাতিল করুন' : 'Cancel'}
              </button>
            </div>
          </div>
        )}

        {/* 4 Primary 3D Journey Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {/* Start Date Card */}
          <div className="neu-inset rounded-2xl p-4 sm:p-5 flex items-start gap-3.5">
            <div className="neu-raised-sm w-11 h-11 rounded-xl flex items-center justify-center text-[var(--neu-accent)] shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-xs text-[var(--neu-text-muted)]">
                {isBn ? 'শুরুর তারিখ' : 'Start Date'}
              </div>
              <div className="text-base font-bold text-[var(--neu-text-primary)] mt-1 font-bengali leading-snug">
                {formatStartedDate(listeningStats.startedDate, isBn)}
              </div>
              <div className="text-[11px] text-[var(--neu-text-muted)] mt-0.5">
                {isBn ? 'প্রথম পাঠ ও তিলাওয়াত' : 'Journey started'}
              </div>
            </div>
          </div>

          {/* Total Active Days Card */}
          <div className="neu-inset rounded-2xl p-4 sm:p-5 flex items-start gap-3.5">
            <div className="neu-raised-sm w-11 h-11 rounded-xl flex items-center justify-center text-[var(--neu-gold)] shrink-0">
              <Flame className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-xs text-[var(--neu-text-muted)]">
                {isBn ? 'মোট সক্রিয় দিন' : 'Total Active Days'}
              </div>
              <div className="text-2xl font-bold text-[var(--neu-text-primary)] mt-0.5 tabular-nums">
                {isBn
                  ? `${toBengaliDigits(activeDaysCount)} দিন`
                  : `${activeDaysCount} ${activeDaysCount === 1 ? 'Day' : 'Days'}`}
              </div>
              <div className="text-[11px] text-[var(--neu-text-muted)] mt-0.5">
                {isBn ? 'নিয়মিত কুরআন চর্চা' : 'Consistent days'}
              </div>
            </div>
          </div>

          {/* Total Ayahs Read (Auto Live Increment) */}
          <div
            data-testid="progress-ayah-count"
            className="neu-inset rounded-2xl p-4 sm:p-5 flex items-center justify-between gap-3"
          >
            <div className="flex items-start gap-3.5 min-w-0">
              <div className="neu-raised-sm w-11 h-11 rounded-xl flex items-center justify-center text-[var(--neu-accent)] shrink-0">
                <BookOpenCheck className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="text-xs text-[var(--neu-text-muted)]">
                  {isBn ? 'মোট পঠিত আয়াত' : 'Total Ayahs Read'}
                </div>
                <div className="text-2xl font-bold text-[var(--neu-accent)] mt-0.5 tabular-nums font-bengali">
                  {isBn ? toBengaliDigits(readCount) : readCount}
                </div>
                <div className="text-[11px] text-[var(--neu-text-muted)] mt-0.5 tabular-nums">
                  {isBn
                    ? `মোট ৬,২৩৬ এর ${toBengaliDigits(percentage)}%`
                    : `${percentage}% of 6,236`}
                </div>
              </div>
            </div>

            <svg width="56" height="56" viewBox="0 0 60 60" className="shrink-0">
              <circle
                cx="30"
                cy="30"
                r={ringR}
                fill="none"
                stroke="var(--neu-divider)"
                strokeWidth="5"
              />
              <circle
                cx="30"
                cy="30"
                r={ringR}
                fill="none"
                stroke="var(--neu-accent)"
                strokeWidth="5"
                strokeLinecap="round"
                strokeDasharray={ringC}
                strokeDashoffset={ringOffset}
                transform="rotate(-90 30 30)"
                className="transition-all duration-500"
              />
              <text
                x="30"
                y="34"
                textAnchor="middle"
                fontSize="11"
                fontWeight="700"
                fill="var(--neu-text-primary)"
              >
                {isBn ? `${toBengaliDigits(Math.round(percentage))}%` : `${Math.round(percentage)}%`}
              </text>
            </svg>
          </div>

          {/* Total Live Duration Summary */}
          <div className="neu-inset rounded-2xl p-4 sm:p-5 flex items-start gap-3.5">
            <div className="neu-raised-sm w-11 h-11 rounded-xl flex items-center justify-center text-[var(--neu-accent)] shrink-0">
              <Headphones className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-xs text-[var(--neu-text-muted)]">
                {isBn ? 'মোট ব্যয়কৃত সময়' : 'Total Time Spent'}
              </div>
              <div className="text-lg font-bold text-[var(--neu-text-primary)] mt-1 tabular-nums font-bengali">
                {isBn
                  ? `${toBengaliDigits(breakdown.hours)} ঘণ্টা ${toBengaliDigits(breakdown.minutes)} মিনিট`
                  : `${breakdown.hours}h ${breakdown.minutes}m`}
              </div>
              <div className="text-[11px] text-[var(--neu-accent)] font-semibold mt-0.5 tabular-nums">
                {isBn
                  ? `${toBengaliDigits(breakdown.seconds)} সেকেন্ড`
                  : `${breakdown.seconds} seconds`}
              </div>
            </div>
          </div>
        </div>

        {/* 4-Unit Tactile Live Breakdown: Days / Hours / Minutes / Seconds */}
        <div className="pt-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-[var(--neu-text-secondary)] mb-3">
            <Clock className="w-3.5 h-3.5 text-[var(--neu-accent)]" />
            <span>
              {isBn
                ? 'সর্বমোট সময়ের হিসাব (দিন · ঘণ্টা · মিনিট · সেকেন্ড)'
                : 'Cumulative Live Breakdown (Days · Hours · Minutes · Seconds)'}
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            {[
              { value: breakdown.days, bn: 'দিন', en: 'Days', accent: false },
              { value: breakdown.hours, bn: 'ঘণ্টা', en: 'Hours', accent: false },
              { value: breakdown.minutes, bn: 'মিনিট', en: 'Minutes', accent: false },
              { value: breakdown.seconds, bn: 'সেকেন্ড', en: 'Seconds', accent: true },
            ].map((unit) => (
              <div
                key={unit.en}
                data-testid={`progress-unit-${unit.en.toLowerCase()}`}
                className="neu-raised-sm rounded-2xl py-4 px-3 text-center transition-all duration-300"
              >
                <div
                  className={`text-2xl sm:text-3xl font-bold tabular-nums transition-transform duration-200 ${
                    unit.accent ? 'text-[var(--neu-accent)]' : 'text-[var(--neu-text-primary)]'
                  }`}
                >
                  {isBn
                    ? toBengaliDigits(String(unit.value).padStart(2, '0'))
                    : String(unit.value).padStart(2, '0')}
                </div>
                <div className="text-xs font-semibold text-[var(--neu-text-muted)] mt-1 font-bengali">
                  {isBn ? unit.bn : unit.en}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Signature 3D Recessed Pillar & Wave SVG Chart */}
      <div className="neu-raised rounded-3xl p-6 sm:p-8 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-[var(--neu-text-primary)] font-bengali">
              {isBn ? 'দৈনিক তিলাওয়াত ও পাঠ গ্রাফ' : 'Daily Activity & Flow Chart'}
            </h2>
            <p className="text-xs text-[var(--neu-text-muted)] mt-0.5 tabular-nums">
              {activePoint
                ? isBn
                  ? `${activePoint.dateKey} · ${toBengaliDigits(activePoint.minutes)} মিনিট (${toBengaliDigits(activePoint.seconds)} সেকেন্ড)`
                  : `${activePoint.dateKey} · ${activePoint.minutes} min (${activePoint.seconds}s)`
                : isBn
                  ? `গত ${toBengaliDigits(rangeDays)} দিনের প্রতিদিনের সক্রিয় সময় (মিনিট)`
                  : `Daily active minutes over the last ${rangeDays} days`}
            </p>
          </div>

          <div className="neu-inset p-1.5 rounded-2xl flex items-center gap-1">
            {([7, 14] as const).map((days) => (
              <button
                key={days}
                type="button"
                onClick={() => {
                  setRangeDays(days);
                  setHoveredIdx(null);
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all tabular-nums ${
                  rangeDays === days
                    ? 'neu-raised-sm text-[var(--neu-accent)]'
                    : 'text-[var(--neu-text-secondary)]'
                }`}
              >
                {isBn ? `${toBengaliDigits(days)} দিন` : `${days} Days`}
              </button>
            ))}
          </div>
        </div>

        {/* Sculpted 3D SVG Chart Container */}
        <div className="neu-inset rounded-3xl p-4 sm:p-6">
          <div className="w-full overflow-x-auto">
            <svg
              viewBox={`0 0 ${chartW} ${chartH}`}
              className="w-full min-w-[460px] h-auto"
              role="img"
              aria-label={isBn ? 'দৈনিক তিলাওয়াত গ্রাফ' : 'Daily activity chart'}
            >
              <defs>
                <linearGradient id="neuPillarGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--neu-gold)" stopOpacity="0.95" />
                  <stop offset="35%" stopColor="var(--neu-accent)" stopOpacity="0.95" />
                  <stop offset="100%" stopColor="var(--neu-accent)" stopOpacity="0.45" />
                </linearGradient>
                <linearGradient id="neuWaveFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--neu-accent)" stopOpacity="0.22" />
                  <stop offset="100%" stopColor="var(--neu-accent)" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="neuGrooveGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="var(--neu-shadow-dark)" stopOpacity="0.24" />
                  <stop offset="50%" stopColor="var(--neu-surface)" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="var(--neu-shadow-light)" stopOpacity="0.35" />
                </linearGradient>
                <filter id="neuGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#0f766e" floodOpacity="0.28" />
                </filter>
              </defs>

              {/* Horizontal Reference Gridlines & Y Labels */}
              {[0, 0.5, 1].map((frac) => {
                const y = padT + plotH - frac * plotH;
                const val = Math.round(maxMinutes * frac);
                return (
                  <g key={frac}>
                    <line
                      x1={padL}
                      y1={y}
                      x2={chartW - padR}
                      y2={y}
                      stroke="var(--neu-divider)"
                      strokeDasharray={frac === 0 ? undefined : '4 5'}
                    />
                    <text
                      x={padL - 8}
                      y={y + 4}
                      textAnchor="end"
                      fontSize="10"
                      fontWeight="600"
                      fill="var(--neu-text-muted)"
                    >
                      {isBn ? toBengaliDigits(val) : val}
                    </text>
                  </g>
                );
              })}

              {/* Soft Wave Area Behind 3D Pillars */}
              {smoothAreaPath && <path d={smoothAreaPath} fill="url(#neuWaveFill)" />}

              {/* Sculpted Vertical 3D Channels & Luminous Pillars */}
              {series.map((pt, i) => {
                const x = startX + i * (barW + barGap);
                const ratio = Math.min(1, pt.minutes / maxMinutes);
                const h = pt.seconds > 0 ? Math.max(12, ratio * plotH) : 0;
                const y = padT + plotH - h;
                const isHover = hoveredIdx === i;
                const dayNum = pt.dateKey.slice(8);
                const xLabel =
                  rangeDays === 7
                    ? isBn
                      ? pt.dayShortBn
                      : pt.dayShortEn
                    : isBn
                      ? toBengaliDigits(Number(dayNum))
                      : String(Number(dayNum));

                return (
                  <g
                    key={pt.dateKey}
                    onMouseEnter={() => setHoveredIdx(i)}
                    onMouseLeave={() => setHoveredIdx(null)}
                    className="cursor-pointer"
                  >
                    {/* Carved 3D Neumorphic Channel Slot */}
                    <rect
                      x={x}
                      y={padT}
                      width={barW}
                      height={plotH}
                      rx={barW / 2}
                      fill="url(#neuGrooveGrad)"
                      stroke="var(--neu-divider)"
                      strokeWidth="1"
                    />

                    {/* Filled 3D Capsule Pillar */}
                    {h > 0 && (
                      <rect
                        x={x + 2}
                        y={y}
                        width={Math.max(8, barW - 4)}
                        height={h}
                        rx={Math.max(4, (barW - 4) / 2)}
                        fill="url(#neuPillarGrad)"
                        filter={isHover ? 'url(#neuGlow)' : undefined}
                        opacity={isHover ? 1 : 0.9}
                      />
                    )}

                    {/* Specular top glint dot inside pillar */}
                    {h > 10 && (
                      <circle
                        cx={x + barW / 2}
                        cy={y + 6}
                        r={isHover ? 3.5 : 2.5}
                        fill="#ffffff"
                        opacity="0.85"
                      />
                    )}

                    {/* Transparent Wide Hit Target */}
                    <rect
                      x={x - 5}
                      y={padT}
                      width={barW + 10}
                      height={plotH + 18}
                      fill="transparent"
                    />

                    <text
                      x={x + barW / 2}
                      y={chartH - 10}
                      textAnchor="middle"
                      fontSize="11"
                      fontWeight={isHover ? '700' : '600'}
                      fill={isHover ? 'var(--neu-accent)' : 'var(--neu-text-muted)'}
                    >
                      {xLabel}
                    </text>
                  </g>
                );
              })}

              {/* Smooth Cubic Bezier Wave Line Overlay */}
              {smoothLinePath && (
                <path
                  d={smoothLinePath}
                  fill="none"
                  stroke="var(--neu-gold)"
                  strokeWidth="2.25"
                  strokeLinecap="round"
                  opacity="0.92"
                />
              )}

              {/* Hover Value Callout Badge */}
              {hoveredIdx !== null && waveCoords[hoveredIdx] && series[hoveredIdx] && (
                <g
                  transform={`translate(${Math.min(
                    chartW - 88,
                    Math.max(44, waveCoords[hoveredIdx].x)
                  )}, ${Math.max(18, waveCoords[hoveredIdx].y - 12)})`}
                >
                  <rect
                    x="-42"
                    y="-16"
                    width="84"
                    height="22"
                    rx="11"
                    fill="var(--neu-accent)"
                  />
                  <text
                    x="0"
                    y="-2"
                    textAnchor="middle"
                    fontSize="10"
                    fontWeight="700"
                    fill="#ffffff"
                  >
                    {isBn
                      ? `${toBengaliDigits(series[hoveredIdx].minutes)} মি.`
                      : `${series[hoveredIdx].minutes} min`}
                  </text>
                </g>
              )}
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
};
