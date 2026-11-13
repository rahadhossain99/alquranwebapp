import React, { useEffect, useState } from 'react';
import {
  Bookmark,
  BookOpenText,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Pause,
  Play,
  RefreshCw,
  Share2,
  Star,
} from 'lucide-react';
import {
  Ayah,
  BookmarkItem,
  ReaderSettings,
  SurahDetail,
  SurahMeta,
} from '../types/quran';
import {
  getAyahHaloPalette,
  toArabicIndicDigits,
  toBengaliDigits,
} from '../utils/quranLogic';
import { ArabesqueDivider, AyahRosette } from './GeometricIcons';

interface SurahReaderProps {
  surahMeta: SurahMeta;
  surahDetail: SurahDetail | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  settings: ReaderSettings;
  activePlayingAyah: number | null;
  playingAyahDuration?: number;
  highlightedAyah: number | null;
  isPlaying: boolean;
  bookmarks: BookmarkItem[];
  favoriteSurahs: number[];
  readAyahKeys: Set<string>;
  onPlayAyah: (ayahNumber: number) => void;
  onPlaySurah: () => void;
  onToggleBookmark: (ayah: Ayah) => void;
  onToggleFavoriteSurah: (surahNumber: number) => void;
  onAutoMarkAyahRead: (ayahNumber: number) => void;
  onNavigateSurah: (surahNumber: number) => void;
  onOpenSurahList: () => void;
  onShareAyah: (ayah: Ayah) => void;
}

interface AyahCardProps {
  ayah: Ayah;
  surahNumber: number;
  isBn: boolean;
  isBookmarked: boolean;
  isRead: boolean;
  isActiveAudio: boolean;
  isCurrentlyPlaying: boolean;
  isHighlighted: boolean;
  isCopied: boolean;
  arabicFontSize: number;
  translationFontSize: number;
  transliterationFontSize: number;
  showBengali: boolean;
  showTransliteration: boolean;
  showEnglish: boolean;
  playingAyahDuration?: number;
  onPlayAyah: (ayahNumber: number) => void;
  onToggleBookmark: (ayah: Ayah) => void;
  onCopy: (ayah: Ayah) => void;
  onShareAyah: (ayah: Ayah) => void;
}

const AyahCard = React.memo<AyahCardProps>(
  ({
    ayah,
    surahNumber,
    isBn,
    isBookmarked,
    isRead,
    isActiveAudio,
    isCurrentlyPlaying,
    isHighlighted,
    isCopied,
    arabicFontSize,
    translationFontSize,
    transliterationFontSize,
    showBengali,
    showTransliteration,
    showEnglish,
    playingAyahDuration,
    onPlayAyah,
    onToggleBookmark,
    onCopy,
    onShareAyah,
  }) => {
    const rosetteNum = isBn
      ? toBengaliDigits(ayah.numberInSurah)
      : String(ayah.numberInSurah);

    const haloPalette = getAyahHaloPalette(ayah.numberInSurah);
    const estimatedSec = Math.max(
      4,
      Math.min(45, Math.round(ayah.arabic.length / 7.2) + 2)
    );
    const loopDurSec =
      isCurrentlyPlaying && playingAyahDuration && playingAyahDuration > 0
        ? playingAyahDuration
        : estimatedSec;

    return (
      <article
        id={`ayah-${ayah.numberInSurah}`}
        data-ayah-num={ayah.numberInSurah}
        data-testid={`ayah-card-${ayah.numberInSurah}`}
        data-playing={isCurrentlyPlaying ? 'true' : 'false'}
        style={
          isCurrentlyPlaying
            ? ({
                '--halo-c1': haloPalette.c1,
                '--halo-c2': haloPalette.c2,
                '--halo-duration': `${loopDurSec.toFixed(1)}s`,
              } as React.CSSProperties)
            : undefined
        }
        className={`rounded-3xl ayah-card-perf ${
          isCurrentlyPlaying
            ? 'ayah-playing-halo'
            : isHighlighted || isActiveAudio
              ? 'neu-raised ring-2 ring-[var(--neu-accent)]/65'
              : 'neu-raised'
        }`}
      >
        <div
          className={
            isCurrentlyPlaying ? 'ayah-playing-halo-inner p-5 sm:p-7' : 'p-5 sm:p-7'
          }
        >
          {/* Ayah Controls Header */}
          <div className="flex items-center justify-between gap-4 pb-4 border-b border-[var(--neu-divider)]">
            <div className="flex items-center gap-3">
              <div
                className={`rounded-full transition-transform duration-300 ${
                  isCurrentlyPlaying ? 'scale-110' : ''
                }`}
              >
                <AyahRosette
                  label={rosetteNum}
                  active={isActiveAudio || isRead || isHighlighted}
                  playing={isCurrentlyPlaying}
                  size={40}
                />
              </div>
              <span className="text-xs font-medium text-[var(--neu-text-muted)] tabular-nums">
                {isBn
                  ? `${toBengaliDigits(surahNumber)}:${toBengaliDigits(ayah.numberInSurah)}`
                  : `${surahNumber}:${ayah.numberInSurah}`}
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
                  isCurrentlyPlaying
                    ? 'neu-accent-btn px-3.5 scale-105'
                    : 'neu-btn w-10 text-[var(--neu-text-secondary)] hover:text-[var(--neu-accent)]'
                }`}
              >
                {isCurrentlyPlaying ? (
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
                onClick={() => onCopy(ayah)}
                aria-label={
                  isBn
                    ? `আয়াত ${ayah.numberInSurah} কপি করুন`
                    : `Copy Ayah ${ayah.numberInSurah}`
                }
                className="neu-btn w-10 h-10 rounded-xl flex items-center justify-center text-[var(--neu-text-secondary)] hover:text-[var(--neu-text-primary)] cursor-pointer"
              >
                {isCopied ? (
                  <Check className="w-4 h-4 text-[var(--neu-accent)]" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>

              <button
                type="button"
                onClick={() => onShareAyah(ayah)}
                aria-label={
                  isBn
                    ? `আয়াত ${ayah.numberInSurah} শেয়ার করুন`
                    : `Share Ayah ${ayah.numberInSurah}`
                }
                className="neu-btn w-10 h-10 rounded-xl flex items-center justify-center text-[var(--neu-text-secondary)] hover:text-[var(--neu-accent)] cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 1. Arabic Script */}
          <div className="pt-6 pb-4" dir="rtl">
            <p
              className="font-quran text-[var(--neu-text-primary)] leading-[2.2] text-right"
              style={{ fontSize: `var(--live-ar-size, ${arabicFontSize}px)` }}
            >
              {ayah.arabic}{' '}
              <span className="text-[var(--neu-gold)] text-[0.72em] select-none px-1">
                ﴿{toArabicIndicDigits(ayah.numberInSurah)}﴾
              </span>
            </p>
          </div>

          {/* 2. Bengali Meaning & 3. English Pronunciation (Transliteration) */}
          <div className="space-y-3 max-w-3xl">
            {showBengali && ayah.bengali && (
              <p
                className="font-bengali text-[var(--neu-text-primary)] leading-[1.75]"
                style={{ fontSize: `var(--live-bn-size, ${translationFontSize}px)` }}
              >
                {ayah.bengali}
              </p>
            )}

            {showTransliteration && ayah.transliteration && (
              <p
                className="font-latin text-[var(--neu-text-secondary)] leading-[1.7]"
                style={{ fontSize: `var(--live-tr-size, ${transliterationFontSize}px)` }}
              >
                <span className="font-semibold text-[var(--neu-accent)] not-italic mr-1.5 font-bengali">
                  {isBn ? 'উচ্চারণ:' : 'Pronunciation:'}
                </span>
                <span className="italic">{ayah.transliteration}</span>
              </p>
            )}

            {showEnglish && ayah.english && (
              <p
                className="font-latin text-[var(--neu-text-muted)] leading-[1.65]"
                style={{
                  fontSize: `var(--live-en-size, ${Math.max(12, translationFontSize - 2)}px)`,
                }}
              >
                {ayah.english}
              </p>
            )}
          </div>
        </div>
      </article>
    );
  }
);

export const SurahReader: React.FC<SurahReaderProps> = ({
  surahMeta,
  surahDetail,
  loading,
  error,
  onRetry,
  settings,
  activePlayingAyah,
  playingAyahDuration,
  highlightedAyah,
  isPlaying,
  bookmarks,
  favoriteSurahs,
  readAyahKeys,
  onPlayAyah,
  onPlaySurah,
  onToggleBookmark,
  onToggleFavoriteSurah,
  onAutoMarkAyahRead,
  onNavigateSurah,
  onOpenSurahList,
  onShareAyah,
}) => {
  const [copiedAyah, setCopiedAyah] = useState<number | null>(null);
  const isBn = settings.uiLanguage === 'bn';
  const isSurahFavorite = favoriteSurahs.includes(surahMeta.number);

  // Automatically record Ayahs viewed steadily in viewport as read
  useEffect(() => {
    if (!surahDetail || loading) return;
    if (typeof IntersectionObserver === 'undefined') return;

    const pendingTimers = new Map<number, number>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const raw = entry.target.getAttribute('data-ayah-num');
          const ayahNum = raw ? Number(raw) : 0;
          if (!ayahNum) continue;

          if (entry.isIntersecting) {
            if (!pendingTimers.has(ayahNum)) {
              const t = window.setTimeout(() => {
                onAutoMarkAyahRead(ayahNum);
                pendingTimers.delete(ayahNum);
              }, 1100);
              pendingTimers.set(ayahNum, t);
            }
          } else {
            const existing = pendingTimers.get(ayahNum);
            if (existing !== undefined) {
              window.clearTimeout(existing);
              pendingTimers.delete(ayahNum);
            }
          }
        }
      },
      { threshold: 0.45 }
    );

    const nodes = document.querySelectorAll('[data-ayah-num]');
    nodes.forEach((node) => observer.observe(node));

    return () => {
      observer.disconnect();
      pendingTimers.forEach((t) => window.clearTimeout(t));
      pendingTimers.clear();
    };
  }, [loading, onAutoMarkAyahRead, surahDetail]);

  const handleCopy = React.useCallback(
    async (ayah: Ayah) => {
      const text = `${ayah.arabic}\n\n${ayah.bengali}\n${ayah.english}\n— ${surahMeta.englishName} (${surahMeta.number}:${ayah.numberInSurah})`;
      try {
        await navigator.clipboard.writeText(text);
        setCopiedAyah(ayah.numberInSurah);
        setTimeout(() => setCopiedAyah(null), 1800);
      } catch {
        // Clipboard blocked in non-HTTPS contexts
      }
    },
    [surahMeta.englishName, surahMeta.number]
  );

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
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Surah Masthead Card */}
      <section
        key={surahMeta.number}
        aria-label={surahMeta.englishName}
        className="neu-raised rounded-3xl p-6 sm:p-8 text-center animate-drop-from-top"
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
              onClick={onOpenSurahList}
              className="neu-btn inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-medium text-[var(--neu-text-primary)] hover:text-[var(--neu-accent)] cursor-pointer whitespace-nowrap"
            >
              <BookOpenText className="w-4 h-4 text-[var(--neu-accent)]" />
              <span>{isBn ? 'সকল সূরা (১১৪)' : 'All Surahs (114)'}</span>
            </button>

            <button
              type="button"
              onClick={() => onToggleFavoriteSurah(surahMeta.number)}
              aria-pressed={isSurahFavorite}
              aria-label={
                isBn
                  ? `${surahMeta.bengaliName} ফেভারিট করুন`
                  : `Favorite ${surahMeta.englishName}`
              }
              className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl text-sm font-medium cursor-pointer whitespace-nowrap transition-all ${
                isSurahFavorite
                  ? 'neu-inset text-[var(--neu-gold)] font-semibold'
                  : 'neu-btn text-[var(--neu-text-secondary)] hover:text-[var(--neu-gold)]'
              }`}
            >
              <Star className={`w-4 h-4 ${isSurahFavorite ? 'fill-current' : ''}`} />
              <span>
                {isSurahFavorite
                  ? isBn
                    ? 'পছন্দের'
                    : 'Starred'
                  : isBn
                    ? 'ফেভারিট'
                    : 'Favorite'}
              </span>
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
            const isCurrentlyPlaying = isActiveAudio && isPlaying;
            const isHighlighted = highlightedAyah === ayah.numberInSurah;

            return (
              <AyahCard
                key={ayah.numberInSurah}
                ayah={ayah}
                surahNumber={surahMeta.number}
                isBn={isBn}
                isBookmarked={isBookmarked}
                isRead={isRead}
                isActiveAudio={isActiveAudio}
                isCurrentlyPlaying={isCurrentlyPlaying}
                isHighlighted={isHighlighted}
                isCopied={copiedAyah === ayah.numberInSurah}
                arabicFontSize={settings.arabicFontSize}
                translationFontSize={settings.translationFontSize}
                transliterationFontSize={settings.transliterationFontSize}
                showBengali={settings.showBengali}
                showTransliteration={settings.showTransliteration}
                showEnglish={settings.showEnglish}
                playingAyahDuration={playingAyahDuration}
                onPlayAyah={onPlayAyah}
                onToggleBookmark={onToggleBookmark}
                onCopy={handleCopy}
                onShareAyah={onShareAyah}
              />
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
