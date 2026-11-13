import test from 'node:test';
import assert from 'node:assert/strict';
import { RECITERS, SURAH_META, TOTAL_QURAN_AYAHS } from '../data/surahMeta';
import {
  buildActivitySeries,
  buildAppPath,
  buildAyahNumberList,
  calculateKhatamProgress,
  createInitialListeningStats,
  filterSurahs,
  formatDuration,
  formatTimeBreakdown,
  getAudioUrl,
  getGlobalAyahNumber,
  getNextAyahPointer,
  getPrevAyahPointer,
  parseAppRoute,
  recordListeningActivity,
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

test('RECITERS includes 18 verified Qaris with valid bitrates and audio URLs', () => {
  assert.equal(RECITERS.length, 18);
  assert.equal(
    getAudioUrl(1, 'ar.alafasy'),
    'https://cdn.islamic.network/quran/audio/128/ar.alafasy/1.mp3'
  );
  assert.equal(
    getAudioUrl(1, 'ar.abdulbasitmurattal'),
    'https://cdn.islamic.network/quran/audio/64/ar.abdulbasitmurattal/1.mp3'
  );
  assert.equal(
    getAudioUrl(7, 'ar.minshawi'),
    'https://cdn.islamic.network/quran/audio/128/ar.minshawi/7.mp3'
  );
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

test('buildAyahNumberList returns 1..N sequence', () => {
  const list25 = buildAyahNumberList(25);
  assert.equal(list25.length, 25);
  assert.equal(list25[0], 1);
  assert.equal(list25[24], 25);
  assert.deepEqual(buildAyahNumberList(0), []);
});

test('slash routing parses and builds paths with and without GitHub Pages base', () => {
  assert.deepEqual(parseAppRoute('/settings', '/'), { view: 'settings' });
  assert.deepEqual(parseAppRoute('/surahs', '/'), { view: 'surahs' });
  assert.deepEqual(parseAppRoute('/surah/36', '/'), { view: 'reader', surahNumber: 36 });
  assert.deepEqual(parseAppRoute('/alquranwebapp/progress', '/alquranwebapp/'), {
    view: 'progress',
  });
  assert.deepEqual(parseAppRoute('/alquranwebapp/surah/2', '/alquranwebapp/'), {
    view: 'reader',
    surahNumber: 2,
  });

  assert.equal(buildAppPath('settings', 1, '/'), '/settings');
  assert.equal(buildAppPath('reader', 18, '/alquranwebapp/'), '/alquranwebapp/surah/18');
  assert.equal(buildAppPath('bookmarks', 1, '/alquranwebapp/'), '/alquranwebapp/bookmarks');
});

test('listening stats track start date, unique active days, time breakdown, and chart series', () => {
  let stats = createInitialListeningStats();
  assert.equal(stats.startedDate, null);
  assert.equal(stats.activeDates.length, 0);

  stats = recordListeningActivity(stats, 3665, '2026-11-10', '2026-11-10T10:00:00Z');
  stats = recordListeningActivity(stats, 120, '2026-11-10', '2026-11-10T10:02:00Z');
  stats = recordListeningActivity(stats, 90000, '2026-11-12', '2026-11-12T10:00:00Z');

  assert.equal(stats.startedDate, '2026-11-10');
  assert.deepEqual(stats.activeDates, ['2026-11-10', '2026-11-12']);
  assert.equal(stats.totalSeconds, 93785);
  assert.equal(stats.dailySeconds['2026-11-10'], 3785);

  // 93785s = 1 day (86400) + 2 hours (7200) + 3 mins (180) + 5 secs
  assert.deepEqual(formatTimeBreakdown(93785), {
    days: 1,
    hours: 2,
    minutes: 3,
    seconds: 5,
  });

  const series = buildActivitySeries(stats.dailySeconds, 7, new Date(2026, 10, 13));
  assert.equal(series.length, 7);
  const nov10 = series.find((p) => p.dateKey === '2026-11-10');
  assert.ok(nov10);
  assert.equal(nov10.seconds, 3785);
});

test('formatShareAyahText includes Arabic, Bengali meaning, and English pronunciation', async () => {
  const { formatShareAyahText } = await import('./quranLogic');
  const shared = formatShareAyahText(
    { number: 1, bengaliName: 'আল-ফাতিহা', englishName: 'Al-Fatihah' },
    'بِسْمِ ٱللَّهِ',
    'আল্লাহর নামে',
    'Bismillaah',
    1,
    true
  );
  assert.ok(shared.includes('আল-ফাতিহা (১:১)'));
  assert.ok(shared.includes('بِسْمِ ٱللَّهِ'));
  assert.ok(shared.includes('আল্লাহর নামে'));
  assert.ok(shared.includes('উচ্চারণ: Bismillaah'));
});

test('toggleFavoriteSurah toggles surah numbers cleanly in sorted order', async () => {
  const { toggleFavoriteSurah } = await import('./quranLogic');
  let favs = toggleFavoriteSurah([], 36);
  favs = toggleFavoriteSurah(favs, 1);
  assert.deepEqual(favs, [1, 36]);
  favs = toggleFavoriteSurah(favs, 36);
  assert.deepEqual(favs, [1]);
});

test('formatHumanDuration formats Bengali & English seconds/minutes/hours naturally', async () => {
  const { formatHumanDuration } = await import('./quranLogic');
  assert.equal(formatHumanDuration(45, true, false), '৪৫ সেকেন্ড');
  assert.equal(formatHumanDuration(45, true, true), '৪৫ সে.');
  assert.equal(formatHumanDuration(127, true, false), '২ মিনিট ৭ সেকেন্ড');
  assert.equal(formatHumanDuration(127, true, true), '২ মি. ৭ সে.');
  assert.equal(formatHumanDuration(127, false, true), '2m 7s');
  assert.equal(formatHumanDuration(45, false, true), '45s');
});

test('buildSurahParts splits short and long surahs into clean readable sections', async () => {
  const { buildSurahParts } = await import('./quranLogic');
  const fatihaParts = buildSurahParts(7, true);
  assert.equal(fatihaParts.length, 2);
  assert.equal(fatihaParts[0].startAyah, 1);
  assert.equal(fatihaParts[0].endAyah, 4);
  assert.equal(fatihaParts[1].startAyah, 5);
  assert.equal(fatihaParts[1].endAyah, 7);

  const baqaraParts = buildSurahParts(286, true);
  assert.equal(baqaraParts[0].startAyah, 1);
  assert.equal(baqaraParts[baqaraParts.length - 1].endAyah, 286);
  assert.equal(baqaraParts.length, 15);
});

test('whole-surah timeline mapping computes elapsed, total, and target ayah on scrub', async () => {
  const {
    estimateAyahDurations,
    getSurahTimelinePosition,
    findAyahAtSurahTime,
  } = await import('./quranLogic');

  const durs = estimateAyahDurations(3, undefined, { 1: 10, 2: 20, 3: 30 });
  assert.deepEqual(durs, [10, 20, 30]);

  const pos = getSurahTimelinePosition(durs, 2, 5);
  assert.equal(pos.elapsed, 15);
  assert.equal(pos.total, 60);

  assert.deepEqual(findAyahAtSurahTime(durs, 4), { ayahNumber: 1, offsetInAyah: 4 });
  assert.deepEqual(findAyahAtSurahTime(durs, 18), { ayahNumber: 2, offsetInAyah: 8 });
  assert.deepEqual(findAyahAtSurahTime(durs, 45), { ayahNumber: 3, offsetInAyah: 15 });
});

test('getAyahHaloPalette assigns distinct color pairs per ayah cleanly', async () => {
  const { getAyahHaloPalette } = await import('./quranLogic');
  const p1 = getAyahHaloPalette(1);
  const p2 = getAyahHaloPalette(2);
  const p3 = getAyahHaloPalette(3);
  const p7 = getAyahHaloPalette(7);
  assert.notEqual(p1.c1, p2.c1);
  assert.notEqual(p2.c1, p3.c1);
  assert.deepEqual(p1, p7);
});

test('resolveReadingJumpTarget prefers active playing ayah when playing, else lastRead', async () => {
  const { resolveReadingJumpTarget } = await import('./quranLogic');
  assert.deepEqual(
    resolveReadingJumpTarget(true, 2, 14, { surahNumber: 1, ayahNumber: 1 }),
    { surahNumber: 2, ayahNumber: 14 }
  );
  assert.deepEqual(
    resolveReadingJumpTarget(false, 2, 14, { surahNumber: 4, ayahNumber: 22 }),
    { surahNumber: 4, ayahNumber: 22 }
  );
});

test('getLiveFontCssVars maps font keys to CSS custom properties safely', async () => {
  const { getLiveFontCssVars } = await import('./quranLogic');
  assert.deepEqual(getLiveFontCssVars('arabicFontSize', 42), [
    ['--live-ar-size', '42px'],
  ]);
  assert.deepEqual(getLiveFontCssVars('translationFontSize', 18), [
    ['--live-bn-size', '18px'],
    ['--live-en-size', '16px'],
  ]);
  assert.deepEqual(getLiveFontCssVars('transliterationFontSize', 16), [
    ['--live-tr-size', '16px'],
  ]);
});
