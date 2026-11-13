import React, { useState } from 'react';
import { Search, Star } from 'lucide-react';
import { SurahMeta, UiLanguage } from '../types/quran';
import { RevelationFilter, filterSurahs, toBengaliDigits } from '../utils/quranLogic';
import { AyahRosette } from './GeometricIcons';

interface SurahDirectoryProps {
  surahs: SurahMeta[];
  activeSurahNumber: number;
  playingSurahNumber: number;
  isPlaying: boolean;
  favoriteSurahs: number[];
  uiLanguage: UiLanguage;
  onSelectSurah: (surahNumber: number) => void;
  onToggleFavoriteSurah: (surahNumber: number) => void;
}

type DirectoryFilter = RevelationFilter | 'favorites';

export const SurahDirectory: React.FC<SurahDirectoryProps> = ({
  surahs,
  activeSurahNumber,
  playingSurahNumber,
  isPlaying,
  favoriteSurahs,
  uiLanguage,
  onSelectSurah,
  onToggleFavoriteSurah,
}) => {
  const [query, setQuery] = useState('');
  const [revelation, setRevelation] = useState<DirectoryFilter>('all');
  const isBn = uiLanguage === 'bn';

  const baseFiltered = filterSurahs(
    surahs,
    query,
    revelation === 'favorites' ? 'all' : revelation
  );
  const filtered =
    revelation === 'favorites'
      ? baseFiltered.filter((s) => favoriteSurahs.includes(s.number))
      : baseFiltered;

  const tabs: { id: DirectoryFilter; bn: string; en: string }[] = [
    { id: 'all', bn: 'সকল (১১৪)', en: 'All (114)' },
    {
      id: 'favorites',
      bn:
        favoriteSurahs.length > 0
          ? `পছন্দের (${toBengaliDigits(favoriteSurahs.length)})`
          : 'পছন্দের',
      en: favoriteSurahs.length > 0 ? `Favorites (${favoriteSurahs.length})` : 'Favorites',
    },
    { id: 'Meccan', bn: 'মক্কী', en: 'Meccan' },
    { id: 'Medinan', bn: 'মাদানী', en: 'Medinan' },
  ];

  return (
    <section
      aria-label={isBn ? 'সকল সূরার তালিকা' : 'Complete Surah Directory'}
      className="space-y-6 animate-neu-enter"
    >
      <div className="neu-raised rounded-3xl p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--neu-text-primary)] font-bengali">
            {isBn ? 'পবিত্র কুরআনের সূরাসমূহ' : 'Surahs of the Noble Quran'}
          </h1>
          <p className="text-sm text-[var(--neu-text-secondary)] mt-1 tabular-nums">
            {isBn
              ? '১১৪টি সূরা · ৩০ পারা · ৬,২৩৬ আয়াত'
              : '114 Surahs · 30 Juz · 6,236 Ayahs'}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="neu-inset rounded-2xl px-4 py-2.5 flex items-center gap-2.5 min-w-[220px]">
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

          <div className="neu-inset p-1.5 rounded-2xl flex items-center gap-1 overflow-x-auto">
            {tabs.map((tab) => {
              const active = revelation === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setRevelation(tab.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-all duration-200 tabular-nums ${
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
        <div className="neu-raised rounded-3xl p-12 text-center space-y-2">
          <p className="text-base font-medium text-[var(--neu-text-secondary)] font-bengali">
            {revelation === 'favorites'
              ? isBn
                ? 'এখনো কোনো সূরা পছন্দের তালিকায় যুক্ত করা হয়নি। সূরার নামের পাশের স্টার আইকনে ক্লিক করুন।'
                : 'No favorite Surahs yet. Tap the star icon next to any Surah name.'
              : isBn
                ? 'আপনার অনুসন্ধানের সাথে মিলে এমন কোনো সূরা পাওয়া যায়নি।'
                : 'No Surahs match your search criteria.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((surah) => {
            const isCurrent = surah.number === activeSurahNumber;
            const isSurahPlaying = isPlaying && surah.number === playingSurahNumber;
            const isFav = favoriteSurahs.includes(surah.number);
            const numLabel = isBn ? toBengaliDigits(surah.number) : String(surah.number);
            const revLabel = isBn
              ? surah.revelationType === 'Meccan'
                ? 'মক্কী'
                : 'মাদানী'
              : surah.revelationType;
            const ayahsLabel = isBn
              ? `${toBengaliDigits(surah.ayahCount)} আয়াত`
              : `${surah.ayahCount} Ayahs`;

            const innerContent = (
              <>
                <button
                  type="button"
                  onClick={() => onSelectSurah(surah.number)}
                  className="flex-1 min-w-0 flex items-center gap-3.5 text-left cursor-pointer focus-visible:outline-none rounded-2xl"
                >
                  <AyahRosette
                    label={numLabel}
                    active={isCurrent || isSurahPlaying}
                    playing={isSurahPlaying}
                    size={42}
                  />
                  <div className="min-w-0 flex-1">
                    <h2 className="text-base font-bold text-[var(--neu-text-primary)] truncate font-bengali">
                      {isBn ? surah.bengaliName : surah.englishName}
                    </h2>
                    <p className="text-xs text-[var(--neu-text-secondary)] truncate mt-0.5">
                      {isBn ? surah.bengaliMeaning : surah.englishMeaning}
                    </p>
                    <p className="text-[11px] text-[var(--neu-text-muted)] mt-1 tabular-nums">
                      {revLabel} · {ayahsLabel}
                      {isSurahPlaying && (
                        <span className="ml-1.5 font-semibold text-[var(--neu-accent)]">
                          · {isBn ? 'চলছে' : 'Playing'}
                        </span>
                      )}
                    </p>
                  </div>
                </button>

                <div className="flex items-center gap-2.5 shrink-0">
                  <span className="font-quran text-lg sm:text-xl text-[var(--neu-text-primary)]">
                    {surah.arabicName.replace('سُورَةُ ', '')}
                  </span>

                  <button
                    type="button"
                    onClick={() => onToggleFavoriteSurah(surah.number)}
                    aria-pressed={isFav}
                    aria-label={
                      isBn
                        ? `${surah.bengaliName} ফেভারিট করুন`
                        : `Favorite ${surah.englishName}`
                    }
                    className={`w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer transition-all duration-200 ${
                      isFav
                        ? 'neu-inset text-[var(--neu-gold)] scale-105'
                        : 'neu-btn text-[var(--neu-text-muted)] hover:text-[var(--neu-gold)]'
                    }`}
                  >
                    <Star className={`w-4 h-4 ${isFav ? 'fill-current' : ''}`} />
                  </button>
                </div>
              </>
            );

            if (isSurahPlaying) {
              return (
                <div
                  key={surah.number}
                  data-surah-playing="true"
                  className="ayah-playing-halo surah-card-perf"
                >
                  <div className="ayah-playing-halo-inner p-4 sm:p-5 flex items-center justify-between gap-3">
                    {innerContent}
                  </div>
                </div>
              );
            }

            return (
              <div
                key={surah.number}
                data-surah-playing="false"
                className={`rounded-3xl p-4 sm:p-5 flex items-center justify-between gap-3 surah-card-perf ${
                  isCurrent
                    ? 'neu-inset ring-1 ring-[var(--neu-accent)]/40'
                    : 'neu-btn'
                }`}
              >
                {innerContent}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
