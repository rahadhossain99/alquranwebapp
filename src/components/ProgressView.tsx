import React from 'react';
import { BookOpen, CheckCircle2, RotateCcw } from 'lucide-react';
import { SURAH_META, TOTAL_QURAN_AYAHS } from '../data/surahMeta';
import { UiLanguage } from '../types/quran';
import { calculateKhatamProgress, toBengaliDigits } from '../utils/quranLogic';

interface ProgressViewProps {
  readAyahKeys: string[];
  uiLanguage: UiLanguage;
  onSelectSurah: (surahNumber: number) => void;
  onResetProgress: () => void;
}

export const ProgressView: React.FC<ProgressViewProps> = ({
  readAyahKeys,
  uiLanguage,
  onSelectSurah,
  onResetProgress,
}) => {
  const isBn = uiLanguage === 'bn';
  const { readCount, percentage } = calculateKhatamProgress(
    readAyahKeys,
    TOTAL_QURAN_AYAHS
  );

  // Calculate per-surah read count
  const readBySurah = new Map<number, number>();
  for (const key of readAyahKeys) {
    const [surahStr] = key.split(':');
    const surahNum = Number(surahStr);
    if (surahNum > 0) {
      readBySurah.set(surahNum, (readBySurah.get(surahNum) ?? 0) + 1);
    }
  }

  const completedSurahs = SURAH_META.filter(
    (s) => (readBySurah.get(s.number) ?? 0) >= s.ayahCount
  ).length;

  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  const strokeOffset = circumference - (percentage / 100) * circumference;

  return (
    <section aria-label={isBn ? 'খতম অগ্রগতি' : 'Khatam Reading Progress'} className="space-y-6">
      <div className="neu-raised rounded-3xl p-6 sm:p-8 grid grid-cols-1 md:grid-cols-[auto_1fr] items-center gap-8">
        {/* Neumorphic Circular Progress Dial */}
        <div className="neu-inset w-44 h-44 rounded-full mx-auto md:mx-0 flex items-center justify-center relative shrink-0">
          <svg className="w-40 h-40 -rotate-90" viewBox="0 0 160 160" aria-hidden="true">
            <circle
              cx="80"
              cy="80"
              r={radius}
              fill="none"
              stroke="var(--neu-divider)"
              strokeWidth="10"
            />
            <circle
              cx="80"
              cy="80"
              r={radius}
              fill="none"
              stroke="var(--neu-accent)"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeOffset}
              className="transition-all duration-500"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-2xl font-bold text-[var(--neu-text-primary)] tabular-nums">
              {isBn ? `${toBengaliDigits(percentage)}%` : `${percentage}%`}
            </span>
            <span className="text-[11px] text-[var(--neu-text-muted)]">
              {isBn ? 'সম্পন্ন' : 'Completed'}
            </span>
          </div>
        </div>

        {/* Summary Stats & Action */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[var(--neu-text-primary)] font-bengali">
                {isBn ? 'কুরআন খতম অগ্রগতি' : 'Khatam Reading Tracker'}
              </h1>
              <p className="text-sm text-[var(--neu-text-secondary)] mt-1">
                {isBn
                  ? 'প্রতিটি আয়াত বা সূরা পঠিত হিসেবে চিহ্নিত করে আপনার অগ্রগতি সংরক্ষণ করুন।'
                  : 'Track every Ayah and Surah you complete across the 6,236 verses of the Quran.'}
              </p>
            </div>

            {readCount > 0 && (
              <button
                type="button"
                onClick={onResetProgress}
                className="neu-btn px-3.5 py-2 rounded-xl text-xs font-semibold text-[var(--neu-text-secondary)] hover:text-rose-600 inline-flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{isBn ? 'রিসেট করুন' : 'Reset'}</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="neu-inset rounded-2xl p-4">
              <div className="text-xs text-[var(--neu-text-muted)]">
                {isBn ? 'পঠিত আয়াত' : 'Ayahs Read'}
              </div>
              <div className="text-xl font-bold text-[var(--neu-text-primary)] mt-1 tabular-nums">
                {isBn
                  ? `${toBengaliDigits(readCount)} / ${toBengaliDigits(TOTAL_QURAN_AYAHS)}`
                  : `${readCount} / ${TOTAL_QURAN_AYAHS}`}
              </div>
            </div>

            <div className="neu-inset rounded-2xl p-4">
              <div className="text-xs text-[var(--neu-text-muted)]">
                {isBn ? 'সম্পূর্ণ সূরা' : 'Completed Surahs'}
              </div>
              <div className="text-xl font-bold text-[var(--neu-accent)] mt-1 tabular-nums">
                {isBn
                  ? `${toBengaliDigits(completedSurahs)} / ১১৪`
                  : `${completedSurahs} / 114`}
              </div>
            </div>

            <div className="neu-inset rounded-2xl p-4">
              <div className="text-xs text-[var(--neu-text-muted)]">
                {isBn ? 'অবশিষ্ট আয়াত' : 'Remaining Ayahs'}
              </div>
              <div className="text-xl font-bold text-[var(--neu-text-primary)] mt-1 tabular-nums">
                {isBn
                  ? toBengaliDigits(TOTAL_QURAN_AYAHS - readCount)
                  : TOTAL_QURAN_AYAHS - readCount}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Surah-by-Surah Completion Matrix */}
      <div className="neu-raised rounded-3xl p-6 sm:p-8 space-y-4">
        <h2 className="text-lg font-bold text-[var(--neu-text-primary)] font-bengali">
          {isBn ? 'সূরাভিত্তিক অগ্রগতি' : 'Progress by Surah'}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {SURAH_META.map((surah) => {
            const count = Math.min(readBySurah.get(surah.number) ?? 0, surah.ayahCount);
            const done = count >= surah.ayahCount;
            const started = count > 0 && !done;

            return (
              <button
                key={surah.number}
                type="button"
                onClick={() => onSelectSurah(surah.number)}
                className={`p-3.5 rounded-2xl text-left transition-all cursor-pointer ${
                  done
                    ? 'neu-inset ring-1 ring-[var(--neu-accent)]/40'
                    : 'neu-btn'
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-semibold text-[var(--neu-text-muted)] tabular-nums">
                    {isBn ? toBengaliDigits(surah.number) : surah.number}
                  </span>
                  {done ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-[var(--neu-accent)]" />
                  ) : started ? (
                    <BookOpen className="w-3.5 h-3.5 text-[var(--neu-gold)]" />
                  ) : null}
                </div>
                <div className="text-xs font-bold text-[var(--neu-text-primary)] truncate mt-1 font-bengali">
                  {isBn ? surah.bengaliName : surah.englishName}
                </div>
                <div className="text-[11px] text-[var(--neu-text-muted)] tabular-nums mt-0.5">
                  {isBn
                    ? `${toBengaliDigits(count)}/${toBengaliDigits(surah.ayahCount)}`
                    : `${count}/${surah.ayahCount}`}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};
