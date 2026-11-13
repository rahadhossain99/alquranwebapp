import React from 'react';
import { BookOpen } from 'lucide-react';
import { AppView, LastReadPosition, UiLanguage } from '../types/quran';
import { buildAppPath, toBengaliDigits } from '../utils/quranLogic';
import { NoorEmblem } from './GeometricIcons';

interface TopBarProps {
  activeView: AppView;
  activeSurahNumber: number;
  onSelectView: (view: AppView) => void;
  uiLanguage: UiLanguage;
  lastRead: LastReadPosition;
  savedCount: number;
  onResumeReading: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeView,
  activeSurahNumber,
  onSelectView,
  uiLanguage,
  lastRead,
  savedCount,
  onResumeReading,
}) => {
  const baseUrl = import.meta.env.BASE_URL || '/';

  const navItems: { id: AppView; bn: string; en: string }[] = [
    { id: 'surahs', bn: 'সকল সূরা', en: 'Surahs' },
    {
      id: 'bookmarks',
      bn: savedCount > 0 ? `সংরক্ষিত (${toBengaliDigits(savedCount)})` : 'সংরক্ষিত',
      en: savedCount > 0 ? `Saved (${savedCount})` : 'Saved',
    },
    { id: 'progress', bn: 'অগ্রগতি', en: 'Progress' },
    { id: 'settings', bn: 'সেটিংস', en: 'Settings' },
  ];

  const resumeLabel =
    uiLanguage === 'bn'
      ? `পাঠ ${toBengaliDigits(lastRead.surahNumber)}:${toBengaliDigits(lastRead.ayahNumber)}`
      : `Read ${lastRead.surahNumber}:${lastRead.ayahNumber}`;

  return (
    <header className="w-full sticky top-0 z-30 bg-[var(--neu-bg)]/95 backdrop-blur-md border-b border-[var(--neu-divider)] shadow-[0_6px_18px_rgba(148,163,184,0.16)] dark:shadow-[0_6px_20px_rgba(0,0,0,0.45)]">
      <div className="max-w-[1380px] mx-auto px-3.5 sm:px-6 lg:px-8 h-15 sm:h-18 flex items-center justify-between gap-3 sm:gap-8">
        {/* Zone 1: 3D Tactile Brand Wordmark */}
        <a
          href={buildAppPath('reader', activeSurahNumber, baseUrl)}
          onClick={(e) => {
            e.preventDefault();
            onSelectView('reader');
          }}
          className="neu-btn inline-flex items-center gap-2 sm:gap-2.5 px-2.5 sm:px-3 py-1.5 rounded-2xl text-sm sm:text-lg font-bold tracking-tight text-[var(--neu-text-primary)] whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--neu-accent)]"
        >
          <NoorEmblem size={26} />
          <span className="font-bengali">
            {uiLanguage === 'bn' ? 'আল-নূর কুরআন' : 'Al-Noor Quran'}
          </span>
        </a>

        {/* Zone 2: 3D Sculpted Neumorphic Menu Dock */}
        <nav
          aria-label={uiLanguage === 'bn' ? 'প্রধান নেভিগেশন' : 'Primary Navigation'}
          className="hidden md:flex items-center gap-1.5 neu-inset p-1.5 rounded-2xl"
        >
          {navItems.map((item) => {
            const isActive = activeView === item.id;
            const href = buildAppPath(item.id, activeSurahNumber, baseUrl);
            return (
              <a
                key={item.id}
                href={href}
                onClick={(e) => {
                  e.preventDefault();
                  onSelectView(item.id);
                }}
                aria-current={isActive ? 'page' : undefined}
                className={`relative px-4 py-2 rounded-xl text-sm whitespace-nowrap shrink-0 cursor-pointer tabular-nums transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--neu-accent)] ${
                  isActive
                    ? 'neu-raised-sm text-[var(--neu-accent)] font-bold -translate-y-[1px]'
                    : 'text-[var(--neu-text-secondary)] font-medium hover:text-[var(--neu-text-primary)] hover:-translate-y-[0.5px]'
                }`}
              >
                {uiLanguage === 'bn' ? item.bn : item.en}
              </a>
            );
          })}
        </nav>

        {/* Zone 3: 3D Tactile Primary Reading/Path CTA */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onResumeReading}
            aria-label={
              uiLanguage === 'bn'
                ? `পাঠ অবস্থানে যান (${toBengaliDigits(lastRead.surahNumber)}:${toBengaliDigits(lastRead.ayahNumber)})`
                : `Jump to current reading Ayah (${lastRead.surahNumber}:${lastRead.ayahNumber})`
            }
            className="neu-accent-btn inline-flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-2xl text-xs sm:text-sm font-semibold whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--neu-accent)] focus-visible:ring-offset-2"
          >
            <BookOpen className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span className="tabular-nums">{resumeLabel}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
