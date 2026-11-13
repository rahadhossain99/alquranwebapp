import { RECITERS } from '../data/surahMeta';
import {
  AppView,
  BookmarkItem,
  ListeningStats,
  ReciterId,
  RevelationType,
  SurahMeta,
} from '../types/quran';

export type RevelationFilter = 'all' | RevelationType;

export function filterSurahs(
  surahs: SurahMeta[],
  query: string,
  revelation: RevelationFilter = 'all'
): SurahMeta[] {
  const normalized = query.trim().toLowerCase();

  return surahs.filter((surah) => {
    if (revelation !== 'all' && surah.revelationType !== revelation) {
      return false;
    }
    if (!normalized) {
      return true;
    }
    return (
      String(surah.number) === normalized ||
      surah.englishName.toLowerCase().includes(normalized) ||
      surah.englishMeaning.toLowerCase().includes(normalized) ||
      surah.bengaliName.toLowerCase().includes(normalized) ||
      surah.bengaliMeaning.toLowerCase().includes(normalized) ||
      surah.arabicName.includes(query.trim())
    );
  });
}

export function getGlobalAyahNumber(
  surahs: SurahMeta[],
  surahNumber: number,
  ayahNumber: number
): number {
  let offset = 0;
  for (const s of surahs) {
    if (s.number < surahNumber) {
      offset += s.ayahCount;
    } else if (s.number === surahNumber) {
      const clampedAyah = Math.max(1, Math.min(ayahNumber, s.ayahCount));
      return offset + clampedAyah;
    }
  }
  return 1;
}

export function getAudioUrl(globalAyahNumber: number, reciterId: ReciterId): string {
  const safeGlobal = Math.max(1, Math.floor(globalAyahNumber));
  const reciter = RECITERS.find((r) => r.id === reciterId);
  const bitrate = reciter?.bitrate ?? 128;
  return `https://cdn.islamic.network/quran/audio/${bitrate}/${reciterId}/${safeGlobal}.mp3`;
}

export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return '0:00';
  }
  const total = Math.floor(seconds);
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function toBengaliDigits(value: number | string): string {
  const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(value).replace(/\d/g, (d) => bnDigits[Number(d)] ?? d);
}

export function toArabicIndicDigits(value: number | string): string {
  const arDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return String(value).replace(/\d/g, (d) => arDigits[Number(d)] ?? d);
}

export function calculateKhatamProgress(
  readAyahKeys: string[],
  totalAyahs: number = 6236
): { readCount: number; percentage: number } {
  const uniqueCount = new Set(readAyahKeys).size;
  const clamped = Math.min(uniqueCount, totalAyahs);
  const percentage = totalAyahs > 0 ? Math.round((clamped / totalAyahs) * 1000) / 10 : 0;
  return { readCount: clamped, percentage };
}

export function toggleBookmarkList(
  bookmarks: BookmarkItem[],
  item: BookmarkItem
): BookmarkItem[] {
  const exists = bookmarks.some((b) => b.id === item.id);
  if (exists) {
    return bookmarks.filter((b) => b.id !== item.id);
  }
  return [item, ...bookmarks];
}

export function toggleFavoriteSurah(
  favorites: number[],
  surahNumber: number
): number[] {
  const safeNum = Math.floor(surahNumber);
  if (safeNum < 1 || safeNum > 114) return favorites;
  if (favorites.includes(safeNum)) {
    return favorites.filter((n) => n !== safeNum);
  }
  return [...favorites, safeNum].sort((a, b) => a - b);
}

export function getNextAyahPointer(
  surahs: SurahMeta[],
  currentSurah: number,
  currentAyah: number
): { surahNumber: number; ayahNumber: number } | null {
  const surah = surahs.find((s) => s.number === currentSurah);
  if (!surah) return null;

  if (currentAyah < surah.ayahCount) {
    return { surahNumber: currentSurah, ayahNumber: currentAyah + 1 };
  }

  const nextSurah = surahs.find((s) => s.number === currentSurah + 1);
  if (nextSurah) {
    return { surahNumber: nextSurah.number, ayahNumber: 1 };
  }

  return null;
}

export function getPrevAyahPointer(
  surahs: SurahMeta[],
  currentSurah: number,
  currentAyah: number
): { surahNumber: number; ayahNumber: number } | null {
  if (currentAyah > 1) {
    return { surahNumber: currentSurah, ayahNumber: currentAyah - 1 };
  }

  const prevSurah = surahs.find((s) => s.number === currentSurah - 1);
  if (prevSurah) {
    return { surahNumber: prevSurah.number, ayahNumber: prevSurah.ayahCount };
  }

  return null;
}

export function buildAyahNumberList(ayahCount: number): number[] {
  const safeCount = Math.max(0, Math.min(300, Math.floor(ayahCount)));
  return Array.from({ length: safeCount }, (_, idx) => idx + 1);
}

// --- Slash Routing Helpers (supports both root "/" and GitHub Pages "/repo/" base paths) ---

export interface ParsedRoute {
  view: AppView;
  surahNumber?: number;
}

function normalizeBase(baseUrl: string): string {
  const trimmed = baseUrl.trim();
  if (!trimmed || trimmed === '/') return '';
  return `/${trimmed.replace(/^\/+|\/+$/g, '')}`;
}

export function parseAppRoute(pathname: string, baseUrl: string = '/'): ParsedRoute {
  const base = normalizeBase(baseUrl);
  let relative = pathname.split('?')[0].split('#')[0];
  if (base && relative.startsWith(base)) {
    relative = relative.slice(base.length);
  }
  const clean = relative.replace(/^\/+|\/+$/g, '');

  if (!clean || clean === 'reader') {
    return { view: 'reader' };
  }
  if (clean === 'surahs') {
    return { view: 'surahs' };
  }
  if (clean === 'bookmarks') {
    return { view: 'bookmarks' };
  }
  if (clean === 'progress') {
    return { view: 'progress' };
  }
  if (clean === 'settings') {
    return { view: 'settings' };
  }
  const surahMatch = clean.match(/^surah\/(\d+)$/);
  if (surahMatch) {
    const num = Number(surahMatch[1]);
    if (num >= 1 && num <= 114) {
      return { view: 'reader', surahNumber: num };
    }
  }
  return { view: 'reader' };
}

export function buildAppPath(
  view: AppView,
  surahNumber: number = 1,
  baseUrl: string = '/'
): string {
  const base = normalizeBase(baseUrl);
  const safeSurah = Math.max(1, Math.min(114, Math.floor(surahNumber)));
  switch (view) {
    case 'surahs':
      return `${base}/surahs`;
    case 'bookmarks':
      return `${base}/bookmarks`;
    case 'progress':
      return `${base}/progress`;
    case 'settings':
      return `${base}/settings`;
    case 'reader':
    default:
      return `${base}/surah/${safeSurah}`;
  }
}

// --- Listening & Engagement Tracking Helpers ---

export function getLocalDateKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function createInitialListeningStats(): ListeningStats {
  return {
    startedDate: null,
    activeDates: [],
    totalSeconds: 0,
    dailySeconds: {},
    lastPlayedAt: null,
  };
}

export function recordListeningActivity(
  stats: ListeningStats,
  secondsDelta: number,
  dateKey: string = getLocalDateKey(),
  timestampIso: string = new Date().toISOString()
): ListeningStats {
  const safeDelta = Math.max(0, Math.floor(secondsDelta));
  const hasDate = stats.activeDates.includes(dateKey);

  return {
    startedDate: stats.startedDate ?? dateKey,
    activeDates: hasDate ? stats.activeDates : [...stats.activeDates, dateKey].sort(),
    totalSeconds: stats.totalSeconds + safeDelta,
    dailySeconds: {
      ...stats.dailySeconds,
      [dateKey]: (stats.dailySeconds[dateKey] ?? 0) + safeDelta,
    },
    lastPlayedAt: timestampIso,
  };
}

export function formatTimeBreakdown(totalSeconds: number): {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
} {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const days = Math.floor(safe / 86400);
  const remAfterDays = safe % 86400;
  const hours = Math.floor(remAfterDays / 3600);
  const remAfterHours = remAfterDays % 3600;
  const minutes = Math.floor(remAfterHours / 60);
  const seconds = remAfterHours % 60;
  return { days, hours, minutes, seconds };
}

export interface DailyActivityPoint {
  dateKey: string;
  dayShortBn: string;
  dayShortEn: string;
  seconds: number;
  minutes: number;
}

const BN_DAYS = ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহ', 'শুক্র', 'শনি'];
const EN_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function buildActivitySeries(
  dailySeconds: Record<string, number>,
  daysCount: number = 7,
  endDate: Date = new Date()
): DailyActivityPoint[] {
  const count = Math.max(1, Math.min(30, Math.floor(daysCount)));
  const points: DailyActivityPoint[] = [];

  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(endDate);
    d.setDate(d.getDate() - i);
    const key = getLocalDateKey(d);
    const secs = dailySeconds[key] ?? 0;
    const dow = d.getDay();
    points.push({
      dateKey: key,
      dayShortBn: BN_DAYS[dow] ?? '',
      dayShortEn: EN_DAYS[dow] ?? '',
      seconds: secs,
      minutes: Math.round((secs / 60) * 10) / 10,
    });
  }

  return points;
}

export function formatShareAyahText(
  surah: Pick<SurahMeta, 'number' | 'bengaliName' | 'englishName'>,
  arabic: string,
  bengali: string,
  transliteration: string | undefined,
  ayahNumber: number,
  isBn: boolean
): string {
  const header = isBn
    ? `${surah.bengaliName} (${toBengaliDigits(surah.number)}:${toBengaliDigits(ayahNumber)})`
    : `${surah.englishName} (${surah.number}:${ayahNumber})`;

  const lines = [header, '', arabic, '', bengali];
  if (transliteration && transliteration.trim()) {
    lines.push('', `${isBn ? 'উচ্চারণ' : 'Pronunciation'}: ${transliteration}`);
  }
  return lines.join('\n');
}

// --- Human-Readable Duration, Surah Parts & Whole-Surah Timeline Helpers ---

export function formatHumanDuration(
  seconds: number,
  isBn: boolean = true,
  compact: boolean = false
): string {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return isBn ? (compact ? '০ সে.' : '০ সেকেন্ড') : compact ? '0s' : '0 sec';
  }
  const total = Math.floor(seconds);
  const hours = Math.floor(total / 3600);
  const mins = Math.floor((total % 3600) / 60);
  const secs = total % 60;

  if (isBn) {
    if (hours > 0) {
      const h = `${toBengaliDigits(hours)} ${compact ? 'ঘ.' : 'ঘণ্টা'}`;
      const m = mins > 0 ? ` ${toBengaliDigits(mins)} ${compact ? 'মি.' : 'মিনিট'}` : '';
      return `${h}${m}`;
    }
    if (mins > 0) {
      const m = `${toBengaliDigits(mins)} ${compact ? 'মি.' : 'মিনিট'}`;
      const s = secs > 0 ? ` ${toBengaliDigits(secs)} ${compact ? 'সে.' : 'সেকেন্ড'}` : '';
      return `${m}${s}`;
    }
    return `${toBengaliDigits(secs)} ${compact ? 'সে.' : 'সেকেন্ড'}`;
  }

  if (hours > 0) {
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }
  if (mins > 0) {
    return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
  }
  return compact ? `${secs}s` : `${secs} sec`;
}

export interface SurahPart {
  partNumber: number;
  startAyah: number;
  endAyah: number;
  label: string;
}

export function buildSurahParts(ayahCount: number, isBn: boolean = true): SurahPart[] {
  const safeCount = Math.max(1, Math.floor(ayahCount));
  let chunkSize = 10;
  if (safeCount <= 12) {
    chunkSize = Math.max(3, Math.ceil(safeCount / 2));
  } else if (safeCount <= 40) {
    chunkSize = 8;
  } else if (safeCount <= 120) {
    chunkSize = 15;
  } else {
    chunkSize = 20;
  }

  const parts: SurahPart[] = [];
  let partNum = 1;
  for (let start = 1; start <= safeCount; start += chunkSize) {
    const end = Math.min(safeCount, start + chunkSize - 1);
    const label = isBn
      ? `পার্ট ${toBengaliDigits(partNum)} · আয়াত ${toBengaliDigits(start)}–${toBengaliDigits(end)}`
      : `Part ${partNum} · Ayah ${start}–${end}`;
    parts.push({ partNumber: partNum, startAyah: start, endAyah: end, label });
    partNum += 1;
  }
  return parts;
}

export function estimateAyahDurations(
  ayahCount: number,
  ayahArabicLengths?: number[],
  measuredDurations?: Record<number, number>
): number[] {
  const count = Math.max(1, Math.floor(ayahCount));
  const result: number[] = [];
  for (let i = 1; i <= count; i++) {
    const measured = measuredDurations?.[i];
    if (typeof measured === 'number' && Number.isFinite(measured) && measured > 0) {
      result.push(measured);
    } else if (ayahArabicLengths && typeof ayahArabicLengths[i - 1] === 'number') {
      const chars = ayahArabicLengths[i - 1];
      const est = Math.max(4, Math.min(55, Math.round(chars / 7.2) + 2));
      result.push(est);
    } else {
      result.push(12);
    }
  }
  return result;
}

export function getSurahTimelinePosition(
  durations: number[],
  currentAyah: number,
  currentTimeInAyah: number
): { elapsed: number; total: number } {
  if (durations.length === 0) return { elapsed: 0, total: 0 };
  const total = durations.reduce((acc, d) => acc + Math.max(0, d), 0);
  const idx = Math.max(0, Math.min(durations.length - 1, Math.floor(currentAyah) - 1));
  let prior = 0;
  for (let i = 0; i < idx; i++) {
    prior += Math.max(0, durations[i]);
  }
  const within = Math.max(0, Math.min(durations[idx] ?? 0, currentTimeInAyah || 0));
  return {
    elapsed: Math.min(total, prior + within),
    total,
  };
}

export function findAyahAtSurahTime(
  durations: number[],
  targetSeconds: number
): { ayahNumber: number; offsetInAyah: number } {
  if (durations.length === 0) return { ayahNumber: 1, offsetInAyah: 0 };
  const clamped = Math.max(0, targetSeconds);
  let acc = 0;
  for (let i = 0; i < durations.length; i++) {
    const dur = Math.max(0.5, durations[i]);
    if (clamped < acc + dur || i === durations.length - 1) {
      const offset = Math.max(0, Math.min(dur - 0.1, clamped - acc));
      return {
        ayahNumber: i + 1,
        offsetInAyah: Math.floor(offset * 10) / 10,
      };
    }
    acc += dur;
  }
  return { ayahNumber: durations.length, offsetInAyah: 0 };
}

const AYAH_HALO_PALETTES: ReadonlyArray<{ c1: string; c2: string }> = [
  { c1: '#0f766e', c2: '#d97706' }, // Emerald & Amber Gold
  { c1: '#0284c7', c2: '#06b6d4' }, // Sapphire & Cyan
  { c1: '#7c3aed', c2: '#ec4899' }, // Royal Violet & Rose
  { c1: '#059669', c2: '#84cc16' }, // Forest Jade & Spring Lime
  { c1: '#c2410c', c2: '#f59e0b' }, // Terracotta & Warm Gold
  { c1: '#4338ca', c2: '#14b8a6' }, // Deep Indigo & Mint Teal
];

export function getAyahHaloPalette(ayahNumber: number): { c1: string; c2: string } {
  const idx = Math.abs(Math.floor(ayahNumber) - 1) % AYAH_HALO_PALETTES.length;
  return AYAH_HALO_PALETTES[idx];
}

export function resolveReadingJumpTarget(
  isPlaying: boolean,
  playingSurah: number,
  playingAyah: number,
  lastRead: { surahNumber: number; ayahNumber: number }
): { surahNumber: number; ayahNumber: number } {
  if (isPlaying && playingSurah >= 1 && playingSurah <= 114) {
    return {
      surahNumber: playingSurah,
      ayahNumber: Math.max(1, playingAyah || 1),
    };
  }
  return {
    surahNumber: Math.max(1, Math.min(114, lastRead.surahNumber || 1)),
    ayahNumber: Math.max(1, lastRead.ayahNumber || 1),
  };
}

export type FontSettingKey =
  | 'arabicFontSize'
  | 'translationFontSize'
  | 'transliterationFontSize';

export function getLiveFontCssVars(
  key: FontSettingKey,
  px: number
): Array<[string, string]> {
  const safePx = Math.max(10, Math.min(60, Math.round(px)));
  if (key === 'arabicFontSize') {
    return [['--live-ar-size', `${safePx}px`]];
  }
  if (key === 'translationFontSize') {
    return [
      ['--live-bn-size', `${safePx}px`],
      ['--live-en-size', `${Math.max(12, safePx - 2)}px`],
    ];
  }
  return [['--live-tr-size', `${safePx}px`]];
}
