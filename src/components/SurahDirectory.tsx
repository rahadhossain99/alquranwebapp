import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { SurahMeta, UiLanguage } from '../types/quran';
import { RevelationFilter, filterSurahs, toBengaliDigits } from '../utils/quranLogic';
import { AyahRosette } from './GeometricIcons';

interface SurahDirectoryProps {
  surahs: SurahMeta[];
  activeSurahNumber: number;
  uiLanguage: UiLanguage;
  onSelectSurah: (surahNumber: number) => void;
}

export const SurahDirectory: React.FC<SurahDirectoryProps> = ({
  surahs,
  activeSurahNumber,
  uiLanguage,
  onSelectSurah,
}) => {
  const [query, setQuery] = useState('');
  const [revelation, setRevelation] = useState<RevelationFilter>('all');
  const isBn = uiLanguage === 'bn';

  const filtered = filterSurahs(surahs, query, revelation);

  const tabs: { id: RevelationFilter; bn: string; en: string }[] = [
    { id: 'all', bn: 'সকল (১১৪)', en: 'All (114)' },
    { id: 'Meccan', bn: 'মক্কী', en: 'Meccan' },
    { id: 'Medinan', bn: 'মাদানী', en: 'Medinan' },
  ];

  return (
    <section aria-label={isBn ? 'সকল সূরার তালিকা' : 'Complete Surah Directory'} className="space-y-6">
      <div className="neu-raised rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--neu-text-primary)] font-bengali">
            {isBn ? 'পবিত্র কুরআনের সূরাসমূহ' : 'Surahs of the Noble Quran'}
          </h1>
          <p className="text-sm text-[var(--neu-text-secondary)] mt-1">
            {isBn
              ? '১১৪টি সূরা · ৩০ পারা · ৬,২৩৬ আয়াত'
              : '114 Surahs · 30 Juz · 6,236 Ayahs'}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="neu-inset rounded-2xl px-4 py-2.5 flex items-center gap-2.5 min-w-[240px]">
            <Search className="w-4 h-4 text-[var(--neu-text-muted)] shrink-0" />
            <label htmlFor="directory-search" className="sr-only">
              {isBn ? 'সূরা অনুসন্ধান' : 'Search Surahs'}
            </label>
            <input
              id="directory-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={isBn ? 'নাম, অর্থ বা নম্বর লিখুন...' : 'Name, meaning, or number...'}
              className="w-full bg-transparent text-sm text-[var(--neu-text-primary)] placeholder:text-[var(--neu-text-muted)] focus:outline-none"
            />
          </div>

          <div className="neu-inset-sm p-1 rounded-2xl flex items-center gap-1">
            {tabs.map((tab) => {
              const active = revelation === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setRevelation(tab.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-all ${
                    active
                      ? 'neu-raised-sm text-[var(--neu-accent)]'
                      : 'text-[var(--neu-text-secondary)] hover:text-[var(--neu-text-primary)]'
                  }`}
                >
                  {isBn ? tab.bn : tab.en}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="neu-raised rounded-3xl p-12 text-center">
          <p className="text-base font-medium text-[var(--neu-text-secondary)]">
            {isBn
              ? 'আপনার অনুসন্ধানের সাথে মিলে এমন কোনো সূরা পাওয়া যায়নি।'
              : 'No Surahs match your search criteria.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((surah) => {
            const isCurrent = surah.number === activeSurahNumber;
            const numLabel = isBn ? toBengaliDigits(surah.number) : String(surah.number);
            const revLabel = isBn
              ? surah.revelationType === 'Meccan'
                ? 'মক্কী'
                : 'মাদানী'
              : surah.revelationType;
            const ayahsLabel = isBn
              ? `${toBengaliDigits(surah.ayahCount)} আয়াত`
              : `${surah.ayahCount} Ayahs`;

            return (
              <button
                key={surah.number}
                type="button"
                onClick={() => onSelectSurah(surah.number)}
                className={`text-left rounded-3xl p-5 flex items-center justify-between gap-4 cursor-pointer transition-all ${
                  isCurrent
                    ? 'neu-inset ring-1 ring-[var(--neu-accent)]/40'
                    : 'neu-btn'
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <AyahRosette label={numLabel} active={isCurrent} size={42} />
                  <div className="min-w-0">
                    <h2 className="text-base font-bold text-[var(--neu-text-primary)] truncate font-bengali">
                      {isBn ? surah.bengaliName : surah.englishName}
                    </h2>
                    <p className="text-xs text-[var(--neu-text-secondary)] truncate mt-0.5">
                      {isBn ? surah.bengaliMeaning : surah.englishMeaning}
                    </p>
                    <p className="text-[11px] text-[var(--neu-text-muted)] mt-1 tabular-nums">
                      {revLabel} · {ayahsLabel}
                    </p>
                  </div>
                </div>

                <span className="font-quran text-xl text-[var(--neu-text-primary)] shrink-0">
                  {surah.arabicName.replace('سُورَةُ ', '')}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
};
