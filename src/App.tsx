import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Bookmark } from 'lucide-react';
import { AudioPlayerBar } from './components/AudioPlayerBar';
import { BookmarksView } from './components/BookmarksView';
import { ProgressView } from './components/ProgressView';
import { SurahDirectory } from './components/SurahDirectory';
import { SurahReader } from './components/SurahReader';
import { SurahSidebar } from './components/SurahSidebar';
import { TopBar } from './components/TopBar';
import { TypographyPanel } from './components/TypographyPanel';
import { WorkspaceToolbar } from './components/WorkspaceToolbar';
import { SURAH_META } from './data/surahMeta';
import { fetchSurahDetail } from './services/quranApi';
import {
  AppView,
  Ayah,
  BookmarkItem,
  LastReadPosition,
  ReaderSettings,
  SurahDetail,
} from './types/quran';
import {
  AutoScrollSpeed,
  RevelationFilter,
  getAudioUrl,
  getAutoScrollPixelsPerSec,
  getGlobalAyahNumber,
  getNextAyahPointer,
  getPrevAyahPointer,
  toBengaliDigits,
  toggleBookmarkList,
} from './utils/quranLogic';

const SETTINGS_KEY = 'al_noor_settings_v1';
const BOOKMARKS_KEY = 'al_noor_bookmarks_v1';
const READ_AYAHS_KEY = 'al_noor_read_ayahs_v1';
const LAST_READ_KEY = 'al_noor_last_read_v1';

const DEFAULT_SETTINGS: ReaderSettings = {
  uiLanguage: 'bn',
  theme: 'light',
  arabicFontSize: 32,
  translationFontSize: 16,
  showBengali: true,
  showEnglish: true,
  showTransliteration: false,
  reciterId: 'ar.alafasy',
  playbackRate: 1,
  autoAdvance: true,
};

const DEFAULT_LAST_READ: LastReadPosition = {
  surahNumber: 1,
  ayahNumber: 1,
  updatedAt: new Date().toISOString(),
};

function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export default function App() {
  const [settings, setSettings] = useState<ReaderSettings>(() => ({
    ...DEFAULT_SETTINGS,
    ...readStorage<Partial<ReaderSettings>>(SETTINGS_KEY, {}),
  }));

  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>(() =>
    readStorage<BookmarkItem[]>(BOOKMARKS_KEY, [])
  );

  const [readAyahKeys, setReadAyahKeys] = useState<string[]>(() =>
    readStorage<string[]>(READ_AYAHS_KEY, [])
  );

  const [lastRead, setLastRead] = useState<LastReadPosition>(() =>
    readStorage<LastReadPosition>(LAST_READ_KEY, DEFAULT_LAST_READ)
  );

  const [activeView, setActiveView] = useState<AppView>('reader');
  const [activeSurahNumber, setActiveSurahNumber] = useState<number>(
    lastRead.surahNumber || 1
  );
  const [surahDetail, setSurahDetail] = useState<SurahDetail | null>(null);
  const [loadingSurah, setLoadingSurah] = useState<boolean>(false);
  const [surahError, setSurahError] = useState<string | null>(null);
  const [reloadNonce, setReloadNonce] = useState<number>(0);

  const [sidebarSearch, setSidebarSearch] = useState<string>('');
  const [revelationFilter, setRevelationFilter] =
    useState<RevelationFilter>('all');
  const [mobileSurahDrawer, setMobileSurahDrawer] = useState<boolean>(false);
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);

  // Auto-Scrolling & Ayah Jump Highlight State
  const [autoScrolling, setAutoScrolling] = useState<boolean>(false);
  const [autoScrollSpeed, setAutoScrollSpeed] =
    useState<AutoScrollSpeed>('medium');
  const [highlightedAyah, setHighlightedAyah] = useState<number | null>(null);
  const [bookmarkToast, setBookmarkToast] = useState<{
    message: string;
    added: boolean;
  } | null>(null);

  // Audio Playback State
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playingSurah, setPlayingSurah] = useState<number>(
    lastRead.surahNumber || 1
  );
  const [playingAyah, setPlayingAyah] = useState<number>(
    lastRead.ayahNumber || 1
  );
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [muted, setMuted] = useState<boolean>(false);
  const [audioNotice, setAudioNotice] = useState<string | null>(null);

  const activeSurahMeta = useMemo(
    () => SURAH_META.find((s) => s.number === activeSurahNumber) ?? SURAH_META[0],
    [activeSurahNumber]
  );

  const playingSurahMeta = useMemo(
    () => SURAH_META.find((s) => s.number === playingSurah) ?? SURAH_META[0],
    [playingSurah]
  );

  const currentAyahObj = useMemo(() => {
    if (surahDetail && playingSurah === activeSurahNumber) {
      return surahDetail.ayahs.find((a) => a.numberInSurah === playingAyah);
    }
    return undefined;
  }, [activeSurahNumber, playingAyah, playingSurah, surahDetail]);

  const readAyahSet = useMemo(() => new Set(readAyahKeys), [readAyahKeys]);

  // Sync theme class on <html>
  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    root.lang = settings.uiLanguage;
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch {
      // Ignore storage error
    }
  }, [settings]);

  useEffect(() => {
    try {
      localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks));
    } catch {
      // Ignore
    }
  }, [bookmarks]);

  useEffect(() => {
    try {
      localStorage.setItem(READ_AYAHS_KEY, JSON.stringify(readAyahKeys));
    } catch {
      // Ignore
    }
  }, [readAyahKeys]);

  useEffect(() => {
    try {
      localStorage.setItem(LAST_READ_KEY, JSON.stringify(lastRead));
    } catch {
      // Ignore
    }
  }, [lastRead]);

  // Smooth Continuous Auto-Scroll Engine
  useEffect(() => {
    if (!autoScrolling || activeView !== 'reader') return;

    let rafId = 0;
    let lastTs = performance.now();
    let carry = 0;

    const tick = (now: number) => {
      const dt = Math.min(0.1, (now - lastTs) / 1000);
      lastTs = now;
      const pxPerSec = getAutoScrollPixelsPerSec(autoScrollSpeed);
      carry += pxPerSec * dt;

      if (carry >= 1) {
        const delta = Math.floor(carry);
        carry -= delta;
        window.scrollBy(0, delta);
      }

      const maxScroll =
        document.documentElement.scrollHeight - window.innerHeight;
      if (window.scrollY >= maxScroll - 2) {
        setAutoScrolling(false);
        return;
      }
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [activeView, autoScrollSpeed, autoScrolling]);

  // Load Surah Verses
  useEffect(() => {
    let cancelled = false;
    setLoadingSurah(true);
    setSurahError(null);

    fetchSurahDetail(activeSurahNumber)
      .then((detail) => {
        if (!cancelled) {
          setSurahDetail(detail);
          setLoadingSurah(false);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setSurahError(err instanceof Error ? err.message : 'Network error');
          setLoadingSurah(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [activeSurahNumber, reloadNonce]);

  const handleUpdateSettings = useCallback((partial: Partial<ReaderSettings>) => {
    setSettings((prev) => ({ ...prev, ...partial }));
  }, []);

  const jumpToAyahElement = useCallback((ayahNumber: number) => {
    setHighlightedAyah(ayahNumber);
    setPlayingAyah(ayahNumber);
    const el = document.getElementById(`ayah-${ayahNumber}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    setTimeout(() => {
      setHighlightedAyah((curr) => (curr === ayahNumber ? null : curr));
    }, 2200);
  }, []);

  const handleSelectSurah = useCallback(
    (surahNumber: number, ayahNumber = 1) => {
      setActiveSurahNumber(surahNumber);
      setActiveView('reader');
      setAutoScrolling(false);
      setLastRead({
        surahNumber,
        ayahNumber,
        updatedAt: new Date().toISOString(),
      });
      if (!isPlaying) {
        setPlayingSurah(surahNumber);
        setPlayingAyah(ayahNumber);
      }
      if (ayahNumber > 1) {
        setTimeout(() => {
          jumpToAyahElement(ayahNumber);
        }, 180);
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    },
    [isPlaying, jumpToAyahElement]
  );

  // Audio playback controls
  const startAudioAt = useCallback(
    (surahNum: number, ayahNum: number) => {
      const audio = audioRef.current;
      if (!audio) return;

      const globalNum = getGlobalAyahNumber(SURAH_META, surahNum, ayahNum);
      const url = getAudioUrl(globalNum, settings.reciterId);

      setPlayingSurah(surahNum);
      setPlayingAyah(ayahNum);
      setAudioNotice(null);
      setLastRead({
        surahNumber: surahNum,
        ayahNumber: ayahNum,
        updatedAt: new Date().toISOString(),
      });

      if (surahNum === activeSurahNumber && activeView === 'reader') {
        const el = document.getElementById(`ayah-${ayahNum}`);
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }

      if (audio.src !== url) {
        audio.src = url;
      }
      audio.playbackRate = settings.playbackRate;
      audio.muted = muted;

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
          })
          .catch(() => {
            setIsPlaying(false);
            setAudioNotice(
              settings.uiLanguage === 'bn'
                ? 'অডিও স্ট্রিম লোড করা যায়নি'
                : 'Audio stream unavailable'
            );
          });
      }
    },
    [
      activeSurahNumber,
      activeView,
      muted,
      settings.playbackRate,
      settings.reciterId,
      settings.uiLanguage,
    ]
  );

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = settings.playbackRate;
    }
  }, [settings.playbackRate]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = muted;
    }
  }, [muted]);

  const handleTogglePlayMain = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else if (audio.src) {
      audio
        .play()
        .then(() => {
          setIsPlaying(true);
          setAudioNotice(null);
        })
        .catch(() => {
          startAudioAt(playingSurah, playingAyah);
        });
    } else {
      startAudioAt(activeSurahNumber, playingAyah || 1);
    }
  }, [activeSurahNumber, isPlaying, playingAyah, playingSurah, startAudioAt]);

  const handlePlayAyah = useCallback(
    (ayahNumber: number) => {
      if (
        isPlaying &&
        playingSurah === activeSurahNumber &&
        playingAyah === ayahNumber
      ) {
        audioRef.current?.pause();
        setIsPlaying(false);
      } else {
        startAudioAt(activeSurahNumber, ayahNumber);
      }
    },
    [activeSurahNumber, isPlaying, playingAyah, playingSurah, startAudioAt]
  );

  const handlePlaySurah = useCallback(() => {
    if (isPlaying && playingSurah === activeSurahNumber) {
      audioRef.current?.pause();
      setIsPlaying(false);
    } else {
      startAudioAt(activeSurahNumber, 1);
    }
  }, [activeSurahNumber, isPlaying, playingSurah, startAudioAt]);

  const handleNextAyah = useCallback(() => {
    const next = getNextAyahPointer(SURAH_META, playingSurah, playingAyah);
    if (!next) {
      setIsPlaying(false);
      return;
    }
    if (next.surahNumber !== activeSurahNumber && activeView === 'reader') {
      setActiveSurahNumber(next.surahNumber);
    }
    startAudioAt(next.surahNumber, next.ayahNumber);
  }, [activeSurahNumber, activeView, playingAyah, playingSurah, startAudioAt]);

  const handlePrevAyah = useCallback(() => {
    const prev = getPrevAyahPointer(SURAH_META, playingSurah, playingAyah);
    if (!prev) return;
    if (prev.surahNumber !== activeSurahNumber && activeView === 'reader') {
      setActiveSurahNumber(prev.surahNumber);
    }
    startAudioAt(prev.surahNumber, prev.ayahNumber);
  }, [activeSurahNumber, activeView, playingAyah, playingSurah, startAudioAt]);

  const handleAudioEnded = useCallback(() => {
    const key = `${playingSurah}:${playingAyah}`;
    setReadAyahKeys((prev) => (prev.includes(key) ? prev : [...prev, key]));

    if (settings.autoAdvance) {
      const next = getNextAyahPointer(SURAH_META, playingSurah, playingAyah);
      if (next) {
        if (next.surahNumber !== activeSurahNumber && activeView === 'reader') {
          setActiveSurahNumber(next.surahNumber);
        }
        startAudioAt(next.surahNumber, next.ayahNumber);
        return;
      }
    }
    setIsPlaying(false);
  }, [
    activeSurahNumber,
    activeView,
    playingAyah,
    playingSurah,
    settings.autoAdvance,
    startAudioAt,
  ]);

  const handleToggleBookmark = useCallback(
    (ayah: Ayah) => {
      const id = `${activeSurahMeta.number}:${ayah.numberInSurah}`;
      const alreadyExists = bookmarks.some((b) => b.id === id);

      const newItem: BookmarkItem = {
        id,
        surahNumber: activeSurahMeta.number,
        ayahNumber: ayah.numberInSurah,
        surahEnglishName: activeSurahMeta.englishName,
        surahBengaliName: activeSurahMeta.bengaliName,
        arabicPreview: ayah.arabic,
        bengaliPreview: ayah.bengali,
        englishPreview: ayah.english,
        note: '',
        createdAt: new Date().toISOString(),
      };
      setBookmarks((prev) => toggleBookmarkList(prev, newItem));

      const isBn = settings.uiLanguage === 'bn';
      const msg = alreadyExists
        ? isBn
          ? `বুকমার্ক সরানো হয়েছে — ${activeSurahMeta.bengaliName} (${toBengaliDigits(activeSurahMeta.number)}:${toBengaliDigits(ayah.numberInSurah)})`
          : `Bookmark removed — ${activeSurahMeta.englishName} (${activeSurahMeta.number}:${ayah.numberInSurah})`
        : isBn
          ? `বুকমার্ক হয়েছে — ${activeSurahMeta.bengaliName} (${toBengaliDigits(activeSurahMeta.number)}:${toBengaliDigits(ayah.numberInSurah)})`
          : `Bookmarked — ${activeSurahMeta.englishName} (${activeSurahMeta.number}:${ayah.numberInSurah})`;

      setBookmarkToast({ message: msg, added: !alreadyExists });
    },
    [activeSurahMeta, bookmarks, settings.uiLanguage]
  );

  useEffect(() => {
    if (!bookmarkToast) return;
    const timer = setTimeout(() => setBookmarkToast(null), 3200);
    return () => clearTimeout(timer);
  }, [bookmarkToast]);

  const handleToggleReadAyah = useCallback(
    (ayahNumber: number) => {
      const key = `${activeSurahNumber}:${ayahNumber}`;
      setReadAyahKeys((prev) =>
        prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
      );
      setLastRead({
        surahNumber: activeSurahNumber,
        ayahNumber,
        updatedAt: new Date().toISOString(),
      });
    },
    [activeSurahNumber]
  );

  const handleMarkSurahRead = useCallback(() => {
    const keys = Array.from(
      { length: activeSurahMeta.ayahCount },
      (_, idx) => `${activeSurahMeta.number}:${idx + 1}`
    );
    setReadAyahKeys((prev) => Array.from(new Set([...prev, ...keys])));
  }, [activeSurahMeta]);

  return (
    <div className="min-h-screen flex flex-col bg-[var(--neu-bg)] text-[var(--neu-text-primary)] pb-32">
      <audio
        ref={audioRef}
        preload="none"
        onTimeUpdate={() => {
          if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
          }
        }}
        onLoadedMetadata={() => {
          if (audioRef.current) {
            setDuration(audioRef.current.duration || 0);
          }
        }}
        onEnded={handleAudioEnded}
        onError={() => {
          setIsPlaying(false);
          setAudioNotice(
            settings.uiLanguage === 'bn'
              ? 'অডিও স্ট্রিম লোড করা যায়নি'
              : 'Audio stream unavailable'
          );
        }}
      />

      <TopBar
        activeView={activeView}
        onSelectView={(v) => {
          setAutoScrolling(false);
          setActiveView(v);
        }}
        uiLanguage={settings.uiLanguage}
        lastRead={lastRead}
        bookmarkCount={bookmarks.length}
        onResumeReading={() =>
          handleSelectSurah(lastRead.surahNumber, lastRead.ayahNumber)
        }
      />

      {/* Bookmark Feedback Toast */}
      {bookmarkToast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-20 right-4 sm:right-6 z-50 neu-raised rounded-2xl px-4 py-3 flex items-center gap-3 animate-neu-enter max-w-sm"
        >
          <Bookmark
            className={`w-4 h-4 shrink-0 ${
              bookmarkToast.added
                ? 'text-[var(--neu-gold)] fill-current'
                : 'text-[var(--neu-text-muted)]'
            }`}
          />
          <span className="text-xs sm:text-sm font-semibold text-[var(--neu-text-primary)] font-bengali">
            {bookmarkToast.message}
          </span>
          {bookmarkToast.added && (
            <button
              type="button"
              onClick={() => {
                setActiveView('bookmarks');
                setBookmarkToast(null);
              }}
              className="neu-btn px-2.5 py-1 rounded-xl text-xs font-semibold text-[var(--neu-accent)] cursor-pointer whitespace-nowrap"
            >
              {settings.uiLanguage === 'bn' ? 'দেখুন' : 'View'}
            </button>
          )}
        </div>
      )}

      <main className="flex-1 w-full max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <WorkspaceToolbar
          activeView={activeView}
          onSelectView={(v) => {
            setAutoScrolling(false);
            setActiveView(v);
          }}
          settings={settings}
          onUpdateSettings={handleUpdateSettings}
          onOpenMobileSurahs={() => setMobileSurahDrawer(true)}
          onOpenSettings={() => setSettingsOpen(true)}
          autoScrolling={autoScrolling}
          autoScrollSpeed={autoScrollSpeed}
          onToggleAutoScroll={() => setAutoScrolling((s) => !s)}
          onChangeAutoScrollSpeed={setAutoScrollSpeed}
          bookmarkCount={bookmarks.length}
        />

        {activeView === 'reader' && (
          <div className="flex items-start gap-7">
            <SurahSidebar
              surahs={SURAH_META}
              activeSurahNumber={activeSurahNumber}
              searchQuery={sidebarSearch}
              onSearchChange={setSidebarSearch}
              revelationFilter={revelationFilter}
              onRevelationChange={setRevelationFilter}
              onSelectSurah={(num) => handleSelectSurah(num, 1)}
              uiLanguage={settings.uiLanguage}
              mobileOpen={mobileSurahDrawer}
              onCloseMobile={() => setMobileSurahDrawer(false)}
            />

            <div className="flex-1 min-w-0">
              <SurahReader
                surahMeta={activeSurahMeta}
                surahDetail={surahDetail}
                loading={loadingSurah}
                error={surahError}
                onRetry={() => setReloadNonce((n) => n + 1)}
                settings={settings}
                activePlayingAyah={
                  playingSurah === activeSurahNumber ? playingAyah : null
                }
                highlightedAyah={highlightedAyah}
                isPlaying={isPlaying}
                bookmarks={bookmarks}
                readAyahKeys={readAyahSet}
                onPlayAyah={handlePlayAyah}
                onPlaySurah={handlePlaySurah}
                onToggleBookmark={handleToggleBookmark}
                onToggleReadAyah={handleToggleReadAyah}
                onMarkSurahRead={handleMarkSurahRead}
                onNavigateSurah={(num) => handleSelectSurah(num, 1)}
              />
            </div>
          </div>
        )}

        {activeView === 'surahs' && (
          <SurahDirectory
            surahs={SURAH_META}
            activeSurahNumber={activeSurahNumber}
            uiLanguage={settings.uiLanguage}
            onSelectSurah={(num) => handleSelectSurah(num, 1)}
          />
        )}

        {activeView === 'bookmarks' && (
          <BookmarksView
            bookmarks={bookmarks}
            uiLanguage={settings.uiLanguage}
            onOpenAyah={(s, a) => handleSelectSurah(s, a)}
            onRemoveBookmark={(id) =>
              setBookmarks((prev) => prev.filter((b) => b.id !== id))
            }
            onUpdateNote={(id, note) =>
              setBookmarks((prev) =>
                prev.map((b) => (b.id === id ? { ...b, note } : b))
              )
            }
            onExploreSurahs={() => setActiveView('reader')}
          />
        )}

        {activeView === 'progress' && (
          <ProgressView
            readAyahKeys={readAyahKeys}
            uiLanguage={settings.uiLanguage}
            onSelectSurah={(num) => handleSelectSurah(num, 1)}
            onResetProgress={() => setReadAyahKeys([])}
          />
        )}
      </main>

      <AudioPlayerBar
        surah={activeView === 'reader' ? activeSurahMeta : playingSurahMeta}
        currentAyah={playingAyah}
        currentAyahObj={currentAyahObj}
        isPlaying={isPlaying}
        currentTime={currentTime}
        duration={duration}
        muted={muted}
        reciterId={settings.reciterId}
        playbackRate={settings.playbackRate}
        uiLanguage={settings.uiLanguage}
        audioNotice={audioNotice}
        autoScrolling={autoScrolling}
        autoScrollSpeed={autoScrollSpeed}
        showJumpButton={activeView === 'reader'}
        onTogglePlay={handleTogglePlayMain}
        onPrevAyah={handlePrevAyah}
        onNextAyah={handleNextAyah}
        onSeek={(time) => {
          if (audioRef.current) {
            audioRef.current.currentTime = time;
            setCurrentTime(time);
          }
        }}
        onToggleMute={() => setMuted((m) => !m)}
        onChangeReciter={(id) => handleUpdateSettings({ reciterId: id })}
        onChangeSpeed={(rate) => handleUpdateSettings({ playbackRate: rate })}
        onToggleAutoScroll={() => setAutoScrolling((s) => !s)}
        onChangeAutoScrollSpeed={setAutoScrollSpeed}
        onJumpToAyah={(ayahNum) => jumpToAyahElement(ayahNum)}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      <TypographyPanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
      />
    </div>
  );
}
