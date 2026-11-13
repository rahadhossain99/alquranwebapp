import React from 'react';
import {
  ArrowDownCircle,
  Bookmark,
  List,
  Moon,
  PauseCircle,
  SlidersHorizontal,
  Sun,
} from 'lucide-react';
import { AppView, ReaderSettings } from '../types/quran';
import { AutoScrollSpeed, toBengaliDigits } from '../utils/quranLogic';

interface WorkspaceToolbarProps {
  activeView: AppView;
  onSelectView: (view: AppView) => void;
  settings: ReaderSettings;
  onUpdateSettings: (partial: Partial<ReaderSettings>) => void;
  onOpenMobileSurahs: () => void;
  onOpenSettings: () => void;
  autoScrolling: boolean;
  autoScrollSpeed: AutoScrollSpeed;
  onToggleAutoScroll: () => void;
  onChangeAutoScrollSpeed: (speed: AutoScrollSpeed) => void;
  bookmarkCount: number;
}

export const WorkspaceToolbar: React.FC<WorkspaceToolbarProps> = ({
  activeView,
  onSelectView,
  settings,
  onUpdateSettings,
  onOpenMobileSurahs,
  onOpenSettings,
  autoScrolling,
  autoScrollSpeed,
  onToggleAutoScroll,
  onChangeAutoScrollSpeed,
  bookmarkCount,
}) => {
  const isBn = settings.uiLanguage === 'bn';

  const mobileTabs: { id: AppView; bn: string; en: string }[] = [
    { id: 'reader', bn: 'পাঠ', en: 'Read' },
    { id: 'surahs', bn: 'সূরা', en: 'Surahs' },
    { id: 'bookmarks', bn: 'সংরক্ষিত', en: 'Saved' },
    { id: 'progress', bn: 'অগ্রগতি', en: 'Progress' },
  ];

  const speedOptions: { id: AutoScrollSpeed; bn: string; en: string }[] = [
    { id: 'slow', bn: 'ধীর', en: 'Slow' },
    { id: 'medium', bn: 'মধ্যম', en: 'Med' },
    { id: 'fast', bn: 'দ্রুত', en: 'Fast' },
  ];

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
      {/* Left: Mobile View tabs + Desktop Reading Controls */}
      <div className="flex items-center gap-2.5 flex-wrap w-full md:w-auto justify-between md:justify-start">
        <div className="flex md:hidden neu-inset-sm p-1 rounded-xl gap-1 w-full justify-between">
          {mobileTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelectView(tab.id)}
              className={`flex-1 px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap cursor-pointer ${
                activeView === tab.id
                  ? 'neu-raised-sm text-[var(--neu-accent)] font-semibold'
                  : 'text-[var(--neu-text-secondary)]'
              }`}
            >
              {isBn ? tab.bn : tab.en}
            </button>
          ))}
        </div>

        {/* Translation Layer Switches + Auto-Scroll Bar in Reader */}
        {activeView === 'reader' && (
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="hidden sm:flex items-center gap-1.5 neu-inset-sm p-1 rounded-2xl">
              <button
                type="button"
                aria-pressed={settings.showBengali}
                onClick={() =>
                  onUpdateSettings({ showBengali: !settings.showBengali })
                }
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-all ${
                  settings.showBengali
                    ? 'neu-raised-sm text-[var(--neu-accent)]'
                    : 'text-[var(--neu-text-muted)] hover:text-[var(--neu-text-primary)]'
                }`}
              >
                {isBn ? 'বাংলা অনুবাদ' : 'Bengali'}
              </button>
              <button
                type="button"
                aria-pressed={settings.showEnglish}
                onClick={() =>
                  onUpdateSettings({ showEnglish: !settings.showEnglish })
                }
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-all ${
                  settings.showEnglish
                    ? 'neu-raised-sm text-[var(--neu-accent)]'
                    : 'text-[var(--neu-text-muted)] hover:text-[var(--neu-text-primary)]'
                }`}
              >
                {isBn ? 'ইংরেজি' : 'English'}
              </button>
              <button
                type="button"
                aria-pressed={settings.showTransliteration}
                onClick={() =>
                  onUpdateSettings({
                    showTransliteration: !settings.showTransliteration,
                  })
                }
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-all ${
                  settings.showTransliteration
                    ? 'neu-raised-sm text-[var(--neu-accent)]'
                    : 'text-[var(--neu-text-muted)] hover:text-[var(--neu-text-primary)]'
                }`}
              >
                {isBn ? 'উচ্চারণ' : 'Translit'}
              </button>
            </div>

            {/* Auto-Scroll Tactile Control */}
            <div className="flex items-center gap-1.5 neu-inset-sm p-1 rounded-2xl">
              <button
                type="button"
                aria-pressed={autoScrolling}
                onClick={onToggleAutoScroll}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-all ${
                  autoScrolling
                    ? 'neu-accent-btn'
                    : 'neu-raised-sm text-[var(--neu-text-primary)] hover:text-[var(--neu-accent)]'
                }`}
              >
                {autoScrolling ? (
                  <PauseCircle className="w-3.5 h-3.5" />
                ) : (
                  <ArrowDownCircle className="w-3.5 h-3.5 text-[var(--neu-accent)]" />
                )}
                <span>{isBn ? 'অটো স্ক্রল' : 'Auto Scroll'}</span>
              </button>

              {autoScrolling && (
                <div className="flex items-center gap-1 pr-1">
                  {speedOptions.map((sp) => (
                    <button
                      key={sp.id}
                      type="button"
                      onClick={() => onChangeAutoScrollSpeed(sp.id)}
                      className={`px-2 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap cursor-pointer transition-all ${
                        autoScrollSpeed === sp.id
                          ? 'neu-raised-sm text-[var(--neu-accent)]'
                          : 'text-[var(--neu-text-muted)] hover:text-[var(--neu-text-primary)]'
                      }`}
                    >
                      {isBn ? sp.bn : sp.en}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Saved Bookmarks Button */}
            <button
              type="button"
              onClick={() => onSelectView('bookmarks')}
              aria-label={isBn ? 'বুকমার্ক দেখুন' : 'View Bookmarks'}
              className="hidden xl:inline-flex neu-btn h-10 px-3.5 rounded-xl items-center gap-2 text-xs font-semibold text-[var(--neu-text-primary)] hover:text-[var(--neu-gold)] cursor-pointer whitespace-nowrap tabular-nums"
            >
              <Bookmark className="w-3.5 h-3.5 text-[var(--neu-gold)]" />
              <span>
                {isBn
                  ? `বুকমার্ক (${toBengaliDigits(bookmarkCount)})`
                  : `Saved (${bookmarkCount})`}
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Right: Mobile Surah drawer trigger + UI Language Toggle, Theme Toggle, Typography Drawer */}
      <div className="flex items-center justify-between md:justify-end gap-2.5 w-full md:w-auto ml-auto">
        {activeView === 'reader' && (
          <button
            type="button"
            onClick={onOpenMobileSurahs}
            className="lg:hidden neu-btn px-3.5 py-2 rounded-xl text-xs font-semibold text-[var(--neu-text-primary)] inline-flex items-center gap-2 cursor-pointer whitespace-nowrap"
          >
            <List className="w-4 h-4 text-[var(--neu-accent)]" />
            <span>{isBn ? 'সূরা তালিকা' : 'Surah List'}</span>
          </button>
        )}

        <div className="flex items-center gap-2.5 ml-auto">
          <div
            role="group"
            aria-label={isBn ? 'অ্যাপের ভাষা' : 'Interface Language'}
            className="neu-inset-sm p-1 rounded-xl flex items-center gap-1"
          >
            <button
              type="button"
              onClick={() => onUpdateSettings({ uiLanguage: 'bn' })}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer transition-all font-bengali ${
                settings.uiLanguage === 'bn'
                  ? 'neu-raised-sm text-[var(--neu-accent)]'
                  : 'text-[var(--neu-text-secondary)]'
              }`}
            >
              বাংলা
            </button>
            <button
              type="button"
              onClick={() => onUpdateSettings({ uiLanguage: 'en' })}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer transition-all ${
                settings.uiLanguage === 'en'
                  ? 'neu-raised-sm text-[var(--neu-accent)]'
                  : 'text-[var(--neu-text-secondary)]'
              }`}
            >
              EN
            </button>
          </div>

          <button
            type="button"
            onClick={() =>
              onUpdateSettings({
                theme: settings.theme === 'light' ? 'dark' : 'light',
              })
            }
            aria-label={
              settings.theme === 'light'
                ? isBn
                  ? 'ডার্ক মোড চালু করুন'
                  : 'Switch to dark mode'
                : isBn
                  ? 'লাইট মোড চালু করুন'
                  : 'Switch to light mode'
            }
            className="neu-btn w-10 h-10 rounded-xl flex items-center justify-center text-[var(--neu-text-primary)] cursor-pointer shrink-0"
          >
            {settings.theme === 'light' ? (
              <Moon className="w-4 h-4" />
            ) : (
              <Sun className="w-4 h-4 text-[var(--neu-gold)]" />
            )}
          </button>

          <button
            type="button"
            onClick={onOpenSettings}
            aria-label={
              isBn ? 'ফন্ট ও তিলাওয়াত সেটিংস' : 'Typography & Reciter Settings'
            }
            className="neu-btn h-10 px-3.5 rounded-xl inline-flex items-center gap-2 text-xs font-semibold text-[var(--neu-text-primary)] cursor-pointer whitespace-nowrap shrink-0"
          >
            <SlidersHorizontal className="w-4 h-4 text-[var(--neu-accent)]" />
            <span className="hidden sm:inline">
              {isBn ? 'ফন্ট ও ক্বারি' : 'Display & Audio'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
