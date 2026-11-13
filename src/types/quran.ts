export type RevelationType = 'Meccan' | 'Medinan';

export type UiLanguage = 'bn' | 'en';

export type AppView = 'reader' | 'surahs' | 'bookmarks' | 'progress' | 'settings';

export type ReciterId =
  | 'ar.alafasy'
  | 'ar.abdulbasitmurattal'
  | 'ar.abdulsamad'
  | 'ar.husary'
  | 'ar.husarymujawwad'
  | 'ar.minshawi'
  | 'ar.minshawimujawwad'
  | 'ar.abdurrahmaansudais'
  | 'ar.saoodshuraym'
  | 'ar.mahermuaiqly'
  | 'ar.shaatree'
  | 'ar.ahmedajamy'
  | 'ar.hudhaify'
  | 'ar.muhammadayyoub'
  | 'ar.muhammadjibreel'
  | 'ar.abdullahbasfar'
  | 'ar.hanirifai'
  | 'ar.aymanswoaid';

export interface SurahMeta {
  number: number;
  arabicName: string;
  englishName: string;
  englishMeaning: string;
  bengaliName: string;
  bengaliMeaning: string;
  revelationType: RevelationType;
  ayahCount: number;
  juzStart: number;
}

export interface Ayah {
  numberInSurah: number;
  arabic: string;
  bengali: string;
  english: string;
  transliteration?: string;
}

export interface SurahDetail {
  meta: SurahMeta;
  ayahs: Ayah[];
  source: 'bundled' | 'api';
}

export interface BookmarkItem {
  id: string; // `${surahNumber}:${ayahNumber}`
  surahNumber: number;
  ayahNumber: number;
  surahEnglishName: string;
  surahBengaliName: string;
  arabicPreview: string;
  bengaliPreview: string;
  englishPreview: string;
  note: string;
  createdAt: string;
}

export interface ReaderSettings {
  uiLanguage: UiLanguage;
  theme: 'light' | 'dark';
  arabicFontSize: number; // 24 - 48
  translationFontSize: number; // 14 - 24 (Bengali text size)
  transliterationFontSize: number; // 12 - 22 (English pronunciation size)
  showBengali: boolean;
  showEnglish: boolean;
  showTransliteration: boolean;
  reciterId: ReciterId;
  playbackRate: number;
  autoAdvance: boolean;
  soundEffects: boolean;
}

export interface LastReadPosition {
  surahNumber: number;
  ayahNumber: number;
  updatedAt: string;
}

export interface ReciterInfo {
  id: ReciterId;
  englishName: string;
  bengaliName: string;
  style: string;
  bitrate: 64 | 128;
}

export interface ListeningStats {
  startedDate: string | null; // YYYY-MM-DD of first playback
  activeDates: string[]; // unique YYYY-MM-DD dates played
  totalSeconds: number;
  dailySeconds: Record<string, number>;
  lastPlayedAt: string | null;
}
