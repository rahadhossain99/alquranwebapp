export type RevelationType = 'Meccan' | 'Medinan';

export type UiLanguage = 'bn' | 'en';

export type AppView = 'reader' | 'surahs' | 'bookmarks' | 'progress';

export type ReciterId = 'ar.alafasy' | 'ar.abdulbasitmurattal' | 'ar.husary';

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
  arabicFontSize: number; // 24 - 44
  translationFontSize: number; // 14 - 22
  showBengali: boolean;
  showEnglish: boolean;
  showTransliteration: boolean;
  reciterId: ReciterId;
  playbackRate: number;
  autoAdvance: boolean;
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
}
