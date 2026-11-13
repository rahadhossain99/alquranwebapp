import React from 'react';
import { BookOpen } from 'lucide-react';
import { AppView, LastReadPosition, UiLanguage } from '../types/quran';
import { toBengaliDigits } from '../utils/quranLogic';
import { NoorEmblem } from './GeometricIcons';

interface TopBarProps {
  activeView: AppView;
  onSelectView: (view: AppView) => void;
  uiLanguage: UiLanguage;
  lastRead: LastReadPosition;
  bookmarkCount: number;
  onResumeReading: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeView,
  onSelectView,
  uiLanguage,
  lastRead,
  bookmarkCount,
  onResumeReading,
}) => {
  const navItems: { id: AppView; bn: string; en: string }[] = [
    { id: 'reader', bn: 'কুরআন পাঠ', en: 'Reader' },
    { id: 'surahs', bn: 'সকল সূরা', en: 'Surahs' },
    {
      id: 'bookmarks',
      bn: bookmarkCount > 0 ? `সংরক্ষিত (${toBengaliDigits(bookmarkCount)})` : 'সংরক্ষিত',
      en: bookmarkCount > 0 ? `Bookmarks (${bookmarkCount})` : 'Bookmarks',
    },
    { id: 'progress', bn: 'অগ্রগতি', en: 'Progress' },
  ];

  const resumeLabel =
    uiLanguage === 'bn'
      ? `পড়ুন ${toBengaliDigits(lastRead.surahNumber)}:${toBengaliDigits(lastRead.ayahNumber)}`
      : `Resume ${lastRead.surahNumber}:${lastRead.ayahNumber}`;

  return (
    <header className="w-full md:sticky md:top-0 z-30 bg-[var(--neu-bg)]/95 backdrop-blur-sm border-b border-[var(--neu-divider)]">
      <div className="max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single-element Brand Wordmark */}
        <a
          href="#reader"
          onClick={(e) => {
            e.preventDefault();
            onSelectView('reader');
          }}
          className="inline-flex items-center gap-2.5 text-lg font-bold tracking-tight text-[var(--neu-text-primary)] whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--neu-accent)] rounded-lg px-1"
        >
          <NoorEmblem size={30} />
          <span className="font-bengali">
            {uiLanguage === 'bn' ? 'আল-নূর কুরআন' : 'Al-Noor Quran'}
          </span>
        </a>

        {/* Zone 2: 4 concise single-line text navigation links */}
        <nav
          aria-label={uiLanguage === 'bn' ? 'প্রধান নেভিগেশন' : 'Primary Navigation'}
          className="hidden md:flex items-center gap-7"
        >
          {navItems.map((item) => {
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectView(item.id)}
                className={`relative py-2 text-sm font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--neu-accent)] rounded-md px-1 tabular-nums ${
                  isActive
                    ? 'text-[var(--neu-accent)] font-semibold'
                    : 'text-[var(--neu-text-secondary)] hover:text-[var(--neu-text-primary)]'
                }`}
              >
                {uiLanguage === 'bn' ? item.bn : item.en}
                <span
                  aria-hidden="true"
                  className={`absolute left-1 right-1 -bottom-[1px] h-[2px] rounded-full transition-opacity duration-200 ${
                    isActive ? 'bg-[var(--neu-accent)] opacity-100' : 'opacity-0'
                  }`}
                />
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Single primary CTA */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onResumeReading}
            className="neu-accent-btn inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--neu-accent)] focus-visible:ring-offset-2"
          >
            <BookOpen className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span className="tabular-nums">{resumeLabel}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
