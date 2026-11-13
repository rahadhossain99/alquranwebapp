import React, { useMemo, useRef, useState } from 'react';
import {
  BookOpen,
  BookOpenText,
  ChevronDown,
  ChevronUp,
  Grid2x2,
  Layers,
  Mic2,
  Pause,
  Play,
  Search,
  Share2,
  SkipBack,
  SkipForward,
  SlidersHorizontal,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { SmoothFontRange } from './SmoothFontRange';
import { RECITERS, SURAH_META } from '../data/surahMeta';
import { Ayah, ReaderSettings, ReciterId, SurahMeta } from '../types/quran';
import {
  buildAyahNumberList,
  buildSurahParts,
  estimateAyahDurations,
  filterSurahs,
  findAyahAtSurahTime,
  formatHumanDuration,
  getSurahTimelinePosition,
  toBengaliDigits,
} from '../utils/quranLogic';
import { AyahRosette, NeuWaveform } from './GeometricIcons';

interface AudioPlayerBarProps {
  surah: SurahMeta;
  playingSurahNumber: number;
  currentAyah: number;
  currentAyahObj?: Ayah;
  surahAyahs?: Ayah[];
  measuredAyahDurations?: Record<number, number>;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  muted: boolean;
  settings: ReaderSettings;
  audioNotice: string | null;
  showJumpButton: boolean;
  dismissed: boolean;
  onDismiss: () => void;
  onRestore: () => void;
  onTogglePlay: () => void;
  onPrevAyah: () => void;
  onNextAyah: () => void;
  onSeek: (time: number) => void;
  onSeekSurahTime: (ayahNumber: number, offsetInAyah: number) => void;
  onToggleMute: () => void;
  onUpdateSettings: (partial: Partial<ReaderSettings>) => void;
  onJumpToAyah: (ayahNumber: number) => void;
  onSelectPart: (startAyah: number, closePlayer?: boolean) => void;
  onSelectSurah: (surahNumber: number) => void;
  onShareCurrent: () => void;
  onOpenSettings: () => void;
  onGoToReadingPosition?: () => void;
  expanded: boolean;
  activeDrawer: FullPlayerDrawer;
  jumpOpen: boolean;
  dockedSettingsOpen: boolean;
  onToggleExpand: () => void;
  onCloseExpand: () => void;
  onToggleDrawer: (target: Exclude<FullPlayerDrawer, null>) => void;
  onCloseDrawer: () => void;
  onToggleJumpOpen: () => void;
  onCloseJumpOpen: () => void;
  onToggleDockedSettings: () => void;
  onCloseDockedSettings: () => void;
}

export type FullPlayerDrawer = 'surah' | 'ayah' | 'qari' | 'settings' | 'parts' | null;

export const AudioPlayerBar: React.FC<AudioPlayerBarProps> = ({
  surah,
  playingSurahNumber,
  currentAyah,
  currentAyahObj,
  surahAyahs,
  measuredAyahDurations,
  isPlaying,
  currentTime,
  duration,
  muted,
  settings,
  audioNotice,
  showJumpButton,
  dismissed,
  onDismiss,
  onRestore,
  onTogglePlay,
  onPrevAyah,
  onNextAyah,
  onSeek,
  onSeekSurahTime,
  onToggleMute,
  onUpdateSettings,
  onJumpToAyah,
  onSelectPart,
  onSelectSurah,
  onShareCurrent,
  onOpenSettings,
  onGoToReadingPosition,
  expanded,
  activeDrawer,
  jumpOpen,
  dockedSettingsOpen,
  onToggleExpand,
  onCloseExpand,
  onToggleDrawer,
  onCloseDrawer,
  onToggleJumpOpen,
  onCloseJumpOpen,
  onToggleDockedSettings,
  onCloseDockedSettings,
}) => {
  const [surahQuery, setSurahQuery] = useState('');

  // Whole-Surah interactive timeline scrub preview
  const [scrubPreviewTime, setScrubPreviewTime] = useState<number | null>(null);
  const [lastSeekLabel, setLastSeekLabel] = useState<string | null>(null);
  const isScrubbingRef = useRef(false);
  const seekFeedbackTimerRef = useRef<number | null>(null);

  // Horizontal swipe-to-dismiss state for docked bottom player
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);
  const swipingAxisRef = useRef<'x' | 'y' | null>(null);

  const isBn = settings.uiLanguage === 'bn';
  const reciter = RECITERS.find((r) => r.id === settings.reciterId) ?? RECITERS[0];
  const ayahNumbers = buildAyahNumberList(surah.ayahCount);
  const filteredSurahs = filterSurahs(SURAH_META, surahQuery, 'all');
  const surahParts = useMemo(
    () => buildSurahParts(surah.ayahCount, isBn),
    [surah.ayahCount, isBn]
  );

  // Whole-surah duration & timeline calculation
  const arabicCharLengths = useMemo(
    () => surahAyahs?.map((a) => a.arabic.length),
    [surahAyahs]
  );
  const surahDurations = useMemo(
    () =>
      estimateAyahDurations(surah.ayahCount, arabicCharLengths, measuredAyahDurations),
    [surah.ayahCount, arabicCharLengths, measuredAyahDurations]
  );
  const activeAyahIndexForTimeline =
    surah.number === playingSurahNumber ? currentAyah : 1;
  const surahTimeline = useMemo(
    () =>
      getSurahTimelinePosition(
        surahDurations,
        activeAyahIndexForTimeline,
        surah.number === playingSurahNumber ? currentTime : 0
      ),
    [
      surahDurations,
      activeAyahIndexForTimeline,
      surah.number,
      playingSurahNumber,
      currentTime,
    ]
  );

  const effectiveSurahScrubValue =
    scrubPreviewTime !== null ? scrubPreviewTime : surahTimeline.elapsed;
  const scrubTargetInfo = useMemo(
    () => findAyahAtSurahTime(surahDurations, effectiveSurahScrubValue),
    [surahDurations, effectiveSurahScrubValue]
  );

  const ayahText = isBn
    ? `আয়াত ${toBengaliDigits(currentAyah)} / ${toBengaliDigits(surah.ayahCount)}`
    : `Ayah ${currentAyah} / ${surah.ayahCount}`;

  const rangeLabel = isBn
    ? `১–${toBengaliDigits(surah.ayahCount)}`
    : `1–${surah.ayahCount}`;

  const handleToggleExpand = () => {
    onToggleExpand();
  };

  const handleToggleDrawer = (target: Exclude<FullPlayerDrawer, null>) => {
    onToggleDrawer(target);
  };

  const showTimedSeekFeedback = (targetSecs: number, targetAyahNum: number) => {
    const timeLabel = formatHumanDuration(targetSecs, isBn, false);
    const msg = isBn
      ? `${timeLabel} → আয়াত ${toBengaliDigits(targetAyahNum)}`
      : `${timeLabel} → Ayah ${targetAyahNum}`;
    setLastSeekLabel(msg);
    if (seekFeedbackTimerRef.current !== null) {
      window.clearTimeout(seekFeedbackTimerRef.current);
    }
    seekFeedbackTimerRef.current = window.setTimeout(() => {
      setLastSeekLabel(null);
    }, 2400);
  };

  const commitSurahScrub = (secondsVal: number) => {
    const mapped = findAyahAtSurahTime(surahDurations, secondsVal);
    onSeekSurahTime(mapped.ayahNumber, mapped.offsetInAyah);
    showTimedSeekFeedback(secondsVal, mapped.ayahNumber);
    setScrubPreviewTime(null);
  };

  // Pointer swipe handlers for left/right dismiss on docked bottom bar
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const targetEl = e.target as HTMLElement | null;
    if (targetEl?.closest('input[type="range"]')) return;
    pointerStartRef.current = { x: e.clientX, y: e.clientY };
    swipingAxisRef.current = null;
    setIsDragging(false);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!pointerStartRef.current) return;
    const dx = e.clientX - pointerStartRef.current.x;
    const dy = e.clientY - pointerStartRef.current.y;

    if (!swipingAxisRef.current) {
      if (Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy)) {
        swipingAxisRef.current = 'x';
        setIsDragging(true);
      } else if (Math.abs(dy) > 10) {
        swipingAxisRef.current = 'y';
        pointerStartRef.current = null;
        return;
      }
    }

    if (swipingAxisRef.current === 'x') {
      setDragX(dx);
    }
  };

  const handlePointerEnd = () => {
    if (!pointerStartRef.current) return;
    const finalDx = dragX;
    pointerStartRef.current = null;
    swipingAxisRef.current = null;
    setIsDragging(false);

    if (Math.abs(finalDx) > 75) {
      setDragX(finalDx > 0 ? 420 : -420);
      window.setTimeout(() => {
        onCloseJumpOpen();
        onCloseDockedSettings();
        setDragX(0);
        onDismiss();
      }, 170);
    } else {
      setDragX(0);
    }
  };

  const renderFontSizeSlideControls = (onCloseSlide: () => void, onGoFullSettings?: () => void) => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="neu-inset-sm rounded-2xl p-3.5">
          <SmoothFontRange
            id="quick-arabic-font"
            label={isBn ? 'আরবি ফন্ট' : 'Arabic Font'}
            ariaLabel={isBn ? 'আরবি ফন্টের আকার' : 'Arabic font size'}
            settingKey="arabicFontSize"
            value={settings.arabicFontSize}
            min={24}
            max={48}
            step={2}
            isBn={isBn}
            onCommit={(arabicFontSize) => onUpdateSettings({ arabicFontSize })}
          />
        </div>

        <div className="neu-inset-sm rounded-2xl p-3.5">
          <SmoothFontRange
            id="quick-bengali-font"
            label={isBn ? 'বাংলা ফন্ট' : 'Bengali Font'}
            ariaLabel={isBn ? 'বাংলা ফন্টের আকার' : 'Bengali font size'}
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
        </div>

        <div className="neu-inset-sm rounded-2xl p-3.5">
          <SmoothFontRange
            id="quick-pronunciation-font"
            label={isBn ? 'ইংরেজি উচ্চারণ' : 'Pronunciation'}
            ariaLabel={isBn ? 'ইংরেজি উচ্চারণ ফন্টের আকার' : 'Pronunciation font size'}
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
        </div>
      </div>

      {onGoFullSettings && (
        <div className="flex items-center justify-between pt-1">
          <button
            type="button"
            onClick={() => {
              onGoFullSettings();
            }}
            className="text-xs font-semibold text-[var(--neu-accent)] hover:underline cursor-pointer"
          >
            {isBn ? 'থিম ও সব সেটিংস পাতায় যান →' : 'Open full settings page →'}
          </button>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Full-Screen Top-Slide-Down Audio Player */}
      {expanded && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={isBn ? 'সম্পূর্ণ অডিও প্লেয়ার' : 'Full-Screen Audio Player'}
          className="fixed inset-0 z-50 bg-[var(--neu-bg)] overflow-y-auto animate-slide-down-full"
        >
          <div className="min-h-full max-w-4xl mx-auto px-4 sm:px-8 py-4 sm:py-6 flex flex-col justify-start gap-4 sm:gap-5">
            {/* Top Bar */}
            <div className="flex items-center justify-between gap-3 pb-3.5 border-b border-[var(--neu-divider)] shrink-0">
              <button
                type="button"
                onClick={onCloseExpand}
                aria-label={isBn ? 'প্লেয়ার ছোট করুন' : 'Minimize player'}
                className="neu-btn h-10 px-3.5 rounded-2xl inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[var(--neu-text-primary)] cursor-pointer shrink-0"
              >
                <ChevronDown className="w-4 h-4" />
                <span>{isBn ? 'বন্ধ করো' : 'Close'}</span>
              </button>

              <div className="text-center min-w-0">
                <p className="text-[11px] font-semibold text-[var(--neu-accent)] truncate">
                  {isBn ? 'এখন তিলাওয়াত চলছে' : 'Now Reciting'}
                </p>
                <h2 className="text-sm sm:text-base font-bold text-[var(--neu-text-primary)] truncate font-bengali tabular-nums">
                  {isBn ? surah.bengaliName : surah.englishName} · {ayahText}
                </h2>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={onShareCurrent}
                  aria-label={isBn ? 'আয়াত শেয়ার করুন' : 'Share current Ayah'}
                  className="neu-btn h-10 px-3 rounded-2xl inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--neu-accent)] cursor-pointer"
                >
                  <Share2 className="w-4 h-4" />
                  <span className="hidden sm:inline">{isBn ? 'শেয়ার' : 'Share'}</span>
                </button>

                <button
                  type="button"
                  aria-expanded={activeDrawer === 'settings'}
                  onClick={() => handleToggleDrawer('settings')}
                  aria-label={isBn ? 'ফন্ট ও দ্রুত সেটিংস' : 'Quick Font Settings'}
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center cursor-pointer transition-all ${
                    activeDrawer === 'settings'
                      ? 'neu-inset text-[var(--neu-accent)]'
                      : 'neu-btn text-[var(--neu-text-secondary)] hover:text-[var(--neu-accent)]'
                  }`}
                >
                  <SlidersHorizontal className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Top Trigger Bar for Surah / Ayah / Qari */}
            <div className="flex flex-wrap items-center justify-center gap-2.5 shrink-0">
              <button
                type="button"
                aria-expanded={activeDrawer === 'surah'}
                onClick={() => handleToggleDrawer('surah')}
                className={`px-4 py-2 rounded-2xl text-xs font-semibold inline-flex items-center gap-2 cursor-pointer transition-all ${
                  activeDrawer === 'surah'
                    ? 'neu-inset text-[var(--neu-accent)]'
                    : 'neu-btn text-[var(--neu-text-primary)]'
                }`}
              >
                <BookOpenText className="w-3.5 h-3.5 text-[var(--neu-accent)]" />
                <span>
                  {isBn
                    ? `সূরা (${toBengaliDigits(surah.number)})`
                    : `Surah (${surah.number})`}
                </span>
              </button>

              <button
                type="button"
                aria-expanded={activeDrawer === 'ayah'}
                onClick={() => handleToggleDrawer('ayah')}
                className={`px-4 py-2 rounded-2xl text-xs font-semibold inline-flex items-center gap-2 cursor-pointer transition-all tabular-nums ${
                  activeDrawer === 'ayah'
                    ? 'neu-inset text-[var(--neu-accent)]'
                    : 'neu-btn text-[var(--neu-text-primary)]'
                }`}
              >
                <Grid2x2 className="w-3.5 h-3.5 text-[var(--neu-gold)]" />
                <span>{isBn ? `আয়াত (${rangeLabel})` : `Ayah (${rangeLabel})`}</span>
              </button>

              <button
                type="button"
                aria-expanded={activeDrawer === 'qari'}
                onClick={() => handleToggleDrawer('qari')}
                className={`px-4 py-2 rounded-2xl text-xs font-semibold inline-flex items-center gap-2 cursor-pointer transition-all ${
                  activeDrawer === 'qari'
                    ? 'neu-inset text-[var(--neu-accent)]'
                    : 'neu-btn text-[var(--neu-text-primary)]'
                }`}
              >
                <Mic2 className="w-3.5 h-3.5 text-[var(--neu-accent)]" />
                <span>
                  {isBn
                    ? `ক্বারি (${toBengaliDigits(RECITERS.length)})`
                    : `Qari (${RECITERS.length})`}
                </span>
              </button>
            </div>

            {/* Top-Dropdown Drawer (Surah / Ayah / Qari / Quick Font Settings / Surah Parts) */}
            {activeDrawer !== null && (
              <div
                role="region"
                aria-label={
                  activeDrawer === 'surah'
                    ? isBn
                      ? 'সূরা নির্বাচন'
                      : 'Select Surah'
                    : activeDrawer === 'ayah'
                      ? isBn
                        ? 'আয়াত নম্বর নির্বাচন'
                        : 'Select Ayah'
                      : activeDrawer === 'qari'
                        ? isBn
                          ? 'ক্বারি নির্বাচন'
                          : 'Select Qari'
                        : activeDrawer === 'parts'
                          ? isBn
                            ? 'সূরার পার্টসমূহ'
                            : 'Surah Parts'
                          : isBn
                            ? 'ফন্টের আকার ও দ্রুত সেটিংস'
                            : 'Quick Font Settings'
                }
                className="neu-raised rounded-3xl p-5 sm:p-6 space-y-4 animate-drop-from-top shrink-0"
              >
                <div className="flex items-center justify-between gap-3 pb-3 border-b border-[var(--neu-divider)]">
                  <h3 className="text-sm sm:text-base font-bold text-[var(--neu-text-primary)] font-bengali">
                    {activeDrawer === 'surah'
                      ? isBn
                        ? 'সূরা নির্বাচন করুন (১১৪)'
                        : 'Choose Surah (114)'
                      : activeDrawer === 'ayah'
                        ? isBn
                          ? `${surah.bengaliName} — আয়াত (${rangeLabel})`
                          : `${surah.englishName} — Ayahs (${rangeLabel})`
                        : activeDrawer === 'qari'
                          ? isBn
                            ? 'ক্বারি পরিবর্তন করুন (সাথে সাথেই পরিবর্তন হবে)'
                            : 'Switch Reciter (Updates live)'
                          : activeDrawer === 'parts'
                            ? isBn
                              ? `${surah.bengaliName} — পার্ট অনুযায়ী যান`
                              : `${surah.englishName} — Jump by Part`
                            : isBn
                              ? 'ফন্টের আকার সমন্বয় করুন'
                              : 'Adjust Font Sizes'}
                  </h3>

                  <button
                    type="button"
                    onClick={onCloseDrawer}
                    className="neu-btn px-3 py-1.5 rounded-xl text-xs font-semibold text-[var(--neu-text-secondary)] hover:text-[var(--neu-text-primary)] inline-flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>{isBn ? 'বন্ধ করো' : 'Close'}</span>
                  </button>
                </div>

                {activeDrawer === 'settings' &&
                  renderFontSizeSlideControls(
                    onCloseDrawer,
                    onOpenSettings
                  )}

                {activeDrawer === 'parts' && (
                  <div className="space-y-3">
                    <div className="max-h-[260px] overflow-y-auto px-1 py-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                      {surahParts.map((part) => {
                        const isActivePart =
                          currentAyah >= part.startAyah && currentAyah <= part.endAyah;
                        const cueArabic =
                          surahAyahs?.[part.startAyah - 1]?.arabic.slice(0, 34);
                        return (
                          <button
                            key={part.partNumber}
                            type="button"
                            onClick={() => {
                              onSelectPart(part.startAyah, true);
                            }}
                            className={`text-left px-4 py-3 rounded-2xl flex items-center justify-between gap-2.5 cursor-pointer ${
                              isActivePart
                                ? 'neu-inset ring-1 ring-[var(--neu-accent)]/40 text-[var(--neu-accent)]'
                                : 'neu-btn text-[var(--neu-text-primary)]'
                            }`}
                          >
                            <div className="min-w-0 flex-1">
                              <div className="text-xs sm:text-sm font-bold font-bengali">
                                {part.label}
                              </div>
                              {cueArabic ? (
                                <p
                                  dir="rtl"
                                  className="font-quran text-sm text-[var(--neu-text-secondary)] truncate mt-0.5"
                                >
                                  {cueArabic}…
                                </p>
                              ) : (
                                <div className="text-[11px] text-[var(--neu-text-muted)] mt-0.5">
                                  {isBn
                                    ? `আয়াত ${toBengaliDigits(part.startAyah)} থেকে পড়ুন`
                                    : `Read from Ayah ${part.startAyah}`}
                                </div>
                              )}
                            </div>
                            <span className="text-xs font-bold text-[var(--neu-accent)] shrink-0">
                              →
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {activeDrawer === 'surah' && (
                  <div className="space-y-3">
                    <div className="neu-inset rounded-2xl px-3.5 py-2 flex items-center gap-2">
                      <Search className="w-4 h-4 text-[var(--neu-text-muted)] shrink-0" />
                      <input
                        type="search"
                        value={surahQuery}
                        onChange={(e) => setSurahQuery(e.target.value)}
                        placeholder={isBn ? 'সূরা খুঁজুন...' : 'Search Surah...'}
                        className="w-full bg-transparent text-xs sm:text-sm text-[var(--neu-text-primary)] placeholder:text-[var(--neu-text-muted)] focus:outline-none"
                      />
                    </div>
                    <div className="max-h-[260px] overflow-y-auto px-1 py-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                      {filteredSurahs.map((s) => {
                        const active = s.number === surah.number;
                        const playingNow = isPlaying && s.number === playingSurahNumber;
                        const btnBody = (
                          <button
                            key={s.number}
                            type="button"
                            onClick={() => {
                              onSelectSurah(s.number);
                            }}
                            className={`w-full text-left px-3.5 py-2.5 rounded-2xl flex items-center justify-between gap-2 cursor-pointer transition-all ${
                              playingNow
                                ? 'bg-transparent text-[var(--neu-accent)]'
                                : active
                                  ? 'neu-inset text-[var(--neu-accent)]'
                                  : 'neu-btn text-[var(--neu-text-primary)]'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <AyahRosette
                                label={
                                  isBn ? toBengaliDigits(s.number) : String(s.number)
                                }
                                active={active || playingNow}
                                playing={playingNow}
                                size={32}
                              />
                              <div className="min-w-0">
                                <div className="text-xs sm:text-sm font-semibold truncate font-bengali">
                                  {isBn ? s.bengaliName : s.englishName}
                                </div>
                                <div className="text-[11px] text-[var(--neu-text-muted)] tabular-nums">
                                  {isBn
                                    ? `${toBengaliDigits(s.ayahCount)} আয়াত`
                                    : `${s.ayahCount} Ayahs`}
                                  {playingNow && (
                                    <span className="ml-1 font-semibold text-[var(--neu-accent)]">
                                      · {isBn ? 'চলছে' : 'Playing'}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <span className="font-quran text-base shrink-0">
                              {s.arabicName.replace('سُورَةُ ', '')}
                            </span>
                          </button>
                        );

                        if (playingNow) {
                          return (
                            <div key={s.number} className="ayah-playing-halo rounded-2xl">
                              <div className="ayah-playing-halo-inner rounded-2xl">
                                {btnBody}
                              </div>
                            </div>
                          );
                        }
                        return btnBody;
                      })}
                    </div>
                  </div>
                )}

                {activeDrawer === 'ayah' && (
                  <div className="max-h-[260px] overflow-y-auto px-1 py-1 grid grid-cols-5 sm:grid-cols-8 gap-2">
                    {ayahNumbers.map((num) => {
                      const isCurrent = num === currentAyah;
                      return (
                        <button
                          key={num}
                          type="button"
                          onClick={() => {
                            onJumpToAyah(num);
                            onCloseDrawer();
                          }}
                          className={`h-10 rounded-xl text-xs font-bold tabular-nums cursor-pointer transition-all ${
                            isCurrent
                              ? 'neu-accent-btn'
                              : 'neu-btn text-[var(--neu-text-primary)] hover:text-[var(--neu-accent)]'
                          }`}
                        >
                          {isBn ? toBengaliDigits(num) : num}
                        </button>
                      );
                    })}
                  </div>
                )}

                {activeDrawer === 'qari' && (
                  <div className="max-h-[270px] overflow-y-auto px-1 py-1 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {RECITERS.map((r) => {
                      const active = r.id === settings.reciterId;
                      return (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => onUpdateSettings({ reciterId: r.id })}
                          className={`w-full text-left px-3.5 py-2.5 rounded-2xl flex items-center justify-between gap-2 cursor-pointer transition-all ${
                            active
                              ? 'neu-inset text-[var(--neu-accent)]'
                              : 'neu-btn text-[var(--neu-text-primary)]'
                          }`}
                        >
                          <div className="min-w-0">
                            <div className="text-xs sm:text-sm font-semibold truncate font-bengali">
                              {isBn ? r.bengaliName : r.englishName}
                            </div>
                            <div className="text-[11px] text-[var(--neu-text-muted)]">
                              {r.style}
                            </div>
                          </div>
                          {active && (
                            <span className="text-[11px] font-bold text-[var(--neu-accent)] shrink-0">
                              {isBn ? 'নির্বাচিত' : 'Active'}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Main Verse Card */}
            <div className="neu-raised rounded-3xl p-4 sm:p-8 flex-1 flex flex-col justify-between gap-3.5 sm:gap-6 min-h-[340px] sm:min-h-[500px] animate-drop-from-top">
              {/* Medallion & Reciter Header */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    className={`neu-inset w-11 h-11 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-300 ${
                      isPlaying ? 'ring-2 ring-[var(--neu-accent)]/50 scale-105' : ''
                    }`}
                  >
                    <NeuWaveform isPlaying={isPlaying} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-base sm:text-xl font-bold text-[var(--neu-text-primary)] truncate font-bengali">
                      {isBn ? surah.bengaliName : surah.englishName}
                    </div>
                    <div className="text-xs sm:text-sm text-[var(--neu-text-secondary)] truncate font-bengali">
                      {isBn ? reciter.bengaliName : reciter.englishName}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  {onGoToReadingPosition && (
                    <button
                      type="button"
                      onClick={onGoToReadingPosition}
                      aria-label={isBn ? 'পাঠ অবস্থানে যান' : 'Go to reading position'}
                      className="neu-btn h-9 px-3 rounded-xl inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--neu-accent)] cursor-pointer"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>{isBn ? 'পাঠ' : 'Read'}</span>
                    </button>
                  )}

                  <AyahRosette
                    label={isBn ? toBengaliDigits(currentAyah) : String(currentAyah)}
                    active={isPlaying}
                    playing={isPlaying}
                    size={44}
                  />
                </div>
              </div>

              {/* Generous Verse Showcase: Live root CSS font sizing (zero lag during drag) */}
              <div className="neu-inset rounded-3xl p-4 sm:p-8 flex-1 flex flex-col justify-center space-y-3 sm:space-y-5 min-h-[160px] sm:min-h-[250px]">
                <p
                  dir="rtl"
                  className="font-quran text-[var(--neu-text-primary)] leading-[2.2] text-right"
                  style={{ fontSize: `var(--live-ar-size, ${settings.arabicFontSize}px)` }}
                >
                  {currentAyahObj?.arabic ?? surah.arabicName}
                </p>

                {currentAyahObj && (
                  <div className="space-y-3 pt-4 border-t border-[var(--neu-divider)]">
                    <p
                      className="text-[var(--neu-text-primary)] font-bengali leading-relaxed"
                      style={{ fontSize: `var(--live-bn-size, ${settings.translationFontSize}px)` }}
                    >
                      {currentAyahObj.bengali}
                    </p>
                    {currentAyahObj.transliteration && (
                      <p
                        className="text-[var(--neu-text-secondary)] font-latin leading-relaxed"
                        style={{
                          fontSize: `var(--live-tr-size, ${settings.transliterationFontSize}px)`,
                        }}
                      >
                        <span className="font-semibold text-[var(--neu-accent)] mr-1.5 font-bengali">
                          {isBn ? 'উচ্চারণ:' : 'Pronunciation:'}
                        </span>
                        <span className="italic">{currentAyahObj.transliteration}</span>
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Dual Timelines & Transport Controls */}
              <div className="space-y-3.5">
                {audioNotice && (
                  <p className="text-xs text-center font-medium text-amber-700 dark:text-amber-300">
                    {audioNotice}
                  </p>
                )}

                {/* Timeline 1: Current Ayah Progress (Clean single duration readout) */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-medium text-[var(--neu-text-muted)] px-1">
                    <span>{isBn ? 'বর্তমান আয়াত' : 'Current Ayah'}</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="text-[11px] text-[var(--neu-text-primary)] font-semibold tabular-nums min-w-[54px] text-right whitespace-nowrap">
                      {formatHumanDuration(currentTime, isBn, true)}
                    </span>
                    <input
                      type="range"
                      min={0}
                      max={duration > 0 ? duration : 100}
                      value={Math.min(currentTime, duration > 0 ? duration : 100)}
                      onChange={(e) => onSeek(Number(e.target.value))}
                      aria-label={isBn ? 'আয়াত সময়রেখা' : 'Current Ayah timeline'}
                      className="neu-range flex-1"
                    />
                    <span className="text-[11px] text-[var(--neu-text-muted)] font-semibold tabular-nums min-w-[54px] whitespace-nowrap">
                      {formatHumanDuration(duration, isBn, true)}
                    </span>
                  </div>
                </div>

                {/* Timeline 2: Bigger Whole-Surah Timeline (No repeated text, silky scrub preview) */}
                <div className="neu-inset-sm rounded-2xl px-4 py-3 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="font-bold text-[var(--neu-text-primary)] font-bengali">
                      {isBn
                        ? `পুরো সূরা (${surah.bengaliName})`
                        : `Whole Surah (${surah.englishName})`}
                    </span>

                    {scrubPreviewTime !== null ? (
                      <span className="px-2.5 py-0.5 rounded-xl bg-[var(--neu-accent)] text-white dark:text-[#091513] font-bold text-[11px] tabular-nums">
                        {isBn
                          ? `${formatHumanDuration(scrubPreviewTime, true, false)} → আয়াত ${toBengaliDigits(scrubTargetInfo.ayahNumber)}`
                          : `${formatHumanDuration(scrubPreviewTime, false, false)} → Ayah ${scrubTargetInfo.ayahNumber}`}
                      </span>
                    ) : lastSeekLabel ? (
                      <span className="px-2.5 py-0.5 rounded-xl neu-raised-sm text-[var(--neu-accent)] font-bold text-[11px] tabular-nums">
                        {lastSeekLabel}
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold text-[var(--neu-text-secondary)] tabular-nums">
                        {formatHumanDuration(surahTimeline.elapsed, isBn, true)} /{' '}
                        {formatHumanDuration(surahTimeline.total, isBn, true)}
                      </span>
                    )}
                  </div>

                  <input
                    type="range"
                    min={0}
                    max={Math.max(1, Math.round(surahTimeline.total))}
                    step={1}
                    value={Math.min(
                      Math.round(effectiveSurahScrubValue),
                      Math.max(1, Math.round(surahTimeline.total))
                    )}
                    onPointerDown={() => {
                      isScrubbingRef.current = true;
                    }}
                    onMouseDown={() => {
                      isScrubbingRef.current = true;
                    }}
                    onTouchStart={() => {
                      isScrubbingRef.current = true;
                    }}
                    onChange={(e) => {
                      const nextSec = Number(e.target.value);
                      if (isScrubbingRef.current) {
                        setScrubPreviewTime(nextSec);
                      } else {
                        commitSurahScrub(nextSec);
                      }
                    }}
                    onPointerUp={(e) => {
                      isScrubbingRef.current = false;
                      const val = Number((e.currentTarget as HTMLInputElement).value);
                      commitSurahScrub(val);
                    }}
                    onMouseUp={(e) => {
                      if (isScrubbingRef.current) {
                        isScrubbingRef.current = false;
                        const val = Number((e.currentTarget as HTMLInputElement).value);
                        commitSurahScrub(val);
                      }
                    }}
                    onTouchEnd={(e) => {
                      if (isScrubbingRef.current) {
                        isScrubbingRef.current = false;
                        const val = Number((e.currentTarget as HTMLInputElement).value);
                        commitSurahScrub(val);
                      }
                    }}
                    aria-label={isBn ? 'পুরো সূরার সময়রেখা' : 'Whole Surah timeline'}
                    className="neu-range-lg w-full"
                  />
                </div>

                {/* Bottom Transport Row: Bottom-Left 'পার্ট' Button + Play/Prev/Next + Mute */}
                <div className="flex items-center justify-between gap-2 pt-1">
                  <button
                    type="button"
                    aria-expanded={activeDrawer === 'parts'}
                    onClick={() => handleToggleDrawer('parts')}
                    aria-label={isBn ? 'সূরার পার্টসমূহ' : 'Surah Parts'}
                    className={`h-11 px-3 sm:px-3.5 rounded-2xl inline-flex items-center gap-1.5 text-xs font-semibold cursor-pointer transition-all shrink-0 ${
                      activeDrawer === 'parts'
                        ? 'neu-inset text-[var(--neu-accent)]'
                        : 'neu-btn text-[var(--neu-text-primary)] hover:text-[var(--neu-accent)]'
                    }`}
                  >
                    <Layers className="w-4 h-4 text-[var(--neu-accent)]" />
                    <span>{isBn ? 'পার্ট' : 'Parts'}</span>
                  </button>

                  {/* Central Transport */}
                  <div className="flex items-center gap-3 sm:gap-5">
                    <button
                      type="button"
                      onClick={onPrevAyah}
                      aria-label={isBn ? 'পূর্ববর্তী আয়াত' : 'Previous Ayah'}
                      className="neu-btn w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-[var(--neu-text-primary)] cursor-pointer"
                    >
                      <SkipBack className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>

                    <button
                      type="button"
                      onClick={onTogglePlay}
                      aria-label={
                        isPlaying
                          ? isBn
                            ? 'তিলাওয়াত বিরতি'
                            : 'Pause recitation'
                          : isBn
                            ? 'তিলাওয়াত চালু করুন'
                            : 'Play recitation'
                      }
                      className={`neu-accent-btn w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center cursor-pointer transition-transform duration-300 ${
                        isPlaying ? 'scale-105 ring-4 ring-[var(--neu-accent-soft)]' : ''
                      }`}
                    >
                      {isPlaying ? (
                        <Pause className="w-6 h-6 fill-current" />
                      ) : (
                        <Play className="w-6 h-6 fill-current translate-x-[1px]" />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={onNextAyah}
                      aria-label={isBn ? 'পরবর্তী আয়াত' : 'Next Ayah'}
                      className="neu-btn w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-[var(--neu-text-primary)] cursor-pointer"
                    >
                      <SkipForward className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={onToggleMute}
                    aria-label={muted ? (isBn ? 'শব্দ চালু' : 'Unmute') : isBn ? 'নিঃশব্দ' : 'Mute'}
                    className="neu-btn w-11 h-11 rounded-2xl flex items-center justify-center text-[var(--neu-text-secondary)] cursor-pointer shrink-0"
                  >
                    {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top-Down Quick Font Settings Slide when clicked from Docked Player */}
      {!expanded && dockedSettingsOpen && (
        <div
          role="dialog"
          aria-modal="false"
          aria-label={isBn ? 'দ্রুত ফন্ট সেটিংস' : 'Quick Font Settings'}
          className="fixed top-4 left-3 right-3 sm:left-1/2 sm:-translate-x-1/2 sm:w-full sm:max-w-2xl z-50 neu-raised rounded-3xl p-5 sm:p-6 space-y-4 animate-drop-from-top"
        >
          <div className="flex items-center justify-between gap-3 pb-3 border-b border-[var(--neu-divider)]">
            <h3 className="text-sm sm:text-base font-bold text-[var(--neu-text-primary)] font-bengali">
              {isBn ? 'ফন্টের আকার সমন্বয় করুন' : 'Adjust Font Sizes'}
            </h3>
            <button
              type="button"
              onClick={onCloseDockedSettings}
              className="neu-btn px-3 py-1.5 rounded-xl text-xs font-semibold text-[var(--neu-text-secondary)] hover:text-[var(--neu-text-primary)] inline-flex items-center gap-1.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>{isBn ? 'বন্ধ করো' : 'Close'}</span>
            </button>
          </div>
          {renderFontSizeSlideControls(
            onCloseDockedSettings,
            onOpenSettings
          )}
        </div>
      )}

      {/* Subtle Floating Reopen Audio Button when docked bar was swiped away */}
      {!expanded && dismissed && (
        <button
          type="button"
          onClick={onRestore}
          aria-label={isBn ? 'অডিও প্লেয়ার ফিরে আনুন' : 'Restore audio player'}
          className="fixed bottom-4 right-4 z-40 neu-accent-btn w-12 h-12 rounded-full flex items-center justify-center cursor-pointer animate-neu-enter"
        >
          <NeuWaveform isPlaying={isPlaying} />
        </button>
      )}

      {/* Docked Bottom Audio Console */}
      {!expanded && !dismissed && (
        <div
          role="region"
          aria-label={isBn ? 'কুরআন তিলাওয়াত প্লেয়ার' : 'Quran Audio Player'}
          className="fixed bottom-0 left-0 right-0 z-40 px-3 sm:px-6 pb-3 pointer-events-none"
        >
          <div
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerEnd}
            onPointerCancel={handlePointerEnd}
            style={{
              transform: `translateX(${dragX}px)`,
              opacity: Math.max(0.15, 1 - Math.abs(dragX) / 280),
              transition: isDragging
                ? 'none'
                : 'transform 220ms cubic-bezier(0.16, 1, 0.3, 1), opacity 200ms ease',
              touchAction: 'pan-y',
            }}
            className="max-w-[1220px] mx-auto relative pointer-events-auto select-none"
          >
            {/* Ayah Number Grid Card (Opens ONLY when clicking ১–N button) */}
            {showJumpButton && jumpOpen && (
              <div
                role="dialog"
                aria-label={isBn ? 'আয়াত নম্বর নির্বাচন' : 'Jump to Ayah Number'}
                className="mb-3 neu-raised rounded-3xl p-4 sm:p-5 animate-drop-from-top max-w-xl ml-auto"
              >
                <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-[var(--neu-divider)]">
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-[var(--neu-text-primary)] truncate font-bengali">
                      {isBn ? surah.bengaliName : surah.englishName}
                    </h4>
                    <p className="text-[11px] text-[var(--neu-text-muted)] tabular-nums">
                      {isBn
                        ? `যেকোনো আয়াত নম্বরে সরাসরি যান (${rangeLabel})`
                        : `Jump directly to any Ayah (${rangeLabel})`}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={onCloseJumpOpen}
                    aria-label={isBn ? 'বন্ধ করো' : 'Close Ayah selector'}
                    className="neu-btn px-3 py-1.5 rounded-xl flex items-center gap-1 text-xs font-semibold text-[var(--neu-text-secondary)] cursor-pointer shrink-0"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>{isBn ? 'বন্ধ করো' : 'Close'}</span>
                  </button>
                </div>

                <div className="max-h-[240px] overflow-y-auto pr-1 grid grid-cols-5 sm:grid-cols-7 gap-2">
                  {ayahNumbers.map((num) => {
                    const isCurrent = num === currentAyah;
                    return (
                      <button
                        key={num}
                        type="button"
                        onClick={() => {
                          onJumpToAyah(num);
                          onCloseJumpOpen();
                        }}
                        className={`h-10 rounded-xl text-xs font-bold tabular-nums cursor-pointer transition-all ${
                          isCurrent
                            ? 'neu-accent-btn'
                            : 'neu-btn text-[var(--neu-text-primary)] hover:text-[var(--neu-accent)]'
                        }`}
                      >
                        {isBn ? toBengaliDigits(num) : num}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Unified Bottom Bar */}
            <div className="neu-raised rounded-2xl sm:rounded-3xl px-3.5 py-2.5 sm:px-6 sm:py-3 flex items-center justify-between gap-2 sm:gap-4">
              {/* Clickable Track Identity -> Opens Full-Screen Slide-Down Player */}
              <button
                type="button"
                onClick={handleToggleExpand}
                aria-expanded={expanded}
                aria-label={
                  isBn ? 'বড় প্লেয়ার খুলুন' : 'Open full-screen audio player'
                }
                className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1 sm:flex-initial sm:w-[270px] text-left cursor-pointer group rounded-xl p-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--neu-accent)]"
              >
                <div
                  className={`hidden sm:flex neu-inset-sm w-10 h-10 rounded-xl items-center justify-center shrink-0 transition-transform duration-200 ${
                    isPlaying ? 'scale-105 ring-1 ring-[var(--neu-accent)]/40' : ''
                  }`}
                >
                  <NeuWaveform isPlaying={isPlaying} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs sm:text-sm font-semibold text-[var(--neu-text-primary)] truncate font-bengali group-hover:text-[var(--neu-accent)] transition-colors">
                    {isBn ? surah.bengaliName : surah.englishName}
                    <span className="hidden sm:inline text-[var(--neu-accent)] tabular-nums">
                      {' '}· {ayahText}
                    </span>
                  </div>
                  <div className="text-[11px] text-[var(--neu-text-muted)] truncate">
                    <span className="sm:hidden font-semibold text-[var(--neu-accent)] tabular-nums">
                      {isBn
                        ? `${toBengaliDigits(currentAyah)}/${toBengaliDigits(surah.ayahCount)}`
                        : `${currentAyah}/${surah.ayahCount}`}
                      {' · '}
                    </span>
                    {audioNotice ?? (isBn ? reciter.bengaliName : reciter.englishName)}
                  </div>
                </div>
                <ChevronUp
                  className="w-4 h-4 text-[var(--neu-text-muted)] group-hover:text-[var(--neu-accent)] transition-colors shrink-0"
                  aria-hidden="true"
                />
              </button>

              {/* Tactile Transport Controls */}
              <div className="flex items-center gap-1 sm:gap-3 shrink-0">
                <button
                  type="button"
                  onClick={onPrevAyah}
                  aria-label={isBn ? 'পূর্ববর্তী আয়াত' : 'Previous Ayah'}
                  className="neu-btn w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-[var(--neu-text-secondary)] hover:text-[var(--neu-text-primary)] cursor-pointer"
                >
                  <SkipBack className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>

                <button
                  type="button"
                  onClick={onTogglePlay}
                  aria-label={
                    isPlaying
                      ? isBn
                        ? 'তিলাওয়াত বিরতি'
                        : 'Pause recitation'
                      : isBn
                        ? 'তিলাওয়াত চালু করুন'
                        : 'Play recitation'
                  }
                  className={`neu-accent-btn rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                    isPlaying
                      ? 'w-11 h-11 sm:w-12 sm:h-12 scale-105 ring-4 ring-[var(--neu-accent-soft)]'
                      : 'w-10 h-10 sm:w-11 sm:h-11'
                  }`}
                >
                  {isPlaying ? (
                    <Pause className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
                  ) : (
                    <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current translate-x-[1px]" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={onNextAyah}
                  aria-label={isBn ? 'পরবর্তী আয়াত' : 'Next Ayah'}
                  className="neu-btn w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-[var(--neu-text-secondary)] hover:text-[var(--neu-text-primary)] cursor-pointer"
                >
                  <SkipForward className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
              </div>

              {/* Scrubber & Integrated Ayah Jump + Quick Font Settings */}
              <div className="flex items-center gap-2 sm:gap-3 shrink-0 md:flex-1 md:max-w-[380px]">
                <div className="hidden md:flex items-center gap-2.5 flex-1">
                  <span className="text-[11px] text-[var(--neu-text-muted)] tabular-nums whitespace-nowrap">
                    {formatHumanDuration(currentTime, isBn, true)}
                  </span>
                  <input
                    type="range"
                    min={0}
                    max={duration > 0 ? duration : 100}
                    value={Math.min(currentTime, duration > 0 ? duration : 100)}
                    onChange={(e) => onSeek(Number(e.target.value))}
                    aria-label={isBn ? 'তিলাওয়াত অগ্রগতি' : 'Recitation progress'}
                    className="neu-range flex-1"
                  />
                  <span className="text-[11px] text-[var(--neu-text-muted)] tabular-nums whitespace-nowrap">
                    {formatHumanDuration(duration, isBn, true)}
                  </span>
                </div>

                {showJumpButton && (
                  <button
                    type="button"
                    onClick={onToggleJumpOpen}
                    aria-expanded={jumpOpen}
                    aria-label={
                      isBn
                        ? `আয়াত নম্বর তালিকা (${rangeLabel})`
                        : `Ayah number grid (${rangeLabel})`
                    }
                    className={`h-9 sm:h-10 px-2.5 sm:px-3 rounded-xl flex items-center gap-1.5 cursor-pointer transition-all shrink-0 ${
                      jumpOpen
                        ? 'neu-inset text-[var(--neu-accent)]'
                        : 'neu-btn text-[var(--neu-text-primary)] hover:text-[var(--neu-accent)]'
                    }`}
                  >
                    <Grid2x2 className="w-4 h-4 text-[var(--neu-gold)] shrink-0" />
                    <span className="text-[11px] font-bold tabular-nums whitespace-nowrap">
                      {rangeLabel}
                    </span>
                  </button>
                )}

                <button
                  type="button"
                  aria-expanded={dockedSettingsOpen}
                  onClick={onToggleDockedSettings}
                  aria-label={isBn ? 'দ্রুত ফন্ট সেটিংস' : 'Quick Font Settings'}
                  className={`hidden sm:flex w-9 h-9 sm:w-10 sm:h-10 rounded-xl items-center justify-center cursor-pointer shrink-0 transition-all ${
                    dockedSettingsOpen
                      ? 'neu-inset text-[var(--neu-accent)]'
                      : 'neu-btn text-[var(--neu-text-secondary)] hover:text-[var(--neu-accent)]'
                  }`}
                >
                  <SlidersHorizontal className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
