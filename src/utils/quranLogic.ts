import { BookmarkItem, ReciterId, RevelationType, SurahMeta } from '../types/quran';

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
  return `https://cdn.islamic.network/quran/audio/128/${reciterId}/${safeGlobal}.mp3`;
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

export type AutoScrollSpeed = 'slow' | 'medium' | 'fast';

export function buildAyahNumberList(ayahCount: number): number[] {
  const safeCount = Math.max(0, Math.min(300, Math.floor(ayahCount)));
  return Array.from({ length: safeCount }, (_, idx) => idx + 1);
}

export function getAutoScrollPixelsPerSec(speed: AutoScrollSpeed): number {
  switch (speed) {
    case 'slow':
      return 24;
    case 'fast':
      return 72;
    case 'medium':
    default:
      return 42;
  }
}

