import React, { useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { SurahMeta, UiLanguage } from '../types/quran';
import { RevelationFilter, filterSurahs, toBengaliDigits } from '../utils/quranLogic';
import { AyahRosette } from './GeometricIcons';

interface SurahSidebarProps {
  surahs: SurahMeta[];
  activeSurahNumber: number;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  revelationFilter: RevelationFilter;
  onRevelationChange: (f: RevelationFilter) => void;
  onSelectSurah: (surahNumber: number) => void;
  uiLanguage: UiLanguage;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const SurahSidebar: React.FC<SurahSidebarProps> = ({
  surahs,
  activeSurahNumber,
  searchQuery,
  onSearchChange,
  revelationFilter,
  onRevelationChange,
  onSelectSurah,
  uiLanguage,
  mobileOpen = false,
  onCloseMobile,
}) => {
  const activeItemRef = useRef<HTMLButtonElement | null>(null);
  const filtered = filterSurahs(surahs, searchQuery, revelationFilter);

  useEffect(() => {
    activeItemRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [activeSurahNumber]);

  const filterTabs: { id: RevelationFilter; bn: string; en: string }[] = [
    { id: 'all', bn: 'সকল', en: 'All' },
    { id: 'Meccan', bn: 'মক্কী', en: 'Meccan' },
    { id: 'Medinan', bn: 'মাদানী', en: 'Medinan' },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-[var(--neu-text-primary)] font-bengali">
          {uiLanguage === 'bn' ? 'সূরাসমূহ (১১৪)' : 'Surahs (114)'}
        </h2>
        {onCloseMobile && (
          <button
            type="button"
            onClick={onCloseMobile}
            aria-label={uiLanguage === 'bn' ? 'তালিকা বন্ধ করুন' : 'Close Surah list'}
            className="lg:hidden neu-btn w-10 h-10 rounded-xl flex items-center justify-center text-[var(--neu-text-secondary)] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Recessed Neumorphic Search Well */}
      <div className="neu-inset rounded-2xl px-3.5 py-2.5 flex items-center gap-2.5 mb-3.5">
        <Search className="w-4 h-4 text-[var(--neu-text-muted)] shrink-0" aria-hidden="true" />
        <label htmlFor="sidebar-surah-search" className="sr-only">
          {uiLanguage === 'bn' ? 'সূরা খুঁজুন' : 'Search Surahs'}
        </label>
        <input
          id="sidebar-surah-search"
          type="search"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={
            uiLanguage === 'bn' ? 'সূরা খুঁজুন (নাম বা নম্বর)...' : 'Search Surah or number...'
          }
          className="w-full bg-transparent text-sm text-[var(--neu-text-primary)] placeholder:text-[var(--neu-text-muted)] focus:outline-none"
        />
      </div>

      {/* Segmented Revelation Filter */}
      <div
        role="group"
        aria-label={uiLanguage === 'bn' ? 'অবতরণ অনুযায়ী ফিল্টার' : 'Filter by revelation'}
        className="neu-inset-sm p-1 rounded-xl grid grid-cols-3 gap-1 mb-4"
      >
        {filterTabs.map((tab) => {
          const active = revelationFilter === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onRevelationChange(tab.id)}
              className={`py-1.5 px-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                active
                  ? 'neu-raised-sm text-[var(--neu-accent)] font-semibold'
                  : 'text-[var(--neu-text-secondary)] hover:text-[var(--neu-text-primary)]'
              }`}
            >
              {uiLanguage === 'bn' ? tab.bn : tab.en}
            </button>
          );
        })}
      </div>

      {/* Scrollable Surah List */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-2.5 min-h-0">
        {filtered.length === 0 ? (
          <div className="neu-inset rounded-2xl p-6 text-center text-sm text-[var(--neu-text-muted)]">
            {uiLanguage === 'bn'
              ? 'কোনো সূরা খুঁজে পাওয়া যায়নি।'
              : 'No matching Surahs found.'}
          </div>
        ) : (
          filtered.map((surah) => {
            const isSelected = surah.number === activeSurahNumber;
            const numDisplay =
              uiLanguage === 'bn' ? toBengaliDigits(surah.number) : String(surah.number);
            const ayahDisplay =
              uiLanguage === 'bn'
                ? `${toBengaliDigits(surah.ayahCount)} আয়াত`
                : `${surah.ayahCount} Ayahs`;

            return (
              <button
                key={surah.number}
                ref={isSelected ? activeItemRef : null}
                type="button"
                onClick={() => {
                  onSelectSurah(surah.number);
                  if (onCloseMobile) onCloseMobile();
                }}
                aria-current={isSelected ? 'true' : undefined}
                className={`w-full text-left rounded-2xl px-3 py-2.5 flex items-center gap-3 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--neu-accent)] ${
                  isSelected
                    ? 'neu-inset text-[var(--neu-accent)]'
                    : 'neu-btn text-[var(--neu-text-primary)]'
                }`}
              >
                <AyahRosette label={numDisplay} active={isSelected} size={36} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold truncate font-bengali">
                      {uiLanguage === 'bn' ? surah.bengaliName : surah.englishName}
                    </span>
                    <span className="font-quran text-base text-[var(--neu-text-primary)] shrink-0">
                      {surah.arabicName.replace('سُورَةُ ', '')}
                    </span>
                  </div>
                  <div className="text-xs text-[var(--neu-text-muted)] truncate mt-0.5 tabular-nums">
                    {uiLanguage === 'bn' ? surah.englishName : surah.englishMeaning} · {ayahDisplay}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sticky Neumorphic Rail */}
      <aside
        aria-label={uiLanguage === 'bn' ? 'সূরা তালিকা সাইডবার' : 'Surah Navigator'}
        className="hidden lg:block w-[320px] xl:w-[340px] shrink-0"
      >
        <div className="neu-raised rounded-3xl p-5 sticky top-20 h-[calc(100vh-13.25rem)] flex flex-col">
          {sidebarContent}
        </div>
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="relative z-10 w-[86vw] max-w-[340px] h-full bg-[var(--neu-bg)] p-5 shadow-2xl flex flex-col">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
