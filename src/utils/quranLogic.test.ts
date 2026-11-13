import test from 'node:test';
import assert from 'node:assert/strict';
import { SURAH_META, TOTAL_QURAN_AYAHS } from '../data/surahMeta';
import {
  buildAyahNumberList,
  calculateKhatamProgress,
  filterSurahs,
  formatDuration,
  getAudioUrl,
  getAutoScrollPixelsPerSec,
  getGlobalAyahNumber,
  getNextAyahPointer,
  getPrevAyahPointer,
  toArabicIndicDigits,
  toBengaliDigits,
  toggleBookmarkList,
} from './quranLogic';

test('SURAH_META has all 114 surahs summing to 6236 ayahs', () => {
  assert.equal(SURAH_META.length, 114);
  const sum = SURAH_META.reduce((acc, s) => acc + s.ayahCount, 0);
  assert.equal(sum, TOTAL_QURAN_AYAHS);
  assert.equal(sum, 6236);
});

test('getGlobalAyahNumber computes exact global ayah indices', () => {
  assert.equal(getGlobalAyahNumber(SURAH_META, 1, 1), 1);
  assert.equal(getGlobalAyahNumber(SURAH_META, 1, 7), 7);
  assert.equal(getGlobalAyahNumber(SURAH_META, 2, 1), 8);
  assert.equal(getGlobalAyahNumber(SURAH_META, 114, 6), 6236);
});

test('filterSurahs matches English, Bengali, number, and revelation type', () => {
  const byEng = filterSurahs(SURAH_META, 'fatihah');
  assert.equal(byEng.length, 1);
  assert.equal(byEng[0].number, 1);

  const byBn = filterSurahs(SURAH_META, 'ইখলাস');
  assert.equal(byBn.length, 1);
  assert.equal(byBn[0].number, 112);

  const byNum = filterSurahs(SURAH_META, '114');
  assert.equal(byNum.length, 1);
  assert.equal(byNum[0].englishName, 'An-Nas');

  const medinanOnly = filterSurahs(SURAH_META, '', 'Medinan');
  assert.ok(medinanOnly.every((s) => s.revelationType === 'Medinan'));
  assert.ok(medinanOnly.length > 20);
});

test('getNextAyahPointer and getPrevAyahPointer traverse across surah boundaries', () => {
  assert.deepEqual(getNextAyahPointer(SURAH_META, 1, 6), { surahNumber: 1, ayahNumber: 7 });
  assert.deepEqual(getNextAyahPointer(SURAH_META, 1, 7), { surahNumber: 2, ayahNumber: 1 });
  assert.equal(getNextAyahPointer(SURAH_META, 114, 6), null);

  assert.deepEqual(getPrevAyahPointer(SURAH_META, 2, 1), { surahNumber: 1, ayahNumber: 7 });
  assert.equal(getPrevAyahPointer(SURAH_META, 1, 1), null);
});

test('digit conversions and duration formatting work accurately', () => {
  assert.equal(toBengaliDigits(114), '১১৪');
  assert.equal(toArabicIndicDigits(19), '١٩');
  assert.equal(formatDuration(125), '2:05');
  assert.equal(formatDuration(-5), '0:00');
  assert.equal(getAudioUrl(1, 'ar.alafasy'), 'https://cdn.islamic.network/quran/audio/128/ar.alafasy/1.mp3');
});

test('calculateKhatamProgress deduplicates read ayahs and computes percentage', () => {
  const result = calculateKhatamProgress(['1:1', '1:2', '1:1', '112:1'], 6236);
  assert.equal(result.readCount, 3);
  assert.equal(result.percentage, 0);

  const half = calculateKhatamProgress(
    Array.from({ length: 3118 }, (_, i) => `1:${i}`),
    6236
  );
  assert.equal(half.readCount, 3118);
  assert.equal(half.percentage, 50);
});

test('toggleBookmarkList adds and removes bookmarks idempotently', () => {
  const sample = {
    id: '1:1',
    surahNumber: 1,
    ayahNumber: 1,
    surahEnglishName: 'Al-Fatihah',
    surahBengaliName: 'আল-ফাতিহা',
    arabicPreview: 'بِسْمِ ٱللَّهِ',
    bengaliPreview: 'পরম করুণাময়',
    englishPreview: 'In the name of Allah',
    note: '',
    createdAt: '2026-11-13T00:00:00Z',
  };

  const added = toggleBookmarkList([], sample);
  assert.equal(added.length, 1);

  const removed = toggleBookmarkList(added, sample);
  assert.equal(removed.length, 0);
});

test('buildAyahNumberList and getAutoScrollPixelsPerSec return expected values', () => {
  const list25 = buildAyahNumberList(25);
  assert.equal(list25.length, 25);
  assert.equal(list25[0], 1);
  assert.equal(list25[24], 25);
  assert.deepEqual(buildAyahNumberList(0), []);

  assert.ok(getAutoScrollPixelsPerSec('slow') < getAutoScrollPixelsPerSec('medium'));
  assert.ok(getAutoScrollPixelsPerSec('medium') < getAutoScrollPixelsPerSec('fast'));
});

