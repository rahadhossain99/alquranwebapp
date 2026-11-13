import React, { useState } from 'react';
import { Check, Languages, Moon, Search, Sun, Volume2 } from 'lucide-react';
import { RECITERS } from '../data/surahMeta';
import { ReaderSettings, ReciterId } from '../types/quran';
import { toBengaliDigits } from '../utils/quranLogic';
import { SmoothFontRange } from './SmoothFontRange';

interface SettingsViewProps {
  settings: ReaderSettings;
  onUpdateSettings: (partial: Partial<ReaderSettings>) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
}) => {
  const [qariQuery, setQariQuery] = useState('');
  const isBn = settings.uiLanguage === 'bn';

  const filteredReciters = RECITERS.filter((r) => {
    const q = qariQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      r.englishName.toLowerCase().includes(q) ||
      r.bengaliName.toLowerCase().includes(q) ||
      r.style.toLowerCase().includes(q)
    );
  });

  return (
    <section
      aria-label={isBn ? 'অ্যাপ সেটিংস ও ক্বারি' : 'Settings & Reciters'}
      className="max-w-5xl mx-auto space-y-6 animate-neu-enter"
    >
      {/* Page Header */}
      <div className="neu-raised rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--neu-text-primary)] font-bengali">
            {isBn ? 'সেটিংস ও তিলাওয়াত পছন্দ' : 'Settings & Recitation'}
          </h1>
          <p className="text-sm text-[var(--neu-text-secondary)] mt-1">
            {isBn
              ? 'থিম, ভাষা, ফন্টের আকার, অনুবাদ এবং ১৮ জন ক্বারি নির্বাচন করুন'
              : 'Configure theme, language, typography, translations, and 18 verified Qaris'}
          </p>
        </div>
      </div>

      {/* Appearance & Typography Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Appearance & Language */}
        <div className="neu-raised rounded-3xl p-6 space-y-6">
          <h2 className="text-base font-bold text-[var(--neu-text-primary)] font-bengali">
            {isBn ? 'থিম ও ভাষা' : 'Theme & Language'}
          </h2>

          <div>
            <span className="block text-xs font-semibold text-[var(--neu-text-secondary)] mb-2.5">
              {isBn ? 'প্রদর্শনের ধরন (আলো / অন্ধকার)' : 'Surface Theme'}
            </span>
            <div className="neu-inset-sm p-1.5 rounded-2xl grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onUpdateSettings({ theme: 'light' })}
                className={`py-2.5 px-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2 cursor-pointer transition-all ${
                  settings.theme === 'light'
                    ? 'neu-raised-sm text-[var(--neu-accent)] font-semibold'
                    : 'text-[var(--neu-text-secondary)]'
                }`}
              >
                <Sun className="w-4 h-4" />
                <span>{isBn ? 'নরম আলো' : 'Soft Daylight'}</span>
              </button>
              <button
                type="button"
                onClick={() => onUpdateSettings({ theme: 'dark' })}
                className={`py-2.5 px-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2 cursor-pointer transition-all ${
                  settings.theme === 'dark'
                    ? 'neu-raised-sm text-[var(--neu-accent)] font-semibold'
                    : 'text-[var(--neu-text-secondary)]'
                }`}
              >
                <Moon className="w-4 h-4" />
                <span>{isBn ? 'গভীর রাত' : 'Deep Night'}</span>
              </button>
            </div>
          </div>

          <div>
            <span className="block text-xs font-semibold text-[var(--neu-text-secondary)] mb-2.5">
              {isBn ? 'অ্যাপের ভাষা' : 'Interface Language'}
            </span>
            <div className="neu-inset-sm p-1.5 rounded-2xl grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onUpdateSettings({ uiLanguage: 'bn' })}
                className={`py-2.5 px-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all font-bengali ${
                  settings.uiLanguage === 'bn'
                    ? 'neu-raised-sm text-[var(--neu-accent)]'
                    : 'text-[var(--neu-text-secondary)]'
                }`}
              >
                <Languages className="w-4 h-4" />
                <span>বাংলা</span>
              </button>
              <button
                type="button"
                onClick={() => onUpdateSettings({ uiLanguage: 'en' })}
                className={`py-2.5 px-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                  settings.uiLanguage === 'en'
                    ? 'neu-raised-sm text-[var(--neu-accent)]'
                    : 'text-[var(--neu-text-secondary)]'
                }`}
              >
                <Languages className="w-4 h-4" />
                <span>English</span>
              </button>
            </div>
          </div>

          <div>
            <span className="block text-xs font-semibold text-[var(--neu-text-secondary)] mb-2.5">
              {isBn ? 'অনুবাদ ও উচ্চারণ প্রদর্শন' : 'Visible Reading Layers'}
            </span>
            <div className="grid grid-cols-3 gap-2.5">
              <button
                type="button"
                aria-pressed={settings.showBengali}
                onClick={() =>
                  onUpdateSettings({ showBengali: !settings.showBengali })
                }
                className={`py-2.5 px-3 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                  settings.showBengali
                    ? 'neu-inset text-[var(--neu-accent)]'
                    : 'neu-btn text-[var(--neu-text-secondary)]'
                }`}
              >
                {isBn ? 'বাংলা অনুবাদ' : 'Bengali'}
              </button>
              <button
                type="button"
                aria-pressed={settings.showTransliteration}
                onClick={() =>
                  onUpdateSettings({
                    showTransliteration: !settings.showTransliteration,
                  })
                }
                className={`py-2.5 px-2 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                  settings.showTransliteration
                    ? 'neu-inset text-[var(--neu-accent)]'
                    : 'neu-btn text-[var(--neu-text-secondary)]'
                }`}
              >
                {isBn ? 'ইংরেজি উচ্চারণ' : 'Pronunciation'}
              </button>
              <button
                type="button"
                aria-pressed={settings.showEnglish}
                onClick={() =>
                  onUpdateSettings({ showEnglish: !settings.showEnglish })
                }
                className={`py-2.5 px-2 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                  settings.showEnglish
                    ? 'neu-inset text-[var(--neu-accent)]'
                    : 'neu-btn text-[var(--neu-text-secondary)]'
                }`}
              >
                {isBn ? 'ইংরেজি অর্থ' : 'English'}
              </button>
            </div>
          </div>
        </div>

        {/* Script Scale & Playback Controls */}
        <div className="neu-raised rounded-3xl p-6 space-y-6">
          <h2 className="text-base font-bold text-[var(--neu-text-primary)] font-bengali">
            {isBn ? 'ফন্ট ও তিলাওয়াত পছন্দ' : 'Typography & Sound'}
          </h2>

          <div className="space-y-3">
            <SmoothFontRange
              id="settings-arabic-slider"
              label={isBn ? 'আরবি ফন্টের আকার' : 'Arabic Script Size'}
              ariaLabel={isBn ? 'আরবি ফন্টের আকার' : 'Arabic Script Size'}
              settingKey="arabicFontSize"
              value={settings.arabicFontSize}
              min={24}
              max={48}
              step={2}
              isBn={isBn}
              onCommit={(arabicFontSize) => onUpdateSettings({ arabicFontSize })}
            />
            <div className="neu-inset rounded-2xl p-3 text-right" dir="rtl">
              <p
                className="font-quran text-[var(--neu-text-primary)] leading-[2]"
                style={{ fontSize: `var(--live-ar-size, ${settings.arabicFontSize}px)` }}
              >
                بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
              </p>
            </div>
          </div>

          <SmoothFontRange
            id="settings-translation-slider"
            label={isBn ? 'বাংলা ফন্টের আকার' : 'Bengali Font Size'}
            ariaLabel={isBn ? 'বাংলা ফন্টের আকার' : 'Bengali Font Size'}
            settingKey="translationFontSize"
            value={settings.translationFontSize}
            min={14}
            max={24}
            step={1}
            isBn={isBn}
            onCommit={(translationFontSize) =>
              onUpdateSettings({ translationFontSize })
            }
          />

          <SmoothFontRange
            id="settings-transliteration-slider"
            label={isBn ? 'ইংরেজি উচ্চারণ ফন্টের আকার' : 'English Pronunciation Size'}
            ariaLabel={isBn ? 'ইংরেজি উচ্চারণ ফন্টের আকার' : 'English Pronunciation Size'}
            settingKey="transliterationFontSize"
            value={settings.transliterationFontSize}
            min={12}
            max={22}
            step={1}
            isBn={isBn}
            onCommit={(transliterationFontSize) =>
              onUpdateSettings({ transliterationFontSize })
            }
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <span className="block text-xs font-semibold text-[var(--neu-text-secondary)] mb-2">
                {isBn ? 'পরবর্তী আয়াত অটো-প্লে' : 'Auto-Advance Ayah'}
              </span>
              <button
                type="button"
                aria-pressed={settings.autoAdvance}
                onClick={() =>
                  onUpdateSettings({ autoAdvance: !settings.autoAdvance })
                }
                className={`w-full py-2.5 px-4 rounded-2xl text-xs font-semibold cursor-pointer transition-all ${
                  settings.autoAdvance
                    ? 'neu-inset text-[var(--neu-accent)]'
                    : 'neu-btn text-[var(--neu-text-secondary)]'
                }`}
              >
                {settings.autoAdvance
                  ? isBn
                    ? 'চালু (স্বয়ংক্রিয়)'
                    : 'Enabled'
                  : isBn
                    ? 'বন্ধ'
                    : 'Disabled'}
              </button>
            </div>

            <div>
              <span className="block text-xs font-semibold text-[var(--neu-text-secondary)] mb-2">
                {isBn ? 'বাটন ক্লিক সাউন্ড' : 'Button Click Sound'}
              </span>
              <button
                type="button"
                aria-pressed={settings.soundEffects}
                onClick={() =>
                  onUpdateSettings({ soundEffects: !settings.soundEffects })
                }
                className={`w-full py-2.5 px-4 rounded-2xl text-xs font-semibold cursor-pointer transition-all ${
                  settings.soundEffects
                    ? 'neu-inset text-[var(--neu-accent)]'
                    : 'neu-btn text-[var(--neu-text-secondary)]'
                }`}
              >
                {settings.soundEffects
                  ? isBn
                    ? 'চালু (সফট শব্দ)'
                    : 'Enabled (Tactile)'
                  : isBn
                    ? 'বন্ধ'
                    : 'Muted'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Full Verified Qari Selection (18 Reciters) */}
      <div className="neu-raised rounded-3xl p-6 sm:p-8 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-[var(--neu-text-primary)] font-bengali">
              {isBn
                ? `বিশ্ববিখ্যাত ক্বারি নির্বাচন (${toBengaliDigits(RECITERS.length)} জন)`
                : `Select Quran Reciter (${RECITERS.length} Verified Qaris)`}
            </h2>
            <p className="text-xs text-[var(--neu-text-muted)] mt-0.5">
              {isBn
                ? 'সকল ক্বারির তিলাওয়াত সরাসরি আয়াত অনুযায়ী সংযুক্ত'
                : 'Every reciter streams verse-by-verse audio seamlessly'}
            </p>
          </div>

          <div className="neu-inset rounded-2xl px-3.5 py-2 flex items-center gap-2 sm:w-64">
            <Search className="w-4 h-4 text-[var(--neu-text-muted)] shrink-0" />
            <label htmlFor="settings-qari-search" className="sr-only">
              {isBn ? 'ক্বারি খুঁজুন' : 'Search reciters'}
            </label>
            <input
              id="settings-qari-search"
              type="search"
              value={qariQuery}
              onChange={(e) => setQariQuery(e.target.value)}
              placeholder={isBn ? 'ক্বারির নাম লিখুন...' : 'Filter Qari name...'}
              className="w-full bg-transparent text-xs sm:text-sm text-[var(--neu-text-primary)] placeholder:text-[var(--neu-text-muted)] focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredReciters.map((reciter) => {
            const selected = settings.reciterId === reciter.id;
            return (
              <button
                key={reciter.id}
                type="button"
                onClick={() =>
                  onUpdateSettings({ reciterId: reciter.id as ReciterId })
                }
                aria-pressed={selected}
                className={`text-left px-4 py-3.5 rounded-2xl flex items-center justify-between gap-3 cursor-pointer transition-all ${
                  selected
                    ? 'neu-inset ring-1 ring-[var(--neu-accent)]/40 text-[var(--neu-accent)]'
                    : 'neu-btn text-[var(--neu-text-primary)]'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="neu-inset-sm w-9 h-9 rounded-xl flex items-center justify-center shrink-0">
                    <Volume2 className="w-4 h-4" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold truncate font-bengali">
                      {isBn ? reciter.bengaliName : reciter.englishName}
                    </div>
                    <div className="text-[11px] text-[var(--neu-text-muted)] truncate">
                      {isBn ? reciter.englishName : reciter.style} · {reciter.style}
                    </div>
                  </div>
                </div>
                {selected && <Check className="w-4 h-4 shrink-0 text-[var(--neu-accent)]" />}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};
