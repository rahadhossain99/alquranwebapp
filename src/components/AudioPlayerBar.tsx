import React, { useState } from 'react';
import {
  ArrowDownCircle,
  ChevronDown,
  ChevronUp,
  Grid2x2,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  SlidersHorizontal,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { RECITERS } from '../data/surahMeta';
import { Ayah, ReciterId, SurahMeta, UiLanguage } from '../types/quran';
import {
  AutoScrollSpeed,
  buildAyahNumberList,
  formatDuration,
  toBengaliDigits,
} from '../utils/quranLogic';
import { NeuWaveform } from './GeometricIcons';

interface AudioPlayerBarProps {
  surah: SurahMeta;
  currentAyah: number;
  currentAyahObj?: Ayah;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  muted: boolean;
  reciterId: ReciterId;
  playbackRate: number;
  uiLanguage: UiLanguage;
  audioNotice: string | null;
  autoScrolling: boolean;
  autoScrollSpeed: AutoScrollSpeed;
  showJumpButton: boolean;
  onTogglePlay: () => void;
  onPrevAyah: () => void;
  onNextAyah: () => void;
  onSeek: (time: number) => void;
  onToggleMute: () => void;
  onChangeReciter: (id: ReciterId) => void;
  onChangeSpeed: (rate: number) => void;
  onToggleAutoScroll: () => void;
  onChangeAutoScrollSpeed: (speed: AutoScrollSpeed) => void;
  onJumpToAyah: (ayahNumber: number) => void;
  onOpenSettings: () => void;
}

export const AudioPlayerBar: React.FC<AudioPlayerBarProps> = ({
  surah,
  currentAyah,
  currentAyahObj,
  isPlaying,
  currentTime,
  duration,
  muted,
  reciterId,
  playbackRate,
  uiLanguage,
  audioNotice,
  autoScrolling,
  autoScrollSpeed,
  showJumpButton,
  onTogglePlay,
  onPrevAyah,
  onNextAyah,
  onSeek,
  onToggleMute,
  onChangeReciter,
  onChangeSpeed,
  onToggleAutoScroll,
  onChangeAutoScrollSpeed,
  onJumpToAyah,
  onOpenSettings,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [jumpOpen, setJumpOpen] = useState(false);

  const isBn = uiLanguage === 'bn';
  const reciter = RECITERS.find((r) => r.id === reciterId) ?? RECITERS[0];
  const ayahNumbers = buildAyahNumberList(surah.ayahCount);

  const ayahText = isBn
    ? `আয়াত ${toBengaliDigits(currentAyah)} / ${toBengaliDigits(surah.ayahCount)}`
    : `Ayah ${currentAyah} / ${surah.ayahCount}`;

  const rangeLabel = isBn
    ? `১–${toBengaliDigits(surah.ayahCount)}`
    : `1–${surah.ayahCount}`;

  const handlePlayClick = () => {
    onTogglePlay();
  };

  const handleToggleExpand = () => {
    setExpanded((prev) => {
      const next = !prev;
      if (next) setJumpOpen(false);
      return next;
    });
  };

  const handleToggleJump = () => {
    setJumpOpen((prev) => {
      const next = !prev;
      if (next) setExpanded(false);
      return next;
    });
  };

  return (
    <div
      role="region"
      aria-label={isBn ? 'কুরআন তিলাওয়াত প্লেয়ার' : 'Quran Audio Player'}
      className="fixed bottom-0 left-0 right-0 z-40 px-3 sm:px-6 pb-3 pointer-events-none"
    >
      <div className="max-w-[1220px] mx-auto relative flex items-end gap-2.5 sm:gap-3">
        {/* Main Expandable Neumorphic Audio Console */}
        <div
          className={`flex-1 min-w-0 neu-raised rounded-2xl sm:rounded-3xl pointer-events-auto transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] overflow-hidden ${
            expanded ? 'px-5 py-5 sm:px-7 sm:py-6' : 'px-3.5 py-2.5 sm:px-6 sm:py-3'
          }`}
        >
          {/* Expanded Slide-Up Panel */}
          <div
            className={`transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] overflow-hidden ${
              expanded ? 'max-h-[460px] opacity-100 mb-5' : 'max-h-0 opacity-0 mb-0'
            }`}
          >
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-[var(--neu-divider)]">
              <div className="min-w-0">
                <p className="text-xs font-medium text-[var(--neu-accent)] tabular-nums">
                  {isBn
                    ? `এখন তিলাওয়াত চলছে · ${surah.bengaliName} (${toBengaliDigits(surah.number)}:${toBengaliDigits(currentAyah)})`
                    : `Now Reciting · ${surah.englishName} (${surah.number}:${currentAyah})`}
                </p>
                <h3 className="font-quran text-2xl sm:text-3xl text-[var(--neu-text-primary)] mt-1.5 leading-[2]">
                  {currentAyahObj?.arabic ?? surah.arabicName}
                </h3>
                {currentAyahObj && (
                  <p className="text-sm text-[var(--neu-text-secondary)] mt-1 line-clamp-2 font-bengali">
                    {isBn ? currentAyahObj.bengali : currentAyahObj.english}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() => setExpanded(false)}
                aria-label={isBn ? 'প্লেয়ার ছোট করুন' : 'Collapse player'}
                className="neu-btn w-10 h-10 rounded-xl flex items-center justify-center text-[var(--neu-text-secondary)] cursor-pointer shrink-0"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>

            {/* Expanded Controls Row: Qari + Speed + Auto-Scroll */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
              <div>
                <span className="block text-[11px] font-semibold text-[var(--neu-text-muted)] mb-1.5">
                  {isBn ? 'ক্বারি' : 'Reciter'}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {RECITERS.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => onChangeReciter(r.id)}
                      className={`px-2.5 py-1.5 rounded-xl text-[11px] font-semibold cursor-pointer transition-all ${
                        reciterId === r.id
                          ? 'neu-inset text-[var(--neu-accent)]'
                          : 'neu-btn text-[var(--neu-text-secondary)]'
                      }`}
                    >
                      {isBn ? r.bengaliName.split(' ')[0] : r.englishName.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="block text-[11px] font-semibold text-[var(--neu-text-muted)] mb-1.5">
                  {isBn ? 'তিলাওয়াতের গতি' : 'Speed'}
                </span>
                <div className="neu-inset-sm p-1 rounded-xl grid grid-cols-4 gap-1">
                  {[0.75, 1, 1.25, 1.5].map((rate) => (
                    <button
                      key={rate}
                      type="button"
                      onClick={() => onChangeSpeed(rate)}
                      className={`py-1 rounded-lg text-[11px] font-semibold tabular-nums cursor-pointer ${
                        playbackRate === rate
                          ? 'neu-raised-sm text-[var(--neu-accent)]'
                          : 'text-[var(--neu-text-secondary)]'
                      }`}
                    >
                      {rate}x
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="block text-[11px] font-semibold text-[var(--neu-text-muted)] mb-1.5">
                  {isBn ? 'অটো স্ক্রলিং' : 'Auto Scroll'}
                </span>
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={onToggleAutoScroll}
                    className={`px-3 py-1.5 rounded-xl text-[11px] font-semibold inline-flex items-center gap-1.5 cursor-pointer ${
                      autoScrolling
                        ? 'neu-accent-btn'
                        : 'neu-btn text-[var(--neu-text-secondary)]'
                    }`}
                  >
                    <ArrowDownCircle className="w-3.5 h-3.5" />
                    <span>{autoScrolling ? (isBn ? 'চালু' : 'On') : isBn ? 'বন্ধ' : 'Off'}</span>
                  </button>
                  {(['slow', 'medium', 'fast'] as AutoScrollSpeed[]).map((sp) => (
                    <button
                      key={sp}
                      type="button"
                      onClick={() => onChangeAutoScrollSpeed(sp)}
                      className={`px-2 py-1.5 rounded-xl text-[11px] font-semibold cursor-pointer ${
                        autoScrollSpeed === sp
                          ? 'neu-inset text-[var(--neu-accent)]'
                          : 'neu-btn text-[var(--neu-text-muted)]'
                      }`}
                    >
                      {sp === 'slow'
                        ? isBn
                          ? 'ধীর'
                          : '1x'
                        : sp === 'medium'
                          ? isBn
                            ? 'মধ্যম'
                            : '2x'
                          : isBn
                            ? 'দ্রুত'
                            : '3x'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Primary Compact / Docked Row */}
          <div className="flex items-center justify-between gap-2 sm:gap-5">
            {/* Clickable Track Identity -> Expands Player */}
            <button
              type="button"
              onClick={handleToggleExpand}
              aria-expanded={expanded}
              aria-label={
                expanded
                  ? isBn
                    ? 'প্লেয়ার সংকুচিত করুন'
                    : 'Collapse audio player'
                  : isBn
                    ? 'প্লেয়ার বড় করুন'
                    : 'Expand audio player'
              }
              className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 sm:flex-initial sm:w-[270px] text-left cursor-pointer group rounded-xl p-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--neu-accent)]"
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
                  {isBn ? surah.bengaliName : surah.englishName} ·{' '}
                  <span className="text-[var(--neu-accent)] tabular-nums">
                    <span className="sm:hidden">
                      {isBn
                        ? `${toBengaliDigits(currentAyah)}/${toBengaliDigits(surah.ayahCount)}`
                        : `${currentAyah}/${surah.ayahCount}`}
                    </span>
                    <span className="hidden sm:inline">{ayahText}</span>
                  </span>
                </div>
                <div className="text-[11px] text-[var(--neu-text-muted)] truncate">
                  {audioNotice ?? (isBn ? reciter.bengaliName : reciter.englishName)}
                </div>
              </div>
              <ChevronUp
                className={`hidden sm:block w-4 h-4 text-[var(--neu-text-muted)] transition-transform duration-200 shrink-0 ${
                  expanded ? 'rotate-180 text-[var(--neu-accent)]' : ''
                }`}
                aria-hidden="true"
              />
            </button>

            {/* Tactile Transport Controls */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <button
                type="button"
                onClick={onPrevAyah}
                aria-label={isBn ? 'পূর্ববর্তী আয়াত' : 'Previous Ayah'}
                className="neu-btn w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-[var(--neu-text-secondary)] hover:text-[var(--neu-text-primary)] cursor-pointer"
              >
                <SkipBack className="w-4 h-4" />
              </button>

              {/* Playing button smoothly scales slightly larger when active/playing */}
              <button
                type="button"
                onClick={handlePlayClick}
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
                  isPlaying || expanded
                    ? 'w-12 h-12 sm:w-13 sm:h-13 scale-105 ring-4 ring-[var(--neu-accent-soft)]'
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
                className="neu-btn w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-[var(--neu-text-secondary)] hover:text-[var(--neu-text-primary)] cursor-pointer"
              >
                <SkipForward className="w-4 h-4" />
              </button>
            </div>

            {/* Scrubber & Utility Controls (Desktop) */}
            <div className="hidden md:flex items-center gap-3 flex-1 max-w-[340px]">
              <span className="text-[11px] text-[var(--neu-text-muted)] tabular-nums w-9 text-right">
                {formatDuration(currentTime)}
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
              <span className="text-[11px] text-[var(--neu-text-muted)] tabular-nums w-9">
                {formatDuration(duration)}
              </span>

              <button
                type="button"
                onClick={onToggleMute}
                aria-label={muted ? (isBn ? 'শব্দ চালু' : 'Unmute') : isBn ? 'নিঃশব্দ' : 'Mute'}
                className="neu-btn w-9 h-9 rounded-xl flex items-center justify-center text-[var(--neu-text-secondary)] cursor-pointer shrink-0"
              >
                {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>

              <button
                type="button"
                onClick={handleToggleExpand}
                aria-label={isBn ? 'প্লেয়ার বিস্তারিত' : 'Toggle expanded player'}
                className={`w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer shrink-0 transition-all ${
                  expanded
                    ? 'neu-inset text-[var(--neu-accent)]'
                    : 'neu-btn text-[var(--neu-text-secondary)]'
                }`}
              >
                <ChevronUp
                  className={`w-4 h-4 transition-transform duration-200 ${
                    expanded ? 'rotate-180' : ''
                  }`}
                />
              </button>

              <button
                type="button"
                onClick={onOpenSettings}
                aria-label={isBn ? 'সেটিংস' : 'Settings'}
                className="neu-btn w-9 h-9 rounded-xl flex items-center justify-center text-[var(--neu-text-secondary)] cursor-pointer shrink-0"
              >
                <SlidersHorizontal className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Side Decorative Quick Ayah Jump Button + Popover Number Card */}
        {showJumpButton && (
          <div className="relative pointer-events-auto shrink-0">
            {/* Popover Ayah Number Grid Card */}
            {jumpOpen && (
              <div
                role="dialog"
                aria-label={isBn ? 'আয়াত নম্বর নির্বাচন' : 'Jump to Ayah Number'}
                className="absolute bottom-[calc(100%+14px)] right-0 w-[290px] sm:w-[330px] neu-raised rounded-3xl p-4 sm:p-5 animate-neu-enter z-50"
              >
                <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-[var(--neu-divider)]">
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-[var(--neu-text-primary)] truncate font-bengali">
                      {isBn ? surah.bengaliName : surah.englishName}
                    </h4>
                    <p className="text-[11px] text-[var(--neu-text-muted)] tabular-nums">
                      {isBn
                        ? `যেকোনো আয়াতে যান (${rangeLabel})`
                        : `Jump to any Ayah (${rangeLabel})`}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setJumpOpen(false)}
                    aria-label={isBn ? 'বন্ধ করুন' : 'Close Ayah selector'}
                    className="neu-btn w-8 h-8 rounded-xl flex items-center justify-center text-[var(--neu-text-secondary)] cursor-pointer shrink-0"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="max-h-[240px] overflow-y-auto pr-1 grid grid-cols-5 gap-2">
                  {ayahNumbers.map((num) => {
                    const isCurrent = num === currentAyah;
                    return (
                      <button
                        key={num}
                        type="button"
                        onClick={() => {
                          onJumpToAyah(num);
                          setJumpOpen(false);
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

            {/* Ornate Side Neumorphic Ayah Jump Trigger */}
            <button
              type="button"
              onClick={handleToggleJump}
              aria-expanded={jumpOpen}
              aria-label={
                isBn
                  ? `আয়াত নম্বর তালিকা খুলুন (${rangeLabel})`
                  : `Open Ayah number jump card (${rangeLabel})`
              }
              className={`h-[60px] sm:h-[68px] px-3 sm:px-4 rounded-2xl sm:rounded-3xl flex items-center gap-2 cursor-pointer transition-all duration-200 ${
                jumpOpen
                  ? 'neu-inset ring-2 ring-[var(--neu-accent)]/40 text-[var(--neu-accent)]'
                  : 'neu-raised hover:-translate-y-0.5 text-[var(--neu-text-primary)]'
              }`}
            >
              {/* Subtle Islamic Gold Corner Flourish */}
              <div className="neu-inset-sm w-9 h-9 rounded-xl flex items-center justify-center text-[var(--neu-gold)] shrink-0">
                <Grid2x2 className="w-4 h-4" />
              </div>
              <div className="hidden sm:flex flex-col items-start text-left">
                <span className="text-[11px] font-bold leading-tight font-bengali">
                  {isBn ? 'আয়াত নং' : 'Ayahs'}
                </span>
                <span className="text-[11px] font-semibold text-[var(--neu-accent)] tabular-nums leading-tight mt-0.5">
                  {rangeLabel}
                </span>
              </div>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
