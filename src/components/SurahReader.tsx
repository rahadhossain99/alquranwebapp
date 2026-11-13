import React, { useState } from 'react';
import {
  Bookmark,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Copy,
  Pause,
  Play,
  RefreshCw,
} from 'lucide-react';
import {
  Ayah,
  BookmarkItem,
  ReaderSettings,
  SurahDetail,
  SurahMeta,
} from '../types/quran';
import { toArabicIndicDigits, toBengaliDigits } from '../utils/quranLogic';
import { ArabesqueDivider, AyahRosette } from './GeometricIcons';

interface SurahReaderProps {
  surahMeta: SurahMeta;
  surahDetail: SurahDetail | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  settings: ReaderSettings;
  activePlayingAyah: number | null;
  highlightedAyah: number | null;
  isPlaying: boolean;
  bookmarks: BookmarkItem[];
  readAyahKeys: Set<string>;
  onPlayAyah: (ayahNumber: number) => void;
  onPlaySurah: () => void;
  onToggleBookmark: (ayah: Ayah) => void;
  onToggleReadAyah: (ayahNumber: number) => void;
  onMarkSurahRead: () => void;
  onNavigateSurah: (surahNumber: number) => void;
}

export const SurahReader: React.FC<SurahReaderProps> = ({
  surahMeta,
  surahDetail,
  loading,
  error,
  onRetry,
  settings,
  activePlayingAyah,
  highlightedAyah,
  isPlaying,
  bookmarks,
  readAyahKeys,
  onPlayAyah,
  onPlaySurah,
  onToggleBookmark,
  onToggleReadAyah,
  onMarkSurahRead,
  onNavigateSurah,
}) => {
  const [copiedAyah, setCopiedAyah] = useState<number | null>(null);
  const isBn = settings.uiLanguage === 'bn';

  const handleCopy = async (ayah: Ayah) => {
    const text = `${ayah.arabic}\n\n${ayah.bengali}\n${ayah.english}\n— ${surahMeta.englishName} (${surahMeta.number}:${ayah.numberInSurah})`;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedAyah(ayah.numberInSurah);
      setTimeout(() => setCopiedAyah(null), 1800);
    } catch {
      // Clipboard blocked in non-HTTPS contexts
    }
  };

  const revelationLabel = isBn
    ? surahMeta.revelationType === 'Meccan'
      ? 'মক্কী'
      : 'মাদানী'
    : surahMeta.revelationType;

  const ayahCountLabel = isBn
    ? `${toBengaliDigits(surahMeta.ayahCount)} আয়াত`
    : `${surahMeta.ayahCount} Ayahs`;

  const juzLabel = isBn
    ? `পারা ${toBengaliDigits(surahMeta.juzStart)}`
    : `Juz ${surahMeta.juzStart}`;

  const showBismillahBanner = surahMeta.number !== 1 && surahMeta.number !== 9;

  return (
    <div className="space-y-6">
      {/* Surah Masthead Card */}
      <section
        key={surahMeta.number}
        aria-label={surahMeta.englishName}
        className="neu-raised rounded-3xl p-6 sm:p-8 text-center animate-neu-enter"
      >
        <div className="flex flex-col items-center">
          <p className="text-xs font-medium tracking-wide text-[var(--neu-text-muted)] tabular-nums">
            {isBn
              ? `সূরা ${toBengaliDigits(surahMeta.number)}`
              : `Surah ${surahMeta.number}`}{' '}
            <span aria-hidden="true">·</span> {revelationLabel}{' '}
            <span aria-hidden="true">·</span> {ayahCountLabel}{' '}
            <span aria-hidden="true">·</span> {juzLabel}
          </p>

          <h1 className="font-quran text-3xl sm:text-4xl text-[var(--neu-text-primary)] mt-3 leading-[2.15]">
            {surahMeta.arabicName}
          </h1>

          <h2 className="text-xl sm:text-2xl font-bold text-[var(--neu-text-primary)] mt-3 font-bengali text-balance">
            {isBn
              ? `${surahMeta.bengaliName} — ${surahMeta.bengaliMeaning}`
              : `${surahMeta.englishName} — ${surahMeta.englishMeaning}`}
          </h2>

          <p className="text-sm text-[var(--neu-text-secondary)] mt-1">
            {isBn
              ? `${surahMeta.englishName} (${surahMeta.englishMeaning})`
              : `${surahMeta.bengaliName} (${surahMeta.bengaliMeaning})`}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
            <button
              type="button"
              onClick={onPlaySurah}
              className="neu-accent-btn inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-semibold cursor-pointer whitespace-nowrap"
            >
              {isPlaying && activePlayingAyah !== null ? (
                <>
                  <Pause className="w-4 h-4 fill-current" />
                  <span>{isBn ? 'বিরতি দিন' : 'Pause Recitation'}</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>{isBn ? 'তিলাওয়াত শুনুন' : 'Listen to Surah'}</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onMarkSurahRead}
              className="neu-btn inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-medium text-[var(--neu-text-secondary)] hover:text-[var(--neu-accent)] cursor-pointer whitespace-nowrap"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isBn ? 'সম্পূর্ণ সূরা পড়া হয়েছে' : 'Mark Surah Read'}</span>
            </button>
          </div>
        </div>

        {showBismillahBanner && (
          <>
            <ArabesqueDivider />
            <p
              dir="rtl"
              className="font-quran text-2xl sm:text-3xl text-[var(--neu-text-primary)] leading-loose"
            >
              بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
            </p>
          </>
        )}
      </section>

      {/* Loading Skeleton */}
      {loading && (
        <div className="space-y-4" aria-busy="true" aria-label="Loading Ayahs">
          {[1, 2, 3].map((n) => (
            <div key={n} className="neu-raised rounded-3xl p-6 animate-pulse space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl neu-inset-sm" />
                <div className="w-28 h-8 rounded-xl neu-inset-sm" />
              </div>
              <div className="h-8 w-3/4 ml-auto rounded-xl neu-inset-sm" />
              <div className="h-5 w-5/6 rounded-xl neu-inset-sm" />
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="neu-raised rounded-3xl p-8 text-center space-y-4">
          <p className="text-base font-semibold text-[var(--neu-text-primary)] font-bengali">
            {isBn
              ? 'সূরার আয়াত লোড করা যায়নি। অনুগ্রহ করে ইন্টারনেট সংযোগ পরীক্ষা করুন।'
              : 'Unable to load Surah verses right now.'}
          </p>
          <p className="text-xs text-[var(--neu-text-muted)]">{error}</p>
          <button
            type="button"
            onClick={onRetry}
            className="neu-btn inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-semibold text-[var(--neu-accent)] cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>{isBn ? 'আবার চেষ্টা করুন' : 'Retry'}</span>
          </button>
        </div>
      )}

      {/* Ayahs Reading List */}
      {!loading && !error && surahDetail && (
        <div className="space-y-5">
          {surahDetail.ayahs.map((ayah) => {
            const key = `${surahMeta.number}:${ayah.numberInSurah}`;
            const isBookmarked = bookmarks.some((b) => b.id === key);
            const isRead = readAyahKeys.has(key);
            const isActiveAudio = activePlayingAyah === ayah.numberInSurah;
            const isHighlighted = highlightedAyah === ayah.numberInSurah;
            const rosetteNum = isBn
              ? toBengaliDigits(ayah.numberInSurah)
              : String(ayah.numberInSurah);

            return (
              <article
                key={ayah.numberInSurah}
                id={`ayah-${ayah.numberInSurah}`}
                data-testid={`ayah-card-${ayah.numberInSurah}`}
                className={`rounded-3xl p-5 sm:p-7 transition-all duration-300 ${
                  isActiveAudio || isHighlighted
                    ? 'neu-raised ring-2 ring-[var(--neu-accent)]/55'
                    : 'neu-raised'
                }`}
              >
                {/* Ayah Controls Header */}
                <div className="flex items-center justify-between gap-4 pb-4 border-b border-[var(--neu-divider)]">
                  <div className="flex items-center gap-3">
                    <AyahRosette
                      label={rosetteNum}
                      active={isActiveAudio || isRead || isHighlighted}
                      size={40}
                    />
                    <span className="text-xs font-medium text-[var(--neu-text-muted)] tabular-nums">
                      {isBn
                        ? `${toBengaliDigits(surahMeta.number)}:${toBengaliDigits(ayah.numberInSurah)}`
                        : `${surahMeta.number}:${ayah.numberInSurah}`}
                    </span>
                    {isBookmarked && (
                      <span className="text-[11px] font-semibold text-[var(--neu-gold)]">
                        · {isBn ? 'বুকমার্ক হয়েছে' : 'Bookmarked'}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onPlayAyah(ayah.numberInSurah)}
                      aria-label={
                        isBn
                          ? `আয়াত ${ayah.numberInSurah} শুনুন`
                          : `Play Ayah ${ayah.numberInSurah}`
                      }
                      className={`h-10 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-all duration-300 ${
                        isActiveAudio && isPlaying
                          ? 'neu-accent-btn px-3.5 scale-105'
                          : 'neu-btn w-10 text-[var(--neu-text-secondary)] hover:text-[var(--neu-accent)]'
                      }`}
                    >
                      {isActiveAudio && isPlaying ? (
                        <>
                          <Pause className="w-4 h-4 fill-current shrink-0" />
                          <span className="text-xs font-semibold hidden sm:inline">
                            {isBn ? 'চলছে' : 'Playing'}
                          </span>
                        </>
                      ) : (
                        <Play className="w-4 h-4 fill-current translate-x-[0.5px]" />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => onToggleBookmark(ayah)}
                      aria-pressed={isBookmarked}
                      aria-label={
                        isBn
                          ? `আয়াত ${ayah.numberInSurah} বুকমার্ক করুন`
                          : `Bookmark Ayah ${ayah.numberInSurah}`
                      }
                      className={`w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer transition-all ${
                        isBookmarked
                          ? 'neu-inset text-[var(--neu-gold)]'
                          : 'neu-btn text-[var(--neu-text-secondary)] hover:text-[var(--neu-gold)]'
                      }`}
                    >
                      <Bookmark
                        className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`}
                      />
                    </button>

                    <button
                      type="button"
                      onClick={() => onToggleReadAyah(ayah.numberInSurah)}
                      aria-pressed={isRead}
                      aria-label={
                        isBn
                          ? `আয়াত ${ayah.numberInSurah} পঠিত হিসেবে চিহ্নিত করুন`
                          : `Mark Ayah ${ayah.numberInSurah} as read`
                      }
                      className={`w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer transition-all ${
                        isRead
                          ? 'neu-inset text-[var(--neu-accent)]'
                          : 'neu-btn text-[var(--neu-text-secondary)] hover:text-[var(--neu-accent)]'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleCopy(ayah)}
                      aria-label={
                        isBn
                          ? `আয়াত ${ayah.numberInSurah} কপি করুন`
                          : `Copy Ayah ${ayah.numberInSurah}`
                      }
                      className="neu-btn w-10 h-10 rounded-xl flex items-center justify-center text-[var(--neu-text-secondary)] hover:text-[var(--neu-text-primary)] cursor-pointer"
                    >
                      {copiedAyah === ayah.numberInSurah ? (
                        <Check className="w-4 h-4 text-[var(--neu-accent)]" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Arabic Script */}
                <div className="pt-6 pb-4" dir="rtl">
                  <p
                    className="font-quran text-[var(--neu-text-primary)] leading-[2.2] text-right"
                    style={{ fontSize: `${settings.arabicFontSize}px` }}
                  >
                    {ayah.arabic}{' '}
                    <span className="text-[var(--neu-gold)] text-[0.72em] select-none px-1">
                      ﴿{toArabicIndicDigits(ayah.numberInSurah)}﴾
                    </span>
                  </p>
                </div>

                {/* Transliteration */}
                {settings.showTransliteration && ayah.transliteration && (
                  <p className="text-sm italic text-[var(--neu-text-muted)] mb-3 leading-relaxed">
                    {ayah.transliteration}
                  </p>
                )}

                {/* Translations */}
                <div className="space-y-2.5 max-w-3xl">
                  {settings.showBengali && ayah.bengali && (
                    <p
                      className="font-bengali text-[var(--neu-text-primary)] leading-[1.75]"
                      style={{ fontSize: `${settings.translationFontSize}px` }}
                    >
                      {ayah.bengali}
                    </p>
                  )}

                  {settings.showEnglish && ayah.english && (
                    <p
                      className="font-latin text-[var(--neu-text-secondary)] leading-[1.7]"
                      style={{
                        fontSize: `${Math.max(13, settings.translationFontSize - 1)}px`,
                      }}
                    >
                      {ayah.english}
                    </p>
                  )}
                </div>
              </article>
            );
          })}

          {/* Previous / Next Surah Footer */}
          <div className="flex items-center justify-between gap-4 pt-2">
            {surahMeta.number > 1 ? (
              <button
                type="button"
                onClick={() => onNavigateSurah(surahMeta.number - 1)}
                className="neu-btn px-5 py-3 rounded-2xl inline-flex items-center gap-2 text-sm font-semibold text-[var(--neu-text-primary)] cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>{isBn ? 'পূর্ববর্তী সূরা' : 'Previous Surah'}</span>
              </button>
            ) : (
              <div />
            )}

            {surahMeta.number < 114 && (
              <button
                type="button"
                onClick={() => onNavigateSurah(surahMeta.number + 1)}
                className="neu-btn px-5 py-3 rounded-2xl inline-flex items-center gap-2 text-sm font-semibold text-[var(--neu-accent)] cursor-pointer"
              >
                <span>{isBn ? 'পরবর্তী সূরা' : 'Next Surah'}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
