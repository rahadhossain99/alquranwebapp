import React from 'react';
import { AppView, UiLanguage } from '../types/quran';
import { buildAppPath } from '../utils/quranLogic';

interface WorkspaceToolbarProps {
  activeView: AppView;
  activeSurahNumber: number;
  onSelectView: (view: AppView) => void;
  uiLanguage: UiLanguage;
}

export const WorkspaceToolbar: React.FC<WorkspaceToolbarProps> = ({
  activeView,
  activeSurahNumber,
  onSelectView,
  uiLanguage,
}) => {
  const isBn = uiLanguage === 'bn';
  const baseUrl = import.meta.env.BASE_URL || '/';

  const mobileTabs: { id: AppView; bn: string; en: string }[] = [
    { id: 'surahs', bn: 'সূরা', en: 'Surahs' },
    { id: 'bookmarks', bn: 'সংরক্ষিত', en: 'Saved' },
    { id: 'progress', bn: 'অগ্রগতি', en: 'Stats' },
    { id: 'settings', bn: 'সেটিংস', en: 'Settings' },
  ];

  return (
    <nav
      aria-label={isBn ? 'মোবাইল নেভিগেশন' : 'Mobile Navigation'}
      className="md:hidden mb-5"
    >
      <div className="neu-inset p-1.5 rounded-2xl grid grid-cols-4 gap-1.5 w-full">
        {mobileTabs.map((tab) => {
          const isActive = activeView === tab.id;
          return (
            <a
              key={tab.id}
              href={buildAppPath(tab.id, activeSurahNumber, baseUrl)}
              onClick={(e) => {
                e.preventDefault();
                onSelectView(tab.id);
              }}
              aria-current={isActive ? 'page' : undefined}
              className={`text-center px-2 py-2.5 rounded-xl text-xs whitespace-nowrap cursor-pointer transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] font-bengali ${
                isActive
                  ? 'neu-raised-sm text-[var(--neu-accent)] font-bold -translate-y-[1px]'
                  : 'text-[var(--neu-text-secondary)] font-medium'
              }`}
            >
              {isBn ? tab.bn : tab.en}
            </a>
          );
        })}
      </div>
    </nav>
  );
};
