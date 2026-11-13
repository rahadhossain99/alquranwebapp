import React from 'react';
import { Moon, Sun, Volume2, X } from 'lucide-react';
import { RECITERS } from '../data/surahMeta';
import { ReaderSettings, ReciterId } from '../types/quran';
import { toBengaliDigits } from '../utils/quranLogic';

interface TypographyPanelProps {
  open: boolean;
  onClose: () => void;
  settings: ReaderSettings;
  onUpdateSettings: (partial: Partial<ReaderSettings>) => void;
}

export const TypographyPanel: React.FC<TypographyPanelProps> = ({
  open,
  onClose,
  settings,
  onUpdateSettings,
}) => {
  if (!open) return null;

  const isBn = settings.uiLanguage === 'bn';

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={isBn ? 'পাঠ্য ও অডিও সেটিংস' : 'Reading & Audio Settings'}
    >
      <div
        className="fixed inset-0 bg-black/35 backdrop-blur-xs"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative z-10 w-full sm:max-w-lg neu-raised rounded-t-3xl sm:rounded-3xl p-6 max-h-[86vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-[var(--neu-text-primary)] font-bengali">
              {isBn ? 'পড়ার ও তিলাওয়াত সেটিংস' : 'Reading & Recitation Settings'}
            </h2>
            <p className="text-xs text-[var(--neu-text-muted)] mt-0.5">
              {isBn
                ? 'ফন্টের আকার, অনুবাদ এবং ক্বারি নির্বাচন করুন'
                : 'Customize script scale, translations, and reciter'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={isBn ? 'সেটিংস বন্ধ করুন' : 'Close settings'}
            className="neu-btn w-10 h-10 rounded-xl flex items-center justify-center text-[var(--neu-text-secondary)] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Theme Selection */}
          <div>
            <span className="block text-xs font-semibold text-[var(--neu-text-secondary)] mb-2.5">
              {isBn ? 'থিম (আলো / অন্ধকার)' : 'Surface Theme'}
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

          {/* Arabic Font Size Slider */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label
                htmlFor="arabic-font-slider"
                className="text-xs font-semibold text-[var(--neu-text-secondary)]"
              >
                {isBn ? 'আরবি ফন্টের আকার' : 'Arabic Script Size'}
              </label>
              <span className="text-xs font-semibold text-[var(--neu-accent)] tabular-nums">
                {isBn
                  ? `${toBengaliDigits(settings.arabicFontSize)}px`
                  : `${settings.arabicFontSize}px`}
              </span>
            </div>
            <input
              id="arabic-font-slider"
              type="range"
              min={24}
              max={44}
              step={2}
              value={settings.arabicFontSize}
              onChange={(e) =>
                onUpdateSettings({ arabicFontSize: Number(e.target.value) })
              }
              className="neu-range w-full"
            />
          </div>

          {/* Translation Font Size Slider */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label
                htmlFor="translation-font-slider"
                className="text-xs font-semibold text-[var(--neu-text-secondary)]"
              >
                {isBn ? 'অনুবাদ ফন্টের আকার' : 'Translation Size'}
              </label>
              <span className="text-xs font-semibold text-[var(--neu-accent)] tabular-nums">
                {isBn
                  ? `${toBengaliDigits(settings.translationFontSize)}px`
                  : `${settings.translationFontSize}px`}
              </span>
            </div>
            <input
              id="translation-font-slider"
              type="range"
              min={14}
              max={22}
              step={1}
              value={settings.translationFontSize}
              onChange={(e) =>
                onUpdateSettings({ translationFontSize: Number(e.target.value) })
              }
              className="neu-range w-full"
            />
          </div>

          {/* Visible Layers */}
          <div>
            <span className="block text-xs font-semibold text-[var(--neu-text-secondary)] mb-2.5">
              {isBn ? 'প্রদর্শিত অনুবাদ ও উচ্চারণ' : 'Visible Reading Layers'}
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
                aria-pressed={settings.showEnglish}
                onClick={() =>
                  onUpdateSettings({ showEnglish: !settings.showEnglish })
                }
                className={`py-2.5 px-3 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                  settings.showEnglish
                    ? 'neu-inset text-[var(--neu-accent)]'
                    : 'neu-btn text-[var(--neu-text-secondary)]'
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
                className={`py-2.5 px-3 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                  settings.showTransliteration
                    ? 'neu-inset text-[var(--neu-accent)]'
                    : 'neu-btn text-[var(--neu-text-secondary)]'
                }`}
              >
                {isBn ? 'উচ্চারণ' : 'Translit'}
              </button>
            </div>
          </div>

          {/* Reciter Selection */}
          <div>
            <span className="block text-xs font-semibold text-[var(--neu-text-secondary)] mb-2.5">
              {isBn ? 'ক্বারি নির্বাচন' : 'Reciter (Qari)'}
            </span>
            <div className="space-y-2">
              {RECITERS.map((reciter) => {
                const selected = settings.reciterId === reciter.id;
                return (
                  <button
                    key={reciter.id}
                    type="button"
                    onClick={() =>
                      onUpdateSettings({ reciterId: reciter.id as ReciterId })
                    }
                    className={`w-full text-left px-4 py-3 rounded-2xl flex items-center justify-between gap-3 cursor-pointer transition-all ${
                      selected
                        ? 'neu-inset text-[var(--neu-accent)]'
                        : 'neu-btn text-[var(--neu-text-primary)]'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Volume2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                      <div className="min-w-0">
                        <div className="text-sm font-semibold truncate font-bengali">
                          {isBn ? reciter.bengaliName : reciter.englishName}
                        </div>
                        <div className="text-xs text-[var(--neu-text-muted)]">
                          {reciter.style}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Playback Speed */}
          <div>
            <span className="block text-xs font-semibold text-[var(--neu-text-secondary)] mb-2.5">
              {isBn ? 'তিলাওয়াতের গতি' : 'Playback Speed'}
            </span>
            <div className="neu-inset-sm p-1.5 rounded-2xl grid grid-cols-4 gap-1.5">
              {[0.75, 1, 1.25, 1.5].map((rate) => (
                <button
                  key={rate}
                  type="button"
                  onClick={() => onUpdateSettings({ playbackRate: rate })}
                  className={`py-2 rounded-xl text-xs font-semibold tabular-nums cursor-pointer transition-all ${
                    settings.playbackRate === rate
                      ? 'neu-raised-sm text-[var(--neu-accent)]'
                      : 'text-[var(--neu-text-secondary)]'
                  }`}
                >
                  {rate}x
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
