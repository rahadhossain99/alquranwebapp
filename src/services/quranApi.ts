import { BUNDLED_SURAHS } from '../data/bundledSurahs';
import { SURAH_META } from '../data/surahMeta';
import { Ayah, SurahDetail } from '../types/quran';

const memoryCache = new Map<number, SurahDetail>();
const STORAGE_PREFIX = 'al_noor_surah_v1_';

interface AlQuranCloudAyah {
  numberInSurah: number;
  text: string;
}

interface AlQuranCloudEdition {
  ayahs: AlQuranCloudAyah[];
}

export async function fetchSurahDetail(surahNumber: number): Promise<SurahDetail> {
  const meta = SURAH_META.find((s) => s.number === surahNumber) ?? SURAH_META[0];

  const bundled = BUNDLED_SURAHS[surahNumber];
  if (bundled) {
    return {
      meta,
      ayahs: bundled,
      source: 'bundled',
    };
  }

  const cached = memoryCache.get(surahNumber);
  if (cached) {
    return cached;
  }

  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${surahNumber}`);
    if (raw) {
      const parsed = JSON.parse(raw) as Ayah[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        const detail: SurahDetail = { meta, ayahs: parsed, source: 'api' };
        memoryCache.set(surahNumber, detail);
        return detail;
      }
    }
  } catch {
    // Ignore storage read errors
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 9000);

  try {
    const url = `https://api.alquran.cloud/v1/surah/${surahNumber}/editions/quran-uthmani,bn.bengali,en.sahih,en.transliteration`;
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const json = (await response.json()) as {
      code: number;
      data?: AlQuranCloudEdition[];
    };

    if (!json.data || json.data.length < 3) {
      throw new Error('Incomplete edition data');
    }

    const [arabicEd, bengaliEd, englishEd, translitEd] = json.data;
    const ayahs: Ayah[] = arabicEd.ayahs.map((ar, index) => ({
      numberInSurah: ar.numberInSurah,
      arabic: ar.text,
      bengali: bengaliEd.ayahs[index]?.text ?? '',
      english: englishEd.ayahs[index]?.text ?? '',
      transliteration: translitEd?.ayahs[index]?.text ?? '',
    }));

    const detail: SurahDetail = { meta, ayahs, source: 'api' };
    memoryCache.set(surahNumber, detail);

    try {
      localStorage.setItem(`${STORAGE_PREFIX}${surahNumber}`, JSON.stringify(ayahs));
    } catch {
      // Ignore quota exceeded
    }

    return detail;
  } finally {
    clearTimeout(timeout);
  }
}
